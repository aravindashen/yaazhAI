from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.database.db import get_db
from backend.database.models import ClassicalVerseModel
from backend.services.search_engine import search_engine
from backend.services.rag_engine import rag_engine
from backend.security import sanitize_input

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class VoiceProcessRequest(BaseModel):
    query: Optional[str] = None
    transcript: Optional[str] = None
    text: Optional[str] = None
    currentVerseId: Optional[str] = None
    currentRole: Optional[str] = "study"
    action: Optional[str] = None
    language: Optional[str] = "ta"
    userQuizAnswer: Optional[str] = None
    currentQuizQuestion: Optional[Dict[str, Any]] = None

@router.post("/process")
async def process_voice_interaction(req: VoiceProcessRequest, db: Session = Depends(get_db)):
    raw_query = req.query or req.transcript or req.text or ""
    clean_query = sanitize_input(raw_query)
    is_ta = req.language == "ta"
    
    # 1. Voice Quiz Evaluation
    if req.action == "EVALUATE_QUIZ" and req.currentQuizQuestion:
        user_ans = (req.userQuizAnswer or clean_query).lower()
        expected = str(req.currentQuizQuestion.get("expectedAnswer", "")).lower()
        is_correct = expected in user_ans or any(len(p) > 2 and p in user_ans for p in expected.split())
        
        speech = (
            f"மிகச் சரி! {req.currentQuizQuestion.get('explanationTa', 'சரியான விடை.')}" if (is_correct and is_ta) else
            (f"Correct! {req.currentQuizQuestion.get('explanationEn', 'Great job.')}" if is_correct else
             (f"சரியான விடை: {req.currentQuizQuestion.get('expectedAnswer')}. {req.currentQuizQuestion.get('explanationTa', '')}" if is_ta else
              f"The correct answer is: {req.currentQuizQuestion.get('expectedAnswer')}. {req.currentQuizQuestion.get('explanationEn', '')}"))
        )
        return {
            "intent": "QUIZ_EVALUATION",
            "isCorrect": is_correct,
            "speechText": speech,
            "displayText": speech,
            "followUpSuggestions": ["அடுத்த கேள்வி", "பாடலின் பொருள்", "ஆய்வு"] if is_ta else ["Next question", "Explain poem", "Research"]
        }
        
    # 2. Identify active verse
    active_verse = None
    if req.currentVerseId:
        active_verse_model = db.query(ClassicalVerseModel).filter(ClassicalVerseModel.id == req.currentVerseId).first()
        if active_verse_model:
            active_verse = {
                "id": active_verse_model.id,
                "workTitleTa": active_verse_model.work_title_ta,
                "workTitleEn": active_verse_model.work_title_en,
                "chapterTa": active_verse_model.chapter_ta,
                "linesTa": active_verse_model.lines_ta,
                "poetTa": active_verse_model.poet_ta,
                "poetEn": active_verse_model.poet_en,
                "meterTa": active_verse_model.meter_ta,
                "vocabulary": active_verse_model.vocabulary,
                "commentaries": active_verse_model.commentaries,
                "culturalContextTa": active_verse_model.cultural_context_ta,
                "culturalContextEn": active_verse_model.cultural_context_en
            }
            
    if not active_verse:
        first_model = db.query(ClassicalVerseModel).first()
        if first_model:
            active_verse = {
                "id": first_model.id,
                "workTitleTa": first_model.work_title_ta,
                "workTitleEn": first_model.work_title_en,
                "chapterTa": first_model.chapter_ta,
                "linesTa": first_model.lines_ta,
                "poetTa": first_model.poet_ta,
                "poetEn": first_model.poet_en,
                "meterTa": first_model.meter_ta,
                "vocabulary": first_model.vocabulary,
                "commentaries": first_model.commentaries,
                "culturalContextTa": first_model.cultural_context_ta,
                "culturalContextEn": first_model.cultural_context_en
            }
            
    lower = clean_query.lower()
    
    # 3. Navigation Intents
    if any(k in lower for k in ["study", "படிப்பு", "மாணவர்", "syllabus"]):
        return {
            "intent": "NAVIGATION",
            "targetPlatform": "student",
            "speechText": "படிப்புத் தளம் திறக்கப்பட்டது. சொற்களைப் பிரித்துப் படிக்கலாம் மற்றும் வினாடி வினா பயிற்சி செய்யலாம்." if is_ta else "Opening Study Platform. You can explore sandhi splits and practice quizzes.",
            "displayText": "படிப்புத் தளம் இயக்கத்தில் உள்ளது" if is_ta else "Switched to Study Platform",
            "verse": active_verse,
            "followUpSuggestions": ["இப்பாடலின் பொருள் கூறு", "கடின சொற்கள்", "வினாடி வினா"] if is_ta else ["Explain this poem", "Difficult words", "Quiz me"]
        }
        
    if any(k in lower for k in ["explore", "learn", "கற்றல்", "திணை"]):
        return {
            "intent": "NAVIGATION",
            "targetPlatform": "explore",
            "speechText": "கற்றல் மற்றும் ஆராய்வுத் தளம் திறக்கப்பட்டது." if is_ta else "Opening Explore Platform.",
            "displayText": "கற்றல் தளம்" if is_ta else "Explore Platform",
            "verse": active_verse
        }

    # 4. Learning Commands
    if any(k in lower for k in ["explain", "பொருள் கூறு", "எளிய விளக்கம்", "பொருளுரை"]):
        comm = active_verse["commentaries"][0]["textTa"] if active_verse.get("commentaries") else "செவ்வியல் பொருள் விளக்கம்"
        speech = f"{active_verse['workTitleTa']}, {active_verse.get('chapterTa', '')}: {comm}" if is_ta else f"{active_verse['workTitleEn']}: {comm}"
        return {
            "intent": "EXPLAIN_SIMPLE",
            "speechText": speech,
            "displayText": comm,
            "verse": active_verse,
            "followUpSuggestions": ["கடின சொற்களை விளக்கு", "வரலாற்றுப் பின்னணி", "வினாடி வினா"] if is_ta else ["Difficult words", "Historical context", "Quiz me"]
        }

    if any(k in lower for k in ["difficult words", "கடின சொற்கள்", "சொற்பொருள்"]):
        vocabs = (active_verse.get("vocabulary") or [])[:3]
        vocab_speech = ". ".join([f"{v.get('word')}: {v.get('classicalMeaningTa' if is_ta else 'englishMeaning')}" for v in vocabs])
        speech = f"இப்பாடலில் உள்ள முதன்மைச் சொற்கள்: {vocab_speech}" if is_ta else f"Key vocabulary: {vocab_speech}"
        return {
            "intent": "EXPLAIN_WORDS",
            "speechText": speech,
            "displayText": vocab_speech,
            "verse": active_verse
        }

    # 5. Voice Search / RAG
    rag_result = await rag_engine.answer_inquiry(db, clean_query, language=req.language or "ta", role=req.currentRole or "study")
    
    # Strip markdown symbols for speech synthesis
    clean_speech = rag_result["answer"].replace("*", "").replace("#", "").replace(">", "").strip()
    # Truncate for spoken audio brevity if too long
    sentences = clean_speech.split(". ")
    short_speech = ". ".join(sentences[:3]) + "." if len(sentences) > 3 else clean_speech
    
    return {
        "intent": "RESEARCH_QUERY",
        "speechText": short_speech,
        "displayText": rag_result["answer"],
        "verse": rag_result.get("verse") or active_verse,
        "citations": rag_result.get("citations", []),
        "followUpSuggestions": rag_result.get("followUpSuggestions", [])
    }
