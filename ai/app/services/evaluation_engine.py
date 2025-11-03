from typing import List, Dict, Any
import requests
import logging
import json
import re

logger = logging.getLogger(__name__)

class EvaluationEngine:
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

    def _safe_parse_json(self, text: str) -> Any:
        """Attempt to parse JSON from LLM output robustly.
        Returns Python object on success or None on failure.
        """
        if not text:
            return None
        # Try direct load
        try:
            return json.loads(text)
        except Exception:
            pass
        # Try to extract the first JSON object/array within the text
        try:
            match = re.search(r"(\{(?:.|\n)*\}|\[(?:.|\n)*\])", text)
            if match:
                return json.loads(match.group(1))
        except Exception:
            pass
        return None

    def _compute_jaccard_similarity(self, a: str, b: str) -> float:
        """Compute a simple Jaccard similarity between two texts tokenized by whitespace.
        Returns float in 0..1 rounded to 3 decimals.
        """
        if not a or not b:
            return 0.0
        set_a = set(re.findall(r"\w+", a.lower()))
        set_b = set(re.findall(r"\w+", b.lower()))
        if not set_a or not set_b:
            return 0.0
        inter = set_a.intersection(set_b)
        union = set_a.union(set_b)
        score = len(inter) / len(union)
        return round(score, 3)

    def _llm_score_components(self, merged_text: str) -> Any:
        prompt = f"""
You are an expert senior software engineering interviewer and hiring panel evaluator.

Evaluate the candidate ONLY based on the provided Q&A from multi‑round interviews.

Assign numeric scores between 0 and 1 (float values) for:

- technical_score
- communication_score
- problem_solving_score
- depth_score
- code_quality_score
- system_design_score
- confidence_score

If the interview did not include coding, set code_quality_score = null.
Determine if system design concepts appear (keywords: architecture, scaling, load balancing, caching, database schema, hashing, queues, microservices, high availability). If present, assign a numeric system_design_score between 0 and 1. If truly no system design evidence exists, set system_design_score = null.

Return STRICT JSON:

{{
 "technical_score": <float or null>,
 "communication_score": <float>,
 "problem_solving_score": <float>,
 "depth_score": <float>,
 "code_quality_score": <float or null>,
 "system_design_score": <float or null>,
 "confidence_score": <float>
}}

Candidate Q&A rounds:
{merged_text}

IMPORTANT:
- No commentary
- No text outside JSON
        """

        raw = self._llm_ollama(prompt)
        return self._safe_parse_json(raw)

    def evaluate(self, ideal_answer: str, candidate_answer: str, rubric: List[str]) -> Dict:
        prompt = f"""
        You are an interview evaluation model.

        Ideal Answer:
        {ideal_answer}

        Candidate Answer:
        {candidate_answer}

        Rubric criteria: {", ".join(rubric)}

        Evaluate candidate answer on:
        - Semantic similarity to ideal answer (0 to 1)
        - Rubric pass list (which criteria are satisfied)
        
        Respond in JSON like:
        {{
            "similarity": <float>,
            "rubric_pass": [<criteria>]
        }}
        """

        raw = self._llm_ollama(prompt)

        try:
            data = json.loads(raw)
        except Exception:
            parsed = self._safe_parse_json(raw)
            if isinstance(parsed, dict):
                data = parsed
            else:
                logger.error(f"Failed to parse LLM output: {raw}")
                data = {"similarity": 0, "rubric_pass": []}

        rubric_total = len(rubric)
        rubric_score = len(data.get("rubric_pass", [])) / rubric_total if rubric_total else 0

        return {
            "similarity": data.get("similarity", 0),
            "rubric_pass": data.get("rubric_pass", []),
            "rubric_total": rubric_total,
            "rubric_score": rubric_score
        }

    def evaluate_multi_round(self, session: Dict, ideal_answers: Dict = None, rubric: List[str] = None) -> Dict:
        """Evaluate a candidate session that contains multiple rounds.

        session: {
            "candidate_id": "...",
            "rounds": [ {"round":1, "questions": [...], "answers": [...]}, ... ]
        }
        ideal_answers: optional dict mapping question text or index to ideal_answer
        rubric: optional list of rubric criteria (strings)

        Returns a detailed JSON-like dict with per-question similarity, per-round scores,
        overall rubric pass, and final numeric score (0-100).
        """
        rounds = session.get("rounds", []) if isinstance(session, dict) else []
        # Build a merged prompt to send to LLM for an overall qualitative assessment
        merged_text = []
        for r in rounds:
            rn = r.get("round")
            qs = r.get("questions", [])
            ans = r.get("answers", [])
            merged_text.append(f"Round {rn}:")
            for i, q in enumerate(qs):
                a = ans[i] if i < len(ans) else ""
                merged_text.append(f"Q: {q}")
                merged_text.append(f"A: {a}")
        merged_prompt = (
            "You are an interview evaluation model. Provide a JSON object with:\n"
            "- overall_similarity (0-1)\n"
            "- round_breakdown: list of {round, round_similarity (0-1)}\n"
            "- per_question: list of {round, question, similarity (0-1), rubric_pass: []}\n"
            "- overall_rubric_pass: [] (list of criteria passed)\n"
            "- final_score: 0-100 numeric overall score\n\n"
            "Here is the combined candidate material:\n\n"
            + "\n".join(merged_text)
        )

        # First attempt: ask LLM for holistic scoring
        raw = self._llm_ollama(merged_prompt)
        parsed = self._safe_parse_json(raw)

        # Attempt structured LLM component scoring
        llm_component_scores = self._llm_score_components("\n".join(merged_text))

        if isinstance(llm_component_scores, dict) and "technical_score" in llm_component_scores:
            # Normalize nulls to 0 for final scoring logic
            cs = lambda k: llm_component_scores.get(k) if llm_component_scores.get(k) not in [None, "null"] else 0

            final_score = round(
                (
                    (cs("technical_score") * 0.35) +
                    (cs("problem_solving_score") * 0.25) +
                    (cs("depth_score") * 0.15) +
                    (cs("communication_score") * 0.10) +
                    ((cs("code_quality_score") or 0) * 0.10) +
                    ((cs("system_design_score") or 0) * 0.05)
                ) * 100,
                2
            )

            return {
                "overall_score": {
                    "score_100": final_score,
                    "grade": "A" if final_score >= 85 else ("B" if final_score >= 75 else ("C" if final_score >= 65 else "D")),
                    "decision": "Strong Hire" if final_score >= 85 else ("Hire" if final_score >= 75 else ("Borderline" if final_score >= 65 else "Reject"))
                },
                "round_scores": [
                    {"round": 1, "score_100": round(cs("technical_score") * 100, 2)},
                    {"round": 2, "score_100": round(cs("problem_solving_score") * 100, 2)},
                    {"round": 3, "score_100": round(cs("system_design_score") * 100, 2)}
                ],
                "recommended_role_fit": ["Backend Developer", "Full-Stack Engineer"]
            }

        # If LLM returned structured JSON matching the expected keys, use it.
        if isinstance(parsed, dict) and "final_score" in parsed:
            # Ensure numeric types and return as-is with safe defaults
            parsed.setdefault("overall_similarity", 0)
            parsed.setdefault("round_breakdown", [])
            parsed.setdefault("per_question", [])
            parsed.setdefault("overall_rubric_pass", [])
            parsed.setdefault("final_score", 0)
            return parsed

        # Fallback: compute automated granular scores using simple heuristics
        per_question = []
        round_breakdown = []
        round_weights = []
        for r in rounds:
            qs = r.get("questions", [])
            ans = r.get("answers", [])
            q_scores = []
            for i, q in enumerate(qs):
                ideal = None
                # try match by question text in provided ideal_answers
                if ideal_answers and isinstance(ideal_answers, dict):
                    ideal = ideal_answers.get(q) or ideal_answers.get(str(i))
                candidate_ans = ans[i] if i < len(ans) else ""
                if ideal:
                    sim = self._compute_jaccard_similarity(ideal, candidate_ans)
                else:
                    # no ideal available, approximate by comparing answer to question tokens
                    sim = self._compute_jaccard_similarity(q, candidate_ans)
                q_scores.append(sim)
                per_question.append({
                    "round": r.get("round"),
                    "question": q,
                    "similarity": sim,
                    "rubric_pass": [c for c in (rubric or []) if c.lower() in candidate_ans.lower()]
                })
            # round score = average of question scores
            round_score = round(sum(q_scores) / len(q_scores), 3) if q_scores else 0
            round_breakdown.append({"round": r.get("round"), "round_similarity": round_score})
            round_weights.append(round_score)

        overall_similarity = round(sum(round_weights) / len(round_weights), 3) if round_weights else 0

        # derive overall rubric pass as unique passed criteria from per_question
        overall_rubric_pass = set()
        for pq in per_question:
            for c in pq.get("rubric_pass", []):
                overall_rubric_pass.add(c)
        overall_rubric_pass = list(overall_rubric_pass)

        # final numeric score 0-100: scale overall_similarity and add small bonus for rubric pass coverage
        rubric_bonus = 0
        if rubric:
            rubric_covered = len(overall_rubric_pass) / len(rubric)
            rubric_bonus = round(rubric_covered * 20, 2)  # up to +20 points
        final_score = round(overall_similarity * 80 + rubric_bonus, 2)

        # Map round names based on order
        round_names = {
            1: "Aptitude",
            2: "Technical",
            3: "System Design / Coding"
        }

        rounds_summary = []
        for rb in round_breakdown:
            rounds_summary.append({
                "round": rb.get("round"),
                "round_name": round_names.get(rb.get("round"), f"Round {rb.get('round')}"),
                "score_100": round(rb.get("round_similarity", 0) * 100, 2),
                "strengths": [],
                "improvements": []
            })

        # Compute grade
        if final_score >= 85:
            grade = "A"
            decision = "Strong Hire"
        elif final_score >= 75:
            grade = "B"
            decision = "Hire"
        elif final_score >= 65:
            grade = "C"
            decision = "Borderline"
        else:
            grade = "D"
            decision = "Reject"

        # Skills default (LLM enrichment optional later)
        skills_breakdown = {
            "communication": overall_similarity,
            "problem_solving": overall_similarity,
            "technical_depth": overall_similarity,
            "coding_ability": overall_similarity,
            "system_design": overall_similarity,
            "clarity": overall_similarity,
            "accuracy": overall_similarity,
            "depth": overall_similarity,
            "relevance": overall_similarity
        }

        return {
            "overall_score": {
                "score_100": round(final_score, 2),
                "grade": grade,
                "decision": decision
            },
            "round_scores": [
                {"round": rb.get("round"), "score_100": round(rb.get("round_similarity", 0) * 100, 2)}
                for rb in round_breakdown
            ],
            "recommended_role_fit": ["Backend Developer", "Full-Stack Engineer"]
        }