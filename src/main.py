"""
Knowledge Graph Management Workbench - FastAPI backend entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import routes

app = FastAPI(
    title="Knowledge Graph Management Workbench API",
    description="Backend API for the Knowledge Graph Management workbench.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes.router, prefix="/api", tags=["api"])


@app.get("/")
def root():
    """Root health check."""
    return {"status": "ok", "service": "Knowledge Graph Management API"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "healthy"}
