import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.database.db import get_db
from backend.database.models import ClassicalVerseModel, TextualVariantModel
from backend.services.search_engine import search_engine
from backend.services.tamil_linguistics import (
    normalize_tamil,
    transliterate_tamil,
    split_sandhi_heuristic,
    calculate_moraic_cadence
)
from backend.services.ocr_engine import ocr_engine
from backend.services.quiz_service import generate_quiz_and_flashcards
from backend.security import sanitize_input, validate_uploaded_file

router = APIRouter(prefix="/api", tags=["Study"])

class ExplainRequest(BaseModel):
    text: str

class QuizRequest(BaseModel):
    verseId: str

class OcrBase64Request(BaseModel):
    imageBase64: str
    mimeType: Optional[str] = "image/jpeg"
    mode: Optional[str] = "student"

class PronounceRequest(BaseModel):
    text: str

@router.post("/study/explain")
def explain_study_text(req: ExplainRequest, db: Session = Depends(get_db)):
    clean_text = sanitize_input(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text is required for study analysis")
        
    norm_text = normalize_tamil(clean_text)
    identification = search_engine.identify_verse(db, norm_text)
    
    verse = identification.get("verse")
    sandhi_split = split_sandhi_heuristic(norm_text)
    
    analysis = {
        "originalText": norm_text,
        "transliteration": transliterate_tamil(norm_text),
        "identifiedVerse": verse,
        "sandhiSplit": sandhi_split,
        "explanationTa": verse["commentaries"][0]["textTa"] if (verse and verse.get("commentaries")) else "செவ்வியல் செய்யுள் உரை விளக்கம்",
        "explanationEn": verse["translations"][0]["text"] if (verse and verse.get("translations")) else "Classical Tamil literary interpretation",
        "vocabularyBreakdown": verse.get("vocabulary", []) if verse else [],
        "culturalContextTa": verse.get("culturalContextTa", "") if verse else "",
        "culturalContextEn": verse.get("culturalContextEn", "") if verse else "",
        "confidence": identification.get("confidence", 0.0)
    }
    
    return {"analysis": analysis}

@router.post("/study/ocr")
@router.post("/scanner/process")
async def process_ocr_image(req: OcrBase64Request, db: Session = Depends(get_db)):
    if not req.imageBase64:
        raise HTTPException(status_code=400, detail="No image base64 provided")
        
    try:
        # Strip data uri header if present
        clean_b64 = req.imageBase64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]
            
        image_bytes = base64.b64decode(clean_b64)
        validate_uploaded_file(image_bytes, req.mimeType or "image/jpeg", "upload.jpg")
        
        extracted_text, confidence, method = await ocr_engine.extract_text_from_image_bytes(
            image_bytes,
            mime_type=req.mimeType or "image/jpeg"
        )
        
        if not extracted_text:
            return {
                "status": "NO_TEXT",
                "message": "No legible Tamil text detected in image",
                "extractedText": "",
                "confidence": 0
            }
            
        norm = normalize_tamil(extracted_text)
        identification = search_engine.identify_verse(db, norm)
        
        study_analysis = {
            "originalText": norm,
            "transliteration": transliterate_tamil(norm),
            "identifiedVerse": identification.get("verse"),
            "sandhiSplit": split_sandhi_heuristic(norm),
            "explanationTa": identification["verse"]["commentaries"][0]["textTa"] if (identification.get("verse") and identification["verse"].get("commentaries")) else "எழுத்துணரி மூலம் பெறப்பட்ட பாடம்",
            "explanationEn": identification["verse"]["translations"][0]["text"] if (identification.get("verse") and identification["verse"].get("translations")) else "Text extracted via OCR",
            "vocabularyBreakdown": identification["verse"].get("vocabulary", []) if identification.get("verse") else [],
            "confidence": confidence
        }
        
        return {
            "status": "SUCCESS",
            "extractedText": norm,
            "transliteration": transliterate_tamil(norm),
            "confidence": confidence,
            "method": method,
            "identification": identification,
            "studyAnalysis": study_analysis,
            "mode": req.mode or "student"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@router.post("/study/quiz")
def generate_verse_quiz(req: QuizRequest, db: Session = Depends(get_db)):
    verse = db.query(ClassicalVerseModel).filter(ClassicalVerseModel.id == req.verseId).first()
    if not verse:
        verse = db.query(ClassicalVerseModel).first()
        
    if not verse:
        raise HTTPException(status_code=404, detail="No verse found")
        
    quiz_data = generate_quiz_and_flashcards(verse)
    return quiz_data

@router.post("/pronounce")
def get_pronunciation_cadence(req: PronounceRequest):
    clean_text = sanitize_input(req.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    norm = normalize_tamil(clean_text)
    words = norm.split()
    
    syllables = [calculate_moraic_cadence(w) for w in words if w]
    
    return {
        "original": norm,
        "transliteration": transliterate_tamil(norm),
        "syllables": syllables,
        "audioScript": norm
    }
