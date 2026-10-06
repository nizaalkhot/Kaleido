import pytest
from backend.agents.insights_agent import insights_agent
from backend.services.bigquery_service import bigquery_service

@pytest.mark.asyncio
async def test_insights_agent_drop_off_analysis():
    await bigquery_service.init_sqlite_fallback()
    
    insight = await insights_agent.analyze_drop_offs(
        job_id="test_dropoff_job",
        title="Superconducting Qubit Advances",
        summary="Quantum decoherence remains challenging across sustained gate operations.",
        persona="student"
    )
    
    assert insight.job_id == "test_dropoff_job"
    assert insight.drop_off_rate_pct > 0
    assert len(insight.diagnosis) > 0
    assert len(insight.recommended_rewrite) > 0
    assert insight.fact_invariance_verified is True
