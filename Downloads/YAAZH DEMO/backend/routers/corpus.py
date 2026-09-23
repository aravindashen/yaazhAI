from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.db import get_db
from backend.database.models import ClassicalWorkModel, ClassicalVerseModel, TamilConceptModel

router = APIRouter(prefix="/api", tags=["Corpus"])

@router.get("/corpus/works")
def get_classical_works(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ClassicalWorkModel)
    if category:
        query = query.filter(ClassicalWorkModel.category == category)
    works = query.all()
    
    return {
        "works": [
            {
                "id": w.id,
                "titleTa": w.title_ta,
                "titleEn": w.title_en,
                "transliteration": w.transliteration,
                "category": w.category,
                "period": w.period,
                "approxDate": w.approx_date,
                "author": w.author_ta,
                "authorEn": w.author_en,
                "descriptionTa": w.description_ta,
                "descriptionEn": w.description_en,
                "structure": w.structure,
                "canonicalSource": w.canonical_source,
                "verseCount": w.verse_count
            }
            for w in works
        ]
    }

@router.get("/corpus/verse/{verse_id}")
def get_verse_by_id(verse_id: str, db: Session = Depends(get_db)):
    v = db.query(ClassicalVerseModel).filter(ClassicalVerseModel.id == verse_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Verse not found in Classical Tamil corpus")
        
    return {
        "verse": {
            "id": v.id,
            "workId": v.work_id,
            "workTitleTa": v.work_title_ta,
            "workTitleEn": v.work_title_en,
            "sectionTa": v.section_ta,
            "chapterTa": v.chapter_ta,
            "chapterEn": v.chapter_en,
            "verseNumber": v.verse_number,
            "poetTa": v.poet_ta,
            "poetEn": v.poet_en,
            "meterTa": v.meter_ta,
            "thinai": v.thinai,
            "linesTa": v.lines_ta,
            "fullTextTa": v.full_text_ta,
            "transliteration": v.transliteration,
            "wordSplitTa": v.word_split_ta,
            "vocabulary": v.vocabulary,
            "commentaries": v.commentaries,
            "translations": v.translations,
            "coreConcepts": v.core_concepts,
            "culturalContextTa": v.cultural_context_ta,
            "culturalContextEn": v.cultural_context_en,
            "canonicalSource": v.canonical_source
        }
    }

@router.get("/concepts")
def get_concepts(db: Session = Depends(get_db)):
    concepts = db.query(TamilConceptModel).all()
    return {
        "concepts": [
            {
                "id": c.id,
                "nameTa": c.name_ta,
                "nameEn": c.name_en,
                "transliteration": c.transliteration,
                "definitionTa": c.definition_ta,
                "definitionEn": c.definition_en,
                "classicalVocabulary": c.classical_vocabulary,
                "primaryWorkIds": c.primary_work_ids,
                "sampleVerseIds": c.sample_verse_ids,
                "culturalSignificanceTa": c.cultural_significance_ta
            }
            for c in concepts
        ]
    }

@router.get("/graph")
def get_knowledge_graph(db: Session = Depends(get_db)):
    works = db.query(ClassicalWorkModel).all()
    verses = db.query(ClassicalVerseModel).all()
    concepts = db.query(TamilConceptModel).all()
    
    nodes = []
    edges = []
    
    # Work Nodes
    for w in works:
        nodes.append({
            "id": f"node-work-{w.id}",
            "labelTa": w.title_ta,
            "labelEn": w.title_en,
            "type": "work",
            "category": w.category,
            "era": w.period,
            "meta": {"author": w.author_ta, "verseCount": w.verse_count}
        })
        
    # Concept Nodes
    for c in concepts:
        nodes.append({
            "id": f"node-concept-{c.id}",
            "labelTa": c.name_ta,
            "labelEn": c.name_en,
            "type": "concept",
            "category": "விழுமியம்",
            "meta": {"vocab": c.classical_vocabulary}
        })
        
    # Poet Nodes & Edges
    for v in verses:
        poet_node_id = f"node-poet-{v.poet_ta.replace(' ', '_')}"
        if not any(n["id"] == poet_node_id for n in nodes):
            nodes.append({
                "id": poet_node_id,
                "labelTa": v.poet_ta,
                "labelEn": v.poet_en,
                "type": "poet",
                "category": "புலவர்"
            })
            
        # Edge: Poet -> Work
        edges.append({
            "id": f"edge-author-{v.id}",
            "source": poet_node_id,
            "target": f"node-work-{v.work_id}",
            "relationTa": "இயற்றியவர்",
            "relationEn": "authored"
        })
        
        # Edge: Work -> Concept
        for concept_name in (v.core_concepts or []):
            matched_concept = next((c for c in concepts if concept_name in c.name_ta), None)
            if matched_concept:
                edges.append({
                    "id": f"edge-concept-{v.id}-{matched_concept.id}",
                    "source": f"node-work-{v.work_id}",
                    "target": f"node-concept-{matched_concept.id}",
                    "relationTa": "விழுமிய வெளிப்பாடு",
                    "relationEn": "embodies concept"
                })
                
    return {
        "nodes": nodes,
        "edges": edges
    }
