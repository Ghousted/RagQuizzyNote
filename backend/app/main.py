from fastapi import FastAPI

from app.api.routes import health_routes

app = FastAPI(title="QuizzyNote API", version="0.1.0")
app.include_router(health_routes.router)


@app.get("/")
def root():
    return {"name": "QuizzyNote API", "docs": "/docs", "health": "/healthz"}
