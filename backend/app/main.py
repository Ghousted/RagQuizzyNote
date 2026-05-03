from contextlib import asynccontextmanager
from fastapi import FastAPI

import app.models  # noqa: F401 — registers all ORM models with Base.metadata
from app.core.logging import RequestLogMiddleware
from app.db.session import Base, engine
from app.api.routes import auth_routes, health_routes, note_routes, ai_routes, dashboard_routes


@asynccontextmanager
async def lifespan(_: FastAPI):
    # TODO Phase 2: replace with Alembic migrations
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="QuizzyNote API", version="0.1.0", lifespan=lifespan)

app.add_middleware(RequestLogMiddleware)

app.include_router(health_routes.router)
app.include_router(auth_routes.router)
app.include_router(note_routes.router)
app.include_router(ai_routes.router)
app.include_router(dashboard_routes.router)


@app.get("/")
def root():
    return {"name": "QuizzyNote API", "docs": "/docs", "health": "/healthz"}
