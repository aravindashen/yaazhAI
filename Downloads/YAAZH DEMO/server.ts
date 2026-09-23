import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { CLASSICAL_WORKS, CLASSICAL_VERSES, TAMIL_CONCEPTS, KNOWLEDGE_GRAPH_NODES, KNOWLEDGE_GRAPH_EDGES, LEARNER_MODULES, TEXTUAL_VARIANTS } from './src/data/classicalCorpus.ts';
import { hybridSearchCorpus, identifyVerseFromText } from './src/services/hybridSearch.ts';
import { buildStudyAnalysis, buildResearchSynthesis, formatCitations, callGeminiWithFallback } from './src/services/trustEngine.ts';
import { normalizeTamil, cleanTamilForSearch, transliterateTamil } from './src/services/tamilLinguistics.ts';
import { processSmartInput, detectInputLanguage, convertTanglishToTamil } from './src/services/tanglishConverter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// In-memory store for user research notes
const RESEARCH_NOTES: Array<{
  id: string;
  verseId: string;
  title: string;
  noteText: string;
  createdAt: string;
  tags: string[];
}> = [
  {
    id: 'note-1',
    verseId: 'pura-192',
    title: 'யாதும் ஊரே: சமத்துவ மெய்யியல் குறிப்பு',
    noteText: 'கணியன் பூங்குன்றனாரின் கூற்று சாதி, பிறப்பு வேறுபாடுகளைக் கடந்து மனித ஒருமைப்பாட்டை நிறுவுகிறது. "தீதும் நன்றும் பிறர்தர வாரா" என்பது கர்மா கோட்பாட்டையும் தன்னியக்க அறத்தையும் முன்வைக்கிறது.',
    createdAt: '2026-09-23T06:00:00Z',
    tags: ['மெய்யியல்', 'சமத்துவம்', 'புறநானூறு']
  },
  {
    id: 'note-2',
    verseId: 'kural-81',
    title: 'விருந்தோம்பல் சொல் மூல ஆய்வு',
    noteText: 'வேளாண்மை என்ற சொல் இங்கு விவசாயத்தைக் குறிக்காது, உதவி/ஈகையைக் குறிக்கிறது என பரிமேலழகர் உரை உறுதிப்படுத்துகிறது.',
    createdAt: '2026-09-23T06:30:00Z',
    tags: ['சொற்பொருளியல்', 'திருக்குறள்', 'பரிமேலழகர்']
  }
];

// Middleware
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==========================================
// API Endpoints
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'YAAZH AI - Classical Tamil Knowledge Platform',
    corpus: {
      worksCount: CLASSICAL_WORKS.length,
      indexedVerses: CLASSICAL_VERSES.length,
      conceptsCount: TAMIL_CONCEPTS.length,
      graphNodesCount: KNOWLEDGE_GRAPH_NODES.length
    },
    capabilities: {
      hybridSearch: true,
      trustEngine: true,
      geminiLlmEnabled: !!apiKey,
      tamilLinguistics: true
    }
  });
});

// Get Works
app.get('/api/corpus/works', (req, res) => {
  res.json({ works: CLASSICAL_WORKS });
});

// Get Verse by ID
app.get('/api/corpus/verse/:id', (req, res) => {
  const verse = CLASSICAL_VERSES.find(v => v.id === req.params.id);
  if (!verse) {
    return res.status(404).json({ error: 'Verse not found in Classical Tamil corpus' });
  }
  res.json({ verse });
});

// Get Concepts
app.get('/api/concepts', (req, res) => {
  res.json({ concepts: TAMIL_CONCEPTS });
});

// Get Knowledge Graph
app.get('/api/graph', (req, res) => {
  res.json({
    nodes: KNOWLEDGE_GRAPH_NODES,
    edges: KNOWLEDGE_GRAPH_EDGES
  });
});

// Smart Input Parsing (Tamil, Tanglish, English)
app.post('/api/smart-input', (req, res) => {
  try {
    const text = req.body.text || req.body.query;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const smart = processSmartInput(text);
    const identification = identifyVerseFromText(smart.tamilQuery || text);
    
    // Find matching concepts if any
    const matchedConcepts = TAMIL_CONCEPTS.filter(c => 
      c.id === smart.mappedConcept || 
      cleanTamilForSearch(c.nameTa).includes(cleanTamilForSearch(smart.tamilQuery)) ||
      text.toLowerCase().includes(c.nameEn.toLowerCase())
    );

    res.json({
      ...smart,
      verseMatch: identification.isKnownCorpusMatch ? identification.verse : undefined,
      matchedConcepts
    });
  } catch (error: any) {
    console.error('Smart input error:', error);
    res.status(500).json({ error: 'Smart input processing failed', message: error.message });
  }
});

// Translation API: Seamless Tamil ⇄ English translation for all features
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLang = 'en' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to translate is required' });
    }

    const clean = text.trim();

    // 1. Check if it's a known classical verse line or text with verified canonical translations
    for (const verse of CLASSICAL_VERSES) {
      if (verse.fullTextTa.includes(clean) || verse.linesTa.some(l => cleanTamilForSearch(l).includes(cleanTamilForSearch(clean)))) {
        if (targetLang === 'en' && verse.translations[0]) {
          return res.json({
            translatedText: verse.translations[0].text,
            translator: verse.translations[0].translator,
            source: 'Canonical Classical Translation',
            detectedSourceLang: 'ta'
          });
        }
      }
      // Or if English text matches verse translation
      if (targetLang === 'ta') {
        const trMatch = verse.translations.find(t => t.text.toLowerCase().includes(clean.toLowerCase()));
        if (trMatch) {
          return res.json({
            translatedText: verse.linesTa.join('\n'),
            source: 'Classical Tamil Original',
            detectedSourceLang: 'en'
          });
        }
      }
    }

    // 2. If Gemini is available, use high-precision literary and linguistic translation
    if (ai) {
      try {
        const langName = targetLang === 'ta' ? 'clear, authentic Tamil' : 'clear, fluent English';
        const prompt = `You are a bilingual Classical and Modern Tamil scholar. Translate the following text into ${langName}. Preserve nuances of ethics, literature, grammar, and tone. Return ONLY the translated text without extra preamble or markdown tags:\n\n"${clean}"`;
        const result = await callGeminiWithFallback(ai, prompt);
        const translatedText = result.text?.trim() || '';
        if (translatedText) {
          return res.json({
            translatedText,
            source: 'Gemini Literary Translation Engine',
            detectedSourceLang: targetLang === 'ta' ? 'en' : 'ta'
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini translate fallback:', geminiErr);
      }
    }

    // 3. Heuristic / Lexicon fallback
    const smart = processSmartInput(clean);
    if (targetLang === 'ta') {
      return res.json({
        translatedText: smart.tamilQuery || clean,
        source: 'Phonetic Tanglish/Linguistic Engine',
        detectedSourceLang: smart.detectedLanguage
      });
    } else {
      return res.json({
        translatedText: transliterateTamil(clean),
        source: 'ISO 15919 Transliteration Engine',
        detectedSourceLang: 'ta'
      });
    }
  } catch (err: any) {
    console.error('Translation route error:', err);
    res.status(500).json({ error: 'Translation failed', message: err.message });
  }
});

