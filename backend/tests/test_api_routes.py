import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.mark.asyncio
async def test_health_check_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["engine"] == "Kaleido ADK"
        assert "models" in data

@pytest.mark.asyncio
async def test_samples_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/samples")
        assert response.status_code == 200
        samples = response.json()
        assert len(samples) >= 2
        assert any(s["id"] == "sample_quantum_tech" for s in samples)

        sample_id = samples[0]["id"]
        detail_resp = await ac.get(f"/api/samples/{sample_id}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["id"] == sample_id
