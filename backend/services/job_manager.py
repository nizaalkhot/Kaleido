import asyncio
import json
import logging
import uuid
from typing import Dict, Any, Optional, AsyncGenerator

from backend.models.schemas import (
    JobStatus,
    JobStage,
    IngestRequest
)
from backend.db.repositories.job_repository import job_repository
from backend.agents.ingest_pipeline import IngestAndExtractStep, GraphBuilderStep
from backend.agents.trust_pipeline import TrustCriticStep
from backend.agents.format_studio import FormatStudioWorkflow

logger = logging.getLogger(__name__)

class JobManager:
    """
    Orchestrates the multi-agent personalization and verification pipeline.
    Manages in-memory active jobs, SSE event broadcasts, and delegates storage to JobRepository.
    """
    def __init__(self):
        self._jobs: Dict[str, JobStatus] = {}
        self._listeners: Dict[str, list[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def init_db(self):
        """Initializes SQLite tables including content_cache via core/database.py."""
        from backend.core.database import init_database
        await init_database()

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

        await job_repository.save_job(job)
        # Launch background pipeline task
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

        # Query database repository fallback
        db_job = await job_repository.get_job(job_id)
        if db_job:
            async with self._lock:
                self._jobs[job_id] = db_job
            return db_job
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
            await job_repository.save_job(job)
            await self._broadcast(job_id, job)

            extract_step = IngestAndExtractStep()
            context = await extract_step.execute(context)

            # Stage 2: Content Graph Builder
            job.stage = JobStage.BUILDING_GRAPH
            job.progress_pct = 35
            job.message = "Extracting Content Graph, entities, concepts, and factual claims..."
            await job_repository.save_job(job)
            await self._broadcast(job_id, job)

            graph_step = GraphBuilderStep()
            context = await graph_step.execute(context)
            job.graph = context.get("content_graph")
            await self._broadcast(job_id, job)

            # Stage 3: Trust Critic Verification Loop
            job.stage = JobStage.VERIFYING_CLAIMS
            job.progress_pct = 60
            job.message = "Evaluating source faithfulness & external Google Search Grounding..."
            await job_repository.save_job(job)
            await self._broadcast(job_id, job)

            trust_step = TrustCriticStep()
            context = await trust_step.execute(context)
            job.graph = context.get("content_graph")
            await self._broadcast(job_id, job)

            # Stage 4: Multi-Format Studio (Audio, Quiz, Story Cards in parallel!)
            job.stage = JobStage.GENERATING_AUDIO
            job.progress_pct = 80
            job.message = "FormatStudio: Generating Audio Briefing, Interactive Quiz, and Story Cards concurrently..."
            await job_repository.save_job(job)
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
            await job_repository.save_job(job)
            await self._broadcast(job_id, job)
            logger.info(f"Job {job_id} successfully completed with full format suite!")

        except Exception as e:
            logger.exception(f"Job {job_id} failed: {e}")
            job.stage = JobStage.FAILED
            job.error = str(e)
            job.message = f"Execution failed: {e}"
            await job_repository.save_job(job)
            await self._broadcast(job_id, job)

job_manager = JobManager()
