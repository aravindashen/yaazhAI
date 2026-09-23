import { CLASSICAL_VERSES, CLASSICAL_WORKS, TAMIL_CONCEPTS } from '../data/classicalCorpus.ts';
import { ClassicalVerse, EvidenceSnippet, TrustStatus } from '../types/index.ts';
import { cleanTamilForSearch, fuzzySimilarity, normalizeTamil, splitSandhiHeuristic, tokenizeTamil } from './tamilLinguistics.ts';
import { processSmartInput } from './tanglishConverter.ts';

export interface SearchFilters {
  workId?: string;
  category?: string;
  poet?: string;
  conceptId?: string;
  meter?: string;
}

export interface SearchResultItem {
  verse: ClassicalVerse;
  score: number;
  matchType: 'EXACT' | 'FUZZY' | 'CONCEPT' | 'COMMENTARY';
  highlightSnippet: string;
  evidence: EvidenceSnippet;
  detectedLang?: 'tamil' | 'tanglish' | 'english';
}

/**
 * Identifies the closest Classical Tamil verse from user input (Tamil, Tanglish, or English)
 * Returns top match and confidence score (0 to 1)
 */
export function identifyVerseFromText(userInput: string): {
  verse?: ClassicalVerse;
  confidence: number;
  matchedLine?: string;
  isKnownCorpusMatch: boolean;
  detectedLanguage?: 'tamil' | 'tanglish' | 'english';
  normalizedTamil?: string;
} {
  if (!userInput || !userInput.trim()) {
    return { confidence: 0, isKnownCorpusMatch: false };
  }

  const smart = processSmartInput(userInput);
  const normalizedInput = normalizeTamil(smart.tamilQuery || userInput);
  const cleanInput = cleanTamilForSearch(normalizedInput);
  const rawInput = userInput.trim().toLowerCase();

  let bestVerse: ClassicalVerse | undefined;
  let bestScore = 0;
  let bestMatchedLine = '';

  for (const verse of CLASSICAL_VERSES) {
    const cleanFull = cleanTamilForSearch(verse.fullTextTa);
    const cleanTrans = verse.transliteration.toLowerCase();

    // 1. Exact full text or substring with converted Tamil
    if (cleanInput && (cleanFull.includes(cleanInput) || cleanInput.includes(cleanFull))) {
      const matchScore = Math.min(1.0, 0.88 + (cleanInput.length / cleanFull.length) * 0.12);
      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestVerse = verse;
        bestMatchedLine = verse.linesTa[0];
      }
    }

    // 2. Check individual lines with converted Tamil
    for (const line of verse.linesTa) {
      const cleanLine = cleanTamilForSearch(line);
      if (cleanInput && (cleanLine.includes(cleanInput) || cleanInput.includes(cleanLine))) {
        const lineScore = Math.min(0.98, 0.86 + (Math.min(cleanLine.length, cleanInput.length) / Math.max(cleanLine.length, cleanInput.length)) * 0.14);
        if (lineScore > bestScore) {
          bestScore = lineScore;
          bestVerse = verse;
          bestMatchedLine = line;
        }
      }

      // Fuzzy line check
      if (cleanInput) {
        const sim = fuzzySimilarity(cleanLine, cleanInput);
        if (sim > bestScore && sim >= 0.58) {
          bestScore = sim;
          bestVerse = verse;
          bestMatchedLine = line;
        }
      }
    }

    // 3. Check transliteration with raw input (Tanglish or Latin)
    if (cleanTrans.includes(rawInput) || rawInput.includes(cleanTrans.slice(0, 20))) {
      const transScore = 0.88;
      if (transScore > bestScore) {
        bestScore = transScore;
        bestVerse = verse;
        bestMatchedLine = verse.linesTa[0];
      }
    }

    // 4. English translations match
    for (const tr of verse.translations) {
      if (tr.text.toLowerCase().includes(rawInput)) {
        const enScore = 0.85;
        if (enScore > bestScore) {
          bestScore = enScore;
          bestVerse = verse;
          bestMatchedLine = verse.linesTa[0];
        }
      }
    }

    // 5. Author/Work match in English/Tanglish
    if (verse.workTitleEn.toLowerCase().includes(rawInput) || verse.poetEn.toLowerCase().includes(rawInput)) {
      const metaScore = 0.76;
      if (metaScore > bestScore) {
        bestScore = metaScore;
        bestVerse = verse;
        bestMatchedLine = verse.linesTa[0];
      }
    }
  }

  return {
    verse: bestVerse,
    confidence: Math.round(bestScore * 100) / 100,
    matchedLine: bestMatchedLine,
    isKnownCorpusMatch: bestScore >= 0.65,
    detectedLanguage: smart.detectedLanguage,
    normalizedTamil: smart.tamilQuery
  };
}

/**
 * Hybrid Search across Classical Tamil corpus:
 * Combines exact token matching, sandhi-split tokens, fuzzy phonetics,
 * commentary text search, concept associations, and Tanglish/English inputs.
 */
