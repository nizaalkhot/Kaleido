import logging
from typing import Optional
from backend.core.database import get_db_connection
from backend.models.schemas import (
    JobStatus,
    JobStage,
    ContentGraph,
    AudioBriefing,
    Quiz,
    StoryDeck,
    ExecutiveBrief
)

logger = logging.getLogger(__name__)

class JobRepository:
    """Isolates SQLite persistence and queries for JobStatus entities."""

    async def save_job(self, job: JobStatus) -> None:
        """Persists or updates a job record in SQLite."""
        try:
            async with get_db_connection() as db:
                graph_json = job.graph.model_dump_json() if job.graph else None
                audio_json = job.audio.model_dump_json() if job.audio else None
                quiz_json = job.quiz.model_dump_json() if job.quiz else None
                story_deck_json = job.story_deck.model_dump_json() if job.story_deck else None
                executive_brief_json = job.executive_brief.model_dump_json() if job.executive_brief else None

                await db.execute("""
                    INSERT INTO jobs (job_id, stage, progress_pct, message, graph_json, audio_json, quiz_json, story_deck_json, executive_brief_json, error)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(job_id) DO UPDATE SET
                        stage=excluded.stage,
                        progress_pct=excluded.progress_pct,
                        message=excluded.message,
                        graph_json=excluded.graph_json,
                        audio_json=excluded.audio_json,
                        quiz_json=excluded.quiz_json,
                        story_deck_json=excluded.story_deck_json,
                        executive_brief_json=excluded.executive_brief_json,
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
                    executive_brief_json,
                    job.error
                ))
                await db.commit()
        except Exception as e:
            logger.warning(f"Error persisting job {job.job_id} to SQLite: {e}")

    async def get_job(self, job_id: str) -> Optional[JobStatus]:
        """Loads a job record from SQLite."""
        try:
            async with get_db_connection() as db:
                async with db.execute("""
                    SELECT job_id, stage, progress_pct, message, graph_json, audio_json, quiz_json, story_deck_json, error, executive_brief_json
                    FROM jobs WHERE job_id = ?
                """, (job_id,)) as cursor:
                    row = await cursor.fetchone()
                    if not row:
                        return None

                    graph = ContentGraph.model_validate_json(row[4]) if row[4] else None
                    audio = AudioBriefing.model_validate_json(row[5]) if row[5] else None
                    quiz = Quiz.model_validate_json(row[6]) if row[6] else None
                    story_deck = StoryDeck.model_validate_json(row[7]) if row[7] else None
                    executive_brief = None
                    if len(row) > 9 and row[9]:
                        try:
                            executive_brief = ExecutiveBrief.model_validate_json(row[9])
                        except Exception:
                            pass

                    return JobStatus(
                        job_id=row[0],
                        stage=JobStage(row[1]),
                        progress_pct=row[2],
                        message=row[3],
                        graph=graph,
                        audio=audio,
                        quiz=quiz,
                        story_deck=story_deck,
                        executive_brief=executive_brief,
                        error=row[8]
                    )
        except Exception as e:
            logger.warning(f"Failed to fetch job {job_id} from SQLite: {e}")
            return None

job_repository = JobRepository()
