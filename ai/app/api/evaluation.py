

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.evaluation_engine import EvaluationEngine

router = APIRouter()
engine = EvaluationEngine()

class EvaluationRequest(BaseModel):
    candidate_id: str
    rounds: List[Dict[str, Any]]
    ideal_answers: Dict[str, str] | None = None
    rubric: List[str] | None = None

@router.post("/evaluate")
async def evaluate_candidate(payload: EvaluationRequest):
    try:
        session = {
            "candidate_id": payload.candidate_id,
            "rounds": payload.rounds
        }

        result = engine.evaluate_multi_round(
            session=session,
            ideal_answers=payload.ideal_answers,
            rubric=payload.rubric
        )

        return {
            "status": "success",
            "candidate_id": payload.candidate_id,
            "evaluation": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))