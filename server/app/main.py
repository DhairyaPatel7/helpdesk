from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import router as tickets_router

settings = get_settings()

app = FastAPI(title="Support Ticket API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets_router, prefix="/api/v1")


@app.get("/api/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}
