/**
 * Comprehensive Tanglish (Romanized Tamil), English, and Tamil Input Understanding Engine
 * Converts Tanglish phonetic input to Tamil Unicode script,
 * detects input language, and maps English concepts/keywords to Classical Tamil corpus terms.
 */

import { normalizeTamil, cleanTamilForSearch } from './tamilLinguistics.ts';

// Vowel mappings for Tanglish -> Tamil
const VOWELS_MAP: Record<string, { independent: string; sign: string }> = {
  'aa': { independent: 'ஆ', sign: 'ா' },
  'a': { independent: 'அ', sign: '' },
  'ee': { independent: 'ஈ', sign: 'ீ' },
  'ii': { independent: 'ஈ', sign: 'ீ' },
  'i': { independent: 'இ', sign: 'ி' },
  'oo': { independent: 'ஊ', sign: 'ூ' },
  'uu': { independent: 'ஊ', sign: 'ூ' },
  'u': { independent: 'உ', sign: 'ு' },
  'ae': { independent: 'ஏ', sign: 'ே' },
  'ai': { independent: 'ஐ', sign: 'ை' },
  'e': { independent: 'எ', sign: 'ெ' },
  'oa': { independent: 'ஓ', sign: 'ோ' },
  'o': { independent: 'ஒ', sign: 'ொ' },
  'au': { independent: 'ஔ', sign: 'ௌ' },
  'ou': { independent: 'ஔ', sign: 'ௌ' },
};

// Consonant mappings for Tanglish -> Tamil base consonant
const CONSONANTS_MAP: Record<string, string> = {
  'k': 'க', 'kh': 'க', 'g': 'க', 'gh': 'க',
  'ng': 'ங', 'nga': 'ங',
  'ch': 'ச', 'c': 'ச', 's': 'ச', 'sh': 'ஷ', 'sa': 'ஸ',
  'nj': 'ஞ', 'ny': 'ஞ', 'nya': 'ஞ',
  't': 'த', 'th': 'த', 'd': 'த', 'dh': 'த',
  'tt': 'ட', 'td': 'ட',
  'nn': 'ண', 'nd': 'ண',
  'n': 'ந', 'nh': 'ந',
  'p': 'ப', 'b': 'ப', 'f': 'ப',
  'm': 'ம',
  'y': 'ய',
  'r': 'ர', 'rh': 'ர',
  'l': 'ல',
  'v': 'வ', 'w': 'வ',
  'zh': 'ழ', 'z': 'ழ',
  'll': 'ள', 'lh': 'ள',
  'rr': 'ற', 'tr': 'ற',
  'nnn': 'ன', 'n2': 'ன',
  'j': 'ஜ', 'h': 'ஹ',
};

