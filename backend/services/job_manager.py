import asyncio
import json
import logging
import uuid
from typing import Dict, Any, Optional, AsyncGenerator
import aiosqlite

from backend import config
from backend.models.schemas import (
    JobStatus,
    JobStage,
    IngestRequest,
    ContentGraph,
    AudioBriefing,
    Quiz,
    StoryDeck
)
from backend.agents.ingest_pipeline import IngestAndExtractStep, GraphBuilderStep
from backend.agents.trust_pipeline import TrustCriticStep
from backend.agents.format_studio import FormatStudioWorkflow
from backend.services.bigquery_service import bigquery_service

logger = logging.getLogger(__name__)

class JobManager:
    def __init__(self):
        self._jobs: Dict[str, JobStatus] = {}
        self._listeners: Dict[str, list[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def init_db(self):
        """Initialize SQLite tables for job and telemetry persistence."""
        async with aiosqlite.connect(config.DATABASE_PATH) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    job_id TEXT PRIMARY KEY,
                    stage TEXT,
                    progress_pct INTEGER,
                    message TEXT,
                    graph_json TEXT,
                    audio_json TEXT,
                    quiz_json TEXT,
                    story_deck_json TEXT,
                    error TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.commit()
        await bigquery_service.init_sqlite_fallback()

    async def _persist_job(self, job: JobStatus):
        try:
            async with aiosqlite.connect(config.DATABASE_PATH) as db:
                graph_json = job.graph.model_dump_json() if job.graph else None
                audio_json = job.audio.model_dump_json() if job.audio else None
                quiz_json = job.quiz.model_dump_json() if job.quiz else None
                story_deck_json = job.story_deck.model_dump_json() if job.story_deck else None
                await db.execute("""
                    INSERT INTO jobs (job_id, stage, progress_pct, message, graph_json, audio_json, quiz_json, story_deck_json, error)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(job_id) DO UPDATE SET
                        stage=excluded.stage,
                        progress_pct=excluded.progress_pct,
                        message=excluded.message,
                        graph_json=excluded.graph_json,
                        audio_json=excluded.audio_json,
                        quiz_json=excluded.quiz_json,
                        story_deck_json=excluded.story_deck_json,
                        error=excluded.error
                """, (
                    job.job_id,
                    job.stage.value,
                    job.progress_pct,
                    job.message,
                    graph_json,
                    audio_json,
                    quiz_json,
                    story_deck_json,
                    job.error
                ))
                await db.commit()
        except Exception as e:
            logger.warning(f"Error persisting job {job.job_id} to SQLite: {e}")

    async def create_job(self, request: IngestRequest) -> str:
        job_id = f"job_{uuid.uuid4().hex[:10]}"
        job = JobStatus(
            job_id=job_id,
            stage=JobStage.QUEUED,
            progress_pct=5,
            message="Job queued for processing"
        )
        async with self._lock:
            self._jobs[job_id] = job
            self._listeners[job_id] = []
        
        await self._persist_job(job)
        # Launch background task
        asyncio.create_task(self._run_job_pipeline(job_id, request))
        return job_id

    async def _broadcast(self, job_id: str, job: JobStatus):
        async with self._lock:
            listeners = list(self._listeners.get(job_id, []))
        
        payload = job.model_dump_json()
        for q in listeners:
            await q.put(payload)

    async def get_job(self, job_id: str) -> Optional[JobStatus]:
        async with self._lock:
            if job_id in self._jobs:
                return self._jobs[job_id]

        # Query database fallback
        try:
            async with aiosqlite.connect(config.DATABASE_PATH) as db:
                async with db.execute("""
                    SELECT job_id, stage, progress_pct, message, graph_json, audio_json, quiz_json, story_deck_json, error
                    FROM jobs WHERE job_id = ?
                """, (job_id,)) as cursor:
                    row = await cursor.fetchone()
                    if row:
                        graph = ContentGraph.model_validate_json(row[4]) if row[4] else None
                        audio = AudioBriefing.model_validate_json(row[5]) if row[5] else None
                        quiz = Quiz.model_validate_json(row[6]) if row[6] else None
                        story_deck = StoryDeck.model_validate_json(row[7]) if row[7] else None
                        job = JobStatus(
                            job_id=row[0],
                            stage=JobStage(row[1]),
                            progress_pct=row[2],
                            message=row[3],
                            graph=graph,
                            audio=audio,
                            quiz=quiz,
                            story_deck=story_deck,
                            error=row[8]
                        )
                        async with self._lock:
                            self._jobs[job_id] = job
                        return job
        except Exception as e:
            logger.warning(f"Failed to fetch job from DB: {e}")
        return None

    async def subscribe(self, job_id: str) -> AsyncGenerator[str, None]:
        queue = asyncio.Queue()
        async with self._lock:
            if job_id not in self._listeners:
                self._listeners[job_id] = []
            self._listeners[job_id].append(queue)

        # Emit initial current status
        current = await self.get_job(job_id)
        if current:
            yield f"data: {current.model_dump_json()}\n\n"

        try:
            while True:
                msg = await queue.get()
                yield f"data: {msg}\n\n"
                try:
                    data = json.loads(msg)
                    if data.get("stage") in (JobStage.COMPLETED.value, JobStage.FAILED.value):
                        break
                except Exception:
                    pass
        finally:
            async with self._lock:
                if job_id in self._listeners and queue in self._listeners[job_id]:
                    self._listeners[job_id].remove(queue)

    async def _run_job_pipeline(self, job_id: str, req: IngestRequest):
        job = self._jobs[job_id]
        context: Dict[str, Any] = {
            "job_id": job_id,
            "input_type": req.input_type,
            "content": req.content,
            "url": req.url,
            "lens": req.lens.value,
            "persona": req.persona.value,
            "language": req.language
        }

        try:
            # Stage 1: Ingest & Extract
            job.stage = JobStage.FETCHING
            job.progress_pct = 15
            job.message = "Fetching and sanitizing source content (SSRF protected)..."
            await self._persist_job(job)
            await self._broadcast(job_id, job)

            extract_step = IngestAndExtractStep()
            context = await extract_step.execute(context)

            # Stage 2: Content Graph Builder
            job.stage = JobStage.BUILDING_GRAPH
            job.progress_pct = 35
            job.message = "Extracting Content Graph, entities, concepts, and factual claims..."
            await self._persist_job(job)
            await self._broadcast(job_id, job)

            graph_step = GraphBuilderStep()
            context = await graph_step.execute(context)
            job.graph = context.get("content_graph")
            await self._broadcast(job_id, job)

            # Stage 3: Trust Critic Verification Loop
            job.stage = JobStage.VERIFYING_CLAIMS
            job.progress_pct = 60
            job.message = "Evaluating source faithfulness & external Google Search Grounding..."
            await self._persist_job(job)
            await self._broadcast(job_id, job)

            trust_step = TrustCriticStep()
            context = await trust_step.execute(context)
            job.graph = context.get("content_graph")
            await self._broadcast(job_id, job)

            # Stage 4: Multi-Format Studio (Audio, Quiz, Story Cards in parallel!)
            job.stage = JobStage.GENERATING_AUDIO
            job.progress_pct = 80
            job.message = "FormatStudio: Generating Audio Briefing, Interactive Quiz, and Story Cards concurrently..."
            await self._persist_job(job)
            await self._broadcast(job_id, job)

            format_studio = FormatStudioWorkflow()
            context = await format_studio.execute(context)
            job.audio = context.get("audio_briefing")
            job.quiz = context.get("quiz")
            job.story_deck = context.get("story_deck")
            await self._broadcast(job_id, job)

            # Stage 5: Completed
            job.stage = JobStage.COMPLETED
            job.progress_pct = 100
            job.message = "Verification and multi-format experience generation complete!"
            await self._persist_job(job)
            await self._broadcast(job_id, job)
            logger.info(f"Job {job_id} successfully completed with full format suite!")

        except Exception as e:
            logger.exception(f"Job {job_id} failed: {e}")
            job.stage = JobStage.FAILED
            job.error = str(e)
            job.message = f"Execution failed: {e}"
            await self._persist_job(job)
            await self._broadcast(job_id, job)

job_manager = JobManager()
