from __future__ import annotations
from typing import Dict, Any, List
from app.core.config import settings
from app.services.llm.gemini_client import generate_json

EVAL_PROMPT_VERSION = "v1.0.0"

RUBRIC = """
Scoring rubric (total 100):
- Skills match: 0–40
- Experience relevance: 0–40
- Role fit (projects/education/overall alignment): 0–20

Labels:
- Strong Fit: total_score >= 80
- Medium Fit: 60–79
- Weak Fit: < 60
"""

def build_eval_prompt(jd_text: str, candidate_name: str, evidence_items: List[dict]) -> str:
    evidence_text = "\n\n".join(
        [f"[Evidence {i+1}] (chunk_index={e.get('chunk_index')} score={e.get('score'):.4f})\n{e.get('chunk_text','')}"
         for i, e in enumerate(evidence_items)]
    )

    return f"""
You are an experienced recruiter evaluating ONE candidate for ONE job.
You MUST use ONLY the evidence provided. If evidence is missing, score lower and explain.

JOB DESCRIPTION:
{jd_text}

CANDIDATE:
{candidate_name}

EVIDENCE FROM RESUME (retrieved chunks):
{evidence_text}

{RUBRIC}

Return STRICT JSON with exactly these keys:
{{
  "total_score": number,
  "score_breakdown": {{"skills": number, "experience": number, "role_fit": number}},
  "label": "Strong Fit" | "Medium Fit" | "Weak Fit",
  "strengths": [string, ...],
  "gaps": [string, ...],
  "explanation_bullets": [string, ...],
  "evidence_used": [{{"chunk_index": number, "reason": string}}, ...]
}}

Rules:
- Keep skills/experience/role_fit within rubric ranges.
- Use 3–6 explanation_bullets.
- evidence_used must reference chunk_index values from the evidence list only.
""".strip()

def evaluate_candidate_with_gemini(
    jd_text: str,
    candidate_name: str,
    evidence_items: List[dict],
    model: str | None = None,
) -> Dict[str, Any]:
    prompt = build_eval_prompt(jd_text, candidate_name, evidence_items)
    result = generate_json(model=(model or settings.GEMINI_MODEL), prompt=prompt, temperature=0.2)

    # minimal safety validation
    for k in ["total_score", "score_breakdown", "label", "explanation_bullets", "evidence_used"]:
        if k not in result:
            raise RuntimeError(f"Missing key in Gemini JSON: {k}")

    return result
