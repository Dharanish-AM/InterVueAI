from fastapi import FastAPI, HTTPException # type: ignore
from pydantic import BaseModel # type: ignore
from typing import List, Optional

from app.services.interview_llm import (
    generate_questions,
    evaluate_answer,
    design_review,
    assess_code,
    health_status
)
from app.services.resume_parser import parse_resume_file

app = FastAPI(title="InterVueAI AI Engine", version="1.0")


# ====== Pydantic Models ======
class QuestionRequest(BaseModel):
    role: str
    level: str
    resume_text: Optional[str] = ""
    count: int = 6


class AnswerEvalRequest(BaseModel):
    model_answer: str
    candidate_answer: str
    rubric: List[str] = []


class ResumeParseRequest(BaseModel):
    file_path: str


class DesignReviewRequest(BaseModel):
    prompt: str
    context: Optional[str] = None


class CodeEvalRequest(BaseModel):
    expected_solution: str
    user_code: str
    language: str = "python"


# ====== Routes ======
@app.post("/questions")
def api_generate_questions(req: QuestionRequest):
    try:
        return generate_questions(req.role, req.level, req.resume_text, req.count)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/evaluate")
def api_evaluate(req: AnswerEvalRequest):
    try:
        return evaluate_answer(req.model_answer, req.candidate_answer, req.rubric)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/resume")
def api_parse_resume(req: ResumeParseRequest):
    try:
        text = parse_resume_file(req.file_path)
        return {"parsed_text": text}
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/design_review")
def api_design_review(req: DesignReviewRequest):
    try:
        return design_review(req.prompt, req.context)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.post("/code_review")
def api_code_assess(req: CodeEvalRequest):
    try:
        return assess_code(req.expected_solution, req.user_code, req.language)
    except Exception as e:
        raise HTTPException(500, str(e))


@app.get("/health")
def api_health():
    return health_status()