import re
import unicodedata
from typing import List, Dict, Any, Tuple

# Tamil Unicode Vowels and Consonants
TAMIL_VOWELS = {
    'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u',
    'ஊ': 'ū', 'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o',
    'ஓ': 'ō', 'ஔ': 'au', 'ஃ': 'ḵ'
}

TAMIL_CONSONANTS = {
    'க்': 'k', 'ங்': 'ṅ', 'ச்': 'c', 'ஞ்': 'ñ', 'ட்': 'ṭ',
    'ண்': 'ṇ', 'த்': 't', 'ந்': 'n', 'ப்': 'p', 'ம்': 'm',
    'ய்': 'y', 'ர்': 'r', 'ல்': 'l', 'வ்': 'v', 'ழ்': 'ḻ',
    'ள்': 'ḷ', 'ற்': 'ṟ', 'ன்': 'ṉ', 'ஜ்': 'j', 'ஷ்': 'ṣ',
    'ஸ்': 's', 'ஹ்': 'h', 'க்ஷ்': 'kṣ'
}

PULLI_CHAR = '\u0BCD' # ்

# Tanglish phonetic mapping table
TANGLISH_REPLACEMENTS = [
    (r'\bvanakkam\b', 'வணக்கம்'),
    (r'\byaathum\b', 'யாதும்'),
    (r'\boore\b', 'ஊரே'),
    (r'\byavarum\b', 'யாவரும்'),
    (r'\bkelir\b', 'கேளிர்'),
    (r'\btheethum\b', 'தீதும்'),
    (r'\bnandrum\b', 'நன்றும்'),
    (r'\bkurunthogai\b', 'குறுந்தொகை'),
    (r'\bpurananuru\b', 'புறநானூறு'),
    (r'\btirukkural\b', 'திருக்குறள்'),
    (r'\bthirukkural\b', 'திருக்குறள்'),
    (r'\btolkappiyam\b', 'தொல்காப்பியம்'),
    (r'\bsilappadikaram\b', 'சிலப்பதிகாரம்'),
    (r'\bmanimekalai\b', 'மணிமேகலை'),
    (r'\bvirunthombal\b', 'விருந்தோம்பல்'),
    (r'\bvirunthombi\b', 'விருந்தோம்பி'),
    (r'\bviruntombi\b', 'விருந்தோம்பி'),
    (r'\bvelanmai\b', 'வேளாண்மை'),
    (r'\birunthombi\b', 'இருந்தோம்பி'),
    (r'\biruntombi\b', 'இருந்தோம்பி'),
    (r'\bilvazhvu\b', 'இல்வாழ்வு'),
    (r'\bsembulam\b', 'செம்புலம்'),
    (r'\bpeyalneer\b', 'பெயல்நீர்'),
    (r'\banbu\b', 'அன்பு'),
    (r'\baram\b', 'அறம்'),
    (r'\bporul\b', 'பொருள்'),
    (r'\binbam\b', 'இன்பம்'),
    (r'\bveedu\b', 'வீடு'),
    (r'\bthinai\b', 'திணை'),
    (r'\bkurinji\b', 'குறிஞ்சி'),
    (r'\bmullai\b', 'முல்லை'),
    (r'\bmarutham\b', 'மருதம்'),
    (r'\bneythal\b', 'நெய்தல்'),
    (r'\bpalai\b', 'பாலை')
]

def normalize_tamil(text: str) -> str:
    """Normalize Tamil text to Unicode NFC and remove formatting artifacts."""
    if not text:
        return ""
    # Unicode NFC normalization
    normalized = unicodedata.normalize('NFC', text)
    # Normalize multiple whitespace characters
    normalized = re.sub(r'[\r\n\t]+', ' ', normalized)
    normalized = re.sub(r'\s{2,}', ' ', normalized)
    return normalized.strip()

