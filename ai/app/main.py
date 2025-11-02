from fastapi import FastAPI
from app.api import resume, questions

app = FastAPI(title="InterVueAI")

app.include_router(resume.router, prefix="/api/resume", tags=["Resume Parser"])
app.include_router(questions.router, prefix="/api/questions", tags=["Question Engine"])

@app.get("/")
def root():
    return {"message": "InterVueAI API running!"}