// Common Sangam and Classical Tamil keywords / phrases frequently typed in Tanglish
const TANGLISH_EXACT_DICTIONARY: Record<string, string> = {
  // Purananuru 192
  'yaathum': 'யாதும்',
  'yaadhum': 'யாதும்',
  'yadhum': 'யாதும்',
  'oore': 'ஊரே',
  'oorae': 'ஊரே',
  'ure': 'ஊரே',
  'yaavarum': 'யாவரும்',
  'yavarum': 'யாவரும்',
  'kelir': 'கேளிர்',
  'kaelir': 'கேளிர்',
  'keler': 'கேளிர்',
  'theethum': 'தீதும்',
  'thithum': 'தீதும்',
  'nandrum': 'நன்றும்',
  'nanrum': 'நன்றும்',
  'pirarthara': 'பிறர்தர',
  'vaara': 'வாரா',
  'vaaraa': 'வாரா',
  'nothalum': 'நோதலும்',
  'nodhalum': 'நோதலும்',
  'thanithalum': 'தணிதலும்',
  'saathalum': 'சாதலும்',
  'puthuvathu': 'புதுவது',
  'vaazhthal': 'வாழ்தல்',
  'periyorai': 'பெரியோரை',
  'viyathalum': 'வியத்தலும்',
  'ilame': 'இலமே',
  'siriyorai': 'சிறியோரை',
  'igazhthal': 'இகழ்தல்',
  'athaninum': 'அதனினும்',

  // Thirukkural 81 & 72
  'irunthombi': 'இருந்தோம்பி',
  'irundhombi': 'இருந்தோம்பி',
  'ilvaazhvathu': 'இல்வாழ்வ தெல்லாம்',
  'ilvaazhvadhல்லாம்': 'இல்வாழ்வ தெல்லாம்',
  'virunthombi': 'விருந்தோம்பி',
  'virundhombi': 'விருந்தோம்பி',
  'velanmai': 'வேளாண்மை',
  'vaelaanmai': 'வேளாண்மை',
  'seithar': 'செய்தற்',
  'seithal': 'செய்தல்',
  'poruttu': 'பொருட்டு',
  'anbilaar': 'அன்பிலார்',
  'anbilar': 'அன்பிலார்',
  'ellam': 'எல்லாம்',
  'thamakkuriyar': 'தமக்குரியர்',
  'anbudaiyaar': 'அன்புடையார்',
  'enbum': 'என்பும்',
  'uriyar': 'உரியர்',
  'pirarkku': 'பிறர்க்கு',

  // Kurunthogai 40
  'chem': 'செம்',
  'sem': 'செம்',
  'pulam': 'புலம்',
  'pulap': 'புலப்',
  'peyal': 'பெயல்',
  'neer': 'நீர்',
  'nir': 'நீர்',
  'pola': 'போல',
  'anbudai': 'அன்புடை',
  'nenjam': 'நெஞ்சம்',
  'thaam': 'தாம்',
  'kalanthanave': 'கலந்தனவே',

  // Tolkappiyam & Concepts
  'tolkappiyam': 'தொல்காப்பியம்',
  'tholkappiyam': 'தொல்காப்பியம்',
  'thirukkural': 'திருக்குறள்',
  'tirukkural': 'திருக்குறள்',
  'purananuru': 'புறநானூறு',
  'kurunthogai': 'குறுந்தொகை',
  'silappathikaram': 'சிலப்பதிகாரம்',
  'silapathikaram': 'சிலப்பதிகாரம்',
  'manimekalai': 'மணிமேகலை',
  'thiruvalluvar': 'திருவள்ளுவர்',
  'tiruvalluvar': 'திருவள்ளுவர்',
  'valluvar': 'வள்ளுவர்',
  'avvaiyar': 'அவ்வையார்',
  'avvai': 'அவ்வையார்',
  'kaniyan': 'கணியன்',
  'poongunranar': 'பூங்குன்றனார்',
  'kapilar': 'கபிலர்',
  'parimelazhagar': 'பரிமேலழகர்',
  'parimelalagar': 'பரிமேலழகர்',
  'uvs': 'உ.வே.சா',
  'u.ve.sa': 'உ.வே.சா',
  'aram': 'அறம்',
  'porul': 'பொருள்',
  'inbam': 'இன்பம்',
  'veedu': 'வீடு',
  'anbu': 'அன்பு',
  'virunthombal': 'விருந்தோம்பல்',
  'veeram': 'வீரம்',
  'natpu': 'நட்பு',
  'kalvi': 'கல்வி',
  'mazhai': 'மழை',
  'neethi': 'நீதி',
  'vanakkam': 'வணக்கம்',
  'nandri': 'நன்றி',
  'thamizh': 'தமிழ்',
  'tamil': 'தமிழ்',
};

// English concepts mapped to classical Tamil query keywords & concepts
const ENGLISH_CONCEPT_MAP: Record<string, { tamilTerm: string; conceptId?: string; explanation: string }> = {
  'hospitality': { tamilTerm: 'விருந்தோம்பல்', conceptId: 'c-virunthombal', explanation: 'Ancient Tamil ethics of welcoming and honoring guests' },
  'guest': { tamilTerm: 'விருந்தினர் விருந்தோம்பல்', conceptId: 'c-virunthombal', explanation: 'Guests and hospitality traditions' },
  'virtue': { tamilTerm: 'அறம்', conceptId: 'c-aram', explanation: 'Cosmic order, righteousness, and personal virtue' },
  'righteousness': { tamilTerm: 'அறம் நெறி', conceptId: 'c-aram', explanation: 'Moral duty and integrity' },
  'ethics': { tamilTerm: 'அறநெறி திருக்குறள்', conceptId: 'c-aram', explanation: 'Classical moral philosophy' },
  'universal kinship': { tamilTerm: 'யாதும் ஊரே யாவரும் கேளிர் சமூக உறவு', conceptId: 'c-kelir', explanation: 'Universal brotherhood and cosmopolitan equality' },
  'kinship': { tamilTerm: 'கேளிர் சுற்றம்', conceptId: 'c-kelir', explanation: 'Social bonds and universal kinship' },
  'friendship': { tamilTerm: 'நட்பு கேளிர்', conceptId: 'c-kelir', explanation: 'True companionship and loyalty' },
  'love': { tamilTerm: 'அன்பு அன்புடைமை காதல்', conceptId: 'c-anbu', explanation: 'Universal love and Sangam interior poetry (Agam)' },
  'benevolence': { tamilTerm: 'வேளாண்மை அன்பு உபகாரம்', conceptId: 'c-virunthombal', explanation: 'Selfless assistance and generous aiding of others' },
  'courage': { tamilTerm: 'வீரம் மறம்', conceptId: 'c-veeram', explanation: 'Valour and military chivalry in Purananuru' },
  'valor': { tamilTerm: 'வீரம் மறம்', conceptId: 'c-veeram', explanation: 'Sangam heroic code' },
  'rain': { tamilTerm: 'மழை வான்சிறப்பு பெயல்நீர்', conceptId: 'c-iyalnerigal', explanation: 'Life-giving rain and cosmic fertility' },
  'nature': { tamilTerm: 'இயற்கை திணை நிலம்', conceptId: 'c-iyalnerigal', explanation: 'The 5 landscapes (Ainthinai) of Tamil country' },
  'justice': { tamilTerm: 'செங்கோல் முறைமை அறம்', conceptId: 'c-aram', explanation: 'Unbiased royal justice and ethical governance' },
  'education': { tamilTerm: 'கல்வி அறிவு நுண்மை', explanation: 'Classical Tamil reverence for learning' },
  'learning': { tamilTerm: 'கல்வி கற்றல் கேள்வி', explanation: 'Acquisition of wisdom and oral scholastic traditions' },
  'equality': { tamilTerm: 'பிறப்பொக்கும் எல்லா உயிர்க்கும் சமத்துவம்', explanation: 'Egalitarianism in Thirukkural and Sangam poetry' },
  'tolerance': { tamilTerm: 'பொறை பொறுமை பொதுமை', explanation: 'Endurance and universal forbearance' },
  'poetics': { tamilTerm: 'யாப்பு அணி தொல்காப்பியம்', explanation: 'Classical Tamil prosody and poetics' },
  'palm leaf': { tamilTerm: 'ஓலைச்சுவடி ஏட்டுப்பிரதி', explanation: 'Palm-leaf manuscript heritage' },
  'commentary': { tamilTerm: 'பரிமேலழகர் உரை பழைய உரை', explanation: 'Scholarly glosses and medieval commentaries' },
  'manuscript': { tamilTerm: 'சுவடி ஏட்டுப் பாடம்', explanation: 'Primary manuscript witnesses' },
};

