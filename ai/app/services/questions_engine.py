from typing import Dict, List, Any
import requests # type: ignore
import logging
import json
import re

# Question Engine for InterVueAI
logging.basicConfig(level=logging.INFO, format="[InterVueAI] %(message)s")
logger = logging.getLogger(__name__)


class QuestionEngine:
    def __init__(self):
        logger.info("QuestionEngine initialized")

    def _safe_extract_list(self, text: str) -> List[str]:
        # Fallback: extract bullet/numbered lines
        lines = re.findall(r"(?:^|\n)[\-\*\d\)]\s*(.*)", text)
        cleaned = [l.strip() for l in lines if l.strip()]
        if cleaned:
            return cleaned
        # Last fallback: return whole text as one question
        return [text.strip()]

    def _safe_extract_json(self, text: str) -> Any:
        try:
            return json.loads(text)
        except Exception:
            # Try to extract JSON inside text
            try:
                match = re.search(r"\{.*\}|\[.*\]", text, re.DOTALL)
                if match:
                    return json.loads(match.group())
            except Exception:
                pass
        return None

    def _llm_ollama(self, prompt: str):
        logger.info("Sending prompt to Ollama (llama3.2)")
        logger.info(prompt)

        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={"model": "llama3.2", "prompt": prompt, "stream": False},
                timeout=60
            )
            data = response.json()
            logger.info(f"Ollama raw response: {str(data)[:500]}")

            return data.get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            return ""

    # ------------------- Aptitude Round -------------------
    def generate_aptitude_questions(self, profile: Dict) -> List[str]:
        name = profile.get("data", profile).get("name", "Candidate")

        prompt = f"""
You are InterVueAI. Generate exactly 5 aptitude questions for {name}, applying for a software engineering role.

Categories required:
1. Logical reasoning
2. Math
3. Problem solving
4. Pattern recognition
5. Analytical ability

Output strictly JSON:
{{
  "questions": ["Q1","Q2","Q3","Q4","Q5"]
}}
"""
        raw = self._llm_ollama(prompt)
        logger.info("LLM Parsed Output:")
        logger.info(raw)

        js = self._safe_extract_json(raw)
        if js and "questions" in js:
            return js["questions"]

        return [q for q in self._safe_extract_list(raw)]

    # ------------------- Technical Round -------------------
    def generate_technical_questions(self, profile: Dict) -> List[Dict]:
        data = profile.get("data", profile)
        skills = data.get("skills", {})
        projects = data.get("projects", [])

        all_skills = []
        for v in skills.values():
            if isinstance(v, list):
                all_skills.extend(v)

        tech_stack = ", ".join(all_skills)
        project_names = ", ".join([p.get("name","") for p in projects])

        prompt = f"""
Generate technical interview questions grouped into categories for a full-stack software engineer.

Candidate Skills: {tech_stack}
Projects: {project_names}

Categories to include:
- DSA
- OOP & Core CS
- Web Development
- Backend & Databases
- DevOps & Cloud
- System Design

Rules:
• Exactly one question per category
• No numbering or bullet points
• No markdown
• No prefixes like Q:
• Output strictly valid JSON

Expected output format:
{{
  "questions": [
    {{"category": "DSA", "question": "..." }},
    {{"category": "OOP & Core CS", "question": "..." }},
    {{"category": "Web Development", "question": "..." }},
    {{"category": "Backend & Databases", "question": "..." }},
    {{"category": "DevOps & Cloud", "question": "..." }},
    {{"category": "System Design", "question": "..." }}
  ]
}}
"""
        raw = self._llm_ollama(prompt)
        logger.info("LLM Parsed Output:")
        logger.info(raw)

        js = self._safe_extract_json(raw)
        if js and "questions" in js:
            return js["questions"]

        fallback = self._safe_extract_list(raw)[:6]
        categories = [
            "DSA",
            "OOP & Core CS",
            "Web Development",
            "Backend & Databases",
            "DevOps & Cloud",
            "System Design"
        ]

        return [
            {"category": categories[i], "question": fallback[i] if i < len(fallback) else ""}
            for i in range(len(categories))
        ]

    # ------------------- Coding Round -------------------
    def generate_coding_questions(self, profile: Dict) -> List[Dict]:
        data = profile.get("data", profile)
        skills = data.get("skills", {})
        languages = []

        for v in skills.values():
            if isinstance(v, list):
                languages.extend(v)

        primary = "Python"
        for lang in ["JavaScript", "TypeScript", "Java", "C++", "Python"]:
            if lang.lower() in [l.lower() for l in languages]:
                primary = lang
                break

        prompt = f"""
Candidate primary language = {primary}

Generate exactly 2 coding interview problems.

Each problem must include:
- Title (short)
- Problem description (clear)
- Constraints (time and space)
- Sample Input
- Sample Output
- Function signature in {primary}

Very Important Rules:
• Output strictly valid JSON only
• Do not wrap response in code blocks
• No markdown, no backticks, no quotes around keys beyond JSON rules
• No explanation text outside JSON
• starter_function must be a function signature only (no full solution)

Return strictly this JSON format:
[
  {{
    "title": "",
    "description": "",
    "constraints": "",
    "sample_input": "",
    "sample_output": "",
    "starter_function": "function example(input) {{ }}"
  }},
  {{
    "title": "",
    "description": "",
    "constraints": "",
    "sample_input": "",
    "sample_output": "",
    "starter_function": "function example(input) {{ }}"
  }}
]
"""
        raw = self._llm_ollama(prompt)
        logger.info("LLM Parsed Output:")
        logger.info(raw)

        js = self._safe_extract_json(raw)
        if isinstance(js, list):
            return js

        return [{
            "title": "Coding Challenge",
            "description": q,
            "constraints": "Follow optimal time and space complexity",
            "sample_input": "",
            "sample_output": "",
            "starter_function": ""
        } for q in self._safe_extract_list(raw)[:2]]

    # ------------------- Round Wrappers -------------------
    def round_aptitude(self, profile: Dict) -> List[str]:
        return self.generate_aptitude_questions(profile)

    def round_technical(self, profile: Dict) -> List[Dict]:
        return self.generate_technical_questions(profile)

    def round_coding(self, profile: Dict) -> List[Dict]:
        return self.generate_coding_questions(profile)
