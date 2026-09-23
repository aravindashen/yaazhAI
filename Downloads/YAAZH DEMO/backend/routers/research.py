import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from backend.database.db import get_db
from backend.database.models import TextualVariantModel, ResearchNoteModel, ClassicalVerseModel
from backend.services.rag_engine import rag_engine
from backend.services.citation_service import format_citations
from backend.security import sanitize_input

router = APIRouter(prefix="/api/research", tags=["Research"])

class SynthesizeRequest(BaseModel):
    query: str
    language: Optional[str] = "ta"

class ExportCitationRequest(BaseModel):
    citations: List[Dict[str, Any]]
    format: Optional[str] = "BIBTEX"

class SaveNoteRequest(BaseModel):
    verseId: Optional[str] = "general"
    title: str
    noteText: str
    tags: Optional[List[str]] = None

@router.post("/synthesize")
async def synthesize_research_inquiry(req: SynthesizeRequest, db: Session = Depends(get_db)):
    clean_query = sanitize_input(req.query)
    if not clean_query:
        raise HTTPException(status_code=400, detail="Query is required")
        
    synthesis = await rag_engine.answer_inquiry(
        db,
        clean_query,
        language=req.language or "ta",
        role="research"
    )
    
    return {"synthesis": synthesis}

@router.post("/export")
def export_citations(req: ExportCitationRequest):
    if not req.citations:
        raise HTTPException(status_code=400, detail="Citations list is required")
        
    formatted = format_citations(req.citations, req.format or "BIBTEX")
    return {
        "formatted": formatted,
        "format": req.format or "BIBTEX"
    }

@router.get("/variants")
def get_textual_variants(workId: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(TextualVariantModel)
    if workId:
        query = query.filter(TextualVariantModel.work_id == workId)
    variants = query.all()
    
    return {
        "variants": [
            {
                "id": v.id,
                "workId": v.work_id,
                "workTitleTa": v.work_title_ta,
                "workTitleEn": v.work_title_en,
                "verseRef": v.verse_ref,
                "baseReadingTa": v.base_reading_ta,
                "variantReadingTa": v.variant_reading_ta,
                "sourceManuscript": v.source_manuscript,
                "printedEdition": v.printed_edition,
                "criticalAnalysisTa": v.critical_analysis_ta,
                "criticalAnalysisEn": v.critical_analysis_en
            }
            for v in variants
        ]
    }

@router.get("/notes")
def get_research_notes(db: Session = Depends(get_db)):
    notes = db.query(ResearchNoteModel).order_by(ResearchNoteModel.created_at.desc()).all()
    return {
        "notes": [
            {
                "id": n.id,
                "verseId": n.verse_id,
                "title": n.title,
                "noteText": n.note_text,
                "createdAt": n.created_at.isoformat() if n.created_at else "",
                "tags": n.tags or []
            }
            for n in notes
        ]
    }

@router.post("/notes")
def create_research_note(req: SaveNoteRequest, db: Session = Depends(get_db)):
    clean_title = sanitize_input(req.title)
    clean_text = sanitize_input(req.noteText)
    if not clean_title or not clean_text:
        raise HTTPException(status_code=400, detail="Title and noteText are required")
        
    new_note = ResearchNoteModel(
        id=f"note-{uuid.uuid4().hex[:8]}",
        verse_id=req.verseId or "general",
        title=clean_title,
        note_text=clean_text,
        tags=req.tags or ["ஆராய்ச்சி", "குறிப்பு"]
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return {
        "success": True,
        "note": {
            "id": new_note.id,
            "verseId": new_note.verse_id,
            "title": new_note.title,
            "noteText": new_note.note_text,
            "createdAt": new_note.created_at.isoformat() if new_note.created_at else "",
            "tags": new_note.tags or []
        }
    }