// Comprehensive Classical Tamil Scholarly Knowledge Engine
function synthesizeScholarlyKnowledge(cleanQuery: string, isTa: boolean, topVerse?: any): {
  answer: string;
  citations: string[];
  highlightQuote: string;
  followUpSuggestions: string[];
} {
  const lower = cleanQuery.toLowerCase();
  
  // 1. Classical Tamil Literature / Overview
  if (/(classical tamil|tamil literature|literature|செம்மொழி|தமிழ் இலக்கியம்|இலக்கிய வரலாறு|41 நூல்கள்|41 canonical|overview|explain)/i.test(lower) && !/(tirukkural|kural|purananuru|kurunthogai|silappadikaram|thinai|tolkappiyam)/i.test(lower)) {
    if (isTa) {
      return {
        answer: `செவ்வியல் தமிழ் இலக்கியம் (Classical Tamil Literature) என்பது பொ.ஊ.மு. 500 முதல் பொ.ஊ. 900 வரையிலான காலகட்டத்தில் இயற்றப்பட்ட, இந்திய அரசால் செம்மொழித் தகுதியளிக்கப்பட்ட 41 தொன்மையான மூல நூல்களைக் குறிக்கிறது.

### 🏛️ முதன்மைப் பகுப்புகள்:
1. **மூல இலக்கணம் (Foundational Grammar)**:
   - **தொல்காப்பியம்** (தொல்காப்பியர்): தமிழ் மொழியின் ஒலி (எழுத்து), சொல், வாழ்வியல் மற்றும் கவிதை அழகியல் (பொருள்) விதிகளை வகுத்த மூல நூல்.
2. **பதினெண்மேற்கணக்கு (18 Greater Works - சங்க இலக்கியம்)**:
   - **எட்டுத்தொகை** (8 Anthologies): நற்றிணை, குறுந்தொகை, ஐங்குறுநூறு, பதிற்றுப்பத்து, பரிபாடல், கலித்தொகை, அகநானூறு, புறநானூறு (2,381 பாடல்கள், 473 புலவர்கள்).
   - **பத்துப்பாட்டு** (10 Idylls): திருமுருகாற்றுப்படை, பொருநராற்றுப்படை, சிறுபாணாற்றுப்படை, பெரும்பாணாற்றுப்படை, முல்லைப்பாட்டு, மதுரைக்காஞ்சி, நெடுநல்வாடை, குறிஞ்சிப்பாட்டு, பட்டினப்பாலை, மலைபடுகடாம்.
3. **பதினெண்கீழ்க்கணக்கு (18 Didactic & Ethical Texts)**:
   - **திருக்குறள்**, நாலடியார், நான்மணிக்கடிகை, திரிகடுகம், ஆசாரக்கோவை, பழமொழி நானூறு உள்ளிட்ட 18 நீதி நூல்கள்.
4. **ஐம்பெருங்காப்பியங்கள் (5 Great Epics)**:
   - **சிலப்பதிகாரம்**, **மணிமேகலை**, சீவக சிந்தாமணி, வளையாபதி, குண்டலகேசி.

### 🌿 வாழ்வியல் மெய்யியல் & சிறப்புகள்:
- **அகப்பொருள்**: நிலமும் பருவமும் சார்ந்த தூய காதல் மற்றும் இல்லற வாழ்வு (குறிஞ்சி, முல்லை, மருதம், நெய்தல், பாலை).
- **புறப்பொருள்**: வீரம், கொடை, அரசியல் அறம், சமூக சமத்துவம் மற்றும் உலக சகோதரத்துவம் ("யாதும் ஊரே யாவரும் கேளிர்").
- **தொல்லியல் சான்றுகள்**: கீழடி, பொருந்தல், கொடுமணல் அகழாய்வுகள் சங்க இலக்கியத்தின் தொன்மையை உறுதி செய்கின்றன.`,
        citations: ['தொல்காப்பியம்', 'சங்க இலக்கியம் (எட்டுத்தொகை & பத்துப்பாட்டு)', 'திருக்குறள்', 'சிலப்பதிகாரம்'],
        highlightQuote: 'யாதும் ஊரே யாவரும் கேளிர் தீதும் நன்றும் பிறர்தர வாரா - புறநானூறு 192',
        followUpSuggestions: ['சங்க இலக்கிய அகத்திணைகள் யாவை?', 'திருக்குறளின் சிறப்புகள்', 'தொல்காப்பிய இலக்கணக் கட்டமைப்பு']
      };
    } else {
      return {
        answer: `**Classical Tamil Literature** represents one of the oldest, richest, and continuously surviving independent classical traditions in world history, spanning from roughly **500 BCE to 900 CE**. The canon comprises **41 foundational works** recognized by the Central Institute of Classical Tamil (CICT).

### 🏛️ The Four Major Canonical Pillars:
1. **Foundational Treatise (Ilakkanam)**:
   - **Tolkappiyam** by Tholkappiyar: The world's most comprehensive ancient grammar, codifying phonology (*Ezhuthu*), morphology & syntax (*Sol*), and socio-cultural poetic poetics (*Porul*).
2. **Pathinenmelkanakku (18 Major Classical Works - Sangam Poetry)**:
   - **Ettuthokai (Eight Anthologies)**: *Narrinai, Kurunthogai, Ainkurunuru, Pathitrupathu, Paripadal, Kalithokai, Akananuru, Purananuru* (2,381 poems by 473 bards).
   - **Pattuppattu (Ten Idylls)**: Monumental long narrative guide songs including *Maduraikkanji, Pattinappalai, Mullaipattu, Kurinjippattu*.
3. **Pathinenkilkanakku (18 Didactic & Ethical Works)**:
   - Led by the universal humanist masterwork **Tirukkural** by Thiruvalluvar, alongside *Naladiyar, Pazhamozhi Nanuru, Nanmanikkadikai*.
4. **The Major Epics (Kappiyam)**:
   - Dramatic narrative masterpieces: **Silappadikaram** (The Tale of an Anklet) by Ilango Adigal, **Manimekalai** by Seethalai Chathanar, and **Civaka Cintamani**.

### 🌿 Unique Distinctions:
- **Akam-Puram Duality**: Division of human experience into intimate inner romantic consciousness (*Akam*) and public virtue, justice, and bravery (*Puram*).
- **Thinai Ecology**: Anchoring all emotions into five distinct landscapes (montane, pastoral, riverine, littoral, arid).
- **Cosmopolitan Humanism**: Epitomized in Purananuru 192: *"Every town is our hometown, and all humankind are our kin."*`,
        citations: ['Tolkappiyam', 'Sangam Corpus (Ettuthokai & Pathupattu)', 'Tirukkural', 'Silappadikaram'],
        highlightQuote: 'Every town our hometown, every person our kin - Purananuru 192',
        followUpSuggestions: ['What are the 5 Sangam Thinais?', 'Explain Tirukkural structure', 'Tolkappiyam grammar breakdown']
      };
    }
  }

  // 2. Sangam Literature
  if (/(sangam|சங்க இலக்கியம்|சங்க காலம்|எட்டுத்தொகை|பத்துப்பாட்டு)/i.test(lower)) {
    if (isTa) {
      return {
        answer: `**சங்க இலக்கியம் (Sangam Literature)** என்பது பண்டைய தமிழகத்தில் நிலவிய முச்சங்கங்களில் கடைச்சங்கக் காலத்தில் (பொ.ஊ.மு. 300 முதல் பொ.ஊ. 200 வரை) வாழ்ந்த புலவர்களால் இயற்றப்பட்ட செவ்வியல் கவிதைத் திரட்டாகும்.

### நூல்களின் வகைப்பாடு (பதினெண்மேற்கணக்கு):
- **எட்டுத்தொகை**: நற்றிணை (400), குறுந்தொகை (401), ஐங்குறுநூறு (500), பதிற்றுப்பத்து (80), பரிபாடல் (22), கலித்தொகை (150), அகநானூறு (400), புறநானூறு (400).
- **பத்துப்பாட்டு**: திருமுருகாற்றுப்படை, பொருநராற்றுப்படை, சிறுபாணாற்றுப்படை, பெரும்பாணாற்றுப்படை, முல்லைப்பாட்டு, மதுரைக்காஞ்சி, நெடுநல்வாடை, குறிஞ்சிப்பாட்டு, பட்டினப்பாலை, மலைபடுகடாம்.

### தனித்துவப் பண்புகள்:
1. **சமயச் சார்பற்ற மனித நேயம்**: இயற்கை, காதல், கொடை, வீரம் மற்றும் உலக சகோதரத்துவத்தை மையமாகக் கொண்டது.
2. **திணைக் கோட்பாடு**: ஐந்திணைகளின் முதற்பொருள் (நிலம், காலம்), கருப்பொருள் (மரம், பறவை, இசை), உரிப்பொருள் (மன உணர்வுகள்) வழியே பாடல்கள் புனையப்பட்டுள்ளன.
3. **பெண்பாற் புலவர்கள்**: ஔவையார், வெள்ளிவீதியார், காக்கைப் பாடினியார் உள்ளிட்ட 40-க்கும் மேற்பட்ட பெண் அறிஞர்களின் பங்களிப்பு சங்க இலக்கியத்தில் பதிவாகியுள்ளது.`,
        citations: ['எட்டுத்தொகை', 'பத்துப்பாட்டு', 'CICT சங்க இலக்கியத் தொகுதி'],
        highlightQuote: 'செம்புலப் பெயல்நீர் போல அன்புடை நெஞ்சம் தாம்கலந்தனவே - குறுந்தொகை 40',
        followUpSuggestions: ['ஐந்திணைகள் பற்றி விளக்குக', 'புறநானூறு பாடல்களின் சிறப்பு', 'சங்க காலப் பெண்பாற் புலவர்கள்']
      };
    } else {
      return {
        answer: `**Sangam Literature** represents the high classical lyric poetry composed between **300 BCE and 200 CE** by over 473 poets (including more than 40 women scholars like Avvaiyar and Velli Veethiyar).

### Structure:
- **Ettuthokai (Eight Anthologies)**: 2,381 short to medium stanzas exploring love (*Akam*) and valor/ethics (*Puram*).
- **Pattuppattu (Ten Idylls)**: 10 long descriptive poems depicting ancient cities like Madurai, ports like Poompuhar, and mountainous terrains.

### Key Innovations:
- **Ecological Poetics (Thinai)**: Mapping psychological states to specific environmental biomes.
- **Secular Democratic Ethics**: Kings were directly held accountable to righteousness (*Aram*) by independent bardic intellectuals.
- **Archaeological Grounding**: Carbon-dated excavations at Keeladi, Kodumanal, and Porunthal directly corroborate Sangam descriptions of urban planning, Roman trade, and Tamil-Brahmi literacy.`,
        citations: ['Ettuthokai', 'Pattuppattu', 'CICT Classical Tamil Series'],
        highlightQuote: 'Like rain on red earth, loving hearts have mingled into one - Kurunthogai 40',
        followUpSuggestions: ['Explain Kurunthogai 40', 'Who were the Sangam women poets?', 'Keeladi excavations and Sangam age']
      };
    }
  }

  // 3. Tirukkural
  if (/(tirukkural|thirukkural|திருக்குறள்|குறள்|வள்ளுவர்|thiruvalluvar)/i.test(lower)) {
    if (isTa) {
      return {
        answer: `**திருக்குறள் (Tirukkural)** என்பது திருவள்ளுவரால் இயற்றப்பட்ட உலகப் பொதுமறையாகும். மனித வாழ்வின் அனைத்துத் தளங்களுக்கும் வழிகாட்டும் உலகளாவிய அறநெறிப் பேழை.

### கட்டமைப்பு:
- **3 பால்கள்**:
  1. **அறத்துப்பால்** (Virtue) - 38 அதிகாரங்கள் (பாயிரவியல், இல்லறவியல், துறவறவியல், ஊழியல்).
  2. **பொருட்பால்** (Wealth & Statecraft) - 70 அதிகாரங்கள் (அரசியல், அங்கவியல், ஒழிபியல்).
  3. **காமத்துப்பால் / இன்பத்துப்பால்** (Love) - 25 அதிகாரங்கள் (களவியல், கற்பியல்).
- **மொத்தம்**: 133 அதிகாரங்கள், 1330 குறட்பாக்கள்.
- **யாப்பு**: குறள் வெண்பா (இரண்டு அடிகள், ஏழே சீர்கள்).

### உரை மரபுகள்:
பதினெண் கீழ்க்கணக்கு நூல்களில் தலையாயதான திருக்குறளுக்கு **பரிமேலழகர்**, மணக்குடவர், காளிங்கர், பரிதியார் உள்ளிட்ட பதின்மர் பழங்காலத்து உரையாசிரியர்கள் ஆவர். நவீன காலத்தில் டாக்டர் மு. வரதராசன், சாலமன் பாப்பையா, கலைஞர் மு. கருணாநிதி ஆகியோர் தெளிவுரை வழங்கியுள்ளனர். ஜி.யு. போப், வ.வே.சு. ஐயர் உள்ளிட்டோர் இதனை உலக மொழிகளில் மொழிபெயர்த்துள்ளனர்.`,
        citations: ['திருக்குறள் (பரிமேலழகர் உரை)', 'டாக்டர் மு. வரதராசன் தெளிவுரை', 'CICT பதிப்பு'],
        highlightQuote: 'இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி வேளாண்மை செய்தற் பொருட்டு - குறள் 81',
        followUpSuggestions: ['குறள் 81 உரை விளக்கம்', 'அறத்துப்பாலின் 4 இயல்கள்', 'பரிமேலழகர் உரையின் சிறப்பு']
      };
    } else {
      return {
        answer: `**Tirukkural** (literally "Sacred Couplets"), composed by the sage-philosopher **Thiruvalluvar**, is one of the most translated and revered ethical masterworks in global literature.

### Tripartite Structure (Muppal):
1. **Aram (Virtue & Ethics)**: 38 Chapters covering domestic life, renunciation, and moral righteousness.
2. **Porul (Wealth, Statecraft & Governance)**: 70 Chapters providing timeless counsel on leadership, diplomacy, justice, citizen duty, and defense.
3. **Inbam / Kamam (Love & Romance)**: 25 Chapters presenting subtle psychological nuances of pre-marital romance and marital companionship.

- **Total Scale**: 133 Chapters, 1,330 Couplets.
- **Meter**: *Kural Venba* — compact 2-line stanzas with exactly seven metrical feet (*Seer*).

### Canonical Commentators:
Classical commentaries include Parimelazhagar (13th c. CE), Manakkudavar, and modern interpretations by Dr. M. Varadarajan. Famous English translations were authored by Rev. G.U. Pope (1886) and Rev. W.H. Drew (1840).`,
        citations: ['Tirukkural - Parimelazhagar Edition', 'G.U. Pope Translation (1886)', 'CICT Series'],
        highlightQuote: 'All domestic living and wealth is to provide hospitality and benevolence - Kural 81',
        followUpSuggestions: ['Explain Kural 81 on Hospitality', 'What are the 3 sections of Tirukkural?', 'Parimelazhagar commentary nuance']
      };
    }
  }

  // 4. Five Thinais (ஐந்திணைகள்)
  if (/(thinai|திணை|குறிஞ்சி|முல்லை|மருதம்|நெய்தல்|பாலை|ஐந்திணை)/i.test(lower)) {
    if (isTa) {
      return {
        answer: `**ஐந்திணைகள் (The Five Classical Landscapes)** என்பது சங்கத் தமிழ் இலக்கியத்தின் நிகரற்ற சூழலியல் கவிதை அழகியல் முறையாகும்.

### 5 திணைகளின் அட்டவணை:
1. **குறிஞ்சி (Kurinji - மலையும் மலை சார்ந்த இடமும்)**:
   - **உரிப்பொருள்**: புணர்தலும் புணர்தல் நிமித்தமும் (காதலர்கள் கூடுதல்).
   - **பொழுது & மலர்**: கூதிர்காலம், யாமம்; குறிஞ்சி மலர்.
2. **முல்லை (Mullai - காடும் காடு சார்ந்த இடமும்)**:
   - **உரிப்பொருள்**: இருத்தலும் இருத்தல் நிமித்தமும் (ஆற்றி காத்திருத்தல்).
   - **பொழுது & மலர்**: கார்காலம் (மழைக்காலம்), மாலை; முல்லை மலர்.
3. **மருதம் (Marutham - வயலும் வயல் சார்ந்த இடமும்)**:
   - **உரிப்பொருள்**: ஊடலும் ஊடல் நிமித்தமும் (இனிய செல்லக் கோபம்).
   - **பொழுது & மலர்**: விடியல் காலம்; தாமரை, செங்கழுநீர்.
4. **நெய்தல் (Neythal - கடலும் கடல் சார்ந்த இடமும்)**:
   - **உரிப்பொருள்**: இரங்கலும் இரங்கல் நிமித்தமும் (பிரிவுத் துயர்/வருத்தம்).
   - **பொழுது & மலர்**: எற்பாடு (பிற்பகல்); நெய்தல் மலர்.
5. **பாலை (Palai - மணலும் மணல் சார்ந்த வறண்ட நிலமும்)**:
   - **உரிப்பொருள்**: பிரிதலும் பிரிதல் நிமித்தமும் (நீண்ட பிரிவு).
   - **பொழுது & மலர்**: வேனில்காலம், நண்பகல்; குரவம், பாதிரி.`,
        citations: ['தொல்காப்பியம் பொருளதிகாரம்', 'ஐங்குறுநூறு', 'குறுந்தொகை'],
        highlightQuote: 'குறிஞ்சி முல்லை மருதம் நெய்தல் பாலை என முறைமைத்தாகும் - தொல்காப்பியம்',
        followUpSuggestions: ['குறிஞ்சித்திணைப் பாடல்கள்', 'முல்லைத்திணையின் காத்திருத்தல் நயம்', 'முதற்பொருள் கருப்பொருள் உரிப்பொருள்']
      };
    } else {
      return {
        answer: `**The Five Thinais** are the cornerstone of Classical Tamil landscape poetics, systematically codified in **Tolkappiyam**. Every human emotion is organically married to a geographic biome and season:

1. **Kurinji (Montane / Mountains)**:
   - **Emotion**: First union of lovers (*Punarthal*).
   - **Atmosphere**: Midnight, Winter/Dewy season; Kurinji blossom.
2. **Mullai (Pastoral / Forests)**:
   - **Emotion**: Patient, hopeful waiting of the wife during rainy season (*Iruthal*).
   - **Atmosphere**: Monsoon dusk; Jasmine (*Mullai*).
3. **Marutham (Riverine / Fertile Plains)**:
   - **Emotion**: Playful lover spats and reconciliation (*Oodal*).
   - **Atmosphere**: Dawn; Red lotus.
4. **Neythal (Littoral / Seashore)**:
   - **Emotion**: Yearning and sorrow of separation (*Irangal*).
   - **Atmosphere**: Late afternoon sunset; Neythal water-lily.
5. **Palai (Arid / Desert Waste)**:
   - **Emotion**: Hardship of journey and long separation (*Pirithal*).
   - **Atmosphere**: Scorching summer noon; Dried cactus & Paathiri.`,
        citations: ['Tolkappiyam Porulathikaram', 'Ainkurunuru', 'Kurunthogai'],
        highlightQuote: 'Emotions anchored in ecology - Tolkappiyam Poetics',
        followUpSuggestions: ['Explain Kurinji lyrics', 'Why is Mullai associated with rain?', 'Akam poetics breakdown']
      };
    }
  }

  // 5. Default Comprehensive Grounded Synthesis (If specific verse or topic)
  if (topVerse) {
    const comm = topVerse.commentaries?.[0]?.textTa || topVerse.culturalContextTa || '';
    const tr = topVerse.translations?.[0]?.text || '';
    if (isTa) {
      return {
        answer: `உங்கள் கேள்வி "${cleanQuery}" குறித்த நேரடிச் செவ்வியல் சான்று **${topVerse.workTitleTa}** நூலில் காணப்படுகிறது.

### மூலப் பாடல் வரிகள்:
> **${topVerse.linesTa.join('\n> ')}**

### உரை விளக்கம்:
${comm}

### விழுமியங்கள் & பின்னணி:
- **நூல்**: ${topVerse.workTitleTa} (${topVerse.chapterTa || `பாடல் ${topVerse.verseNumber}`})
- **இயற்றியவர்**: ${topVerse.poetTa}
- **யாப்பு**: ${topVerse.meterTa}
- **முதன்மை விழுமியங்கள்**: ${(topVerse.coreConcepts || []).join(', ')}
- **பண்பாட்டுச் சூழல்**: ${topVerse.culturalContextTa}`,
        citations: [topVerse.canonicalSource || topVerse.workTitleTa],
        highlightQuote: topVerse.linesTa[0] || '',
        followUpSuggestions: ['இப்பாடலின் கடின சொல் விளக்கம்', 'இலக்கணக் குறிப்பு & பதம் பிரிப்பு', 'ஒத்த கருத்துடைய பிற பாடல்கள்']
      };
    } else {
      return {
        answer: `For your inquiry "${cleanQuery}", an authoritative Classical Tamil passage is found in **${topVerse.workTitleEn}** (${topVerse.chapterEn || `Verse ${topVerse.verseNumber}`}).

### Original Classical Verses:
> **${topVerse.linesTa.join('\n> ')}**

### Canonical Meaning & Commentary:
${tr || comm}

### Literary & Cultural Background:
- **Work**: ${topVerse.workTitleEn} (${topVerse.workTitleTa})
- **Author/Poet**: ${topVerse.poetEn} (${topVerse.poetTa})
- **Prosodic Meter**: ${topVerse.meterTa}
- **Core Classical Concepts**: ${(topVerse.coreConcepts || []).join(', ')}
- **Context**: ${topVerse.culturalContextEn}`,
        citations: [topVerse.canonicalSource || topVerse.workTitleEn],
        highlightQuote: topVerse.linesTa[0] || '',
        followUpSuggestions: ['Explain word-by-word sandhi split', 'Historical context', 'Related Sangam verses']
      };
    }
  }

  // General fallback
  if (isTa) {
    return {
      answer: `உங்கள் கேள்வி "${cleanQuery}" செம்மொழித் தமிழ் ஆய்வுப் பொறியில் பகுப்பாய்வு செய்யப்பட்டது.

செம்மொழித் தமிழின் 41 மூல நூல்கள் (தொல்காப்பியம், எட்டுத்தொகை, பத்துப்பாட்டு, பதினெண்கீழ்க்கணக்கு நீதி நூல்கள், ஐம்பெருங்காப்பியங்கள்) மற்றும் இலக்கண, வரலாற்று ஆய்வுகள் குறித்த துல்லியமான தகவல்களை YAAZH AI வழங்குகிறது.

நீங்கள் திருக்குறள், புறநானூறு, குறுந்தொகை, சிலப்பதிகாரம், ஐந்திணைகள், சொல் பிரிப்பு, அல்லது மொழிபெயர்ப்புகள் குறித்து விரிவாகக் கேட்கலாம்.`,
      citations: ['செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் (CICT)', 'தொல்காப்பியம்', 'திருக்குறள்'],
      highlightQuote: 'யாதும் ஊரே யாவரும் கேளிர் - புறநானூறு 192',
      followUpSuggestions: ['செவ்வியல் தமிழ் இலக்கியம் பற்றி விளக்குக', 'திருக்குறள் 81 விளக்கம்', 'ஐந்திணைகள் யாவை?']
    };
  } else {
    return {
      answer: `Your inquiry "${cleanQuery}" has been processed through the Classical Tamil Knowledge Engine.

YAAZH AI provides authoritative intelligence grounded in the **41 canonical Classical Tamil works** (Tolkappiyam, Sangam 8 Anthologies & 10 Idylls, 18 Didactic Texts including Tirukkural, and Epics like Silappadikaram).

You can ask about specific poems, word-by-word sandhi decomposition, ethical philosophy, landscape poetics (*Thinai*), or translations.`,
      citations: ['Central Institute of Classical Tamil (CICT)', 'Tolkappiyam', 'Tirukkural'],
      highlightQuote: 'Every town our hometown, every person our kin - Purananuru 192',
      followUpSuggestions: ['Explain Classical Tamil Literature', 'Explain Tirukkural 81', 'What are the 5 Sangam Thinais?']
    };
  }
}

