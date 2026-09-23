# 🎻 YAAZH AI (யாழ் AI) — Classical Tamil Knowledge & Research Platform

<div align="center">
  <h3>Scalable, Secure, Accessible, and Grounded Classical Tamil Intelligence</h3>
  <p>Connecting trusted Classical Tamil sources with OCR, intelligent search, knowledge graphs, RAG/AI, learning tools, and voice accessibility.</p>
</div>

---

## 🌟 Executive Summary

Classical Tamil (*செவ்வியல் தமிழ்*) represents one of humanity's oldest, richest, and continuously surviving independent classical traditions (spanning from ~500 BCE to 900 CE). However, mastering and researching Classical Tamil faces critical hurdles:
- **Archaic Language & Complex Sandhi Rules** (e.g., compound fusion of words).
- **Difficult Vocabulary & Polysemy**.
- **Scattered & Unstandardized Text Editions**.
- **Lack of Citations and Hallucination Risks in Generic LLMs**.
- **Accessibility Barriers for Visually Impaired, Auditory, and Mobile Learners**.

**YAAZH AI** solves these challenges by combining canonical primary sources (the 41 Classical Works recognized by the Central Institute of Classical Tamil) with **multimodal OCR**, **deterministic linguistic engines**, **hybrid lexical-semantic search**, **grounded RAG with strict verification**, **dynamic interactive quizzes**, and **two-way voice accessibility**.

---

## 🏛️ Core Product Modes

### 1. 📖 STUDY — "Help Me Understand"
- **Multimodal OCR**: Camera scan, image upload, and PDF extraction with Tesseract Tamil and AI fallback.
- **Verse Identification**: Automatic matching of noisy OCR/typed input to canonical verses via character ngram fuzzy matching.
- **Word-by-Word Sandhi Splitting**: Deconstructs compound classical words into root lemmas with individual grammatical tags and meanings.
- **Bilingual Commentaries**: Classical canonical commentaries (Parimelazhagar, Manakkudavar) alongside modern accessible explanations.
- **Phonetic & Audio Pronunciation**: ISO 15919 transliteration and moraic cadence calculation (*Maathirai*).
- **Gamified Quizzes & Flashcards**: Dynamic test generator across meaning, author, context, and meter.

### 2. 🗺️ EXPLORE — "Take Me Deeper into Tamil"
- **41 Classical Works Library**: Browse Ilakkanam (Grammar), Ettuthokai (8 Anthologies), Pattuppattu (10 Idylls), Pathinenkilkanakku (18 Didactic Texts), and 5 Great Epics.
- **Landscape Poetics (Thinai Explorer)**: Interactive map and filters for Kurinji, Mullai, Marutham, Neythal, and Palai.
- **Interactive Knowledge Graph**: Explore nodes and relationships across poets, concepts, works, and archaeological sites (Keeladi, Kodumanal).
- **Smart Tanglish Converter**: Real-time phonetic transliteration for learners typing Tamil in English script.

### 3. 🔬 RESEARCH — "Help Me Discover and Publish"
- **Hybrid Search Engine**: Combines SQLite FTS5 Full-Text Search, RapidFuzz token matching, and ISO transliteration indexes.
- **Textual Variants Comparison**: Side-by-side comparison of palm-leaf manuscript readings (U.Ve.Sa., Murray S. Rajam, CICT).
- **Archaeological Grounding**: Epigraphical and material culture links (Keeladi, Porunthal, Kodumanal excavations).
- **Scholar Note-Taking**: Secure markdown annotations tagged by verse and concept.
- **Automated Citation Export**: Instant BibTeX, APA 7th, Chicago, and Markdown citations.

### 4. 🎙️ VOICE ACCESS — "Inclusive Universal Access"
- **Bilingual Tamil/English Speech Recognition**: Hands-free voice commands via Web Speech API (`Alt + V` toggle).
- **Tamil Natural Speech Synthesis**: Text-to-speech with cadence controls for classical meter.
- **Voice-Driven Study Assistant**: Spoken answers, pronunciation practice, and voice audio controls.

---

