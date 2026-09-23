/**
 * Tamil Linguistics Engine for YAAZH AI
 * Handles Unicode normalization, Classical Tamil tokenization,
 * sandhi resolution heuristics, transliteration, and fuzzy matching.
 */

// ISO 15919 Tamil transliteration mapping
const TAMIL_TO_ISO: Record<string, string> = {
  'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū',
  'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au',
  'ஃ': 'ḵ',
  'க': 'ka', 'ங': 'ṅa', 'ச': 'ca', 'ஞ': 'ña', 'ட': 'ṭa', 'ண': 'ṇa',
  'த': 'ta', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra',
  'ல': 'la', 'வ': 'va', 'ழ': 'ḻa', 'ள': 'ḷa', 'ற': 'ṟa', 'ன': 'ṉa',
  'ஜ': 'ja', 'ஷ': 'ṣa', 'ஸ': 'sa', 'ஹ': 'ha', 'க்ஷ': 'kṣa',
};

const VOWEL_SIGNS: Record<string, string> = {
  '\u0BBE': 'ā', // ா
  '\u0BBF': 'i', // ி
  '\u0BC0': 'ī', // ீ
  '\u0BC1': 'u', // ு
  '\u0BC2': 'ū', // ூ
  '\u0BC6': 'e', // ெ
  '\u0BC7': 'ē', // ே
  '\u0BC8': 'ai', // ை
  '\u0BCA': 'o', // ொ
  '\u0BCB': 'ō', // ோ
  '\u0BCC': 'au', // ௌ
  '\u0BCD': '', // புள்ளி (pure consonant)
};

/**
 * Normalizes Tamil text to standard Unicode NFC form,
 * strips invisible artifacts, trims whitespace, and standardizes punctuation.
 */
export function normalizeTamil(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips punctuation and accents for clean search indexing
 */
export function cleanTamilForSearch(text: string): string {
  if (!text) return '';
  return normalizeTamil(text)
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'–—\\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transliterates Tamil text into standard ISO 15919 Latin characters
 */
export function transliterateTamil(text: string): string {
  if (!text) return '';
  const normalized = normalizeTamil(text);
  let result = '';
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];
    const nextChar = normalized[i + 1] || '';

    // Check independent vowels / special
    if (TAMIL_TO_ISO[char] && !VOWEL_SIGNS[nextChar] && nextChar !== '\u0BCD') {
      result += TAMIL_TO_ISO[char];
      i++;
      continue;
    }

    // Consonant + diacritic
    if (TAMIL_TO_ISO[char]) {
      const baseConsonant = TAMIL_TO_ISO[char].replace(/a$/, '');
      if (nextChar === '\u0BCD') {
        // Pure consonant with pulli
        result += baseConsonant;
        i += 2;
        continue;
      } else if (VOWEL_SIGNS[nextChar] !== undefined) {
        // Consonant + dependent vowel sign
        result += baseConsonant + VOWEL_SIGNS[nextChar];
        i += 2;
        continue;
      } else {
        result += TAMIL_TO_ISO[char];
        i++;
        continue;
      }
    }

    result += char;
    i++;
  }

  return result;
}

/**
 * Common classical sandhi splits
 */
const COMMON_CLASSICAL_SPLITS: Record<string, string> = {
  'யாதுமூரே': 'யாதும் ஊரே',
  'யாவருங்கேளிர்': 'யாவரும் கேளிர்',
  'அன்பிலார்': 'அன்பு இலார்',
  'அன்புடையார்': 'அன்பு உடையார்',
  'என்பிலதனை': 'என்பு இலதனை',
  'அன்பிலதனை': 'அன்பு இலதனை',
  'உண்டாலம்seed': 'உண்டால் அம்ம',
  'உண்டாலம்ம': 'உண்டால் அம்ம',
  'விருந்தோம்பல்': 'விருந்து ஓம்பல்',
  'இனியவுளவாக': 'இனிய உளவாக',
  'இன்னாதகூறல்': 'இன்னாத கூறல்',
  'கனியிருப்பக்': 'கனி இருப்ப',
  'காய்கவர்ந்தற்று': 'காய் கவர்ந்தற்று',
  'நிலத்தினும்பேரிதே': 'நிலத்தினும் பெரிதே',
  'வானினுமயர்ந்தன்று': 'வானினும் உயர்ந்தன்று',
  'செம்புலப்பெயனீரார்': 'செம்புலப் பெயல் நீரார்',
  'திங்களைப்போற்றுதும்': 'திங்களைப் போற்றுதும்',
  'ஞாயிறுபோற்றுதும்': 'ஞாயிறு போற்றுதும்',
  'மாமழைபோற்றுதும்': 'மாமழை போற்றுதும்',
};

/**
 * Splits sandhi compounds based on classical Tamil grammar heuristics
 */
export function splitSandhiHeuristic(word: string): string {
  const clean = normalizeTamil(word).replace(/[.,;?!]/g, '');
  if (COMMON_CLASSICAL_SPLITS[clean]) {
    return COMMON_CLASSICAL_SPLITS[clean];
  }
  return clean;
}

/**
 * Computes Levenshtein distance for fuzzy Tamil string comparison
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy similarity score between 0 and 1
 */
export function fuzzySimilarity(a: string, b: string): number {
  const s1 = cleanTamilForSearch(a);
  const s2 = cleanTamilForSearch(b);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  // Substring inclusion check
  if (s1.includes(s2) || s2.includes(s1)) {
    const minLen = Math.min(s1.length, s2.length);
    const maxLen = Math.max(s1.length, s2.length);
    return 0.8 + 0.2 * (minLen / maxLen);
  }

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Extracts candidate tokens from text
 */
export function tokenizeTamil(text: string): string[] {
  const cleaned = cleanTamilForSearch(text);
  return cleaned
    .split(/\s+/)
    .filter(token => token.length > 1);
}