/**
 * Detects whether the input is Tamil Unicode, Tanglish (Romanized Tamil), or English.
 */
export function detectInputLanguage(text: string): 'tamil' | 'tanglish' | 'english' {
  if (!text || !text.trim()) return 'english';

  const clean = text.trim();
  // Check for presence of Tamil Unicode characters (U+0B80 to U+0BFF)
  const tamilCharCount = (clean.match(/[\u0B80-\u0BFF]/g) || []).length;
  if (tamilCharCount > 0 && tamilCharCount / clean.replace(/\s+/g, '').length > 0.3) {
    return 'tamil';
  }

  // Tokenize Latin script words
  const words = clean.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  let tanglishScore = 0;
  let englishScore = 0;

  for (const word of words) {
    if (TANGLISH_EXACT_DICTIONARY[word]) {
      tanglishScore += 3;
      continue;
    }
    if (ENGLISH_CONCEPT_MAP[word]) {
      englishScore += 3;
      continue;
    }
    // Check Tanglish phonetic signatures (zh, rr, ll, nn, th, dh, yaa, oo, ai)
    if (/(zh|ya|oo|ee|aa|ai|th|dh|rr|ll|tt|ng|nj|kur|pur|thir|kural|sang|agam|puram)/.test(word)) {
      tanglishScore += 1;
    }
    // Check common English function words
    if (['the', 'and', 'is', 'in', 'of', 'to', 'what', 'how', 'verse', 'poem', 'meaning', 'about', 'summary', 'explain'].includes(word)) {
      englishScore += 2;
    }
  }

  if (tanglishScore > englishScore) {
    return 'tanglish';
  }
  return 'english';
}

/**
 * Converts a Tanglish word into its phonetic Tamil Unicode equivalent
 */
