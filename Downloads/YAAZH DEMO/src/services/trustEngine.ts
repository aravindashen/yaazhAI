import { GoogleGenAI } from '@google/genai';
import { ClassicalVerse, EvidenceSnippet, ResearchSynthesis, SourceCitation, StudyAnalysis, TrustStatus } from '../types/index.ts';
import { CLASSICAL_VERSES, TAMIL_CONCEPTS } from '../data/classicalCorpus.ts';
import { identifyVerseFromText, hybridSearchCorpus } from './hybridSearch.ts';
import { normalizeTamil, splitSandhiHeuristic } from './tamilLinguistics.ts';

// Initialize Gemini SDK with process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function callGeminiWithFallback(genaiClient: GoogleGenAI, contents: any, config?: any) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError: any = null;
  for (const model of models) {
    try {
      const res = await genaiClient.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {})
      });
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Model ${model} failed, trying next:`, err?.message || err);
    }
  }
  throw lastError;
}

/**
 * Builds grounded Study Analysis for any user-provided Tamil text or verse query.
 */
export async function buildStudyAnalysis(userInput: string): Promise<StudyAnalysis> {
  const normalized = normalizeTamil(userInput);
  const identification = identifyVerseFromText(normalized);
  const matchedVerse = identification.verse;

  if (matchedVerse && identification.isKnownCorpusMatch) {
    const sourceTrust: TrustStatus = 'VERIFIED';
    const wordByWord = matchedVerse.vocabulary.map(v => ({
      original: v.word,
      sandhiSplit: v.splitForm || v.word,
      meaningTa: v.classicalMeaningTa,
      meaningEn: v.englishMeaning,
      grammarNote: v.pos || 'செவ்வியல் சொல்'
    }));

    const sourceTrail = [
      {
        step: '1. உரை உள்ளீடு (Input & Normalization)',
        detail: `பயனர் உள்ளீடு: "${userInput.slice(0, 80)}${userInput.length > 80 ? '...' : ''}"`,
        source: 'யுனிகோட் NFC சீராக்கம் (Unicode NFC Normalization)',
        status: 'USER-PROVIDED' as TrustStatus
      },
      {
        step: '2. மூல நூல் அடையாளம் (Corpus Identification)',
        detail: `${matchedVerse.workTitleTa} - ${matchedVerse.chapterTa || `பாடல் ${matchedVerse.verseNumber}`} (பொருத்தம்: ${Math.round(identification.confidence * 100)}%)`,
        source: matchedVerse.canonicalSource,
        status: 'VERIFIED' as TrustStatus
      },
      {
        step: '3. செவ்வியல் உரைச் சான்று (Canonical Commentary)',
        detail: matchedVerse.commentaries[0] ? `${matchedVerse.commentaries[0].scholarTa} உரை (${matchedVerse.commentaries[0].period})` : 'சங்க மரபு உரை',
        source: matchedVerse.commentaries[0]?.sourceEdition || matchedVerse.canonicalSource,
        status: 'VERIFIED' as TrustStatus
      },
      {
        step: '4. பொருள் விளக்கம் (Grounded Exposition)',
        detail: 'மூல உரையையும் சொல் பிரிப்பையும் அடிப்படையாகக் கொண்டு வழங்கப்பட்ட மெய்ப்பு விளக்கம்.',
        source: 'YAAZH Trust Engine',
        status: 'SOURCE-SUPPORTED' as TrustStatus
      }
    ];

    const relatedLiterature = CLASSICAL_VERSES
      .filter(v => v.id !== matchedVerse.id && v.coreConcepts.some(c => matchedVerse.coreConcepts.includes(c)))
      .slice(0, 3)
      .map(v => ({
        workTitle: v.workTitleTa,
        verseRef: v.chapterTa ? `${v.chapterTa} (${v.verseNumber})` : `பாடல் ${v.verseNumber}`,
        theme: v.coreConcepts.join(', ')
      }));

    return {
      identifiedVerse: matchedVerse,
      matchConfidence: identification.confidence,
      isKnownCorpusMatch: true,
      userInputText: userInput,
      sourceTrust,
      normalizedTamil: normalized,
      wordByWord,
      explanationTa: matchedVerse.commentaries[0]?.textTa || 'பாடலின் செவ்வியல் விளக்கம்.',
      explanationEn: matchedVerse.translations[0]?.text || 'Classical English translation.',
      culturalSignificance: matchedVerse.culturalContextTa,
      literaryDevice: matchedVerse.meterTa,
      sourceTrail,
      relatedLiterature
    };
  }

  // If text is not an exact match in our indexed corpus, we search for closest related evidence
  const searchResults = hybridSearchCorpus(normalized);
  const topEvidence = searchResults.slice(0, 3).map(r => r.evidence);

  let explanationTa = 'இப்பாடல்/வரிகள் நமது முதற்கட்ட செவ்வியல் தகவல் களஞ்சியத்தில் உள்ள 41 செம்மொழித் தமிழ் நூல்களின் பகுப்புகளுடன் பகுதியளவு தொடர்புடையதாகக் கண்டறியப்பட்டது.';
  let explanationEn = 'This text was evaluated against verified Classical Tamil sources. Below are the closest source-grounded references and conceptual parallels.';

  // If Gemini API is available, generate grounded interpretation constrained strictly by retrieved corpus
  if (ai) {
    try {
      const prompt = `You are YAAZH AI, a rigorous Classical Tamil digital humanities trust engine.
