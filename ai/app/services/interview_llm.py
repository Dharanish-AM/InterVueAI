import json
import subprocess

def llm(prompt: str) -> str:
    try:
        result = subprocess.run(
            ["ollama", "run", "llama3.2"],
            input=prompt.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        return result.stdout.decode().strip()
    except Exception as e:
        return f"Error running Ollama: {e}"

def generate_questions(role, level, resume, count):
    prompt = f"""
You are an AI interview generator. Create {count} technical interview questions for a {level} {role}.

Return ONLY valid JSON array in this exact format:
[
  {{"question":"...","model_answer":"...","rubric":["clarity","accuracy","depth"]}}
]

Requirements:
- Questions must be role-specific and realistic.
- Model answers must be technically correct and concise.
- Rubric must remain ["clarity","accuracy","depth"] always.
- No extra text, no descriptions, only JSON.

Resume context for tailoring questions:
{resume[:2000]}
    """

    raw = llm(prompt)

    # Try to extract first JSON array
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        parsed = json.loads(raw[start:end])
        return parsed
    except Exception:
        # Fallback basic structured questions
        return [{
            "question": f"Explain core {role} concept {i+1} relevant to {level} level.",
            "model_answer": "Provide a technically detailed explanation with examples.",
            "rubric": ["clarity", "accuracy", "depth"]
        } for i in range(count)]


def evaluate_answer(model_answer, candidate_answer, rubric):
    prompt = f"""
You are an interview evaluator. Compare the candidate answer to the expected answer.

Expected Answer:
{model_answer}

Candidate Answer:
{candidate_answer}

Rubric: {rubric}

Return JSON only:
{{
 "similarity": "<0-1 score>",
 "rubric_pass": []
}}
"""
    raw = llm(prompt)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return {
            "similarity": 0.5,
            "rubric_pass": rubric
        }


def design_review(prompt_text, context=None):
    prompt = f"""
You are a system design reviewer. Give feedback.

Prompt:
{prompt_text}

Context:
{context}

Return JSON only:
{{
 "review": "..."
}}
"""
    raw = llm(prompt)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return {"review": raw.strip()[:500]}


def assess_code(expected_solution, user_code, language):
    prompt = f"""
You are a code reviewer.

Expected Logic:
{expected_solution}

User Code ({language}):
{user_code}

Return JSON only:
{{
 "score": "<0-1>",
 "feedback": "..."
}}
"""
    raw = llm(prompt)

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        return {"score": 0.5, "feedback": raw.strip()[:500]}


def health_status():
    return {"ollama": True, "model": "llama3.2"}