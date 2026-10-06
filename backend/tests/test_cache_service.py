import pytest
from backend.services.cache_service import (
    compute_content_hash,
    compute_audio_hash,
    get_cached_graph,
    set_cached_graph,
    cache_service
)
from backend.models.schemas import ContentGraph, Entity, Concept, Claim, VerificationStatus, DialogueTurn
from backend.core.database import init_database

def test_compute_content_hash_determinism():
    text1 = "   Artificial intelligence is transforming healthcare in 2026.   \n"
    text2 = "Artificial intelligence is transforming healthcare in 2026."
    hash1 = compute_content_hash(text1)
    hash2 = compute_content_hash(text2)
    assert hash1 == hash2
    assert len(hash1) == 16

def test_compute_audio_hash_determinism():
    turns = [
        DialogueTurn(speaker="Host", text="Welcome to Kaleido."),
        DialogueTurn(speaker="Analyst", text="Glad to be here.")
    ]
    h1 = compute_audio_hash(turns, "en", "en-US-Journey-F", "en-US-Journey-D")
    h2 = compute_audio_hash(turns, "en", "en-US-Journey-F", "en-US-Journey-D")
    h3 = compute_audio_hash(turns, "es", "es-US-Journey-F", "es-US-Journey-D")
    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 16

@pytest.mark.asyncio
async def test_cache_service_in_memory_and_sqlite():
    await init_database()
    test_text = "Quantum computing has demonstrated fault-tolerant quantum error correction in neutral atoms."
    chash = compute_content_hash(test_text)
    
    # Ensure cache miss initially
    cache_service._memory_cache.pop(chash, None)
    cached_initially = await get_cached_graph(chash)
    
    mock_graph = ContentGraph(
        title="Quantum Breakthrough",
        summary="Neutral atoms show fault-tolerance.",
        reading_time_minutes=2,
        tone="analytical",
        complexity_level="advanced",
        language="en",
        entities=[Entity(name="Quantum", category="TECHNOLOGY")],
        concepts=[Concept(name="Error Correction", description="Syndrome decoding")],
        claims=[Claim(
            claim_id="c_1",
            quote="Fault-tolerant neutral atoms demonstrated.",
            normalized_statement="Neutral atom qubits demonstrate fault tolerance.",
            status=VerificationStatus.VERIFIED,
            confidence=0.95
        )],
        trust_score=95.0
    )
    
    # Store in cache
    await set_cached_graph(chash, mock_graph)
    
    # Check in-memory hit
    cached_graph = await get_cached_graph(chash)
    assert cached_graph is not None
    assert cached_graph.title == "Quantum Breakthrough"
    assert cached_graph.is_cached is True
    assert len(cached_graph.claims) == 1
    assert cached_graph.claims[0].status == VerificationStatus.VERIFIED

    # Check persistence: clear in-memory and read back from SQLite
    cache_service._memory_cache.pop(chash, None)
    db_cached_graph = await get_cached_graph(chash)
    assert db_cached_graph is not None
    assert db_cached_graph.title == "Quantum Breakthrough"
    assert db_cached_graph.is_cached is True