You MUST adhere to these strict rules:
1. SOURCE BEFORE AI: Never invent Tamil verses or false citations.
2. Ground your response in authentic Tamil literary traditions (Sangam, Pathinenkilkanakku, Epic).
3. If the user text is incomplete or user-provided, explain its grammatical/lexical meaning and link it strictly to classical principles without fabricating.

User provided text:
"${normalized}"

Closest verified corpus concepts in our repository:
${topEvidence.map(e => `- ${e.workTitleTa}, ${e.citation.chapterOrPoem}: "${e.linesTa.join(' ')}"`).join('\n')}

Provide a structured, scholarly analysis in JSON format:
{
  "explanationTa": "தெளிவான தமிழ்ப் பொருளுரை (அறம்/இலக்கிய மரபு சார்ந்து)",
  "explanationEn": "Clear scholarly English explanation",
  "culturalSignificance": "பண்பாட்டு வரலாற்றுப் பின்னணி",
  "wordAnalysis": [
    {"word": "word1", "meaningTa": "தமிழ் பொருள்", "meaningEn": "English meaning", "grammar": "இலக்கணக்குறிப்பு"}
  ]
}`;

      const response = await callGeminiWithFallback(ai, prompt, { responseMimeType: 'application/json' });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.explanationTa) explanationTa = parsed.explanationTa;
        if (parsed.explanationEn) explanationEn = parsed.explanationEn;
      }
    } catch (err) {
      console.warn('Gemini grounded call fallback:', err);
    }
  }

  return {
    matchConfidence: 0.45,
    isKnownCorpusMatch: false,
    userInputText: userInput,
    sourceTrust: 'USER-PROVIDED',
    normalizedTamil: normalized,
    wordByWord: normalized.split(/\s+/).slice(0, 6).map(w => ({
      original: w,
      sandhiSplit: splitSandhiHeuristic(w),
      meaningTa: 'சொல் பகுப்பாய்வு',
      meaningEn: 'Lexical unit',
      grammarNote: 'சொல்'
    })),
    explanationTa,
    explanationEn,
    culturalSignificance: 'பயனரால் அளிக்கப்பட்ட உரை. இது செவ்வியல் சங்க இலக்கிய மரபோடு ஒப்பிடப்பட்டு ஆராயப்படுகிறது.',
    sourceTrail: [
      {
        step: '1. உள்ளீடு பதிவு (Input Validation)',
        detail: 'பயனர் வழங்கிய குறிப்பு/உரை சரிபார்க்கப்பட்டது.',
        source: 'User Document / Input',
        status: 'USER-PROVIDED'
      },
      {
        step: '2. ஒப்புநோக்கு (Corpus Search)',
        detail: topEvidence.length > 0 ? `தொடர்புடைய ${topEvidence.length} சான்றுகள் கண்டறியப்பட்டன.` : 'நேரடி மூலப் பாடல் சான்றுகள் கிடைக்கவில்லை.',
        source: 'YAAZH Hybrid Search Engine',
        status: 'INTERPRETIVE'
      }
    ],
    relatedLiterature: topEvidence.map(e => ({
      workTitle: e.workTitleTa,
      verseRef: e.citation.chapterOrPoem,
      theme: e.relevanceReason
    }))
  };
}

/**
 * Conducts a research-grade grounded synthesis on an inquiry.
 * Never invents facts; groups evidence by work and attaches exact citations.
 */
export async function buildResearchSynthesis(query: string): Promise<ResearchSynthesis> {
  const normalizedQuery = normalizeTamil(query);
  const searchResults = hybridSearchCorpus(normalizedQuery);

  // Group evidence by work
  const workMap = new Map<string, EvidenceSnippet[]>();
  for (const res of searchResults) {
    const list = workMap.get(res.verse.workTitleTa) || [];
    list.push(res.evidence);
    workMap.set(res.verse.workTitleTa, list);
  }

  const groupedEvidence = Array.from(workMap.entries()).map(([workTitleTa, evidenceItems]) => {
    const firstVerse = CLASSICAL_VERSES.find(v => v.workTitleTa === workTitleTa);
    return {
      workTitleTa,
      workTitleEn: firstVerse?.workTitleEn || workTitleTa,
      period: firstVerse?.canonicalSource || 'சங்க இலக்கியப் பதிப்பு',
      evidenceItems
    };
  });

  const citations: SourceCitation[] = searchResults.map(r => r.evidence.citation);

  // Identify matching concepts
  const identifiedConcepts = TAMIL_CONCEPTS
    .filter(c => normalizedQuery.includes(c.nameTa) || query.toLowerCase().includes(c.nameEn.toLowerCase()) || searchResults.some(r => r.verse.coreConcepts.includes(c.nameTa)))
    .map(c => c.nameTa);

  // If no evidence retrieved from corpus, refuse to fabricate citations!
  if (searchResults.length === 0) {
    return {
      query,
      identifiedConcepts: [],
      groupedEvidence: [],
      academicSynthesisTa: 'கிடைக்கப்பெற்ற செம்மொழித் தமிழ் மூலங்களில் இக்கேள்விக்குரிய நேரடிச் சான்றுகள் காணப்படவில்லை. ஆதாரமற்ற அனுமானங்களை YAAZH Trust Engine தவிர்த்து, மெய்ப்பிக்கப்பட்ட தரவுகளை மட்டுமே வழங்குகிறது.',
      academicSynthesisEn: 'No verified Classical Tamil passages directly supporting this inquiry were retrieved in the current indexed corpus. Adhering to the "Source Before AI" principle, YAAZH refuses to fabricate citations or assertions.',
      citations: [],
      trustSummary: {
        verifiedCorpusPassages: 0,
        commentaryCount: 0,
        overallStatus: 'SOURCE-SUPPORTED'
      }
    };
  }

  // Synthesize research response based strictly on retrieved evidence
  let academicSynthesisTa = '';
  let academicSynthesisEn = '';

  if (ai) {
    try {
      const prompt = `You are YAAZH AI Research Workspace.
