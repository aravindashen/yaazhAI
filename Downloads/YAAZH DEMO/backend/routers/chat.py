import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.database.db import get_db
from backend.database.models import ClassicalVerseModel
from backend.services.rag_engine import rag_engine
from backend.services.tamil_linguistics import (
    normalize_tamil,
    transliterate_tamil,
    clean_tamil_for_search,
    convert_tanglish_to_tamil
)
from backend.security import sanitize_input

router = APIRouter(prefix="/api", tags=["Chat"])

class AskRequest(BaseModel):
    query: str
    language: Optional[str] = "ta"
    currentRole: Optional[str] = "study"
    history: Optional[List[Dict[str, Any]]] = None

class TranslateRequest(BaseModel):
    text: str
    targetLang: Optional[str] = "en"

@router.post("/translate")
async def translate_text(req: TranslateRequest, db: Session = Depends(get_db)):
    clean_text = sanitize_input(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text to translate is required")
        
    target_lang = req.targetLang or "en"
    clean_search = clean_tamil_for_search(clean_text)
    
    # 1. Check if it matches any canonical classical verse
    verses = db.query(ClassicalVerseModel).all()
    for v in verses:
        if clean_search and (clean_search in clean_tamil_for_search(v.full_text_ta) or any(clean_search in clean_tamil_for_search(l) for l in v.lines_ta)):
            if target_lang == "en" and v.translations:
                return {
                    "translatedText": v.translations[0].get("text"),
                    "translator": v.translations[0].get("translator"),
                    "source": "Canonical Classical Translation",
                    "detectedSourceLang": "ta"
                }
        if target_lang == "ta" and v.translations:
            if any(clean_text.lower() in tr.get("text", "").lower() for tr in v.translations):
                return {
                    "translatedText": "\n".join(v.lines_ta),
                    "source": "Classical Tamil Original",
                    "detectedSourceLang": "en"
                }

    # 2. Heuristic translation / transliteration
    if target_lang == "ta":
        converted, _ = convert_tanglish_to_tamil(clean_text)
        return {
            "translatedText": converted,
            "source": "Phonetic Tanglish/Linguistic Engine",
            "detectedSourceLang": "en"
        }
    else:
        return {
            "translatedText": transliterate_tamil(clean_text),
            "source": "ISO 15919 Transliteration Engine",
            "detectedSourceLang": "ta"
        }

@router.post("/ask")
@router.post("/chat")
async def ask_yaazh(req: AskRequest, db: Session = Depends(get_db)):
    clean_q = sanitize_input(req.query)
    if not clean_q:
        raise HTTPException(status_code=400, detail="Valid query parameter is required")
        
    # Check if this is a translation intent
    is_translate = bool(re.search(r'^(translate|மொழிபெயர்ப்பு|மொழிபெயர்)', clean_q, re.IGNORECASE))
    if is_translate:
        target = "en" if "english" in clean_q.lower() or "ஆங்கிலத்தில்" in clean_q else "ta"
        extracted = re.sub(r'^(translate|மொழிபெயர்ப்பு|மொழிபெயர்)\s*(to\s+english|to\s+tamil|in\s+english|in\s+tamil)?\s*[:,-]?\s*', '', clean_q, flags=re.IGNORECASE)
        trans_res = await translate_text(TranslateRequest(text=extracted or clean_q, targetLang=target), db)
        return {
            "type": "translation",
            "query": clean_q,
            "originalText": extracted or clean_q,
            "translatedText": trans_res.get("translatedText"),
            "detectedSourceLang": trans_res.get("detectedSourceLang"),
            "targetLang": target,
            "notes": trans_res.get("source")
        }

    # Execute Grounded RAG
    inquiry_res = await rag_engine.answer_inquiry(
        db,
        clean_q,
        language=req.language or "ta",
        role=req.currentRole or "study",
        history=req.history
    )
    return inquiry_res
