from typing import Dict, Any, List
from backend.database.models import ClassicalVerseModel

def generate_quiz_and_flashcards(verse: ClassicalVerseModel) -> Dict[str, Any]:
    """Generate interactive multiple choice quizzes and flashcards for a verse."""
    concepts = verse.core_concepts or ["அறம்"]
    first_line = verse.lines_ta[0] if verse.lines_ta else verse.full_text_ta
    
    quiz_items = [
        {
            "id": f"quiz-1-{verse.id}",
            "questionTa": f"\"{first_line}\" என்ற பாடல் அடியில் பயின்றுவரும் முதன்மையான விழுமியம் யாது?",
            "questionEn": f"What is the primary classical virtue in the line \"{first_line}\"?",
            "options": [
                concepts[0],
                "வீரத்தின் வெளிப்பாடு",
                "செல்வச் செருக்கு",
                "மகிழ்ச்சி மட்டுமே"
            ],
            "correctIndex": 0,
            "explanationTa": f"இப்பாடல் \"{verse.work_title_ta}\" நூலில் \"{', '.join(concepts)}\" என்ற விழுமியத்தை நிலைநிறுத்துகிறது.",
            "explanationEn": f"This poem from {verse.work_title_en} establishes the classical ideal of {', '.join(concepts)}.",
            "verseRef": f"{verse.work_title_ta} ({verse.chapter_ta or verse.verse_number})"
        },
        {
            "id": f"quiz-2-{verse.id}",
            "questionTa": f"\"{verse.work_title_ta}\" நூலில் இப்பாடலை இயற்றிய புலவர் / சான்றோர் யார்?",
            "questionEn": f"Who is the author/poet of this verse from {verse.work_title_en}?",
            "options": [
                verse.poet_ta,
                "ஔவையார்",
                "கபிலர்",
                "நக்கீரர்"
            ],
            "correctIndex": 0,
            "explanationTa": f"இப்பாடல் {verse.poet_ta} அவர்களால் இயற்றப்பட்டது.",
            "explanationEn": f"Authored by {verse.poet_en}.",
            "verseRef": verse.work_title_ta
        }
    ]
    
    flashcards = []
    vocab_list = verse.vocabulary or []
    for idx, vocab in enumerate(vocab_list):
        flashcards.append({
            "id": f"fc-{verse.id}-{idx}",
            "frontTa": vocab.get("word", ""),
            "transliteration": vocab.get("transliteration", ""),
            "backMeaningTa": vocab.get("classicalMeaningTa", ""),
            "backMeaningEn": vocab.get("englishMeaning", ""),
            "contextVerseTa": first_line,
            "grammarTag": vocab.get("pos", "செவ்வியல் சொல்")
        })
        
    return {
        "quiz": quiz_items,
        "flashcards": flashcards
    }
