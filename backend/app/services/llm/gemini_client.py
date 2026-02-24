import os
import json
from typing import Any, Dict
from google import genai
from google.genai import types
from app.core.config import settings

def _client():
    # Prefer explicit key from settings; fallback to env
    api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing")
    return genai.Client(api_key=api_key)

def generate_json(model: str, prompt: str, temperature: float = 0.2) -> Dict[str, Any]:
    client = _client()

    resp = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=temperature,
            response_mime_type="application/json",
        ),
    )

    # resp.text should be JSON due to response_mime_type
    try:
        return json.loads(resp.text)
    except Exception as e:
        raise RuntimeError(f"Gemini returned non-JSON: {resp.text[:500]}") from e
