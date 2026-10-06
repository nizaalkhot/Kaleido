import ipaddress
import socket
import logging
import io
import base64
from typing import Dict, Any, Optional
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
from google import genai
from google.genai import types

from backend import config
from backend.models.schemas import (
    IngestType,
    ContentGraph,
    Entity,
    Concept,
    Claim,
    VerificationStatus
)
from backend.agents.workflow_engine import WorkflowStep

logger = logging.getLogger(__name__)

class SSRFSecurityError(ValueError):
    """Raised when a URL attempts to target internal or forbidden IP spaces."""
    pass

def validate_safe_url(url: str) -> None:
    """Validates that a URL does not resolve to loopback, private, or link-local IP addresses."""
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFSecurityError(f"Unsupported URL scheme: {parsed.scheme}. Only HTTP/HTTPS permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFSecurityError("Invalid URL: missing hostname.")

    # Resolve IP addresses
    try:
        _, _, ip_addresses = socket.gethostbyname_ex(hostname)
    except socket.gaierror as e:
        raise SSRFSecurityError(f"Could not resolve host '{hostname}': {e}")

    for ip_str in ip_addresses:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            raise SSRFSecurityError(f"Blocked request to internal IP address: {ip_str}")

async def fetch_url_content(url: str) -> str:
    """Safely fetch HTML and extract clean article text."""
    validate_safe_url(url)
    headers = {
        "User-Agent": "KaleidoBot/1.0 (+https://github.com/kaleido/kaleido-engine; Content Verification Demo)"
    }
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")
    # Remove script, style, nav, footer
    for element in soup(["script", "style", "nav", "footer", "header", "aside"]):
        element.decompose()

    # Extract clean text from paragraphs and headers
    paragraphs = [p.get_text().strip() for p in soup.find_all(["p", "h1", "h2", "h3", "li"])]
    clean_text = "\n\n".join([p for p in paragraphs if len(p) > 20])
    if not clean_text:
        clean_text = soup.get_text(separator=" ", strip=True)
    return clean_text[:25000]

def extract_pdf_text(raw_data: str) -> str:
    """Extract text from base64-encoded PDF."""
    try:
        # Check if base64 encoded
        pdf_bytes = base64.b64decode(raw_data)
    except Exception:
        pdf_bytes = raw_data.encode("utf-8")

    reader = PdfReader(io.BytesIO(pdf_bytes))
    extracted = []
    for page in reader.pages:
        txt = page.extract_text()
        if txt:
            extracted.append(txt)
    return "\n\n".join(extracted)

class IngestAndExtractStep(WorkflowStep):
    """Parses incoming input (Text, URL, or PDF) into sanitized plain text."""
    def __init__(self):
        super().__init__("IngestAndExtract")

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        input_type = context.get("input_type", IngestType.TEXT)
        raw_content = context.get("content", "")
        url = context.get("url")

        text = ""
        if input_type == IngestType.URL and url:
            logger.info(f"Fetching URL: {url}")
            text = await fetch_url_content(url)
        elif input_type == IngestType.PDF and raw_content:
            logger.info("Parsing PDF content...")
            text = extract_pdf_text(raw_content)
        else:
            text = str(raw_content).strip()

        if not text:
            raise ValueError("No text extracted from input.")

        context["sanitized_text"] = text
        context["text_preview"] = text[:300]
        return context

class GraphBuilderStep(WorkflowStep):
    """Uses Gemini to build the ContentGraph (entities, concepts, claims, tone, complexity)."""
    def __init__(self):
        super().__init__("GraphBuilder")

    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        text = context.get("sanitized_text", "")
        lens = context.get("lens", "news")
        persona = context.get("persona", "general")
        language = context.get("language", "en")

        client = config.get_genai_client()

        prompt = f"""
You are Kaleido's Content Graph Analyzer.
Analyze the following source text and produce a structured content graph.
Target Lens: {lens}
Target Persona: {persona}
Language: {language}

Source Text:
\"\"\"{text[:12000]}\"\"\"

Extract:
1. Title
2. Multi-sentence summary tailored to the lens and persona.
3. Reading time in minutes.
4. Overall tone (e.g. analytical, urgent, optimistic, neutral).
5. Complexity level (beginner, intermediate, advanced).
6. Key entities (name, category: Person/Org/Tech/Metric/Location, importance 0.0-1.0, short description).
7. Key concepts (name, description).
8. 4 to 8 ATOMIC factual claims directly asserted in the text. For each claim:
   - claim_id: e.g. "claim_1"
   - quote: verbatim quote from text
   - normalized_statement: standard objective statement
   - source_span: paragraph or section indicator

Respond strictly in valid JSON matching this structure:
{{
  "title": "string",
  "summary": "string",
  "reading_time_minutes": 3,
  "tone": "string",
  "complexity_level": "intermediate",
  "entities": [{{"name": "...", "category": "...", "importance": 0.9, "description": "..."}}],
  "concepts": [{{"name": "...", "description": "..."}}],
  "claims": [
    {{
      "claim_id": "claim_1",
      "quote": "verbatim text",
      "normalized_statement": "statement",
      "source_span": "paragraph 1"
    }}
  ]
}}
"""
        try:
            response = client.models.generate_content(
                model=config.GEMINI_FLASH_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            import json
            data = json.loads(response.text)
        except Exception as e:
            logger.error(f"Gemini Content Graph generation error: {e}. Using deterministic parsing fallback.")
            # Deterministic fallback parsing
            title_line = text.split("\n")[0][:80] or "Untitled Document"
            data = {
                "title": title_line,
                "summary": text[:400] + "...",
                "reading_time_minutes": max(1, len(text.split()) // 200),
                "tone": "analytical",
                "complexity_level": "intermediate",
                "entities": [
                    {"name": "Primary Subject", "category": "Topic", "importance": 0.9, "description": "Key focus of source"}
                ],
                "concepts": [
                    {"name": "Core Finding", "description": "Main thesis presented in text"}
                ],
                "claims": [
                    {
                        "claim_id": "claim_1",
                        "quote": text[:150],
                        "normalized_statement": text[:150],
                        "source_span": "Section 1"
                    }
                ]
            }

        claims_list = [
            Claim(
                claim_id=c.get("claim_id", f"claim_{i+1}"),
                quote=c.get("quote", ""),
                normalized_statement=c.get("normalized_statement", ""),
                source_span=c.get("source_span"),
                status=VerificationStatus.UNVERIFIED,
                confidence=0.0
            )
            for i, c in enumerate(data.get("claims", []))
        ]

        graph = ContentGraph(
            title=data.get("title", "Untitled Document"),
            summary=data.get("summary", ""),
            reading_time_minutes=data.get("reading_time_minutes", 3),
            tone=data.get("tone", "objective"),
            complexity_level=data.get("complexity_level", "intermediate"),
            language=language,
            entities=[Entity(**e) for e in data.get("entities", [])],
            concepts=[Concept(**c) for c in data.get("concepts", [])],
            claims=claims_list,
            trust_score=0.0,
            raw_content_preview=text[:300]
        )

        context["content_graph"] = graph
        return context
