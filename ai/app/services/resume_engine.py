import fitz  # PyMuPDF # type: ignore
import pdfplumber  # type: ignore
import docx  # type: ignore
import re
import os
from typing import Optional, List
import spacy  # type: ignore

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ResumeEngine")

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None


import json
import requests


class OllamaLLM:
    def __init__(self, model: str = "llama3.2"):
        self.model = model
        self.base_url = "http://localhost:11434/api/generate"

    def generate(self, prompt: str):
        try:
            response = requests.post(
                self.base_url,
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=60,
            )
            data = response.json()
            return data.get("response", "{}")
        except Exception:
            return "{}"

    def safe_json(self, text: str):
        try:
            return json.loads(text)
        except Exception:
            cleaned = text.strip()
            start = cleaned.find("{")
            end = cleaned.rfind("}") + 1
            if start != -1 and end != -1:
                try:
                    return json.loads(cleaned[start:end])
                except Exception:
                    return {}
            return {}


llm = OllamaLLM("llama3.2")


class ResumeEngine:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        logger.info("Starting PDF text extraction")
        text = ""
        try:
            with fitz.open(stream=file_bytes, filetype="pdf") as doc:
                for page in doc:
                    text += page.get_text("text")
        except Exception:
            pass

        if not text.strip():
            try:
                with pdfplumber.open(file_bytes) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
            except Exception:
                pass

        logger.info(f"PDF extraction complete, length={len(text)}")
        return text

    def extract_text_from_docx(self, file_bytes: bytes) -> str:
        logger.info("Starting DOCX text extraction")
        text = ""
        temp_file = "temp_resume.docx"
        try:
            with open(temp_file, "wb") as f:
                f.write(file_bytes)
            document = docx.Document(temp_file)
            text = "\n".join([para.text for para in document.paragraphs])
        except Exception:
            pass
        finally:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        logger.info(f"DOCX extraction complete, length={len(text)}")
        return text

    def clean_text(self, text: str) -> str:
        logger.info("Cleaning extracted text")
        if not text:
            return ""
        text = re.sub(r"\s+", " ", text)
        text = re.sub(r"[^\x00-\x7F]+", " ", text)
        return text.strip()

    def _validate_name(self, name: str, skills: list):
        if not name:
            return None
        blocked = set(skills)
        cleaned = name.strip()
        if cleaned.lower() in blocked:
            return None
        if len(cleaned.split()) > 4 or any(c.isdigit() for c in cleaned):
            return None
        return cleaned

    def extract_text(self, filename: str, file_bytes: bytes) -> Optional[str]:
        logger.info(f"Received file for extraction: {filename}")
        raw_text = ""
        if filename.endswith(".pdf"):
            raw_text = self.extract_text_from_pdf(file_bytes)
        elif filename.endswith(".docx"):
            raw_text = self.extract_text_from_docx(file_bytes)
        cleaned = self.clean_text(raw_text)
        logger.info(f"Text cleaned, length={len(cleaned) if cleaned else 0}")
        return cleaned if cleaned else None

    # -------------------- NLP BASED FALLBACK -------------------- #
    def nlp_extract(self, text: str):
        logger.info("Running spaCy NLP fallback extraction")
        if nlp is None:
            return {"name": None, "email": None, "phone": None, "skills": []}

        doc = nlp(text)
        data = {"name": None, "email": None, "phone": None, "skills": []}

        email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
        if email:
            data["email"] = email.group(0)

        phone = re.search(r"\+?\d[\d\s\-]{8,15}", text)
        if phone:
            data["phone"] = phone.group(0).strip()

        for ent in doc.ents:
            if ent.label_ == "PERSON" and data["name"] is None:
                data["name"] = ent.text
                break

        tech_keywords = [
            "python",
            "java",
            "javascript",
            "react",
            "node",
            "docker",
            "aws",
            "mongodb",
            "sql",
            "tensorflow",
            "pytorch",
            "html",
            "css",
            "git",
            "fastapi",
            "express",
            "redux",
            "typescript",
        ]
        lower = text.lower()
        data["skills"] = [s for s in tech_keywords if s in lower]

        return data

    # -------------------- LLM STRUCTURED PARSER -------------------- #
    def llm_parse(self, text: str):
        logger.info("Sending text to LLM for structured parsing")
        prompt = f"""
You are an ATS resume parser. Extract structured data in STRICT JSON format.

Schema:
{{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "links": {{
    "github": "",
    "linkedin": "",
    "portfolio": "",
    "other": []
  }},
  "summary": "",
  "skills": {{
    "languages": [],
    "frontend": [],
    "backend": [],
    "databases": [],
    "cloud & devops": [],
    "security": [],
    "tools": [],
    "ml & ai": []
  }},
  "education": [],
  "experience": [],
  "projects": [
  {{
    "name": "",
    "link": "",
    "description": "",
    "tech_stack": []
  }}
],
  "certifications": [],
  "languages_spoken": [],
  "raw_text": ""
}}

Rules:
- Extract real data only. Do not hallucinate facts.
- For each project, extract name, link if available, a short 1-2 sentence description, and a tech stack list.
- If summary missing, generate a 2-3 line professional summary.
- Extract GitHub and LinkedIn links if present.
- Categorize skills correctly into the given groups.
- Return only valid JSON.

Resume text:
{text}
"""
        resp = llm.generate(prompt)
        logger.info("LLM response received")
        try:
            return llm.safe_json(resp)
        except Exception:
            return {}

    # -------------------- FULL PIPELINE MERGE -------------------- #
    def parse_resume(self, text: str):
        logger.info("Running full resume parse pipeline (NLP + LLM)")
        nlp_data = self.nlp_extract(text)
        llm_data = self.llm_parse(text)

        name_candidate = llm_data.get("name") or nlp_data.get("name")
        # Merge skill keywords safely from NLP (list) and LLM (dict or list)
        llm_skills = llm_data.get("skills", {})
        merged_skills = []

        if isinstance(nlp_data.get("skills"), list):
            merged_skills += nlp_data.get("skills", [])

        if isinstance(llm_skills, list):
            merged_skills += llm_skills
        elif isinstance(llm_skills, dict):
            for category, skills_list in llm_skills.items():
                if isinstance(skills_list, list):
                    merged_skills += skills_list

        validated_name = self._validate_name(name_candidate, merged_skills)
        final = {
            "name": validated_name,
            "email": llm_data.get("email") or nlp_data.get("email"),
            "phone": llm_data.get("phone") or nlp_data.get("phone"),
            "location": llm_data.get("location", ""),
            "links": llm_data.get("links", {
                "github": "",
                "linkedin": "",
                "portfolio": "",
                "other": []
            }),
            "summary": llm_data.get("summary") or "",
            "skills": llm_data.get("skills", {}),
            "education": llm_data.get("education", []),
            "experience": llm_data.get("experience", []),
            "projects": llm_data.get("projects", []),
            "certifications": llm_data.get("certifications", []),
            "languages_spoken": llm_data.get("languages_spoken", []),
            "raw_text": text
        }
        logger.info("Resume parsing complete")
        return final