def clean_tamil_for_search(text: str) -> str:
    """Strip punctuation and clean string for indexing / matching."""
    if not text:
        return ""
    normalized = normalize_tamil(text)
    # Remove punctuation
    cleaned = re.sub(r'[^\w\s\u0B80-\u0BFF]', ' ', normalized)
    return re.sub(r'\s+', ' ', cleaned).strip().lower()

def transliterate_tamil(text: str) -> str:
    """Convert Classical Tamil script to ISO 15919 romanized representation."""
    if not text:
        return ""
    
    # Common mappings
    t_map = {
        'அ': 'a', 'ஆ': 'ā', 'இ': 'i', 'ஈ': 'ī', 'உ': 'u', 'ஊ': 'ū',
        'எ': 'e', 'ஏ': 'ē', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'ō', 'ஔ': 'au', 'ஃ': 'ḵ',
        'க': 'ka', 'கா': 'kā', 'கி': 'ki', 'கீ': 'kī', 'கு': 'ku', 'கூ': 'kū',
        'கெ': 'ke', 'கே': 'kē', 'கை': 'kai', 'கொ': 'ko', 'கோ': 'kō', 'கௌ': 'kau', 'க்': 'k',
        'ங': 'ṅa', 'ஙா': 'ṅā', 'ஙி': 'ṅi', 'ஙீ': 'ṅī', 'ஙு': 'ṅu', 'ஙூ': 'ṅū',
        'ஙெ': 'ṅe', 'ஙே': 'ṅē', 'ஙை': 'ṅai', 'ஙொ': 'ṅo', 'ஙோ': 'ṅō', 'ஙௌ': 'ṅau', 'ங்': 'ṅ',
        'ச': 'ca', 'சா': 'cā', 'சி': 'ci', 'சீ': 'cī', 'சு': 'cu', 'சூ': 'cū',
        'செ': 'ce', 'சே': 'cē', 'சை': 'cai', 'சொ': 'co', 'சோ': 'cō', 'சௌ': 'cau', 'ச்': 'c',
        'ஞ': 'ña', 'ஞா': 'ñā', 'ஞி': 'ñi', 'ஞீ': 'ñī', 'ஞு': 'ñu', 'ஞூ': 'ñū',
        'ஞெ': 'ñe', 'ஞே': 'ñē', 'ஞை': 'ñai', 'ஞொ': 'ño', 'ஞோ': 'ñō', 'ஞௌ': 'ñau', 'ஞ்': 'ñ',
        'ட': 'ṭa', 'டா': 'ṭā', 'டி': 'ṭi', 'டீ': 'ṭī', 'டு': 'ṭu', 'டூ': 'ṭū',
        'டெ': 'ṭe', 'டே': 'ṭē', 'டை': 'ṭai', 'டொ': 'ṭo', 'டோ': 'ṭō', 'டௌ': 'ṭau', 'ட்': 'ṭ',
        'ண': 'ṇa', 'ணா': 'ṇā', 'ணி': 'ṇi', 'ணீ': 'ṇī', 'ணு': 'ṇu', 'ணூ': 'ṇū',
        'ணெ': 'ṇe', 'ணே': 'ṇē', 'ணை': 'ṇai', 'ணொ': 'ṇo', 'ணோ': 'ṇō', 'ணௌ': 'ṇau', 'ண்': 'ṇ',
        'த': 'ta', 'தா': 'tā', 'தி': 'ti', 'தீ': 'tī', 'து': 'tu', 'தூ': 'tū',
        'தெ': 'te', 'தே': 'tē', 'தை': 'tai', 'தொ': 'to', 'தோ': 'tō', 'தௌ': 'tau', 'த்': 't',
        'ந': 'na', 'நா': 'nā', 'நி': 'ni', 'நீ': 'nī', 'நு': 'nu', 'நூ': 'nū',
        'நெ': 'ne', 'நே': 'nē', 'நை': 'nai', 'நொ': 'no', 'நோ': 'nō', 'நௌ': 'nau', 'ந்': 'n',
        'ப': 'pa', 'பா': 'pā', 'பி': 'pi', 'பீ': 'pī', 'பு': 'pu', 'பூ': 'pū',
        'பெ': 'pe', 'பே': 'pē', 'பை': 'pai', 'பொ': 'po', 'போ': 'pō', 'பௌ': 'pau', 'ப்': 'p',
        'ம': 'ma', 'மா': 'mā', 'மி': 'mi', 'மீ': 'mī', 'மு': 'mu', 'மூ': 'mū',
        'மெ': 'me', 'மே': 'mē', 'மை': 'mai', 'மொ': 'mo', 'மோ': 'mō', 'மௌ': 'mau', 'ம்': 'm',
        'ய': 'ya', 'யா': 'yā', 'யி': 'yi', 'யீ': 'yī', 'யு': 'yu', 'யூ': 'yū',
        'யெ': 'ye', 'யே': 'yē', 'யை': 'yai', 'யொ': 'yo', 'யோ': 'yō', 'யௌ': 'yau', 'ய்': 'y',
        'ர': 'ra', 'ரா': 'rā', 'ரி': 'ri', 'ரீ': 'rī', 'ரு': 'ru', 'ரூ': 'rū',
        'ரெ': 're', 'ரே': 'rē', 'ரை': 'rai', 'ரொ': 'ro', 'ரோ': 'rō', 'ரௌ': 'rau', 'ர்': 'r',
        'ல': 'la', 'லா': 'lā', 'லி': 'li', 'லீ': 'lī', 'லு': 'lu', 'லூ': 'lū',
        'லெ': 'le', 'லே': 'lē', 'லை': 'lai', 'லொ': 'lo', 'லோ': 'lō', 'லௌ': 'lau', 'ல்': 'l',
        'வ': 'va', 'வா': 'vā', 'வி': 'vi', 'வீ': 'vī', 'வு': 'vu', 'வூ': 'vū',
        'வெ': 've', 'வே': 'vē', 'வை': 'vai', 'வொ': 'vo', 'வோ': 'vō', 'வௌ': 'vau', 'வ்': 'v',
        'ழ': 'ḻa', 'ழா': 'ḻā', 'ழி': 'ḻi', 'ழீ': 'ḻī', 'ழு': 'ḻu', 'ழூ': 'ḻū',
        'ழெ': 'ḻe', 'ழே': 'ḻē', 'ழை': 'ḻai', 'ழொ': 'ḻo', 'ழோ': 'ḻō', 'ழௌ': 'ḻau', 'ழ்': 'ḻ',
        'ள': 'ḷa', 'ளா': 'ḷā', 'ளி': 'ḷi', 'ளீ': 'ḷī', 'ளு': 'ḷu', 'ளூ': 'ḷū',
        'ளெ': 'ḷe', 'ளே': 'ḷē', 'ளை': 'ḷai', 'ளொ': 'ḷo', 'ளோ': 'ḷō', 'ளௌ': 'ḷau', 'ள்': 'ḷ',
        'ற': 'ṟa', 'றா': 'ṟā', 'றி': 'ṟi', 'றீ': 'ṟī', 'று': 'ṟu', 'றூ': 'ṟū',
        'றெ': 'ṟe', 'றே': 'ṟē', 'றை': 'ṟai', 'றொ': 'ṟo', 'றோ': 'ṟō', 'றௌ': 'ṟau', 'ற்': 'ṟ',
        'ன': 'ṉa', 'னா': 'ṉā', 'னி': 'ṉi', 'னீ': 'ṉī', 'னு': 'ṉu', 'னூ': 'ṉū',
        'னெ': 'ṉe', 'னே': 'ṉē', 'னை': 'ṉai', 'னொ': 'ṉo', 'னோ': 'ṉō', 'னௌ': 'ṉau', 'ன்': 'ṉ'
    }
    
    # Sort keys by length descending to match composite combinations first
    sorted_keys = sorted(t_map.keys(), key=lambda x: len(x), reverse=True)
    out = text
    for k in sorted_keys:
        out = out.replace(k, t_map[k])
    return out

