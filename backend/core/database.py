import logging
import json
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
    """Initializes tables for jobs, reader events, billing, and sponsors if they do not exist."""
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
                executive_brief_json TEXT,
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
        # Content and claims verification cache table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS content_cache (
                content_hash TEXT PRIMARY KEY,
                graph_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Organizations Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                tier TEXT DEFAULT 'starter',
                stripe_customer_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # API Keys Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                name TEXT NOT NULL,
                key_hash TEXT UNIQUE NOT NULL,
                key_prefix TEXT NOT NULL,
                tier TEXT DEFAULT 'starter',
                credits_remaining INTEGER DEFAULT 1000,
                credits_total INTEGER DEFAULT 1000,
                rate_limit_rpm INTEGER DEFAULT 60,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Usage Records Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS usage_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                api_key_id TEXT,
                org_id TEXT,
                operation TEXT NOT NULL,
                credits_consumed INTEGER NOT NULL,
                job_id TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Subscriptions Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                plan_tier TEXT NOT NULL,
                billing_cycle TEXT DEFAULT 'monthly',
                status TEXT DEFAULT 'active',
                current_period_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                current_period_end TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Sponsor Campaigns Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sponsor_campaigns (
                id TEXT PRIMARY KEY,
                brand TEXT NOT NULL,
                headline TEXT NOT NULL,
                creative_text TEXT NOT NULL,
                cta_url TEXT NOT NULL,
                cta_label TEXT NOT NULL,
                cpm_bid REAL DEFAULT 15.0,
                matching_topics TEXT, -- JSON array of strings
                sponsor_badge TEXT DEFAULT 'Verified Partner',
                is_active BOOLEAN DEFAULT TRUE
            )
        """)

        # Sponsor Impressions Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sponsor_impressions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                campaign_id TEXT,
                job_id TEXT,
                format_type TEXT,
                publisher_org_id TEXT,
                cpm_earned REAL DEFAULT 0.015,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Verified Embed Domains Table
        await db.execute("""
            CREATE TABLE IF NOT EXISTS embed_domains (
                id TEXT PRIMARY KEY,
                org_id TEXT,
                domain TEXT UNIQUE NOT NULL,
                theme TEXT DEFAULT 'dark',
                is_premium BOOLEAN DEFAULT FALSE,
                impressions_total INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Schema migrations
        async with db.execute("PRAGMA table_info(jobs)") as cursor:
            columns = [row[1] for row in await cursor.fetchall()]
            if "quiz_json" not in columns:
                await db.execute("ALTER TABLE jobs ADD COLUMN quiz_json TEXT")
            if "story_deck_json" not in columns:
                await db.execute("ALTER TABLE jobs ADD COLUMN story_deck_json TEXT")
            if "executive_brief_json" not in columns:
                await db.execute("ALTER TABLE jobs ADD COLUMN executive_brief_json TEXT")

        # Seed initial demo Organization & default API Key if not present
        async with db.execute("SELECT id FROM organizations WHERE id = 'demo_publisher_org'") as cur:
            if not await cur.fetchone():
                await db.execute("""
                    INSERT INTO organizations (id, name, email, tier)
                    VALUES ('demo_publisher_org', 'Acme Media & Publishing Group', 'publisher@acmemedia.com', 'professional')
                """)

        async with db.execute("SELECT id FROM api_keys WHERE id = 'key_demo_live'") as cur:
            if not await cur.fetchone():
                import hashlib
                raw_key = "kal_live_9f83a84c71e24bc890"
                key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
                await db.execute("""
                    INSERT INTO api_keys (id, org_id, name, key_hash, key_prefix, tier, credits_remaining, credits_total, rate_limit_rpm)
                    VALUES ('key_demo_live', 'demo_publisher_org', 'Production Primary Key', ?, 'kal_live_9f83...', 'professional', 8420, 10000, 120)
                """, (key_hash,))

        # Seed sponsor campaigns if empty
        async with db.execute("SELECT COUNT(*) FROM sponsor_campaigns") as cur:
            count = (await cur.fetchone())[0]
            if count == 0:
                campaigns = [
                    (
                        "camp_google_vertex",
                        "Google Cloud Vertex AI",
                        "Scale Generative AI on Proven Infrastructure",
                        "Deploy enterprise-ready LLMs, ground with Google Search, and accelerate time to market.",
                        "https://cloud.google.com/vertex-ai",
                        "Explore Vertex AI",
                        18.5,
                        json.dumps(["artificial intelligence", "technology", "cloud", "machine learning", "quantum", "data"]),
                        "Vertex AI Partner"
                    ),
                    (
                        "camp_stripe",
                        "Stripe Billing & Payments",
                        "Financial Infrastructure for the Internet",
                        "Accept payments, manage subscriptions, and automate revenue recognition with 99.999% uptime.",
                        "https://stripe.com",
                        "Start with Stripe",
                        16.0,
                        json.dumps(["business", "finance", "economy", "revenue", "startup", "commerce"]),
                        "Verified FinTech"
                    ),
                    (
                        "camp_datadog",
                        "Datadog Cloud Observability",
                        "End-to-End Monitoring & Tracing",
                        "Correlate metrics, traces, and logs in real time across hybrid cloud environments.",
                        "https://www.datadoghq.com",
                        "Try Free 14 Days",
                        14.0,
                        json.dumps(["software", "devops", "cloud", "security", "engineering", "infrastructure"]),
                        "Enterprise Partner"
                    )
                ]
                await db.executemany("""
                    INSERT INTO sponsor_campaigns (id, brand, headline, creative_text, cta_url, cta_label, cpm_bid, matching_topics, sponsor_badge)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, campaigns)

        # Seed initial embed domains
        async with db.execute("SELECT COUNT(*) FROM embed_domains") as cur:
            count = (await cur.fetchone())[0]
            if count == 0:
                await db.execute("""
                    INSERT INTO embed_domains (id, org_id, domain, theme, is_premium, impressions_total)
                    VALUES ('dom_1', 'demo_publisher_org', 'news.techwire.io', 'dark', 1, 14850)
                """)
                await db.execute("""
                    INSERT INTO embed_domains (id, org_id, domain, theme, is_premium, impressions_total)
                    VALUES ('dom_2', 'demo_publisher_org', 'academy.edulabs.org', 'editorial', 1, 9320)
                """)

        await db.commit()
    logger.info("Kaleido SQLite database schema successfully initialized.")