Synthesize an evidence-backed academic research briefing addressing this query:
"${query}"

Strictly adhere to the following RETRIEVED PRIMARY EVIDENCE:
${searchResults.map((r, i) => `[Source ${i + 1}] ${r.verse.workTitleTa} (${r.verse.chapterTa || `Verse ${r.verse.verseNumber}`}) by ${r.verse.poetTa}:
Lines: ${r.verse.linesTa.join(' ')}
Commentary: ${r.verse.commentaries[0]?.textTa || 'N/A'}`).join('\n\n')}

Rules:
1. Every claim must refer directly to [Source N].
2. Do not invent non-existent texts or verses.
3. Provide academic synthesis in both Tamil and English.
Output JSON:
{
  "academicSynthesisTa": "ஆராய்ச்சித் தொகுப்புரை (சான்றுகளுடன்)",
  "academicSynthesisEn": "Academic synthesis in English with source citations",
  "divergingInterpretations": ["கருத்து வேறுபாடு 1 அல்லது உரை வேறுபாடு"]
}`;

      const res = await callGeminiWithFallback(ai, prompt, { responseMimeType: 'application/json' });

      if (res.text) {
        const parsed = JSON.parse(res.text);
        academicSynthesisTa = parsed.academicSynthesisTa || '';
        academicSynthesisEn = parsed.academicSynthesisEn || '';
      }
    } catch (err) {
      console.warn('Gemini research synthesis fallback:', err);
    }
  }

  // Deterministic fallback if Gemini is offline
  if (!academicSynthesisTa) {
    academicSynthesisTa = `ஆராய்ச்சிக் கேள்வி தொடர்பாகக் கிடைக்கப்பெற்ற ${searchResults.length} செவ்வியல் சான்றுகள் பகுப்பாய்வு செய்யப்பட்டன. ${groupedEvidence.map(g => `${g.workTitleTa} (${g.evidenceItems.length} பாடல்கள்)`).join(', ')} ஆகிய மூலங்களிலிருந்து பெறப்பட்ட சான்றுகள், இப்பொருண்மையில் பண்டைத் தமிழ்ச் சமுதாயத்தின் ஆழ்ந்த விழுமியங்களை நிறுவுகின்றன.`;
    academicSynthesisEn = `Analyzed ${searchResults.length} primary passages across ${groupedEvidence.map(g => `${g.workTitleEn} (${g.evidenceItems.length} references)`).join(', ')}. The primary texts corroborate this theme with textual evidence and classical commentaries.`;
  }

  return {
    query,
    identifiedConcepts,
    groupedEvidence,
    academicSynthesisTa,
    academicSynthesisEn,
    citations,
    trustSummary: {
      verifiedCorpusPassages: searchResults.length,
      commentaryCount: searchResults.reduce((acc, r) => acc + r.verse.commentaries.length, 0),
      overallStatus: 'VERIFIED'
    }
  };
}

/**
 * Formats citations for export in BibTeX, APA, and Chicago formats
 */
export function formatCitations(citations: SourceCitation[], format: 'BIBTEX' | 'APA' | 'CHICAGO'): string {
  if (format === 'BIBTEX') {
    return citations.map((c, i) => `@incollection{yaazh_${i + 1},
  title = {${c.chapterOrPoem}},
  booktitle = {${c.workTitle}},
  author = {${c.authorOrPoet}},
  publisher = {${c.edition}},
  note = {Verified via YAAZH AI Classical Corpus}
}`).join('\n\n');
  }

  if (format === 'APA') {
    return citations.map(c => `${c.authorOrPoet}. "${c.chapterOrPoem}." In ${c.workTitle}. ${c.edition}.`).join('\n\n');
  }

  // Chicago
  return citations.map(c => `${c.authorOrPoet}. "${c.chapterOrPoem}." In ${c.workTitle}. ${c.edition}.`).join('\n\n');
}