def split_sandhi_heuristic(compound_word: str) -> List[str]:
    """Break classical Tamil compounds using sandhi dissolution rules."""
    word = compound_word.strip()
    if not word:
        return []
    
    # Common classical sandhi splits
    sandhi_rules = [
        (r'^(இருந்தோம்பி)$', ['இருந்து', 'ஓம்பி']),
        (r'^(இல்வாழ்வதெல்லாம்|இல்வாழ்வ தெல்லாம்)$', ['இல்வாழ்வது', 'எல்லாம்']),
        (r'^(விருந்தோம்பி)$', ['விருந்து', 'ஓம்பி']),
        (r'^(வேளாண்மை)$', ['வேள்', 'ஆண்மை']),
        (r'^(செய்தற்பொருட்டு|செய்தற் பொருட்டு)$', ['செய்தல்', 'பொருட்டு']),
        (r'^(யாதுமCall|யாதும் ஊரே)$', ['யாதும்', 'ஊரே']),
        (r'^(யாவரும் கேளிர்)$', ['யாவரும்', 'கேளிர்']),
        (r'^(தீதும் நன்றும்)$', ['தீதும்', 'நன்றும்']),
        (r'^(பிறர்தர வாரா)$', ['பிறர்', 'தர', 'வாரா']),
        (r'^(செம்புலப் பெயல்நீர்|செம்புலப் பெயனீர்)$', ['செம்புலம்', 'பெயல்நீர்']),
        (r'^(அன்புடை நெஞ்சம்)$', ['அன்புடை', 'நெஞ்சம்']),
        (r'^(தாம்கலந்தனவே|தாம்கலந் தனவே)$', ['தாம்', 'கலந்தனவே'])
    ]
    
    for pattern, split_result in sandhi_rules:
        if re.search(pattern, word):
            return split_result
            
    # Heuristic split on doubled hard consonants (க், ச், த், ப்)
    heuristic = re.sub(r'([கசதப])\1', r'\1 \1', word)
    parts = heuristic.split()
    return parts if len(parts) > 1 else [word]

