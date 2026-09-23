export type TrustStatus = 'VERIFIED' | 'SOURCE-SUPPORTED' | 'INTERPRETIVE' | 'USER-PROVIDED';

export type AppMode = 'home' | 'study' | 'explore' | 'research';

export type UserRole = 'home' | 'study' | 'explore' | 'research' | 'student' | 'learner' | 'researcher';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  language: 'ta' | 'en';
  level?: string;
  completedLessons?: string[];
  savedVersesCount?: number;
}

export interface LearnerLesson {
  id: string;
  titleTa: string;
  titleEn: string;
  summaryTa: string;
  summaryEn: string;
  targetVerseId?: string;
  keyWords: string[];
}

export interface LearnerModule {
  id: string;
  level: number;
  levelTitleTa: string;
  levelTitleEn: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  lessons: LearnerLesson[];
}

export interface TextualVariant {
  id: string;
  workId: string;
  workTitleTa: string;
  workTitleEn: string;
  verseRef: string;
  baseReadingTa: string;
  variantReadingTa: string;
  sourceManuscript: string; // e.g., 'திருக்கழுக்குன்றத்து ஏட்டுப் பிரதி'
  printedEdition: string; // e.g., 'உ.வே.சா. முதற்பதிப்பு (1894)'
  criticalAnalysisTa: string;
  criticalAnalysisEn: string;
}

export interface ResearchNote {
  id: string;
  verseId: string;
  title: string;
  noteText: string;
  createdAt: string;
  tags: string[];
}

export interface ClassicalWork {
  id: string;
  titleTa: string;
  titleEn: string;
  transliteration: string;
  category: 'பத்துப்பாட்டு' | 'எட்டுத்தொகை' | 'பதினெண்கீழ்க்கணக்கு' | 'காப்பியம்' | 'இலக்கணம்';
  period: string; // e.g., 'சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)'
  approxDate: string;
  author: string;
  authorEn: string;
  descriptionTa: string;
  descriptionEn: string;
  structure: string; // e.g. '133 அதிகாரங்கள், 1330 குறட்பாக்கள்'
  canonicalSource: string; // e.g. 'CICT Classical Tamil Series / Dr. U.V. Swaminatha Iyer'
  verseCount: number;
}

export interface VocabularyItem {
  word: string;
  transliteration: string;
  splitForm?: string; // Sandhi split
  pos?: string; // part of speech: பெயர்ச்சொல், வினைச்சொல், உரிச்சொல்
  classicalMeaningTa: string;
  modernTamilMeaning: string;
  englishMeaning: string;
  etymology?: string;
  rootWord?: string;
}

export interface Commentary {
  id: string;
  scholarTa: string;
  scholarEn: string;
  period: string; // e.g. '13th Century CE'
  sourceEdition: string;
  textTa: string;
  analysisTa?: string;
  status: TrustStatus;
}

export interface Translation {
  id: string;
  translator: string;
  year?: string;
  language: string;
  text: string;
  notes?: string;
}

export interface ClassicalVerse {
  id: string;
  workId: string;
  workTitleTa: string;
  workTitleEn: string;
  sectionTa?: string; // e.g. 'அறத்துப்பால்'
  chapterTa?: string; // e.g. 'விருந்தோம்பல்'
  chapterEn?: string;
  verseNumber: number;
  poetTa: string;
  poetEn: string;
  meterTa: string; // e.g. 'குறள் வெண்பா', 'நேரிசை ஆசிரியப்பா'
  tinai?: string; // திணை: குறிஞ்சி, முல்லை, மருதம், நெய்தல், பாலை, பொதுவியல்
  thurai?: string; // துறை
  linesTa: string[];
  fullTextTa: string;
  transliteration: string;
  wordSplitTa: string[];
  vocabulary: VocabularyItem[];
  commentaries: Commentary[];
  translations: Translation[];
  coreConcepts: string[];
  culturalContextTa: string;
  culturalContextEn: string;
  primaryEvidenceReference: string; // Precise citation string
  canonicalSource: string;
}

export interface Concept {
  id: string;
  nameTa: string;
  nameEn: string;
  transliteration: string;
  definitionTa: string;
  definitionEn: string;
  classicalVocabulary: string[];
  primaryWorkIds: string[];
  sampleVerseIds: string[];
  relatedConceptIds: string[];
  culturalSignificanceTa: string;
  culturalSignificanceEn: string;
}

export interface SourceCitation {
  workTitle: string;
  chapterOrPoem: string;
  verseNumber?: number;
  authorOrPoet: string;
  edition: string;
  pageOrRef?: string;
  url?: string;
  trustStatus: TrustStatus;
  primaryTextSnippet: string;
}

export interface EvidenceSnippet {
  id: string;
  verseId: string;
  workTitleTa: string;
  workTitleEn: string;
  poetTa: string;
  linesTa: string[];
  explanationTa: string;
  relevanceScore: number;
  relevanceReason: string;
  trustStatus: TrustStatus;
  citation: SourceCitation;
}

export interface StudyAnalysis {
  identifiedVerse?: ClassicalVerse;
  matchConfidence: number; // 0 to 1
  isKnownCorpusMatch: boolean;
  userInputText: string;
  sourceTrust: TrustStatus;
  normalizedTamil: string;
  wordByWord: {
    original: string;
    sandhiSplit: string;
    meaningTa: string;
    meaningEn: string;
    grammarNote?: string;
  }[];
  explanationTa: string;
  explanationEn: string;
  culturalSignificance: string;
  literaryDevice?: string;
  sourceTrail: {
    step: string;
    detail: string;
    source: string;
    status: TrustStatus;
  }[];
  relatedLiterature: {
    workTitle: string;
    verseRef: string;
    theme: string;
  }[];
}

export interface QuizItem {
  id: string;
  questionTa: string;
  questionEn: string;
  options: string[];
  correctIndex: number;
  explanationTa: string;
  explanationEn: string;
  verseRef: string;
}

export interface FlashcardItem {
  id: string;
  frontTa: string;
  transliteration: string;
  backMeaningTa: string;
  backMeaningEn: string;
  contextVerseTa: string;
  grammarTag: string;
}

export interface ResearchSynthesis {
  query: string;
  identifiedConcepts: string[];
  groupedEvidence: {
    workTitleTa: string;
    workTitleEn: string;
    period: string;
    evidenceItems: EvidenceSnippet[];
  }[];
  academicSynthesisTa: string;
  academicSynthesisEn: string;
  divergingInterpretations?: string[];
  citations: SourceCitation[];
  trustSummary: {
    verifiedCorpusPassages: number;
    commentaryCount: number;
    overallStatus: TrustStatus;
  };
}

export interface KnowledgeNode {
  id: string;
  labelTa: string;
  labelEn: string;
  type: 'work' | 'poet' | 'concept' | 'verse' | 'commentary';
  descriptionTa?: string;
  descriptionEn?: string;
  meta?: Record<string, any>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationshipTa: string;
  relationshipEn: string;
  type: 'authored' | 'embodies' | 'commented_on' | 'translated_from' | 'relates_to' | 'contains';
}
