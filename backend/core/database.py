import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import aiosqlite

from backend.core import config

logger = logging.getLogger(__name__)

@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[aiosqlite.Connection, None]:
    """Provides a managed asynchronous SQLite connection."""
    async with aiosqlite.connect(config.DATABASE_PATH) as db:
        yield db

async def init_database():
    """Initializes tables for jobs and reader events if they do not exist."""
    logger.info("Initializing Kaleido SQLite database schema...")
    async with get_db_connection() as db:
        # Jobs table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                stage TEXT,
                progress_pct INTEGER,
                message TEXT,
                graph_json TEXT,
                audio_json TEXT,
                quiz_json TEXT,
                story_deck_json TEXT,
                error TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Reader events telemetry table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS reader_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT,
                persona TEXT,
                language TEXT,
                format_type TEXT,
                section_index INTEGER,
                time_spent_ms INTEGER,
                completed BOOLEAN,
                dropped_off BOOLEAN,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Migrate schema if columns are missing from older database
        async with db.execute("PRAGMA table_info(jobs)") as cursor:
            columns = [row[1] for row in await cursor.fetchall()]
            if "quiz_json" not in columns:
                await db.execute("ALTER TABLE jobs ADD COLUMN quiz_json TEXT")
            if "story_deck_json" not in columns:
                await db.execute("ALTER TABLE jobs ADD COLUMN story_deck_json TEXT")

        await db.commit()
    logger.info("Kaleido SQLite database schema successfully initialized.")
