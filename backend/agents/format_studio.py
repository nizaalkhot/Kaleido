import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types

from backend import config
from backend.models.schemas import (
    ContentGraph,
    Quiz,
    QuizQuestion,
    StoryDeck,
    StoryCard
)
from backend.agents.workflow_engine import WorkflowStep, ParallelWorkflow
from backend.agents.audio_pipeline import AudioGeneratorStep
from backend.utils.json_parser import clean_and_parse_json

logger = logging.getLogger(__name__)

class QuizGeneratorStep(WorkflowStep):
    """Generates an interactive, persona-tuned quiz grounded strictly in verified claims."""
    def __init__(self):
        super().__init__("QuizGenerator")

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        graph: ContentGraph = context.get("content_graph")
        lens = context.get("lens", "news")
        persona = context.get("persona", "general")
        language = context.get("language", "en")

        if not graph:
            return context

        client = config.get_genai_client()
        claims_context = "\n".join([f"- [{c.claim_id}] {c.normalized_statement}" for c in graph.claims if c.status == "VERIFIED"][:6])
        if not claims_context:
            claims_context = "\n".join([f"- [{c.claim_id}] {c.normalized_statement}" for c in graph.claims[:4]])

        prompt = f"""
You are Kaleido's Interactive Quiz Architect.
Generate 3 to 4 multiple-choice questions grounded in the verified claims below.

Target Lens: {lens}
Target Audience Persona: {persona} (If 'student', make it educational and engaging; if 'executive', focus on strategic implications and figures)
Language: {language} (If 'hi', write in natural Hindi/Hinglish; if 'mr', in Marathi; otherwise English)

Title: {graph.title}
Verified Claims:
{claims_context}

Requirements for each question:
1. question: clear, engaging question testing understanding of key facts.
2. options: exactly 4 plausible choices.
3. correct_index: integer 0, 1, 2, or 3.
4. explanation: concise rationale explaining why the answer is correct and citing the claim.
5. citation_claim_id: the exact claim_id from above that verifies this fact.
6. difficulty: "easy", "medium", or "hard".

Respond strictly in valid JSON matching:
{{
  "title": "{graph.title} Quiz",
  "questions": [
    {{
      "question": "What is...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "According to verified data in claim_1...",
      "citation_claim_id": "claim_1",
      "difficulty": "medium"
    }}
  ]
}}
"""
        try:
            response = client.models.generate_content(
                model=config.GEMINI_PRO_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            data = clean_and_parse_json(response.text, default={})
            questions = [QuizQuestion(**q) for q in data.get("questions", [])]
            quiz = Quiz(
                title=data.get("title", f"{graph.title} Quiz"),
                target_persona=persona,
                language=language,
                questions=questions
            )
        except Exception as e:
            logger.warning(f"Quiz generation LLM fallback: {e}")
            fallback_q = [
                QuizQuestion(
                    question=f"What is the key development highlighted regarding {graph.title}?",
                    options=[
                        graph.summary[:80],
                        "No significant developments were reported.",
                        "Initial findings were retracted.",
                        "Development has been paused indefinitely."
                    ],
                    correct_index=0,
                    explanation=f"Based on the verified overview of {graph.title}.",
                    citation_claim_id=graph.claims[0].claim_id if graph.claims else "claim_1",
                    difficulty="medium"
                )
            ]
            quiz = Quiz(
                title=f"{graph.title} Interactive Quiz",
                target_persona=persona,
                language=language,
                questions=fallback_q
            )

        context["quiz"] = quiz
        return context

class StoryDeckGeneratorStep(WorkflowStep):
    """Generates 4-6 swipeable visual summary cards with headlines, takeaways, and metrics."""
    def __init__(self):
        super().__init__("StoryDeckGenerator")

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        graph: ContentGraph = context.get("content_graph")
        lens = context.get("lens", "news")
        persona = context.get("persona", "general")
        language = context.get("language", "en")

        if not graph:
            return context

        client = config.get_genai_client()
        claims_context = "\n".join([f"- [{c.claim_id}] {c.quote}" for c in graph.claims[:6]])

        prompt = f"""
You are Kaleido's Visual Story Card Designer.
Create a series of 4 to 5 punchy, swipeable Story Cards based on the verified content.

Target Lens: {lens}
Persona: {persona}
Language: {language}

Title: {graph.title}
Summary: {graph.summary}
Source Claims:
{claims_context}

For each card return:
- card_id: e.g. "card_1"
- title: Short section title (e.g. "The Breakthrough", "Scale & Impact", "Key Metric", "What's Next")
- headline: Bold 1-sentence hook
- key_takeaway: 1-2 sentence digestible explanation
- statistic_or_metric: prominent metric or stat if available (e.g. "99.85%", "200 GW", "12x suppression") or null
- source_quote: relevant quote
- category: "Milestone", "Technology", "Policy", or "Outlook"

Respond strictly in valid JSON matching:
{{
  "title": "{graph.title} Visual Story",
  "cards": [
    {{
      "card_id": "card_1",
      "title": "The Core Finding",
      "headline": "Decisive advance achieved in real-world testing",
      "key_takeaway": "Researchers observed high reliability across sustained operations.",
      "statistic_or_metric": "99.85%",
      "source_quote": "...",
      "category": "Technology"
    }}
  ]
}}
"""
        try:
            response = client.models.generate_content(
                model=config.GEMINI_PRO_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            data = clean_and_parse_json(response.text, default={})
            cards = [StoryCard(**c) for c in data.get("cards", [])]
            deck = StoryDeck(
                title=data.get("title", f"{graph.title} Story Cards"),
                cards=cards
            )
        except Exception as e:
            logger.warning(f"StoryDeck LLM fallback: {e}")
            fallback_cards = [
                StoryCard(
                    card_id="card_1",
                    title="Executive Summary",
                    headline=graph.title,
                    key_takeaway=graph.summary[:180],
                    statistic_or_metric=f"{graph.trust_score}% Verified",
                    source_quote=graph.claims[0].quote if graph.claims else None,
                    category="Milestone"
                ),
                StoryCard(
                    card_id="card_2",
                    title="Key Entities",
                    headline="Organizations & Concepts Involved",
                    key_takeaway=", ".join([e.name for e in graph.entities[:4]]),
                    statistic_or_metric=f"{len(graph.entities)} Entities",
                    category="Context"
                )
            ]
            deck = StoryDeck(
                title=f"{graph.title} Story Cards",
                cards=fallback_cards
            )

        context["story_deck"] = deck
        return context

class FormatStudioWorkflow(ParallelWorkflow):
    """Runs Audio, Quiz, and Story Card generators concurrently."""
    def __init__(self):
        super().__init__(
            "FormatStudio",
            [
                AudioGeneratorStep(),
                QuizGeneratorStep(),
                StoryDeckGeneratorStep()
            ]
        )
