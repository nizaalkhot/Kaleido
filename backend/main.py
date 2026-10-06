import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.core import config
from backend.core.database import init_database
from backend.api.router import api_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kaleido")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Kaleido Engine & database schema...")
    await init_database()
    yield
    logger.info("Kaleido Engine shutdown.")

app = FastAPI(
    title="Kaleido Engine API",
    description="One source, a verified experience for every audience.",
    version="0.2.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all modular API routes
app.include_router(api_router)

@app.get("/embed.js")
async def serve_embed_js():
    """Serves the standalone embed widget script for verified publisher domains."""
    embed_file = config.STATIC_DIR / "embed.js"
    if not embed_file.exists():
        raise HTTPException(status_code=404, detail="embed.js not found")
    return FileResponse(
        embed_file,
        media_type="application/javascript",
        headers={"X-Kaleido-Provenance": "verified-source"}
    )