export function convertTanglishWordToTamil(word: string): string {
  const cleanWord = word.toLowerCase().trim().replace(/[.,;?!]/g, '');
  if (!cleanWord) return '';

  // 1. Direct dictionary match
  if (TANGLISH_EXACT_DICTIONARY[cleanWord]) {
    return TANGLISH_EXACT_DICTIONARY[cleanWord];
  }

  // 2. Rule-based phonetic transliteration
  let result = '';
  let i = 0;
  let isStartOfWord = true;

  while (i < cleanWord.length) {
    // Check multi-character consonants first (e.g. 'zh', 'th', 'dh', 'ng', 'ch', 'sh', 'll', 'rr')
    let matchedConsonant = '';
    let consLen = 0;

    for (const len of [3, 2, 1]) {
      const sub = cleanWord.substring(i, i + len);
      if (CONSONANTS_MAP[sub]) {
        matchedConsonant = CONSONANTS_MAP[sub];
        consLen = len;
        break;
      }
    }

    if (matchedConsonant) {
      i += consLen;
      // Now check following vowel
      let matchedVowel = '';
      let vowelLen = 0;

      for (const vlen of [2, 1]) {
        const vsub = cleanWord.substring(i, i + vlen);
        if (VOWELS_MAP[vsub]) {
          matchedVowel = vsub;
          vowelLen = vlen;
          break;
        }
      }

      if (matchedVowel) {
        // Consonant + Vowel sign
        result += matchedConsonant + VOWELS_MAP[matchedVowel].sign;
        i += vowelLen;
      } else {
        // Pure consonant with pulli (dot)
        result += matchedConsonant + '\u0BCD';
      }
      isStartOfWord = false;
      continue;
    }

    // Check independent vowel at start of word or after syllable
    let matchedVowel = '';
    let vowelLen = 0;

    for (const vlen of [2, 1]) {
      const vsub = cleanWord.substring(i, i + vlen);
      if (VOWELS_MAP[vsub]) {
        matchedVowel = vsub;
        vowelLen = vlen;
        break;
      }
    }

    if (matchedVowel) {
      if (isStartOfWord || !result) {
        result += VOWELS_MAP[matchedVowel].independent;
      } else {
        result += VOWELS_MAP[matchedVowel].sign;
      }
      i += vowelLen;
      isStartOfWord = false;
      continue;
    }

    // Unmapped character
    result += cleanWord[i];
    i++;
    isStartOfWord = false;
  }

  return normalizeTamil(result);
}

/**
 * Transliterates an entire Tanglish phrase or sentence into Tamil
 */
export function convertTanglishToTamil(text: string): string {
  if (!text) return '';
  return text
    .split(/(\s+)/)
    .map(token => {
      if (/^\s+$/.test(token)) return token;
      return convertTanglishWordToTamil(token);
    })
    .join('');
}

export interface SmartInputAnalysis {
  originalText: string;
  detectedLanguage: 'tamil' | 'tanglish' | 'english';
  tamilQuery: string;
  englishQuery: string;
  explanation: string;
  mappedConcept?: string;
  isTanglishOrEnglish: boolean;
}

/**
 * Unified Smart Input Processor:
 * Accepts Tamil, Tanglish, or English.
 * Produces clean normalized Tamil for corpus lookup and clear English for user context.
 */
export function processSmartInput(input: string): SmartInputAnalysis {
  const trimmed = (input || '').trim();
  const detected = detectInputLanguage(trimmed);

  if (detected === 'tamil') {
    const normalized = normalizeTamil(trimmed);
    return {
      originalText: trimmed,
      detectedLanguage: 'tamil',
      tamilQuery: normalized,
      englishQuery: '',
      explanation: 'தமிழ் உரை உள்ளீடு (Direct Tamil Script)',
      isTanglishOrEnglish: false
    };
  }

  if (detected === 'tanglish') {
    const convertedTamil = convertTanglishToTamil(trimmed);
    return {
      originalText: trimmed,
      detectedLanguage: 'tanglish',
      tamilQuery: convertedTamil,
      englishQuery: trimmed,
      explanation: `Tanglish Phonetic Match: "${trimmed}" ➔ "${convertedTamil}"`,
      isTanglishOrEnglish: true
    };
  }

  // English input
  const lower = trimmed.toLowerCase();
  let tamilKeywords: string[] = [];
  let matchedConcept: string | undefined;

  for (const [engKeyword, data] of Object.entries(ENGLISH_CONCEPT_MAP)) {
    if (lower.includes(engKeyword)) {
      tamilKeywords.push(data.tamilTerm);
      if (data.conceptId && !matchedConcept) {
        matchedConcept = data.conceptId;
      }
    }
  }

  // Check if user named a work in English
  if (/purananuru|puram/i.test(lower)) tamilKeywords.push('புறநானூறு');
  if (/thirukkural|tirukkural|kural/i.test(lower)) tamilKeywords.push('திருக்குறள்');
  if (/kurunthogai|kuruntokai/i.test(lower)) tamilKeywords.push('குறுந்தொகை');
  if (/silappathikaram|silambu/i.test(lower)) tamilKeywords.push('சிலப்பதிகாரம்');
  if (/tolkappiyam|tholkappiyam/i.test(lower)) tamilKeywords.push('தொல்காப்பியம்');
  if (/poet|author|pulavar/i.test(lower)) tamilKeywords.push('புலவர்');

  const resolvedTamil = tamilKeywords.length > 0 ? tamilKeywords.join(' ') : convertTanglishToTamil(trimmed);

  return {
    originalText: trimmed,
    detectedLanguage: 'english',
    tamilQuery: resolvedTamil,
    englishQuery: trimmed,
    explanation: tamilKeywords.length > 0 
      ? `English Semantic Mapping: "${trimmed}" ➔ "${resolvedTamil}"`
      : `Phonetic / Keyword Transliteration: "${resolvedTamil}"`,
    mappedConcept: matchedConcept,
    isTanglishOrEnglish: true
  };
}
