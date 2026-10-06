import pytest
from backend.models.schemas import ContentGraph, Claim, VerificationStatus
from backend.agents.format_studio import QuizGeneratorStep, StoryDeckGeneratorStep

@pytest.mark.asyncio
async def test_quiz_generator_step():
    graph = ContentGraph(
        title="Solar Farm Breakthrough",
        summary="Khavda Renewable Park reached 15 GW generation capacity.",
        reading_time_minutes=2,
        tone="optimistic",
        complexity_level="intermediate",
        claims=[
            Claim(
                claim_id="claim_1",
                quote="Khavda Park reached 15 GW.",
                normalized_statement="Khavda reached 15 GW generation.",
                status=VerificationStatus.VERIFIED,
                confidence=0.95
            )
        ],
        trust_score=95.0
    )
    
    step = QuizGeneratorStep()
    ctx = await step.execute({"content_graph": graph, "persona": "student", "language": "en"})
    quiz = ctx.get("quiz")
    assert quiz is not None
    assert len(quiz.questions) > 0
    assert len(quiz.questions[0].options) == 4
    assert 0 <= quiz.questions[0].correct_index <= 3

@pytest.mark.asyncio
async def test_story_deck_generator_step():
    graph = ContentGraph(
        title="Quantum Leap",
        summary="A 100 logical qubit processor demonstrates sub-threshold error suppression.",
        reading_time_minutes=3,
        tone="analytical",
        complexity_level="advanced",
        claims=[
            Claim(
                claim_id="claim_1",
                quote="Achieved gate fidelity of 99.85%.",
                normalized_statement="Two-qubit gate fidelity achieved 99.85%.",
                status=VerificationStatus.VERIFIED,
                confidence=0.98
            )
        ],
        trust_score=98.0
    )
    
    step = StoryDeckGeneratorStep()
    ctx = await step.execute({"content_graph": graph, "persona": "general", "language": "en"})
    deck = ctx.get("story_deck")
    assert deck is not None
    assert len(deck.cards) > 0
    assert deck.cards[0].headline is not None
