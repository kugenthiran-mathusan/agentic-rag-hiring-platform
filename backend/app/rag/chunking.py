from __future__ import annotations
from dataclasses import dataclass
import re

@dataclass
class Chunk:
    text: str
    chunk_index: int

def chunk_text(text: str, max_chars: int = 900, overlap: int = 150) -> list[Chunk]:
    """
    Simple, reliable chunking for resumes.
    - max_chars: chunk size
    - overlap: repeated text to preserve context
    """
    text = text.strip()
    if not text:
        return []

    # split by paragraphs to keep meaning
    paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[str] = []
    buf = ""

    for p in paras:
        if len(buf) + len(p) + 2 <= max_chars:
            buf = (buf + "\n\n" + p).strip()
        else:
            if buf:
                chunks.append(buf)
            buf = p

    if buf:
        chunks.append(buf)

    # add overlap
    final_chunks: list[Chunk] = []
    for i, c in enumerate(chunks):
        if i == 0:
            final_chunks.append(Chunk(text=c, chunk_index=i))
        else:
            prev = final_chunks[-1].text
            overlap_text = prev[-overlap:] if len(prev) > overlap else prev
            final_chunks.append(Chunk(text=(overlap_text + "\n" + c).strip(), chunk_index=i))

    return final_chunks
