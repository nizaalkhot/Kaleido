import pytest
from backend.models.schemas import ReaderEvent
from backend.services.bigquery_service import bigquery_service

@pytest.mark.asyncio
async def test_record_and_query_reader_event():
    await bigquery_service.init_sqlite_fallback()
    
    event = ReaderEvent(
        job_id="test_job_123",
        persona="student",
        language="en",
        format_type="story",
        section_index=1,
        time_spent_ms=4500,
        completed=True,
        dropped_off=False
    )
    
    res = await bigquery_service.record_event(event)
    assert res["status"] == "recorded"
    
    events = await bigquery_service.query_events("test_job_123")
    assert len(events) > 0
    assert events[0]["section_index"] == 1
