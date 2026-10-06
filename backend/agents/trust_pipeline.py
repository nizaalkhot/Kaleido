import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types

from backend import config
from backend.models.schemas import ContentGraph, Claim, VerificationStatus
from backend.agents.workflow_engine import WorkflowStep
from backend.utils.json_parser import clean_and_parse_json
from backend.services.cache_service import cache_service
import asyncio

logger = logging.getLogger(__name__)

class TrustCriticStep(WorkflowStep):
    """
    Two-stage verification engine:
    1. Source Faithfulness Critic (checking invariance against the original source text)
    2. External World Grounding via Vertex AI Google Search (checking factual truth against the world)
    """
    def __init__(self):
        super().__init__("TrustCritic")

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        graph: ContentGraph = context.get("content_graph")
        source_text: str = context.get("sanitized_text", "")

        if not graph or not graph.claims:
            logger.info("No claims found to verify.")
            return context

        # If graph was retrieved from cache, it is already verified
        if context.get("is_cached"):
            logger.info(f"⚡ ContentGraph claims already verified (cached). Trust score: {graph.trust_score}%.")
            return context

        client = config.get_genai_client()
        updated_claims: List[Claim] = []
        verified_count = 0
        total_claims = len(graph.claims)

        # Batch verify claims against source faithfulness and external world
        claims_payload = [
            {"id": c.claim_id, "quote": c.quote, "statement": c.normalized_statement}
            for c in graph.claims
        ]

        eval_map = {}
        try:
            # Stage A: Unconstrained Search Grounding via Vertex AI (No JSON restriction to avoid 400 error)
            try:
                search_prompt = f"""
You are Kaleido's Trust & Truth Verification Critic.
Search Google to corroborate or contradict each of the following factual claims:

Source Text:
\"\"\"{source_text[:8000]}\"\"\"

Claims to verify:
{json.dumps(claims_payload, indent=2)}

For each claim:
1. Is it faithfully asserted in the source text without distortion?
2. Does external real-world knowledge confirm or debunk it?
Provide evidence quotes, URLs, and state if it is VERIFIED, CONTRADICTED, or UNVERIFIED.
"""
                search_resp = await asyncio.to_thread(
                    client.models.generate_content,
                    model=config.GEMINI_PRO_MODEL,
                    contents=search_prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())]
                    )
                )

                # Stage B: Rapid structuring into typed JSON evaluations
                struct_prompt = f"""
Convert the following factual verification report into structured JSON matching the specified format:

Verification Report:
\"\"\"{search_resp.text}\"\"\"

Respond strictly in valid JSON matching:
{{
  "evaluations": [
    {{
      "id": "claim_1",
      "status": "VERIFIED",
      "confidence": 0.95,
      "evidence_quote": "corroborating or contradicting evidence",
      "external_sources": ["https://..."],
      "fact_invariance_passed": true
    }}
  ]
}}
"""
                struct_resp = await asyncio.to_thread(
                    client.models.generate_content,
                    model=config.GEMINI_FLASH_MODEL,
                    contents=struct_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                data = clean_and_parse_json(struct_resp.text, default={})
                for item in data.get("evaluations", []):
                    eval_map[item.get("id")] = item
                logger.info(f"Google Search Grounding successfully corroborated {len(eval_map)} claims.")

            except Exception as search_err:
                logger.info(f"Two-stage search grounding fallback ({search_err}). Using direct Pro JSON verification.")
                direct_prompt = f"""
You are Kaleido's Trust Critic. Evaluate each claim on source faithfulness and world truth:
Source: \"\"\"{source_text[:8000]}\"\"\"
Claims: {json.dumps(claims_payload, indent=2)}
Return strictly JSON with evaluations array (id, status, confidence, evidence_quote, external_sources, fact_invariance_passed).
"""
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=config.GEMINI_PRO_MODEL,
                    contents=direct_prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                data = clean_and_parse_json(response.text, default={})
                for item in data.get("evaluations", []):
                    eval_map[item.get("id")] = item
        except Exception as e:
            logger.error(f"Error during claim verification LLM call: {e}. Applying heuristic verification fallback.")
            # Heuristic verification fallback
            for c in graph.claims:
                # If quote is directly found in source_text, mark VERIFIED
                is_faithful = c.quote.lower() in source_text.lower() or c.normalized_statement.lower() in source_text.lower()
                eval_map[c.claim_id] = {
                    "id": c.claim_id,
                    "status": "VERIFIED" if is_faithful else "UNVERIFIED",
                    "confidence": 0.88 if is_faithful else 0.45,
                    "evidence_quote": f"Matched in source context: '{c.quote[:80]}...'",
                    "external_sources": [],
                    "fact_invariance_passed": is_faithful
                }

        # Apply results back to claims
        for original_claim in graph.claims:
            res = eval_map.get(original_claim.claim_id)
            if res:
                raw_status = res.get("status", "UNVERIFIED").upper()
                if raw_status not in ("VERIFIED", "CONTRADICTED", "UNVERIFIED"):
                    raw_status = "UNVERIFIED"
                
                status_enum = VerificationStatus(raw_status)
                confidence = float(res.get("confidence", 0.8))
                evidence = res.get("evidence_quote")
                sources = res.get("external_sources", [])
                invariance = bool(res.get("fact_invariance_passed", True))

                if status_enum == VerificationStatus.VERIFIED:
                    verified_count += 1

                updated_claims.append(
                    Claim(
                        claim_id=original_claim.claim_id,
                        quote=original_claim.quote,
                        normalized_statement=original_claim.normalized_statement,
                        source_span=original_claim.source_span,
                        status=status_enum,
                        confidence=confidence,
                        evidence_quote=evidence,
                        external_sources=sources,
                        fact_invariance_passed=invariance
                    )
                )
            else:
                updated_claims.append(original_claim)

        # Compute Trust Score percentage
        if total_claims > 0:
            score = round((verified_count / total_claims) * 100.0, 1)
        else:
            score = 100.0

        graph.claims = updated_claims
        graph.trust_score = score
        context["content_graph"] = graph
        logger.info(f"Trust Layer completed. Total claims: {total_claims}, Verified: {verified_count}, Trust Score: {score}%")

        # Save to Content Cache for instant subsequent retrievals
        content_hash = context.get("content_hash")
        if content_hash:
            await cache_service.set_cached_graph(content_hash, graph)

        return context
