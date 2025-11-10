from fastapi import FastAPI  # type: ignore
from app.api import resume, questions, evaluation
from app.services.resume_engine import OllamaLLM
import logging

app = FastAPI(title="InterVueAI")

app.include_router(resume.router, prefix="/api/resume", tags=["Resume Parser"])
app.include_router(questions.router, prefix="/api/questions", tags=["Question Engine"])
app.include_router(
    evaluation.router, prefix="/api/evaluation", tags=["Evaluation Engine"]
)

logger = logging.getLogger("InterVueAI")
ollama_instance = None


@app.on_event("startup")
async def preload_ollama():
    """Preload the Ollama model into memory at startup for faster resume parsing."""
    global ollama_instance
    logger.info("Preloading Ollama model for faster inference...")
    try:
        ollama_instance = OllamaLLM("llama3.1:8b-instruct")
        # Warm-up ping to load the model into memory
        ollama_instance.generate("Warmup: resume parsing readiness check.")
        logger.info("Ollama model preloaded successfully ✅")
    except Exception as e:
        logger.error(f"Failed to preload Ollama model: {e}")


@app.get("/")
def root():
    return {
        "message": "InterVueAI API running with Ollama preloaded for faster parsing!"
    }
