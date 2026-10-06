import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
import aiosqlite
from google.cloud import bigquery

from backend import config
from backend.models.schemas import ReaderEvent

logger = logging.getLogger(__name__)

DATASET_ID = "kaleido_analytics"
TABLE_ID = "reader_events"

class BigQueryTelemetryService:
    def __init__(self):
        self._bq_client = None
        self._table_ref = f"{config.GCP_PROJECT_ID}.{DATASET_ID}.{TABLE_ID}"
        self._bq_available = False
        self._init_client()

    def _init_client(self):
        try:
            self._bq_client = bigquery.Client(
                project=config.GCP_PROJECT_ID,
                location=config.GCP_LOCATION
            )
            # Check or create dataset
            dataset_ref = bigquery.DatasetReference(config.GCP_PROJECT_ID, DATASET_ID)
            try:
                self._bq_client.get_dataset(dataset_ref)
            except Exception:
                dataset = bigquery.Dataset(dataset_ref)
                dataset.location = config.GCP_LOCATION
                self._bq_client.create_dataset(dataset, exists_ok=True)
                logger.info(f"Created BigQuery dataset: {DATASET_ID}")

            # Check or create table
            schema = [
                bigquery.SchemaField("job_id", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("persona", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("language", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("format_type", "STRING", mode="NULLABLE"),
                bigquery.SchemaField("section_index", "INTEGER", mode="NULLABLE"),
                bigquery.SchemaField("time_spent_ms", "INTEGER", mode="NULLABLE"),
                bigquery.SchemaField("completed", "BOOLEAN", mode="NULLABLE"),
                bigquery.SchemaField("dropped_off", "BOOLEAN", mode="NULLABLE"),
                bigquery.SchemaField("timestamp", "TIMESTAMP", mode="NULLABLE"),
            ]
            table = bigquery.Table(self._table_ref, schema=schema)
            self._bq_client.create_table(table, exists_ok=True)
            self._bq_available = True
            logger.info(f"BigQuery telemetry connected: {self._table_ref}")
        except Exception as e:
            logger.warning(f"BigQuery initialization fallback to SQLite ({e})")
            self._bq_available = False

    async def init_sqlite_fallback(self):
        """Ensure local SQLite table exists for offline fallback."""
        async with aiosqlite.connect(config.DATABASE_PATH) as db:
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
            await db.commit()

    async def record_event(self, event: ReaderEvent) -> Dict[str, Any]:
        """Record reader engagement event to BigQuery with SQLite fallback."""
        row_data = {
            "job_id": event.job_id,
            "persona": event.persona,
            "language": event.language,
            "format_type": event.format_type,
            "section_index": event.section_index,
            "time_spent_ms": event.time_spent_ms,
            "completed": event.completed,
            "dropped_off": event.dropped_off,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        sink_used = "sqlite"
        if self._bq_available and self._bq_client:
            try:
                errors = self._bq_client.insert_rows_json(self._table_ref, [row_data])
                if not errors:
                    sink_used = "bigquery"
                else:
                    logger.warning(f"BigQuery streaming errors: {errors}. Falling back to SQLite.")
            except Exception as e:
                logger.warning(f"BigQuery insert failed ({e}). Falling back to SQLite.")

        # Always persist to SQLite for local fast querying & safety
        try:
            async with aiosqlite.connect(config.DATABASE_PATH) as db:
                await db.execute("""
                    INSERT INTO reader_events (job_id, persona, language, format_type, section_index, time_spent_ms, completed, dropped_off)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    event.job_id,
                    event.persona,
                    event.language,
                    event.format_type,
                    event.section_index,
                    event.time_spent_ms,
                    event.completed,
                    event.dropped_off
                ))
                await db.commit()
        except Exception as e:
            logger.error(f"Error persisting event to SQLite: {e}")

        return {"status": "recorded", "sink": sink_used}

    async def query_events(self, job_id: str) -> List[Dict[str, Any]]:
        """Query aggregated events for a job."""
        results = []
        try:
            async with aiosqlite.connect(config.DATABASE_PATH) as db:
                async with db.execute("""
                    SELECT section_index, COUNT(*) as total_views,
                           SUM(CASE WHEN dropped_off = 1 THEN 1 ELSE 0 END) as drop_offs,
                           AVG(time_spent_ms) as avg_time
                    FROM reader_events
                    WHERE job_id = ?
                    GROUP BY section_index
                    ORDER BY section_index ASC
                """, (job_id,)) as cursor:
                    rows = await cursor.fetchall()
                    for r in rows:
                        results.append({
                            "section_index": r[0],
                            "total_views": r[1],
                            "drop_offs": r[2],
                            "drop_off_rate": round((r[2] / max(1, r[1])) * 100.0, 1),
                            "avg_time_ms": round(r[3] or 0)
                        })
        except Exception as e:
            logger.warning(f"Error querying events from SQLite: {e}")
        return results

bigquery_service = BigQueryTelemetryService()
