from fastapi import APIRouter, UploadFile, File, HTTPException  # type: ignore
from app.services.resume_engine import ResumeEngine  # type: ignore

router = APIRouter()
resume_engine = ResumeEngine()


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    filename = file.filename.lower()

    if not (filename.endswith(".pdf") or filename.endswith(".docx")):
        raise HTTPException(status_code=400, detail="Only PDF or DOCX allowed")

    file_bytes = await file.read()
    parsed_text = resume_engine.extract_text(filename, file_bytes)

    if not parsed_text:
        raise HTTPException(status_code=500, detail="Unable to extract text")

    structured = resume_engine.parse_resume(parsed_text)
    return {"status": "success", "data": structured}
