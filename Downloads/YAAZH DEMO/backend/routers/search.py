from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.database.db import get_db
from backend.services.search_engine import search_engine
from backend.services.tamil_linguistics import (
    normalize_tamil,
    clean_tamil_for_search,
    convert_tanglish_to_tamil,
    split_sandhi_heuristic
)
from backend.security import sanitize_input

router = APIRouter(prefix="/api", tags=["Search"])

class SearchRequest(BaseModel):
    query: str
    workId: Optional[str] = None
    poet: Optional[str] = None
    meter: Optional[str] = None
    conceptId: Optional[str] = None
    language: Optional[str] = "ta"

class IdentifyRequest(BaseModel):
    text: str

class SmartInputRequest(BaseModel):
    text: Optional[str] = None
    query: Optional[str] = None

@router.post("/search")
def search_corpus(req: SearchRequest, db: Session = Depends(get_db)):
    clean_q = sanitize_input(req.query)
    if not clean_q:
        raise HTTPException(status_code=400, detail="Query parameter is required")
        
    results = search_engine.search(
        db,
        clean_q,
        work_id=req.workId,
        poet=req.poet,
        meter=req.meter,
        concept_id=req.conceptId
    )
    
    converted, was_tanglish = convert_tanglish_to_tamil(clean_q)
    
    return {
        "type": "search_results",
        "query": clean_q,
        "smartAnalysis": {
            "originalInput": clean_q,
            "detectedLanguage": "tanglish" if was_tanglish else ("tamil" if any('\u0B80' <= c <= '\u0BFF' for c in clean_q) else "english"),
            "tamilQuery": converted if was_tanglish else clean_q
        },
        "resultsCount": len(results),
        "results": results
    }

@router.post("/identify")
def identify_verse_text(req: IdentifyRequest, db: Session = Depends(get_db)):
    clean_text = sanitize_input(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text to identify is required")
        
    res = search_engine.identify_verse(db, clean_text)
    return res

@router.post("/smart-input")
def process_smart_input_route(req: SmartInputRequest, db: Session = Depends(get_db)):
    input_str = req.text or req.query or ""
    clean_str = sanitize_input(input_str)
    if not clean_str:
        raise HTTPException(status_code=400, detail="Input text is required")
        
    converted, was_tanglish = convert_tanglish_to_tamil(clean_str)
    norm = normalize_tamil(converted if was_tanglish else clean_str)
    identification = search_engine.identify_verse(db, norm)
    
    return {
        "originalInput": clean_str,
        "detectedLanguage": "tanglish" if was_tanglish else ("tamil" if any('\u0B80' <= c <= '\u0BFF' for c in clean_str) else "english"),
        "tamilQuery": converted if was_tanglish else clean_str,
        "normalizedTamil": norm,
        "verseMatch": identification["verse"] if identification["isKnownCorpusMatch"] else None,
        "confidence": identification["confidence"]
    }
