import logging
from typing import Dict, Any
from backend.core import config
from backend.models.schemas import ContentGraph

logger = logging.getLogger(__name__)

class GroundedChatAgent:
    """Answers reader questions strictly grounded in the verified Content Graph."""

    async def answer_question(self, graph: ContentGraph, question: str) -> Dict[str, Any]:
        claims_context = "\n".join([
            f"- {c.normalized_statement} (Verified: {c.status == 'VERIFIED'})"
            for c in graph.claims
        ])

        client = config.get_genai_client()
        prompt = f"""
You are Kaleido's Grounded Q&A Assistant.
Answer the user's question STRICTLY using the verified claims below.
If the information is not present, state clearly that the verified document does not provide this information.

Title: {graph.title}
Verified Claims:
{claims_context}

Question: {question}
"""
        try:
            resp = client.models.generate_content(
                model=config.GEMINI_FLASH_MODEL,
                contents=prompt
            )
            answer = resp.text
        except Exception as e:
            logger.warning(f"Grounded Q&A LLM fallback: {e}")
            answer = f"Based on the verified claims in '{graph.title}', {graph.summary}"

        return {
            "question": question,
            "answer": answer,
            "trust_score": graph.trust_score
        }

chat_agent = GroundedChatAgent()
