from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Import question engine
from app.services.questions_engine import QuestionEngine

router = APIRouter()
qe = QuestionEngine()

# Request model
class CandidateProfile(BaseModel):
    data: Dict[str, Any] = {}


# ✅ Aptitude + Analytical
@router.post("/generate/aptitude")
async def generate_aptitude(profile: CandidateProfile):
    try:
        questions = qe.round_aptitude(profile.data)
        return {"status": "success", "round": "aptitude", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Technical Fundamentals
@router.post("/generate/technical")
async def generate_technical(profile: CandidateProfile):
    try:
        questions = qe.round_technical(profile.data)
        return {"status": "success", "round": "technical", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Hands-on Coding
@router.post("/generate/coding")
async def generate_coding(profile: CandidateProfile):
    try:
        questions = qe.round_coding(profile.data)
        return {"status": "success", "round": "coding", "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))