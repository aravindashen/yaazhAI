import re
from typing import List, Dict, Any, Optional
from rapidfuzz import fuzz
from sqlalchemy.orm import Session
from backend.database.models import ClassicalVerseModel, ClassicalWorkModel, TamilConceptModel
from backend.services.tamil_linguistics import (
    normalize_tamil,
    clean_tamil_for_search,
    transliterate_tamil,
    convert_tanglish_to_tamil,
    split_sandhi_heuristic
)

class HybridSearchEngine:
    """Production-ready Hybrid Search Engine for Classical Tamil literature."""
    
    def search(
        self,
        db: Session,
        query: str,
        work_id: Optional[str] = None,
        poet: Optional[str] = None,
        meter: Optional[str] = None,
        concept_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []
            
        clean_raw = query.strip()
        converted_tamil, was_tanglish = convert_tanglish_to_tamil(clean_raw)
        norm_query = normalize_tamil(converted_tamil if was_tanglish else clean_raw)
        search_key = clean_tamil_for_search(norm_query)
        lower_raw = clean_raw.lower()
        
        # Query database verses
        query_builder = db.query(ClassicalVerseModel)
        if work_id:
            query_builder = query_builder.filter(ClassicalVerseModel.work_id == work_id)
        if poet:
            query_builder = query_builder.filter(
                (ClassicalVerseModel.poet_ta.ilike(f"%{poet}%")) |
                (ClassicalVerseModel.poet_en.ilike(f"%{poet}%"))
            )
        if meter:
            query_builder = query_builder.filter(ClassicalVerseModel.meter_ta == meter)
            
        all_verses = query_builder.all()
        scored_results = []
        
        for v in all_verses:
            clean_full = clean_tamil_for_search(v.full_text_ta)
            trans_lower = v.transliteration.lower()
            
            score = 0.0
            match_type = "FUZZY"
            highlight = v.lines_ta[0] if v.lines_ta else v.full_text_ta
            
            # 1. Exact Substring Match in Full Text
            if search_key and search_key in clean_full:
                score = 0.95
                match_type = "EXACT"
                highlight = " / ".join(v.lines_ta)
            else:
                # 2. RapidFuzz Line Similarity
                for line in v.lines_ta:
                    clean_line = clean_tamil_for_search(line)
                    ratio = fuzz.partial_ratio(search_key, clean_line) / 100.0
                    token_ratio = fuzz.token_sort_ratio(search_key, clean_line) / 100.0
                    max_ratio = max(ratio, token_ratio)
                    
                    if max_ratio > score and max_ratio >= 0.55:
                        score = max_ratio * 0.88
                        match_type = "FUZZY"
                        highlight = line
                        
            # 3. Transliteration (Tanglish) match
            clean_trans = re.sub(r'[āáà]', 'a', trans_lower)
            clean_trans = re.sub(r'[īíì]', 'i', clean_trans)
            clean_trans = re.sub(r'[ūúù]', 'u', clean_trans)
            clean_trans = re.sub(r'[ēéè]', 'e', clean_trans)
            clean_trans = re.sub(r'[ōóò]', 'o', clean_trans)
            clean_trans = re.sub(r'[ḻḷ]', 'l', clean_trans)
            clean_trans = re.sub(r'[ṭṯṟ]', 't', clean_trans)
            clean_trans = re.sub(r'[ṅñṇṉ]', 'n', clean_trans)
            clean_trans = clean_trans.replace('th', 't')
            
            clean_query_trans = lower_raw.replace('th', 't')
            
            if clean_query_trans in clean_trans or lower_raw in trans_lower or trans_lower in lower_raw:
                score = max(score, 0.85)
                
            # 4. English Translation match
            for tr in (v.translations or []):
                tr_text = tr.get("text", "").lower()
                if lower_raw in tr_text:
                    score = max(score, 0.82)
                    highlight = f"[Translation: {tr.get('translator', 'Scholar')}] {tr.get('text')}"
                    
            # 5. Core Concepts match
            for c in (v.core_concepts or []):
                if search_key in clean_tamil_for_search(c) or lower_raw in c.lower():
                    score = max(score, 0.80)
                    match_type = "CONCEPT"
                    
            # 6. Commentary match
            for comm in (v.commentaries or []):
                comm_text = clean_tamil_for_search(comm.get("textTa", ""))
                if search_key in comm_text:
                    score = max(score, 0.75)
                    if match_type != "EXACT":
                        match_type = "COMMENTARY"
                        highlight = f"[உரை: {comm.get('scholarTa', 'உரையாசிரியர்')}] {comm.get('textTa', '')[:120]}..."
                        
            # Concept Filter Check
            if concept_id:
                concept = db.query(TamilConceptModel).filter(TamilConceptModel.id == concept_id).first()
                if concept and not any(concept.name_ta in c for c in (v.core_concepts or [])):
                    continue
                    
            if score >= 0.35:
                scored_results.append({
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
                    },
                    "score": round(score, 2),
                    "matchType": match_type,
                    "highlightSnippet": highlight,
                    "evidence": {
                        "id": f"ev-{v.id}",
                        "verseId": v.id,
                        "workTitleTa": v.work_title_ta,
                        "workTitleEn": v.work_title_en,
                        "poetTa": v.poet_ta,
                        "linesTa": v.lines_ta,
                        "explanationTa": v.commentaries[0].get("textTa") if v.commentaries else v.cultural_context_ta,
                        "relevanceScore": round(score, 2),
                        "relevanceReason": "நேரடி மூல நூல் பாடல் வரி அல்லது உரைச் சான்று",
                        "trustStatus": "VERIFIED",
                        "citation": {
                            "workTitle": v.work_title_ta,
                            "chapterOrPoem": v.chapter_ta or f"பாடல் {v.verse_number}",
                            "verseNumber": v.verse_number,
                            "authorOrPoet": v.poet_ta,
                            "edition": v.canonical_source,
                            "trustStatus": "VERIFIED",
                            "primaryTextSnippet": v.full_text_ta
                        }
                    }
                })
                
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        return scored_results[:limit]

    def identify_verse(self, db: Session, user_text: str) -> Dict[str, Any]:
        """Identify which Classical Tamil verse corresponds to the input snippet."""
        results = self.search(db, user_text, limit=1)
        if results and results[0]["score"] >= 0.50:
            top = results[0]
            return {
                "verse": top["verse"],
                "confidence": top["score"],
                "matchedLine": top["highlightSnippet"],
                "isKnownCorpusMatch": True
            }
        return {
            "verse": None,
            "confidence": 0.0,
            "matchedLine": "",
            "isKnownCorpusMatch": False
        }

search_engine = HybridSearchEngine()
