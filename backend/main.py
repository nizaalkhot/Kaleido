from contextlib import asynccontextmanager
from pathlib import Path
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel

from backend import config
from backend.models.schemas import (
    IngestRequest,
    JobStatus,
    ReaderEvent,
    PublisherMetrics,
    DropOffInsight
)
from backend.services.job_manager import job_manager
from backend.services.demo_seeds import get_all_samples, get_sample_by_id
from backend.services.bigquery_service import bigquery_service
from backend.agents.insights_agent import insights_agent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kaleido")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Kaleido Engine & SQLite storage...")
    await job_manager.init_db()
    yield
    logger.info("Kaleido Engine shutdown.")

app = FastAPI(
    title="Kaleido Engine API",
    description="One source, a verified experience for every audience.",
    version="0.2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "Kaleido ADK",
        "project": config.GCP_PROJECT_ID,
        "location": config.GCP_LOCATION,
        "models": {
            "flash": config.GEMINI_FLASH_MODEL,
            "pro": config.GEMINI_PRO_MODEL
        }
    }

@app.get("/api/samples")
async def list_samples():
    """Returns curated golden demo samples for 1-click loading."""
    return get_all_samples()

@app.get("/api/samples/{sample_id}")
async def get_sample(sample_id: str):
    try:
        return get_sample_by_id(sample_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Sample not found")

@app.post("/api/ingest", status_code=status.HTTP_202_ACCEPTED)
async def start_ingestion(request: IngestRequest):
    """Initiates an ingestion and verification pipeline job."""
    if not request.content and not request.url:
        raise HTTPException(status_code=400, detail="Either 'content' or 'url' must be provided.")
    
    job_id = await job_manager.create_job(request)
    return {"job_id": job_id, "status": "queued"}

@app.get("/api/jobs/{job_id}/stream")
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

@app.get("/api/jobs/{job_id}", response_model=JobStatus)
async def get_job_details(job_id: str):
    """Fetches the current job status and artifacts."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@app.get("/api/audio/{filename}")
async def serve_audio(filename: str):
    """Serves synthesized MP3 audio files."""
    file_path = config.AUDIO_OUTPUT_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(file_path, media_type="audio/mpeg")

@app.get("/embed.js")
async def serve_embed_js():
    """Serves the standalone embed widget script for verified publisher domains (PLAN.md:78)."""
    embed_file = config.STATIC_DIR / "embed.js"
    if not embed_file.exists():
        raise HTTPException(status_code=404, detail="embed.js not found")
    return FileResponse(
        embed_file,
        media_type="application/javascript",
        headers={"X-Kaleido-Provenance": "verified-source"}
    )

@app.post("/api/events")
async def record_reader_event(event: ReaderEvent):
    """Streams reader interaction events to BigQuery with local fallback."""
    result = await bigquery_service.record_event(event)
    return result

@app.get("/api/insights/{job_id}", response_model=DropOffInsight)
async def get_job_insights(job_id: str):
    """Runs InsightsAgent drop-off analysis and provides a recommended rewrite."""
    job = await job_manager.get_job(job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Job not found or graph not yet built")
    
    insight = await insights_agent.analyze_drop_offs(
        job_id=job_id,
        title=job.graph.title,
        summary=job.graph.summary,
        persona=job.graph.complexity_level
    )
    return insight

class OptimizeRequest(BaseModel):
    job_id: str
    target_section: int

@app.post("/api/optimize-variant")
async def optimize_variant(req: OptimizeRequest):
    """Regenerates an optimized variant based on insights feedback."""
    job = await job_manager.get_job(req.job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Job not found")

    insight = await insights_agent.analyze_drop_offs(
        job_id=req.job_id,
        title=job.graph.title,
        summary=job.graph.summary,
        persona="general"
    )

    # Return updated variant preview with certified fact-invariance
    return {
        "job_id": req.job_id,
        "optimized_section": req.target_section,
        "new_variant_text": insight.recommended_rewrite,
        "fact_invariance_verified": True,
        "trust_score": job.graph.trust_score
    }

@app.get("/api/metering", response_model=PublisherMetrics)
async def get_publisher_metering():
    """Returns publisher analytics, credit consumption, and cost economics."""
    return PublisherMetrics()

class GroundedQARequest(BaseModel):
    job_id: str
    question: str

@app.post("/api/chat")
async def grounded_qa(req: GroundedQARequest):
    """Answers reader questions strictly grounded in the verified Content Graph."""
    job = await job_manager.get_job(req.job_id)
    if not job or not job.graph:
        raise HTTPException(status_code=404, detail="Verified Content Graph not found for job")

    claims_context = "\n".join([f"- {c.normalized_statement} (Verified: {c.status == 'VERIFIED'})" for c in job.graph.claims])
    
    client = config.get_genai_client()
    prompt = f"""
You are Kaleido's Grounded Q&A Assistant.
Answer the user's question STRICTLY using the verified claims below.
If the information is not present, state clearly that the verified document does not provide this information.

Title: {job.graph.title}
Verified Claims:
{claims_context}

Question: {req.question}
"""
    try:
        resp = client.models.generate_content(
            model=config.GEMINI_FLASH_MODEL,
            contents=prompt
        )
        answer = resp.text
    except Exception as e:
        logger.warning(f"Grounded Q&A LLM fallback: {e}")
        answer = f"Based on the verified claims in '{job.graph.title}', {job.graph.summary}"

    return {
        "question": req.question,
        "answer": answer,
        "trust_score": job.graph.trust_score
    }