// Unified Ask YAAZH Endpoint: Handles Translation, Grounded Q&A, and Search
app.post('/api/ask', async (req, res) => {
  try {
    const rawQuery = req.body.query || req.body.message || req.body.prompt || req.body.text || '';
    const { language = 'ta', currentRole = 'study', history = [] } = req.body;
    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      return res.status(400).json({ error: 'Valid query parameter is required' });
    }

    const cleanQuery = rawQuery.trim();
    const isTa = language === 'ta';

    // 1. Detect Genuine Translation Intent (avoid false positives like "in Tamil history", "in Tamil literature")
    const isTopicQuery = /\bin tamil (history|culture|literature|society|tradition|poetry|nadu|grammar|folklore|cinema|art|epics|script)\b/i.test(cleanQuery);
    const isTranslateIntent = !isTopicQuery && (
      /^(please\s+)?(translate|translation|trans|மொழிபெயர்ப்பு|மொழிபெயர்)/i.test(cleanQuery) ||
      /\btranslate\s+.+\s+(to|into)\s+(english|tamil)\b/i.test(cleanQuery) ||
      /\b(to english|to tamil|into english|into tamil)\s*$/i.test(cleanQuery) ||
      /\b(how to say|how do you say)\b/i.test(cleanQuery) ||
      /\b(ஆங்கிலத்தில்|தமிழில்)\s*(மொழிபெயர்|மொழிபெயர்ப்பு|பொருள் கூறுக|பொருள் தருக|எப்படி சொல்வது)\b/i.test(cleanQuery) ||
      (/\b(in english|in tamil)\s*$/i.test(cleanQuery) && !cleanQuery.toLowerCase().startsWith('who') && !cleanQuery.toLowerCase().startsWith('what') && !cleanQuery.toLowerCase().startsWith('why') && !cleanQuery.toLowerCase().startsWith('how'))
    );

    if (isTranslateIntent) {
      // Extract target text
      let textToTranslate = cleanQuery;
      const quoteMatch = cleanQuery.match(/["'“](.+?)["'”]/);
      if (quoteMatch) {
        textToTranslate = quoteMatch[1];
      } else {
        textToTranslate = textToTranslate
          .replace(/^(please\s+)?(translate|translation|trans|மொழிபெயர்ப்பு|மொழிபெயர்)\s*(to\s+english|into\s+english|to\s+tamil|into\s+tamil|செய்க)?\s*[:,-]?\s*/i, '')
          .replace(/\s*(to\s+english|into\s+english|to\s+tamil|into\s+tamil|in\s+english|in\s+tamil|ஆங்கிலத்தில்|தமிழில்)\s*$/i, '')
          .replace(/^(what does|what is the meaning of|meaning of)\s*/i, '')
          .replace(/\s*mean\??$/i, '')
          .trim();
      }

      if (!textToTranslate) textToTranslate = cleanQuery;

      const detectedLang = detectInputLanguage(textToTranslate);
      const targetLang = (
        cleanQuery.toLowerCase().includes('tamil') || 
        cleanQuery.includes('தமிழில்') || 
        detectedLang === 'english'
      ) ? 'ta' : 'en';

      // Check if it matches any verse in classical corpus
      let matchedVerse = CLASSICAL_VERSES.find(v => 
        v.fullTextTa.includes(textToTranslate) ||
        v.linesTa.some(l => cleanTamilForSearch(l).includes(cleanTamilForSearch(textToTranslate))) ||
        (v.translations && v.translations.some(tr => tr.text.toLowerCase().includes(textToTranslate.toLowerCase())))
      );

      let translatedText = '';
      let notes = '';
      let transliteration = '';

      if (matchedVerse) {
        if (targetLang === 'en' && matchedVerse.translations.length > 0) {
          translatedText = matchedVerse.translations[0].text;
          notes = `Canonical translation by ${matchedVerse.translations[0].translator} (${matchedVerse.translations[0].year}). Source: ${matchedVerse.workTitleTa}, ${matchedVerse.chapterTa || ''}`;
          transliteration = matchedVerse.transliteration;
        } else if (targetLang === 'ta') {
          translatedText = matchedVerse.linesTa.join('\n');
          notes = `${matchedVerse.workTitleTa} - ${matchedVerse.poetTa}`;
        }
      }

      // If not from canonical translation, use Gemini
      if (!translatedText && ai) {
        try {
          const prompt = `You are YAAZH AI, an expert bilingual Classical and Modern Tamil scholar.
Translate the following text accurately into ${targetLang === 'ta' ? 'natural, authentic Tamil' : 'clear, poetic and fluent English'}.
Input text: "${textToTranslate}"

Provide a JSON response with:
{
  "translatedText": "the exact translation",
  "notes": "brief nuance or grammatical note, especially if classical literary Tamil",
  "transliteration": "ISO 15919 transliteration"
}`;
          const geminiRes = await callGeminiWithFallback(ai, prompt);
          const rawText = geminiRes.text?.trim() || '';
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            translatedText = parsed.translatedText;
            notes = parsed.notes || '';
            transliteration = parsed.transliteration || '';
          } else {
            translatedText = rawText;
          }
        } catch (e) {
          console.warn('Gemini translate error:', e);
        }
      }

      // Fallback
      if (!translatedText) {
        if (targetLang === 'ta') {
          const smart = processSmartInput(textToTranslate);
          translatedText = smart.tamilQuery || textToTranslate;
          notes = 'Phonetic Tanglish / Linguistic conversion';
        } else {
          translatedText = transliterateTamil(textToTranslate);
          notes = 'ISO 15919 Classical Transliteration';
        }
      }

      return res.json({
        type: 'translation',
        query: cleanQuery,
        originalText: textToTranslate,
        translatedText,
        detectedSourceLang: targetLang === 'en' ? 'ta' : 'en',
        targetLang,
        transliteration: transliteration || (detectInputLanguage(textToTranslate) === 'tamil' ? transliterateTamil(textToTranslate) : ''),
        notes,
        relatedVerse: matchedVerse || undefined
      });
    }

    // 2. Real-time Classical Corpus Retrieval & Knowledge Synthesis
    const searchResults = hybridSearchCorpus(cleanQuery);
    const smartAnalysis = processSmartInput(cleanQuery);

    if (ai) {
      try {
        const langName = isTa ? 'Tamil (தமிழ்)' : 'English';
        const retrievedEvidence = searchResults.slice(0, 3).map(r => 
          `- ${r.verse.workTitleTa} (${r.verse.chapterTa || `Verse ${r.verse.verseNumber}`}) by ${r.verse.poetTa}:\n  Lines: "${r.verse.linesTa.join(' ')}"\n  Commentary: "${r.verse.commentaries[0]?.textTa || ''}"`
        ).join('\n\n');

        const historyContext = Array.isArray(history) && history.length > 0
          ? `Recent conversation context:\n` + history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'User' : 'YAAZH'}: ${h.text}`).join('\n') + '\n\n'
          : '';

        const prompt = `You are YAAZH AI (யாழ் AI), an erudite, helpful, and eloquent Classical and Modern Tamil digital humanities scholar, companion, and teacher.
Your mission is to provide an articulate, accurate, informative, and beautifully written response in real time to WHATEVER the user asks.

${historyContext}User Query / Question: "${cleanQuery}"
Requested Response Language: ${langName}
User's Platform Mode: ${currentRole || 'study'}

Corpus references retrieved in real time (use if relevant):
${retrievedEvidence || 'No direct verse text matched in sample index. Draw upon your comprehensive knowledge of the 41 Classical Tamil canonical works, Sangam poetry, Tolkappiyam grammar, Tamil philosophy, culture, history, modern literature, science, or general topics.'}

Instructions:
1. Directly and thoroughly answer the user's specific query.
2. If the user asks about Tamil literature, poetry, or ethics, reference specific works (Sangam, Tolkappiyam, Tirukkural, Silappadikaram, etc.), verses, authors, and provide clear explanations.
3. If the user asks for grammar, sandhi separation, meter (yaappu), or word meanings, provide an exact step-by-step linguistic breakdown.
4. If the user asks general questions, creative questions, translations, study advice, conversational chat, or science/tech in Tamil, provide a well-reasoned, engaging, and comprehensive answer in ${langName}.
5. Use clean formatting with paragraphs, markdown bold highlights, and bullet points where helpful.
6. Suggest 2-3 natural follow-up questions to help the user learn more.

Provide your response in valid JSON:
{
  "answer": "your complete, articulate, and well-structured answer in ${langName}",
  "citations": ["canonical works or sources referenced, if any"],
  "highlightQuote": "a memorable quote, verse line, or proverb if applicable",
  "followUpSuggestions": ["2-3 natural follow-up questions in ${langName}"]
}`;

        const geminiRes = await callGeminiWithFallback(ai, prompt);
        const raw = geminiRes.text?.trim() || '';

        let answer = '';
        let citations: string[] = searchResults.length > 0 ? [searchResults[0].verse.workTitleTa] : [];
        let highlightQuote = searchResults.length > 0 ? searchResults[0].verse.linesTa[0] : '';
        let followUpSuggestions: string[] = isTa
          ? ['இப்பாடலின் எளிய விளக்கம் தருக', 'சொல் பிரிப்பு மற்றும் இலக்கணம்', 'ஒத்த கருத்துடைய பிற பாடல்கள்']
          : ['Explain this in simple terms', 'Show word-by-word sandhi breakdown', 'Related classical verses'];

        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.answer && typeof parsed.answer === 'string') {
              answer = parsed.answer.trim();
            }
            if (Array.isArray(parsed.citations) && parsed.citations.length > 0) {
              citations = parsed.citations;
            }
            if (parsed.highlightQuote && typeof parsed.highlightQuote === 'string') {
              highlightQuote = parsed.highlightQuote.trim();
            }
            if (Array.isArray(parsed.followUpSuggestions) && parsed.followUpSuggestions.length > 0) {
              followUpSuggestions = parsed.followUpSuggestions;
            }
          } catch (jsonErr) {
            console.warn('JSON parse warning, using raw text:', jsonErr);
          }
        }

        // If JSON extraction failed or was incomplete, use the raw response text directly!
        if (!answer && raw) {
          answer = raw
            .replace(/^```(json)?\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();
        }

        if (answer) {
          return res.json({
            type: 'inquiry_answer',
            query: cleanQuery,
            answer,
            reply: answer,
            citations,
            highlightQuote,
            followUpSuggestions,
            verse: searchResults[0]?.verse,
            verses: searchResults.slice(0, 3).map(r => r.verse),
            relatedVerses: searchResults.slice(0, 3).map(r => r.verse),
            smartAnalysis,
            resultsCount: searchResults.length
          });
        }
      } catch (qErr) {
        console.warn('Real-time inquiry synthesis error:', qErr);
      }
    }

    // 3. Intelligent Classical Knowledge Synthesis Engine (Multi-paragraph, structured & grounded)
    const scholarly = synthesizeScholarlyKnowledge(cleanQuery, isTa, searchResults[0]?.verse);

    return res.json({
      type: 'inquiry_answer',
      query: cleanQuery,
      answer: scholarly.answer,
      reply: scholarly.answer,
      smartAnalysis,
      resultsCount: searchResults.length,
      verse: searchResults[0]?.verse,
      verses: searchResults.slice(0, 3).map(r => r.verse),
      results: searchResults,
      citations: scholarly.citations,
      highlightQuote: scholarly.highlightQuote,
      followUpSuggestions: scholarly.followUpSuggestions
    });
  } catch (error: any) {
    console.error('Ask Yaazh error:', error);
    res.status(500).json({ error: 'Failed to process inquiry', message: error.message });
  }
});

