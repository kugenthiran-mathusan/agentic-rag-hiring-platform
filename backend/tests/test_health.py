from fastapi.testclient import TestClient

from app.main import app


class _FakeEmbedder:
    def get_sentence_embedding_dimension(self) -> int:
        return 384


def test_health(monkeypatch):
    monkeypatch.setattr("app.main.get_embedder", lambda: _FakeEmbedder())
    monkeypatch.setattr("app.main.ensure_collection", lambda dim: None)

    with TestClient(app) as client:
        r = client.get("/health")

    assert r.status_code == 200
    assert r.json()["status"] == "ok"
