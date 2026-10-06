import hashlib
import logging
from typing import Optional, List
from backend.core.database import get_db_connection
from backend.models.schemas import ContentGraph, DialogueTurn

logger = logging.getLogger(__name__)

class ContentCacheService:
    """
    Intelligent caching service for ContentGraph and synthesized audio assets.
    Eliminates redundant Gemini inference and Cloud TTS synthesis costs on identical content.
    """
    def __init__(self):
        self._memory_cache = {}

    def compute_content_hash(
        self,
        text: str,
        url: Optional[str] = None,
        lens: str = "news",
        persona: str = "general",
        language: str = "en"
    ) -> str:
        """Computes a deterministic SHA-256 fingerprint for content inputs."""
        normalized = (url or text.strip()).lower()
        key = f"{normalized}|lens:{lens}|persona:{persona}|lang:{language}"
        return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]

    def compute_audio_hash(
        self,
        turns: List[DialogueTurn],
        language: str,
        host_voice: str,
        analyst_voice: str
    ) -> str:
        """Computes a deterministic SHA-256 fingerprint for dialogue scripts and voices."""
        dialogue_content = "|".join([f"{t.speaker}:{t.text.strip()}" for t in turns])
        key = f"lang:{language}|host:{host_voice}|analyst:{analyst_voice}|{dialogue_content}"
        return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]

    async def get_cached_graph(self, content_hash: str) -> Optional[ContentGraph]:
        """Retrieves a cached, verified ContentGraph if available."""
        # 1. Fast in-memory lookup
        if content_hash in self._memory_cache:
            logger.info(f"⚡ In-memory cache HIT for content hash: {content_hash}")
            cached = self._memory_cache[content_hash]
            cached.is_cached = True
            return cached

        # 2. SQLite persistent cache lookup
        try:
            async with get_db_connection() as db:
                async with db.execute(
                    "SELECT graph_json FROM content_cache WHERE content_hash = ?",
                    (content_hash,)
                ) as cursor:
                    row = await cursor.fetchone()
                    if row and row[0]:
                        graph = ContentGraph.model_validate_json(row[0])
                        graph.is_cached = True
                        self._memory_cache[content_hash] = graph
                        logger.info(f"⚡ Persistent SQLite cache HIT for content hash: {content_hash}")
                        return graph
        except Exception as e:
            logger.warning(f"Error reading from content_cache table: {e}")

        return None

    async def set_cached_graph(self, content_hash: str, graph: ContentGraph) -> None:
        """Stores a verified ContentGraph in persistent and in-memory cache."""
        self._memory_cache[content_hash] = graph
        try:
            async with get_db_connection() as db:
                await db.execute("""
                    INSERT INTO content_cache (content_hash, graph_json)
                    VALUES (?, ?)
                    ON CONFLICT(content_hash) DO UPDATE SET graph_json=excluded.graph_json
                """, (content_hash, graph.model_dump_json()))
                await db.commit()
                logger.info(f"Saved verified ContentGraph to cache ({content_hash})")
        except Exception as e:
            logger.warning(f"Error writing to content_cache table: {e}")

cache_service = ContentCacheService()

# Module-level convenience functions
def compute_content_hash(text: str, url: Optional[str] = None, lens: str = "news", persona: str = "general", language: str = "en") -> str:
    return cache_service.compute_content_hash(text, url, lens, persona, language)

def compute_audio_hash(turns: List[DialogueTurn], language: str, host_voice: str, analyst_voice: str) -> str:
    return cache_service.compute_audio_hash(turns, language, host_voice, analyst_voice)

async def get_cached_graph(content_hash: str) -> Optional[ContentGraph]:
    return await cache_service.get_cached_graph(content_hash)

async def set_cached_graph(content_hash: str, graph: ContentGraph) -> None:
    await cache_service.set_cached_graph(content_hash, graph)