// Alias /api/chat to /api/ask for chatbox clients
app.post('/api/chat', async (req, res) => {
  const askUrl = `http://localhost:${PORT}/api/ask`;
  try {
    const askRes = await fetch(askUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const askData = await askRes.json();
    return res.status(askRes.status).json(askData);
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: 'Chat endpoint error', message: err.message });
  }
});

// Hybrid Search
app.post('/api/search', async (req, res) => {
  try {
    const { query, workId, poet, meter, conceptId, language = 'ta' } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Valid query parameter is required' });
    }

    const cleanQuery = query.trim();
    // Check if translation requested inside search
    const isTranslateIntent = 
      /^(translate|translation|trans|மொழிபெயர்ப்பு|மொழிபெயர்)/i.test(cleanQuery) ||
      /\b(to english|to tamil|into english|into tamil|in english|in tamil|ஆங்கிலத்தில்|தமிழில்)\b/i.test(cleanQuery);

    if (isTranslateIntent) {
      // Forward directly to ask handler logic
      const askRes = await fetch(`http://localhost:${PORT}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanQuery, language })
      });
      const askData = await askRes.json();
      return res.json(askData);
    }

    const smartAnalysis = processSmartInput(query);
    const results = hybridSearchCorpus(query, { workId, poet, meter, conceptId });
    res.json({
      type: 'search_results',
      query,
      smartAnalysis,
      resultsCount: results.length,
      results
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal search engine error', message: error.message });
  }
});

// Verse Identification
app.post('/api/identify', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text to identify is required' });
    }
    const result = identifyVerseFromText(text);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Identification error', message: error.message });
  }
});

// Study Mode: Explain text / verse
app.post('/api/study/explain', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text is required for study analysis' });
    }

    const analysis = await buildStudyAnalysis(text);
    res.json({ analysis });
  } catch (error: any) {
    console.error('Study explain error:', error);
    res.status(500).json({ error: 'Failed to build study analysis', message: error.message });
  }
});

// Universal Scanner: Real-time OCR & Document Extraction for Student, Learner, and Researcher
const handleScannerOcr = async (req: express.Request, res: express.Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', mode = 'student' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided for real-time OCR extraction' });
    }

    let extractedText = '';
    let ocrConfidence = 0.95;

    // Real-time Multimodal Gemini OCR on actual user image
    if (ai) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
        const imagePart = {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || 'image/jpeg'
          }
        };

        const ocrPrompt = 'You are an authoritative Classical and Modern Tamil optical character recognition (OCR) and manuscript transcription engine. Examine this image carefully and transcribe all visible Tamil characters, words, palm-leaf lines, or printed verses accurately in real time. Return ONLY the transcribed Tamil text. If no legible Tamil characters or words are present in the image, output strictly: NO_TEXT_FOUND';
        const result = await callGeminiWithFallback(ai, [imagePart, ocrPrompt]);

        const raw = result.text?.trim() || '';
        if (raw && !raw.includes('NO_TEXT_FOUND')) {
          extractedText = raw;
          ocrConfidence = 0.96;
        }
      } catch (ocrErr) {
        console.warn('Real-time Multimodal OCR error:', ocrErr);
      }
    }

    // If no text was recognized
    if (!extractedText) {
      return res.json({
        status: 'NO_TEXT',
        message: 'No legible Tamil text detected in this image. Please ensure the manuscript or book page is well-lit and in focus.',
        extractedText: '',
        confidence: 0
      });
    }

    const normalized = normalizeTamil(extractedText);
    const identification = identifyVerseFromText(normalized);
    const transliteration = transliterateTamil(normalized);
    const studyAnalysis = await buildStudyAnalysis(normalized);

    // Contextual enrichments per user role
    const researchVariants = identification.verse 
      ? TEXTUAL_VARIANTS.filter(v => v.workId === identification.verse?.workId)
      : [];

    res.json({
      extractedText: normalized,
      transliteration,
      confidence: ocrConfidence,
      identification,
      studyAnalysis,
      mode,
      researchVariants: mode === 'researcher' ? researchVariants : undefined,
      status: 'SUCCESS'
    });
  } catch (error: any) {
    console.error('Real-time OCR processing error:', error);
    res.status(500).json({ error: 'Real-time OCR extraction failed', message: error.message });
  }
};

app.post('/api/study/ocr', handleScannerOcr);
app.post('/api/scanner/process', handleScannerOcr);

// Study Mode: Quiz & Practice Generator
app.post('/api/study/quiz', (req, res) => {
  try {
    const { verseId } = req.body;
    const verse = CLASSICAL_VERSES.find(v => v.id === verseId) || CLASSICAL_VERSES[0];

    const quiz = [
      {
        id: `quiz-1-${verse.id}`,
        questionTa: `"${verse.linesTa[0]}" என்ற பாடல் அடியில் பயின்றுவரும் முதன்மையான விழுமியம் யாது?`,
        questionEn: `What is the primary classical virtue embodied in the line "${verse.linesTa[0]}"?`,
        options: [
          verse.coreConcepts[0] || 'அறம்',
          'வீரத்தின் வெளிப்பாடு',
          'செல்வச் செருக்கு',
          'மகிழ்ச்சி மட்டுமே'
        ],
        correctIndex: 0,
        explanationTa: `இப்பாடல் "${verse.workTitleTa}" நூலில் "${verse.coreConcepts.join(', ')}" என்ற விழுமியத்தை நிலைநிறுத்துகிறது.`,
        explanationEn: `This poem from ${verse.workTitleEn} establishes the classical ideal of ${verse.coreConcepts.join(', ')}.`,
        verseRef: `${verse.workTitleTa} (${verse.chapterTa || verse.verseNumber})`
      },
      {
        id: `quiz-2-${verse.id}`,
        questionTa: `இப்பாடலை இயற்றிய புலவர் / சான்றோர் யார்?`,
        questionEn: `Who is the classical poet/author of this verse?`,
        options: [
          verse.poetTa,
          'ஔவையார்',
          'கபிலர்',
          'நக்கீரர்'
        ],
        correctIndex: 0,
        explanationTa: `இப்பாடல் ${verse.poetTa} அவர்களால் இயற்றப்பட்டது.`,
        explanationEn: `Authored by ${verse.poetEn}.`,
        verseRef: verse.workTitleTa
      }
    ];

    const flashcards = verse.vocabulary.map((vocab, idx) => ({
      id: `fc-${verse.id}-${idx}`,
      frontTa: vocab.word,
      transliteration: vocab.transliteration,
      backMeaningTa: vocab.classicalMeaningTa,
      backMeaningEn: vocab.englishMeaning,
      contextVerseTa: verse.linesTa[0],
      grammarTag: vocab.pos || 'செவ்வியல் சொல்'
    }));

    res.json({ quiz, flashcards });
  } catch (error: any) {
    res.status(500).json({ error: 'Quiz generation failed', message: error.message });
  }
});

// Research Mode: Synthesize Research Inquiry
app.post('/api/research/synthesize', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Inquiry query string is required' });
    }

    const synthesis = await buildResearchSynthesis(query);
    res.json({ synthesis });
  } catch (error: any) {
    console.error('Research synthesis error:', error);
    res.status(500).json({ error: 'Research synthesis failed', message: error.message });
  }
});

// Research Mode: Export Citations
app.post('/api/research/export', (req, res) => {
  try {
    const { citations, format } = req.body;
    if (!citations || !Array.isArray(citations)) {
      return res.status(400).json({ error: 'Citations array is required' });
    }
    const formatted = formatCitations(citations, format || 'BIBTEX');
    res.json({ formatted, format: format || 'BIBTEX' });
  } catch (error: any) {
    res.status(500).json({ error: 'Citation export failed', message: error.message });
  }
});

// Learner Mode: Get Curriculum Modules
app.get('/api/learner/modules', (req, res) => {
  res.json({ modules: LEARNER_MODULES });
});

// Learner Mode: Daily Classical Verse
app.get('/api/learner/daily', (req, res) => {
  // Rotate through verified classical verses based on day of year
  const dayIndex = new Date().getDate() % CLASSICAL_VERSES.length;
  const verse = CLASSICAL_VERSES[dayIndex] || CLASSICAL_VERSES[0];
  res.json({
    verse,
    date: new Date().toISOString().split('T')[0],
    focusConcept: verse.coreConcepts[0] || 'அறம்'
  });
});

// Classical Pronunciation & Cadence Generator
app.post('/api/pronounce', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for pronunciation' });
    }
    const clean = normalizeTamil(text);
    const transliteration = transliterateTamil(clean);
    
    // Calculate simple moraic rhythm (மாத்திரை)
    const words = clean.split(/\s+/).filter(Boolean);
    const syllables = words.map(w => ({
      word: w,
      transliteration: transliterateTamil(w),
      cadence: w.length > 5 ? 'நெடில் அசை' : 'குறில் அசை'
    }));

    res.json({
      original: clean,
      transliteration,
      syllables,
      audioScript: clean
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Pronunciation parsing failed' });
  }
});

// Research Mode: Get Textual Variants (பாடபேதங்கள்)
app.get('/api/research/variants', (req, res) => {
  const { workId } = req.query;
  if (workId) {
    const filtered = TEXTUAL_VARIANTS.filter(v => v.workId === workId);
    return res.json({ variants: filtered });
  }
  res.json({ variants: TEXTUAL_VARIANTS });
});

// Research Mode: Research Notes (Get & Create)
app.get('/api/research/notes', (req, res) => {
  res.json({ notes: RESEARCH_NOTES });
});

app.post('/api/research/notes', (req, res) => {
  try {
    const { verseId, title, noteText, tags } = req.body;
    if (!title || !noteText) {
      return res.status(400).json({ error: 'Title and noteText are required' });
    }
    const newNote = {
      id: `note-${Date.now()}`,
      verseId: verseId || 'general',
      title,
      noteText,
      createdAt: new Date().toISOString(),
      tags: tags || []
    };
    RESEARCH_NOTES.unshift(newNote);
    res.json({ note: newNote, success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save note' });
  }
});

// ==========================================
// YAAZH Voice Access Processor
// Voice -> Understand -> Retrieve -> Explain -> Speak -> Follow-up
// ==========================================
app.post('/api/voice/process', async (req, res) => {
  try {
    const { query, transcript, text, currentVerseId, currentRole, action, language = 'ta', userQuizAnswer, currentQuizQuestion } = req.body;
    const cleanQuery = (query || transcript || text || '').trim();
    const isTa = language === 'ta';

    // 1. Quiz answer evaluation
    if (action === 'EVALUATE_QUIZ' && currentQuizQuestion) {
      const userAnswer = (userQuizAnswer || cleanQuery).toLowerCase();
      const expected = (currentQuizQuestion.expectedAnswer || '').toLowerCase();
      const isCorrect = userAnswer.includes(expected) || 
        expected.split(/\s+/).some((part: string) => part.length > 2 && userAnswer.includes(part));
      
      const speech = isCorrect
        ? (isTa ? `மிகச் சரி! ${currentQuizQuestion.explanationTa || 'சரியான விடை.'}` : `Correct! ${currentQuizQuestion.explanationEn || 'Great job.'}`)
        : (isTa ? `சரியான விடை: ${currentQuizQuestion.expectedAnswer}. ${currentQuizQuestion.explanationTa || ''}` : `The correct answer is: ${currentQuizQuestion.expectedAnswer}. ${currentQuizQuestion.explanationEn || ''}`);

      return res.json({
        intent: 'QUIZ_EVALUATION',
        isCorrect,
        speechText: speech,
        displayText: speech,
        followUpSuggestions: isTa ? ['அடுத்த கேள்வி', 'பாடலின் பொருள்', 'ஆய்வு'] : ['Next question', 'Explain poem', 'Research']
      });
    }

    // 2. Identify active verse (from ID or match in query)
    let activeVerse = CLASSICAL_VERSES.find(v => v.id === currentVerseId);
    const identified = identifyVerseFromText(cleanQuery);
    if (identified.verse && identified.confidence > 0.4) {
      activeVerse = identified.verse;
    }
    if (!activeVerse) {
      activeVerse = CLASSICAL_VERSES[0];
    }

    const lower = cleanQuery.toLowerCase();

    // 3. Navigation intents
    if (/(study|படிப்பு|மாணவர்|syllabus|exam)/i.test(lower)) {
      return res.json({
        intent: 'NAVIGATION',
        targetPlatform: 'student',
        speechText: isTa ? 'படிப்புத் தளம் திறக்கப்பட்டது. சொற்களைப் பிரித்துப் படிக்கலாம் மற்றும் வினாடி வினா பயிற்சி செய்யலாம்.' : 'Opening Study Platform. You can explore sandhi splits and take practice quizzes.',
        displayText: isTa ? 'படிப்புத் தளம் இயக்கத்தில் உள்ளது' : 'Switched to Study Platform',
        verse: activeVerse,
        followUpSuggestions: isTa ? ['இப்பாடலின் பொருள் கூறு', 'கடின சொற்கள்', 'வினாடி வினா'] : ['Explain this poem', 'Difficult words', 'Quiz me']
      });
    }

    if (/(learn|explore|கற்றல்|ஆர்வம்|திணை|landscape)/i.test(lower)) {
      return res.json({
        intent: 'NAVIGATION',
        targetPlatform: 'learner',
        speechText: isTa ? 'கற்றல் தளம் திறக்கப்பட்டது. சங்க இலக்கியத் திணைகள் மற்றும் வாழ்வியல் விழுமியங்களை ஆராயலாம்.' : 'Opening Learner Platform. You can explore Sangam landscape modules and daily verses.',
        displayText: isTa ? 'கற்றல் தளம் இயக்கத்தில் உள்ளது' : 'Switched to Learner Platform',
        verse: activeVerse,
        followUpSuggestions: isTa ? ['இன்றைய குறள்', 'வரலாற்றுப் பின்னணி', 'பாடல் வாசி'] : ['Daily verse', 'Historical context', 'Read poem']
      });
    }

    if (/(research|lab|ஆய்வு|ஆராய்ச்சி|பேராசிரியர்)/i.test(lower)) {
      return res.json({
        intent: 'NAVIGATION',
        targetPlatform: 'researcher',
        speechText: isTa ? 'ஆய்வுத் தளம் திறக்கப்பட்டது. செவ்வியல் நூல்களில் ஒப்பாய்வு மற்றும் சான்றுகளைத் தொகுக்கலாம்.' : 'Opening Research Platform. You can perform multi-corpus textual research and export citations.',
        displayText: isTa ? 'ஆய்வுத் தளம் இயக்கத்தில் உள்ளது' : 'Switched to Research Platform',
        verse: activeVerse,
        followUpSuggestions: isTa ? ['பாடபேதங்கள் காட்டு', 'ஆராய்ச்சி தொகுப்புரை'] : ['Show variants', 'Synthesize research']
      });
    }

    if (/(home|portal|முகப்பு|வெளியேறு)/i.test(lower)) {
      return res.json({
        intent: 'NAVIGATION',
        targetPlatform: null,
        speechText: isTa ? 'தமிழ் பண்பாட்டு முகப்புத் தளம் திறக்கப்பட்டது.' : 'Returning to Tamil Cultural Portal.',
        displayText: isTa ? 'முகப்புத் தளம்' : 'Cultural Portal',
        verse: activeVerse
      });
    }

    if (/(camera|scan|கேமரா|ஸ்கேன்|படம்)/i.test(lower)) {
      return res.json({
        intent: 'CAMERA_SCAN',
        action: 'OPEN_CAMERA',
        speechText: isTa ? 'கேமரா திறக்கப்படுகிறது. உங்கள் தொலைபேசியை ஏடு அல்லது நூலின் மீது காட்டி திரையைத் தொடவும்.' : 'Opening camera scanner. Hold phone above the Tamil text and tap anywhere on screen.',
        displayText: isTa ? 'கேமரா ஸ்கேன் தயார்' : 'Camera Scanner Ready',
        verse: activeVerse
      });
    }

    // 4. Learning Commands for poem:
    // A. Explain Simple
    if (/(explain this poem|simple tamil|simple meaning|பொருள் கூறு|எளிய விளக்கம்|பொருள் என்ன|பொருளுரை)/i.test(lower)) {
      const commentary = activeVerse.commentaries[0]?.textTa || activeVerse.vocabulary.map(v => v.classicalMeaningTa).join(' ');
      const speech = isTa
        ? `${activeVerse.workTitleTa}, ${activeVerse.chapterTa || ''}: ${commentary}`
        : `${activeVerse.workTitleEn}: The whole design of living as a householder and preserving wealth is to welcome guests with benevolence.`;

      return res.json({
        intent: 'EXPLAIN_SIMPLE',
        speechText: speech,
        displayText: commentary,
        verse: activeVerse,
        followUpSuggestions: isTa ? ['கடின சொற்களை விளக்கு', 'வரலாற்றுப் பின்னணி', 'வினாடி வினா'] : ['Explain difficult words', 'Historical context', 'Quiz me']
      });
    }

    // B. Explain Difficult Words
    if (/(difficult words|words|vocabulary|கடின சொற்கள்|சொற்பொருள்|சொல் பொருள்|பிரித்துப் பேசு)/i.test(lower)) {
      const vocabList = activeVerse.vocabulary.slice(0, 4);
      const vocabSpeech = vocabList.map(v => `${v.word}: ${isTa ? v.classicalMeaningTa : v.englishMeaning}`).join('. ');
      const speech = isTa
        ? `இப்பாடலில் உள்ள முதன்மைச் சொற்கள்: ${vocabSpeech}`
        : `Key vocabulary in this verse: ${vocabSpeech}`;

      return res.json({
        intent: 'EXPLAIN_WORDS',
        speechText: speech,
        displayText: vocabSpeech,
        verse: activeVerse,
        followUpSuggestions: isTa ? ['மூலப் பாடலை வாசி', 'வரலாற்றுப் பின்னணி', 'வினாடி வினா'] : ['Read original poem', 'Historical context', 'Quiz me']
      });
    }

    // C. Historical / Cultural Context
    if (/(historical context|cultural context|context|பின்னணி|வரலாறு|திணை விளக்கம்)/i.test(lower)) {
      const ctxText = isTa ? activeVerse.culturalContextTa : activeVerse.culturalContextEn;
      const speech = isTa
        ? `இப்பாடலின் பண்பாட்டு வரலாற்றுப் பின்னணி: ${ctxText}`
        : `Cultural and historical context: ${ctxText}`;

      return res.json({
        intent: 'EXPLAIN_CONTEXT',
        speechText: speech,
        displayText: ctxText,
        verse: activeVerse,
        followUpSuggestions: isTa ? ['எளிய விளக்கம்', 'மூலப் பாடலை வாசி', 'வினாடி வினா'] : ['Simple meaning', 'Read original poem', 'Quiz me']
      });
    }

    // D. Read Original Poem
    if (/(read original|read poem|recite|மூலப் பாடல்|பாடல் வாசி|வாசி)/i.test(lower)) {
      const lines = activeVerse.linesTa.join('. ');
      const speech = isTa
        ? `${activeVerse.workTitleTa} மூலப் பாடல்: ${lines}. யாப்பு: ${activeVerse.meterTa}.`
        : `Original classical poem from ${activeVerse.workTitleEn}: ${lines}. Meter: ${activeVerse.meterTa}.`;

      return res.json({
        intent: 'READ_ORIGINAL',
        speechText: speech,
        displayText: lines,
        verse: activeVerse,
        followUpSuggestions: isTa ? ['எளிய விளக்கம்', 'கடின சொற்கள்', 'வினாடி வினா'] : ['Explain simple', 'Difficult words', 'Quiz me']
      });
    }

    // E. Quiz Me on This
    if (/(quiz me|quiz|test me|வினாடி வினா|கேள்வி கேள்|பயிற்சி)/i.test(lower)) {
      const vocab = activeVerse.vocabulary[activeVerse.vocabulary.length - 1] || activeVerse.vocabulary[0];
      const question = {
        id: `voice-quiz-${activeVerse.id}`,
        questionTa: `"${activeVerse.workTitleTa}" பாடலில் "${vocab.word}" என்பதன் பொருள் என்ன?`,
        questionEn: `In ${activeVerse.workTitleEn}, what is the meaning of the word "${vocab.word}"?`,
        expectedAnswer: vocab.classicalMeaningTa,
        explanationTa: `"${vocab.word}" என்பதற்கு "${vocab.classicalMeaningTa}" என்பது பொருள்.`,
        explanationEn: `"${vocab.word}" means "${vocab.englishMeaning}".`
      };

      const speech = isTa
        ? `வினாடி வினா கேள்வி: ${question.questionTa}. உங்கள் விடையைக் குரலில் கூறவும்.`
        : `Quiz question: ${question.questionEn}. Please speak your answer aloud.`;

      return res.json({
        intent: 'VOICE_QUIZ',
        action: 'START_QUIZ',
        quizQuestion: question,
        speechText: speech,
        displayText: isTa ? question.questionTa : question.questionEn,
        verse: activeVerse,
        followUpSuggestions: isTa ? ['விடை சொல்', 'விளக்கம் கூறு', 'அடுத்த கேள்வி'] : ['Answer', 'Explain', 'Next question']
      });
    }

    // 5. Voice Research: Search Knowledge Base / RAG
    const searchResults = hybridSearchCorpus(cleanQuery);
    if (searchResults.length > 0) {
      const topMatch = searchResults[0];
      const verse = topMatch.verse;
      const commentary = verse.commentaries[0]?.textTa || verse.vocabulary.map(v => v.classicalMeaningTa).join(' ');

      let spokenAnswer = '';
      if (ai) {
        try {
          const prompt = `You are YAAZH Voice Assistant, an authentic Classical Tamil scholar assisting a blind or visually impaired user on a smartphone.
Question asked: "${cleanQuery}"
Grounding source: ${verse.workTitleTa} (${verse.poetTa || 'புலவர்'}), Lines: "${verse.linesTa.join(' ')}". Commentary: "${commentary}".
Instructions:
1. Provide a concise, clear 2-3 sentence answer optimized for text-to-speech listening.
2. In ${isTa ? 'Tamil' : 'English'}.
3. DO NOT use markdown symbols, asterisks, brackets, or numbers.
4. Conclude with a natural follow-up invite (e.g., "Would you like me to explain difficult words or recite the poem?").`;
          const aiRes = await callGeminiWithFallback(ai, prompt);
          spokenAnswer = aiRes.text?.trim() || '';
        } catch (e) {
          console.warn('Gemini voice fallback:', e);
        }
      }

      if (!spokenAnswer) {
        spokenAnswer = isTa
          ? `${verse.workTitleTa} நூலில் ${verse.poetTa || ''} இயற்றிய பாடலில் இதற்குச் சான்று உள்ளது: ${verse.linesTa[0]}. இதன் பொருள்: ${commentary}`
          : `According to ${verse.workTitleEn} by ${verse.poetEn || 'the poet'}: "${verse.linesTa[0]}". Meaning: ${verse.vocabulary.map(v => v.englishMeaning).join(', ')}.`;
      }

      return res.json({
        intent: 'RESEARCH_QUERY',
        speechText: spokenAnswer,
        displayText: spokenAnswer,
        verse,
        citations: [{
          workTitle: verse.workTitleTa,
          authorOrPoet: verse.poetTa,
          verseNumber: verse.verseNumber,
          edition: 'CICT Classical Tamil Corpus'
        }],
        followUpSuggestions: isTa ? ['எளிய விளக்கம்', 'கடின சொற்கள்', 'மூலப் பாடல் வாசி', 'வினாடி வினா'] : ['Explain simple', 'Difficult words', 'Read poem', 'Quiz me']
      });
    }

    // 6. Real-time Knowledge Synthesis via Gemini if no direct snippet matched
    if (ai) {
      try {
        const prompt = `You are YAAZH Voice Assistant, an authentic Classical Tamil literary scholar assisting a user on a smartphone.
The user asked via voice: "${cleanQuery}"
Provide an authentic, articulate 2-3 sentence spoken response in ${isTa ? 'Tamil' : 'English'}.
Strictly adhere to Classical Tamil literary principles.
DO NOT use markdown symbols, asterisks, brackets, or numbers.
Conclude with a natural follow-up question.`;
        const aiRes = await callGeminiWithFallback(ai, prompt);
        const spokenAnswer = aiRes.text?.trim();
        if (spokenAnswer) {
          return res.json({
            intent: 'RESEARCH_QUERY',
            speechText: spokenAnswer,
            displayText: spokenAnswer,
            verse: activeVerse,
            followUpSuggestions: isTa ? ['திருக்குறள் பற்றி சொல்', 'புறநானூறு 192', 'படிப்புத் தளம்'] : ['Tell me about Tirukkural', 'Purananuru 192', 'Open Study']
          });
        }
      } catch (voiceAiErr) {
        console.warn('Real-time voice synthesis error:', voiceAiErr);
      }
    }

    // 7. General Fallback
    const fallbackSpeech = isTa
      ? `உங்கள் கேள்வி: ${cleanQuery}. நீங்கள் திருக்குறள், புறநானூறு, குறுந்தொகை பற்றி கேட்கலாம் அல்லது 'எளிய விளக்கம்', 'வினாடி வினா' எனக் கூறலாம்.`
      : `You asked: "${cleanQuery}". You can ask about Tirukkural, Purananuru, Kuruntokai, or say 'Explain this poem' or 'Quiz me'.`;

    return res.json({
      intent: 'UNKNOWN',
      speechText: fallbackSpeech,
      displayText: fallbackSpeech,
      verse: activeVerse,
      followUpSuggestions: isTa ? ['திருக்குறள் பற்றி சொல்', 'புறநானூறு 192', 'படிப்புத் தளம்'] : ['Tell me about Tirukkural', 'Purananuru 192', 'Open Study']
    });

  } catch (error: any) {
    console.error('Voice process error:', error);
    res.status(500).json({ error: 'Voice processing failed', message: error.message });
  }
});

// ==========================================
// Vite / Static Serving Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[YAAZH AI Engine] Listening on port ${PORT}`);
  });
}

startServer();
