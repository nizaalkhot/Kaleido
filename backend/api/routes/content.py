from pathlib import Path
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse, FileResponse

from backend.core import config
from backend.models.schemas import (
    IngestRequest,
    JobStatus,
    GroundedQARequest
)
from backend.services.job_manager import job_manager
from backend.agents.chat_agent import chat_agent

router = APIRouter(tags=["Content & Pipeline"])

@router.post("/ingest", status_code=status.HTTP_202_ACCEPTED)
async def start_ingestion(request: IngestRequest):
    """Initiates an ingestion and verification pipeline job."""
    if not request.content and not request.url:
        raise HTTPException(status_code=400, detail="Either 'content' or 'url' must be provided.")

    job_id = await job_manager.create_job(request)
    return {"job_id": job_id, "status": "queued"}

@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_details(job_id: str):
    """Fetches the current job status and generated artifacts."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.get("/jobs/{job_id}/stream")
async def stream_job_events(job_id: str):
    """Streams SSE events as the ADK pipeline progresses."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return StreamingResponse(
        job_manager.subscribe(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serves synthesized MP3 audio files."""
    file_path = config.AUDIO_OUTPUT_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")

@router.post("/chat")
async def grounded_qa(req: GroundedQARequest):
    """Answers reader questions strictly grounded in the verified Content Graph."""
    job = await job_manager.get_job(req.job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Verified Content Graph not found for job")

    return await chat_agent.answer_question(job.graph, req.question)
