from app.api import evaluation
from fastapi import FastAPI  # type: ignore
from app.api import resume, questions

app = FastAPI(title="InterVueAI")

app.include_router(resume.router, prefix="/api/resume", tags=["Resume Parser"])
app.include_router(questions.router, prefix="/api/questions", tags=["Question Engine"])
app.include_router(
    evaluation.router, prefix="/api/evaluation", tags=["Evaluation Engine"]
)


@app.get("/")
def root():
    return {"message": "InterVueAI API running!"}
