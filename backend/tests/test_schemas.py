import pytest
from backend.models.schemas import (
    IngestRequest,
    IngestType,
    LensType,
    ContentGraph,
    Claim,
    Entity,
    Concept,
    VerificationStatus
)

def test_ingest_request_defaults():
    req = IngestRequest(content="Sample news body")
    assert req.input_type == IngestType.TEXT
    assert req.lens == LensType.NEWS
    assert req.language == "en"

def test_claim_and_content_graph_validation():
    claim = Claim(
        claim_id="claim_1",
        quote="Renewable capacity crossed 200 GW.",
        normalized_statement="India's installed renewable capacity exceeded 200 GW.",
        status=VerificationStatus.VERIFIED,
        confidence=0.96,
        evidence_quote="MNRE confirmed 201.2 GW capacity in Q1.",
        external_sources=["https://mnre.gov.in"]
    )
    
    graph = ContentGraph(
        title="India Renewable Expansion",
        summary="India has surpassed 200 GW non-fossil capacity.",
        reading_time_minutes=2,
        tone="optimistic",
        complexity_level="intermediate",
        entities=[Entity(name="MNRE", category="Organization", importance=0.9)],
        concepts=[Concept(name="BESS", description="Battery storage systems")],
        claims=[claim],
        trust_score=96.0
    )
    
    assert graph.trust_score == 96.0
    assert len(graph.claims) == 1
    assert graph.claims[0].status == VerificationStatus.VERIFIED
    
    # Test JSON serialization / deserialization roundtrip
    json_str = graph.model_dump_json()
    reconstructed = ContentGraph.model_validate_json(json_str)
    assert reconstructed.title == graph.title
    assert reconstructed.claims[0].confidence == 0.96

def test_executive_brief_and_flashcards_validation():
    from backend.models.schemas import ExecutiveBrief, MetricFlashcard
    brief = ExecutiveBrief(
        title="Executive Strategic Memo",
        executive_summary="Key milestone achieved in production deployment.",
        strategic_takeaways=["Rapid deployment timeline", "High cost efficiency"],
        market_catalysts=["Regulatory approval"],
        key_risks_and_limitations=["Scaling infrastructure"],
        action_items=["Initiate Phase 2 review"],
        flashcards=[
            MetricFlashcard(
                id="card_1",
                metric="99.85%",
                label="Benchmark Fidelity",
                significance="Exceeds fault tolerance threshold.",
                verified_source_claim="Achieved 99.85% two-qubit fidelity.",
                claim_id="claim_1"
            )
        ]
    )
    dumped = brief.model_dump_json()
    reconstructed = ExecutiveBrief.model_validate_json(dumped)
    assert reconstructed.title == "Executive Strategic Memo"
    assert len(reconstructed.flashcards) == 1
    assert reconstructed.flashcards[0].metric == "99.85%"

