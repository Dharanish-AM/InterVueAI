from fastapi import FastAPI  # type: ignore
from app.api import resume

app = FastAPI(title="InterVueAI")

# Register routes
app.include_router(resume.router, prefix="/api", tags=["Resume Parser"])


@app.get("/")
def root():
    return {"message": "Resume Parsing API running!"}   