export function hybridSearchCorpus(
  query: string,
  filters: SearchFilters = {}
): SearchResultItem[] {
  if (!query || !query.trim()) return [];

  const smart = processSmartInput(query);
  const normalizedQuery = normalizeTamil(smart.tamilQuery || query);
  const cleanQuery = cleanTamilForSearch(normalizedQuery);
  const rawQuery = query.trim().toLowerCase();

  const queryTokens = tokenizeTamil(cleanQuery);
  const sandhiExpandedQuery = splitSandhiHeuristic(cleanQuery);

  const results: SearchResultItem[] = [];

  for (const verse of CLASSICAL_VERSES) {
    // Apply filters
    if (filters.workId && verse.workId !== filters.workId) continue;
    if (filters.poet && !verse.poetTa.includes(filters.poet) && !verse.poetEn.toLowerCase().includes(filters.poet.toLowerCase())) continue;
    if (filters.meter && verse.meterTa !== filters.meter) continue;
    if (filters.conceptId) {
      const concept = TAMIL_CONCEPTS.find(c => c.id === filters.conceptId);
      if (concept && !verse.coreConcepts.includes(concept.nameTa)) continue;
    }

    let score = 0;
    let matchType: 'EXACT' | 'FUZZY' | 'CONCEPT' | 'COMMENTARY' = 'FUZZY';
    let highlight = verse.linesTa.join(' / ');

    const cleanFull = cleanTamilForSearch(verse.fullTextTa);
    const cleanTrans = verse.transliteration.toLowerCase();

    // 1. Exact phrase in verse text (Tamil or converted Tanglish)
    if (cleanQuery && (cleanFull.includes(cleanQuery) || cleanFull.includes(sandhiExpandedQuery))) {
      score += 0.95;
      matchType = 'EXACT';
    } else {
      // 2. Token overlap & fuzzy matching
      let tokenMatches = 0;
      for (const token of queryTokens) {
        if (cleanFull.includes(token)) {
          tokenMatches++;
        } else {
          // Check vocabulary split
          const vocabMatch = verse.vocabulary.some(v => cleanTamilForSearch(v.word).includes(token) || cleanTamilForSearch(v.classicalMeaningTa).includes(token));
          if (vocabMatch) tokenMatches += 0.75;
        }
      }
      if (queryTokens.length > 0) {
        score += (tokenMatches / queryTokens.length) * 0.7;
      }

      // Fuzzy similarity on lines
      for (const line of verse.linesTa) {
        const sim = fuzzySimilarity(line, query);
        if (sim > 0.65) {
          score = Math.max(score, sim * 0.85);
          matchType = 'FUZZY';
          highlight = line;
        }
      }
    }

    // 3. Transliteration match (Tanglish)
    if (cleanTrans.includes(rawQuery) || rawQuery.includes(cleanTrans.slice(0, 20))) {
      score = Math.max(score, 0.82);
    }

    // 4. English translation match
    for (const trans of verse.translations) {
      if (trans.text.toLowerCase().includes(rawQuery)) {
        score = Math.max(score, 0.85);
        highlight = `[Translation: ${trans.translator}] ${trans.text}`;
      }
    }

    // 5. Concept match (Tamil or English mapped concept)
    for (const conceptName of verse.coreConcepts) {
      if (cleanTamilForSearch(conceptName).includes(cleanQuery) || rawQuery.includes(conceptName.toLowerCase()) || (smart.mappedConcept && verse.coreConcepts.some(c => TAMIL_CONCEPTS.find(tc => tc.id === smart.mappedConcept)?.nameTa === c))) {
        score = Math.max(score, 0.88);
        matchType = 'CONCEPT';
      }
    }

    // Work title and poet match in English/Tanglish
    if (verse.workTitleEn.toLowerCase().includes(rawQuery) || verse.poetEn.toLowerCase().includes(rawQuery)) {
      score = Math.max(score, 0.78);
    }

    // 6. Commentary check
    for (const comm of verse.commentaries) {
      if (cleanTamilForSearch(comm.textTa).includes(cleanQuery)) {
        score = Math.max(score, 0.75);
        if (matchType !== 'EXACT') {
          matchType = 'COMMENTARY';
          highlight = `[உரை: ${comm.scholarTa}] ${comm.textTa.slice(0, 120)}...`;
        }
      }
    }

    if (score >= 0.40) {
      const trustStatus: TrustStatus = 'VERIFIED';
      const evidence: EvidenceSnippet = {
        id: `ev-${verse.id}`,
        verseId: verse.id,
        workTitleTa: verse.workTitleTa,
        workTitleEn: verse.workTitleEn,
        poetTa: verse.poetTa,
        linesTa: verse.linesTa,
        explanationTa: verse.commentaries[0]?.textTa || verse.culturalContextTa,
        relevanceScore: Math.round(score * 100) / 100,
        relevanceReason: matchType === 'EXACT' ? 'மூல நூலின் வரிகளில் நேரடிச் சொல் அமைவு' : matchType === 'CONCEPT' ? 'கருத்தியல் அடிப்படைப் பொருத்தம்' : 'பொருளுரை மற்றும் உரைநடைச் சான்று',
        trustStatus,
        citation: {
          workTitle: verse.workTitleTa,
          chapterOrPoem: verse.chapterTa || `பாடல் ${verse.verseNumber}`,
          verseNumber: verse.verseNumber,
          authorOrPoet: verse.poetTa,
          edition: verse.canonicalSource,
          trustStatus,
          primaryTextSnippet: verse.fullTextTa
        }
      };

      results.push({
        verse,
        score: Math.round(score * 100) / 100,
        matchType,
        highlightSnippet: highlight,
        evidence,
        detectedLang: smart.detectedLanguage
      });
    }
  }

  // Sort descending by score
  return results.sort((a, b) => b.score - a.score);
}
