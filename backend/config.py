import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from google import genai

logger = logging.getLogger(__name__)

# Load .env file from project root or backend dir
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# GCP & Vertex AI Settings
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "team-gain")
GCP_LOCATION = os.getenv("GCP_LOCATION", "us-central1")

# Gemini Models (Configured centrally for Vertex AI)
# Default to latest high-capability models; overrideable via environment
GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.5-flash")
GEMINI_PRO_MODEL = os.getenv("GEMINI_PRO_MODEL", "gemini-2.5-pro")

# Storage & Database
STATIC_DIR = BASE_DIR / "static"
AUDIO_OUTPUT_DIR = STATIC_DIR / "audio"
DATABASE_PATH = BASE_DIR / "kaleido.db"

# Ensure directories exist
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Google Cloud Text-to-Speech Settings
# Neural2 / Journey voices for realistic dual-speaker podcast / news briefing
VOICE_HOST = os.getenv("VOICE_HOST", "en-US-Journey-F")
VOICE_ANALYST = os.getenv("VOICE_ANALYST", "en-US-Journey-D")
VOICE_HINDI_HOST = os.getenv("VOICE_HINDI_HOST", "hi-IN-Neural2-A")
VOICE_HINDI_ANALYST = os.getenv("VOICE_HINDI_ANALYST", "hi-IN-Neural2-B")
VOICE_MARATHI_HOST = os.getenv("VOICE_MARATHI_HOST", "mr-IN-Wavenet-A")
VOICE_MARATHI_ANALYST = os.getenv("VOICE_MARATHI_ANALYST", "mr-IN-Wavenet-B")

def get_genai_client() -> genai.Client:
    """Centralized factory for Vertex AI Gemini client with fallback."""
    try:
        return genai.Client(
            vertexai=True,
            project=GCP_PROJECT_ID,
            location=GCP_LOCATION
        )
    except Exception as e:
        logger.warning(f"Vertex AI client init failed: {e}. Falling back to default GenAI client.")
        return genai.Client()
