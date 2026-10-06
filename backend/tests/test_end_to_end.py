import pytest
import asyncio
from backend.services.job_manager import job_manager
from backend.models.schemas import IngestRequest, IngestType, LensType, JobStage

@pytest.mark.asyncio
async def test_end_to_end_job_processing():
    await job_manager.init_db()
    
    # Ingest a clean test article
    req = IngestRequest(
        input_type=IngestType.TEXT,
        content="""The James Webb Space Telescope (JWST) completed deep infrared observations of galaxy cluster SMACS 0723.
The composite image revealed gravitational lensing effects distorting light from background galaxies formed over 13 billion years ago.
JWST operates at an altitude of approximately 1.5 million kilometers from Earth at the Second Lagrange Point (L2).""",
        lens=LensType.NEWS,
        persona="general",
        language="en"
    )
    
    job_id = await job_manager.create_job(req)
    assert job_id.startswith("job_")
    
    # Wait for the job to complete or progress through stages
    max_wait_seconds = 45
    completed = False
    
    for _ in range(max_wait_seconds * 2):
        await asyncio.sleep(0.5)
        status = await job_manager.get_job(job_id)
        assert status is not None
        if status.stage == JobStage.COMPLETED:
            completed = True
            break
        elif status.stage == JobStage.FAILED:
            pytest.fail(f"Job execution failed with error: {status.error}")

    assert completed, f"Job {job_id} did not complete within timeout"
    final_job = await job_manager.get_job(job_id)
    assert final_job.graph is not None
    assert len(final_job.graph.claims) > 0
    assert final_job.audio is not None
    assert len(final_job.audio.transcript) > 0
