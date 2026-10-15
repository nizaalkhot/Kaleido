import logging
import asyncio
from typing import Dict, Any, List
from google.genai import types
from backend.core import config
from backend.models.schemas import ContentGraph, GroundedCitation, GroundedQAResponse
from backend.utils.json_parser import clean_and_parse_json

logger = logging.getLogger(__name__)

class GroundedChatAgent:
    """Answers reader questions strictly grounded in the verified Content Graph with citations."""

    async def answer_question(self, graph: ContentGraph, question: str) -> Dict[str, Any]:
        claims_context = "\n".join([
            f"[{c.claim_id}] {c.normalized_statement} (Verified: {c.status == 'VERIFIED'}, Quote: \"{c.quote[:100]}\")"
            for c in graph.claims
        ])

        client = config.get_genai_client()
        prompt = f"""
You are Kaleido's Grounded Q&A Assistant.
Answer the user's question STRICTLY using the verified claims below.
If the information is not present in the claims, state clearly that the verified document does not provide this information.

Title: {graph.title}
Verified Claims:
{claims_context}

Question: {question}

Return valid JSON with:
1. "answer": Concise, authoritative answer (1-3 sentences).
2. "cited_claim_ids": Array of claim IDs used to support this answer (e.g. ["claim_1", "claim_2"]).
3. "suggested_questions": Array of 2-3 relevant follow-up questions based on the article's claims.

JSON format:
{{
  "answer": "...",
  "cited_claim_ids": ["claim_1"],
  "suggested_questions": ["What was the measured gate fidelity?", "How does this compare to earlier baselines?"]
}}
"""
        citations: List[GroundedCitation] = []
        suggested: List[str] = [
            f"What is the key takeaway of {graph.title}?",
            "What specific metrics were verified?",
            "How does this impact real-world applications?"
        ]

        try:
            resp = await asyncio.to_thread(
                client.models.generate_content,
                model=config.GEMINI_FLASH_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            data = clean_and_parse_json(resp.text, default={})
            answer = data.get("answer", f"Based on the verified claims in '{graph.title}', {graph.summary}")
            cited_ids = set(data.get("cited_claim_ids", []))
            if data.get("suggested_questions"):
                suggested = data.get("suggested_questions")[:3]

            # Build detailed citation objects from cited claims
            for claim in graph.claims:
                if claim.claim_id in cited_ids:
                    citations.append(
                        GroundedCitation(
                            claim_id=claim.claim_id,
                            statement=claim.normalized_statement,
                            quote=claim.quote,
                            confidence=claim.confidence or 1.0,
                            external_sources=claim.external_sources
                        )
                    )
        except Exception as e:
            logger.warning(f"Grounded Q&A LLM fallback: {e}")
            answer = f"Based on the verified claims in '{graph.title}', {graph.summary}"
            if graph.claims:
                citations.append(
                    GroundedCitation(
                        claim_id=graph.claims[0].claim_id,
                        statement=graph.claims[0].normalized_statement,
                        quote=graph.claims[0].quote,
                        confidence=graph.claims[0].confidence or 1.0,
                        external_sources=graph.claims[0].external_sources
                    )
                )

        return GroundedQAResponse(
            question=question,
            answer=answer,
            trust_score=graph.trust_score,
            citations=citations,
            suggested_questions=suggested
        ).model_dump()

chat_agent = GroundedChatAgent()