def convert_tanglish_to_tamil(text: str) -> Tuple[str, bool]:
    """Convert Tanglish query to Tamil script using lexicon patterns."""
    if not text:
        return "", False
    
    converted = text
    was_tanglish = False
    
    for pat, rep in TANGLISH_REPLACEMENTS:
        if re.search(pat, converted, re.IGNORECASE):
            converted = re.sub(pat, rep, converted, flags=re.IGNORECASE)
            was_tanglish = True
            
    return converted, was_tanglish

def calculate_moraic_cadence(tamil_word: str) -> Dict[str, Any]:
    """Calculate Classical Tamil Mora (மாத்திரை) and syllable cadence."""
    word = normalize_tamil(tamil_word)
    mora = 0
    # Long vowels = 2 mora, short vowels / consonants = 1 mora, pulli consonants = 0.5 mora
    for char in word:
        if char in ['ஆ', 'ஈ', 'ஊ', 'ஏ', 'ஐ', 'ஓ', 'ஔ', 'ா', 'ீ', 'ூ', 'ே', 'ை', 'ோ', 'ௌ']:
            mora += 2.0
        elif char == PULLI_CHAR or char == 'ஃ':
            mora += 0.5
        elif '\u0B80' <= char <= '\u0BFF':
            mora += 1.0
            
    meter_type = "நெடில் அசை" if mora > 3.5 else "குறில் அசை"
    return {
        "word": word,
        "transliteration": transliterate_tamil(word),
        "mora_count": round(mora, 1),
        "cadence": meter_type
    }