## 🏗️ Architecture & Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    YAAZH Web Client (React 19)              │
│   Tailwind CSS v4 • Lucide Icons • Motion • Web Speech API   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
  ┌────────────────────────┐      ┌────────────────────────┐
  │ Express / Vite Runtime │      │ Python FastAPI Backend │
  │   - SSR / Dev Engine   │      │   - Grounded RAG       │
  │   - Unified Omnibar    │      │   - Tesseract OCR      │
  │   - Port 3000          │      │   - Hybrid Search      │
  └────────────────────────┘      │   - Quiz & Flashcards  │
                                  │   - ISO 15919 & Sandhi │
                                  │   - SQLite / DB Seeder │
                                  │   - Port 8000          │
                                  └────────────────────────┘
```

### Backend Components (`backend/`):
- **FastAPI Core (`backend/main.py`)**: Rate limiting, security headers, CORS middleware.
- **Database Layer (`backend/database/`)**: SQLAlchemy models and automatic seeder with 41 classical works, verses, commentaries, and variants.
- **Linguistic Engine (`backend/services/tamil_linguistics.py`)**: Unicode normalizer, sandhi splitter, ISO 15919 transliterator, and moraic meter calculator.
- **Hybrid Search (`backend/services/search_engine.py`)**: Full-text and fuzzy token retrieval.
- **OCR Engine (`backend/services/ocr_engine.py`)**: Pillow preprocessing, Tesseract engine, and PDF parser.
- **RAG Engine (`backend/services/rag_engine.py`)**: Grounded multi-pillar Classical Tamil scholar synthesizer with citation verification.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- (Optional) **Tesseract OCR**: with `tam` language pack for local offline OCR

### 2. Installation
```powershell
# Install Node dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 3. Configuration (.env)
Create a `.env` file in the root directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=yaazh_secret_key_change_in_production
DATABASE_URL=sqlite:///./yaazh_corpus.db
RATE_LIMIT_PER_MINUTE=120
```

### 4. Running the Application
```powershell
# Start the full application (Frontend + FastAPI backend)
npm run dev

# The same command starts:
# - Vite frontend at http://localhost:3000
# - FastAPI backend at http://localhost:8000
# Vite proxies all /api requests to the FastAPI backend.

# To run either service separately:
npm run dev:frontend
npm run dev:backend
```

Access the application in your browser at **`http://localhost:3000`** (or API docs at `http://localhost:8000/docs`).

---

## 🧪 Testing

Run the automated test suite covering linguistics, OCR, hybrid search, RAG synthesis, quizzes, and citations:

```powershell
# Run Python backend test suite
python -m pytest tests/test_api.py -v

# Run Frontend TypeScript & Build verification
npm run lint
npm run build
```

---

## 📜 Canonical Works Covered (41 Classical Canon)

1. **Ilakkanam**: *Tolkappiyam (தொல்காப்பியம்)*
2. **Ettuthokai (8 Anthologies)**: *Narrinai, Kurunthogai, Ainkurunuru, Pathitrupathu, Paripadal, Kalithokai, Akananuru, Purananuru*
3. **Pattuppattu (10 Idylls)**: *Thirumurugatruppadai, Porunaratruppadai, Sirupanatruppadai, Perumpanatruppadai, Mullaipattu, Maduraikkanji, Nedunalvaadai, Kurinjippattu, Pattinappalai, Malaipadukadaam*
4. **Pathinenkilkanakku (18 Ethical Texts)**: *Tirukkural, Naladiyar, Nanmanikkadikai, Inna Narpathu, Iniyavai Narpathu, Kar Narpathu, Kalavazhi Narpathu, Ainthinai Aimpathu, Ainthinai Ezhupathu, Thinaimozhi Aimpathu, Thinaimalai Nootraimpathu, Kainnilay, Thirikadugam, Acharakkovai, Pazhamozhi Nanuru, Sirupanchamoolam, Mudumozhikkanchi, Elathi*
5. **Kappiyam (5 Major Epics)**: *Silappadikaram, Manimekalai, Civaka Cintamani, Valayapathi, Kundalakesi*

---

## 🔒 Security & Performance
- **Input Sanitization**: Multi-layer prompt-injection filter and regex cleaning.
- **Magic-Byte MIME Verification**: Strict file validation for uploads (`image/jpeg`, `image/png`, `application/pdf`).
- **OWASP Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`.
- **Zero Hallucination Architecture**: Citations required for every claim; canonical fallback when offline or LLM unavailable.

---

<div align="center">
  <b>YAAZH AI — Preserving, Illuminating, and Democratizing Classical Tamil for the World.</b>
</div>
