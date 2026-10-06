import pytest
from pathlib import Path
from backend.models.schemas import (
    DialogueTurn,
    ContentGraph,
    Claim,
    VerificationStatus
)
from backend.agents.audio_pipeline import AudioGeneratorStep
from backend.agents.trust_pipeline import TrustCriticStep
from backend.core import config

@pytest.mark.asyncio
async def test_audio_generator_synthesizes_valid_mp3():
    step = AudioGeneratorStep()
    turns = [
        DialogueTurn(speaker="Host", text="Welcome to Kaleido's verified briefing."),
        DialogueTurn(speaker="Analyst", text="Today quantum physicists surpassed surface code thresholds.")
    ]
    filename, duration, segments = await step._synthesize_audio(turns, "en")
    output_path = config.AUDIO_OUTPUT_DIR / filename

    assert output_path.exists(), "Synthesized audio file must exist."
    assert output_path.stat().st_size > 10000, f"Audio file size must be > 10KB, got {output_path.stat().st_size} bytes."
    assert duration > 2.0, "Duration must be greater than 2 seconds."
    assert len(segments) == 2, "Segments must match turns count."

@pytest.mark.asyncio
async def test_trust_critic_verifies_faithful_claims_and_flags_contradiction():
    step = TrustCriticStep()
    source_text = (
        "Researchers at the International Quantum Research Institute have announced 100 logical qubits "
        "operating below the fault-tolerant threshold, achieving 99.85% two-qubit gate fidelity.\n"
        "The publication also claimed that the system achieved instantaneous room-temperature quantum computation "
        "with zero cooling infrastructure required."
    )
    claims = [
        Claim(
            claim_id="c1",
            quote="100 logical qubits operating below the fault-tolerant threshold",
            normalized_statement="Researchers demonstrated 100 logical qubits operating below fault-tolerant threshold."
        ),
        Claim(
            claim_id="c2",
            quote="achieved instantaneous room-temperature quantum computation with zero cooling infrastructure required",
            normalized_statement="The quantum computing system operates at room temperature with zero cooling infrastructure."
        )
    ]
    graph = ContentGraph(
        title="Quantum Computing Test",
        summary="Test summary",
        reading_time_minutes=2,
        complexity_level="moderate",
        tone="objective",
        language="en",
        claims=claims
    )

    context = {
        "content_graph": graph,
        "sanitized_text": source_text,
        "is_cached": False
    }

    result = await step.execute(context)
    verified_graph: ContentGraph = result["content_graph"]

    assert verified_graph.trust_score > 0, "Trust score must be greater than 0."
    claim_map = {c.claim_id: c for c in verified_graph.claims}

    # Claim 1 should be verified
    assert claim_map["c1"].status in (VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED)
    # Claim 2 should be flagged/contradicted
    assert claim_map["c2"].status == VerificationStatus.CONTRADICTED
    assert "room-temperature" in claim_map["c2"].evidence_quote.lower() or "contradicted" in claim_map["c2"].evidence_quote.lower()
