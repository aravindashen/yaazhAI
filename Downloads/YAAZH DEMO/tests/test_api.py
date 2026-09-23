import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.tamil_linguistics import (
    normalize_tamil,
    clean_tamil_for_search,
    transliterate_tamil,
    split_sandhi_heuristic,
    calculate_moraic_cadence
)

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "capabilities" in data

def test_tamil_linguistics_normalization():
    text = "இருந்தோம்பி  இல்வாழ்வ   தெல்லாம்"
    normalized = normalize_tamil(text)
    assert normalized == "இருந்தோம்பி இல்வாழ்வ தெல்லாம்"

def test_sandhi_splitting():
    compound = "இருந்தோம்பி"
    split_res = split_sandhi_heuristic(compound)
    assert split_res == ["இருந்து", "ஓம்பி"]

def test_transliteration():
    tamil = "திருக்குறள்"
    trans = transliterate_tamil(tamil)
    assert "tirukkuṟaḷ" in trans.lower() or "tirukkural" in trans.lower()

def test_moraic_cadence():
    res = calculate_moraic_cadence("அறம்")
    assert "mora_count" in res
    assert res["mora_count"] > 0

def test_works_endpoint():
    response = client.get("/api/corpus/works")
    assert response.status_code == 200
    data = response.json()
    assert len(data["works"]) > 0

def test_search_endpoint():
    response = client.post("/api/search", json={"query": "விருந்தோம்பல்"})
    assert response.status_code == 200
    data = response.json()
    assert data["resultsCount"] >= 1
    assert data["results"][0]["verse"]["id"] == "kural-81"

def test_tanglish_search():
    response = client.post("/api/search", json={"query": "virunthombi"})
    assert response.status_code == 200
    data = response.json()
    assert data["resultsCount"] >= 1

def test_verse_identification():
    response = client.post("/api/identify", json={"text": "யாதும் ஊரே யாவரும் கேளிர்"})
    assert response.status_code == 200
    data = response.json()
    assert data["isKnownCorpusMatch"] is True
    assert data["verse"]["id"] == "pura-192"

def test_study_explain():
    response = client.post("/api/study/explain", json={"text": "இருந்தோம்பி இல்வாழ்வ தெல்லாம்"})
    assert response.status_code == 200
    data = response.json()
    assert "analysis" in data
    assert data["analysis"]["identifiedVerse"]["id"] == "kural-81"

def test_quiz_generator():
    response = client.post("/api/study/quiz", json={"verseId": "kural-81"})
    assert response.status_code == 200
    data = response.json()
    assert "quiz" in data
    assert "flashcards" in data
    assert len(data["quiz"]) >= 2

def test_voice_process_interaction():
    response = client.post("/api/voice/process", json={"query": "Explain Tirukkural 81", "language": "en"})
    assert response.status_code == 200
    data = response.json()
    assert "speechText" in data
    assert "displayText" in data

def test_citation_export():
    sample_citation = [{
        "workTitle": "திருக்குறள்",
        "authorOrPoet": "திருவள்ளுவர்",
        "chapterOrPoem": "விருந்தோம்பல்",
        "verseNumber": 81,
        "edition": "CICT Classical Tamil Series",
        "trustStatus": "VERIFIED"
    }]
    response = client.post("/api/research/export", json={"citations": sample_citation, "format": "BIBTEX"})
    assert response.status_code == 200
    data = response.json()
    assert "@incollection" in data["formatted"]
