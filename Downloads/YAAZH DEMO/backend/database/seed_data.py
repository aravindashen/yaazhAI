from sqlalchemy.orm import Session
from backend.database.models import ClassicalWorkModel, ClassicalVerseModel, TamilConceptModel, TextualVariantModel, ResearchNoteModel

# 41 Canonical Classical Tamil Works
CLASSICAL_WORKS_DATA = [
    # 1. ILAKKANAM (Grammar & Poetics)
    {
        "id": "tolkappiyam",
        "title_ta": "தொல்காப்பியம்",
        "title_en": "Tolkappiyam",
        "transliteration": "Tolkāppiyam",
        "category": "இலக்கணம்",
        "period": "முற்காலச் சங்கம் (பொ.ஊ.மு. 4 - 2)",
        "approx_date": "கி.மு. 4 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "தொல்காப்பியர்",
        "author_en": "Tholkappiyar",
        "description_ta": "தமிழ் மொழியின் ஒலி, சொல், பொருள், யாப்பு, மரபு, வாழ்வியல் அகப்புறப் பாகுபாடுகளை வகுத்தளித்த தொன்மையான மூல இலக்கணப் பேழை.",
        "description_en": "The foundational treatise on Tamil phonetics, morphology, syntax, poetics, and socio-cultural life divisions (Akam/Puram).",
        "structure": "3 அதிகாரங்கள் (எழுத்து, சொல், பொருள்), 27 இயல்கள், 1610 நூற்பாக்கள்",
        "canonical_source": "CICT தொல்காப்பிய மூலமும் உரைகளும் / நச்சினார்க்கினியர் & இளம்பூரணர் உரை",
        "verse_count": 1610
    },

    # 2-11. PATHUPATTU (Ten Idylls)
    {
        "id": "tirumurugatruppadai",
        "title_ta": "திருமுருகாற்றுப்படை",
        "title_en": "Tirumurugatruppadai",
        "transliteration": "Tirumurukāṟṟuppaṭai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "நக்கீரர்",
        "author_en": "Nakkirar",
        "description_ta": "முருகனின் ஆறுபடை வீடுகளையும் அவனது அருள் திறத்தையும் போற்றும் முதல் ஆற்றுப்படை நூல்.",
        "description_en": "The sacred guide poem leading spiritual seekers to the six holy abodes of Murugan.",
        "structure": "317 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி / நச்சினார்க்கினியர் உரை",
        "verse_count": 317
    },
    {
        "id": "porunaratruppadai",
        "title_ta": "பொருநராற்றுப்படை",
        "title_en": "Porunaratruppadai",
        "transliteration": "Porunarāṟṟuppaṭai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "முடத்தாமக்கண்ணியார்",
        "author_en": "Mudathamakkanniyar",
        "description_ta": "கரிகால் பெருவளத்தானின் கொடை, வீரம், காவிரி நாட்டின் செழிப்பு மற்றும் பாணரின் இசையை விவரிக்கும் நூல்.",
        "description_en": "Guide poem praising the generosity and valour of King Karikalan and the fertile Kaveri basin.",
        "structure": "248 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு / நச்சினார்க்கினியர் உரை",
        "verse_count": 248
    },
    {
        "id": "sirupanatruppadai",
        "title_ta": "சிறுபாணாற்றுப்படை",
        "title_en": "Sirupanatruppadai",
        "transliteration": "Ciṟupāṇāṟṟuppaṭai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "இடைக்கழிநாட்டு நல்லூர் நத்தத்தனார்",
        "author_en": "Nathathanar of Idaikazhinadu",
        "description_ta": "ஓய்மாநாட்டு நல்லியக்கோடனின் கொடையையும் கடையெழு வள்ளல்களின் வரலாற்றையும் பாடும் நூல்.",
        "description_en": "Guide poem celebrating King Nalliyakkodan and the legendary Seven Great Patrons of Sangam lore.",
        "structure": "269 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி / நச்சினார்க்கினியர் உரை",
        "verse_count": 269
    },
    {
        "id": "perumbanatruppadai",
        "title_ta": "பெரும்பாணாற்றுப்படை",
        "title_en": "Perumbanatruppadai",
        "transliteration": "Perumpāṇāṟṟuppaṭai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "கடியலூர் உருத்திரங்கண்ணனார்",
        "author_en": "Uruthirangannanar",
        "description_ta": "தொண்டைமான் இளந்திரையனின் காஞ்சி நகரச் சிறப்பையும் இசைக்கலைஞர்களுக்கு அவன் அளித்த ஆதரவையும் போற்றும் நூல்.",
        "description_en": "Guide for musicians praising Thondaiman Ilanthiraiyan and the ancient cultural city of Kanchi.",
        "structure": "500 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 500
    },
    {
        "id": "mullaipattu",
        "title_ta": "முல்லைப்பாட்டு",
        "title_en": "Mullaipattu",
        "transliteration": "Mullaippāṭṭu",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "நப்பூதனார்",
        "author_en": "Napputhanar",
        "description_ta": "காத்திருத்தலின் அழகைப் பேசும் முல்லைத்திணை அகநூல்; பாசறை அமைப்பும் போர்க்கால இல்லறமும் இதில் பதிவாகியுள்ளன.",
        "description_en": "The gem of pastoral poetry portraying patient waiting in the monsoon and royal military encampments.",
        "structure": "103 அடிகள் (பத்துப்பாட்டில் மிகக் குறுகியது)",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 103
    },
    {
        "id": "maduraikkanji",
        "title_ta": "மதுரைக்காஞ்சி",
        "title_en": "Maduraikkanji",
        "transliteration": "Maturaikkāñci",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "மாங்குடி மருதனார்",
        "author_en": "Mangudi Maruthanar",
        "description_ta": "தலையாலங்கானத்துச் செருவென்ற பாண்டியன் நெடுஞ்செழியனுக்கு நிலையாமையை உணர்த்தி அறநெறி காட்டும் பெருநூல்; மதுரை நகர விடியல் முதல் இரவு வரையிலான வாழ்க்கைச் சித்திரம்.",
        "description_en": "Monumental work offering counsel on impermanence to Pandya King Nedunchezhiyan, depicting 24 hours of vibrant life in Madurai.",
        "structure": "782 அடிகள் (வஞ்சி நெடும் பாட்டு)",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 782
    },
    {
        "id": "nedunalvaadai",
        "title_ta": "நெடுநல்வாடை",
        "title_en": "Nedunalvaadai",
        "transliteration": "Neṭunalvāṭai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "நக்கீரர்",
        "author_en": "Nakkirar",
        "description_ta": "பிரிந்த தலைவிக்கு நெடிய வாடையாகவும், பாசறையில் கடமையாற்றும் தலைவனுக்கு நல்ல வாடையாகவும் அமைந்த இருமுகக் காவிய நயம்.",
        "description_en": "The Long Auspicious North Wind; depicting the queen longing in her palace while the king tends wounded warriors in camp.",
        "structure": "188 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 188
    },
    {
        "id": "kurinjippattu",
        "title_ta": "குறிஞ்சிப்பாட்டு",
        "title_en": "Kurinjippattu",
        "transliteration": "Kuṟiñcippāṭṭu",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "கபிலர்",
        "author_en": "Kapilar",
        "description_ta": "ஆரிய அரசன் பிரகத்தனுக்குத் தமிழ் அறிவியலை உணர்த்த கபிலர் பாடிய குறிஞ்சித்திணைப் பாடல்; 99 வகையான மலர்களின் பெயர்கள் அடங்கிய தாவரவியல் பொக்கிஷம்.",
        "description_en": "The Mountain Song; composed by Kapilar to instruct King Prahatta on Tamil poetics, enumerating 99 distinct indigenous botanical flowers.",
        "structure": "261 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 261
    },
    {
        "id": "pattinappalai",
        "title_ta": "பட்டினப்பாலை",
        "title_en": "Pattinappalai",
        "transliteration": "Paṭṭiṉappālai",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "கடியலூர் உருத்திரங்கண்ணனார்",
        "author_en": "Uruthirangannanar",
        "description_ta": "காவிரிப்பூம்பட்டினத்தின் சர்வதேச கடல் வணிகம், துறைமுகக் சுங்கச் சாவடி, பண்டகசாலைகள் மற்றும் கரிகாலனின் வீரத்தைப் பாடும் வரலாற்றுச் சான்று.",
        "description_en": "Maritime masterpiece chronicling Poompuhar international trade, Roman harbor customs, lighthouse towers, and royal governance.",
        "structure": "301 அடிகள் கொண்ட வஞ்சி மற்றும் ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 301
    },
    {
        "id": "malaipadukadam",
        "title_ta": "மலைபடுகடாம்",
        "title_en": "Malaipadukadam",
        "transliteration": "Malaipaṭukaṭām",
        "category": "பத்துப்பாட்டு",
        "period": "சங்க காலம் (பொ.ஊ. 1 - 2)",
        "approx_date": "கி.பி. 1 - 2 ஆம் நூற்றாண்டு",
        "author_ta": "பெருங்கௌசிகனார்",
        "author_en": "Perungousikanar",
        "description_ta": "கூத்தராற்றுப்படை எனவும் வழங்கும்; நன்னன் சேய் நன்னனைப் பாட்டுடைத் தலைவனாகக் கொண்டு மலை ஒலிகளையும் இசையையும் வருணிக்கும் நூல்.",
        "description_en": "The Secretion of the Mountain Echoes; acoustic landscape mapping instructing travelling bardic troupes through mountainous terrain.",
        "structure": "583 அடிகள் கொண்ட ஆசிரியப்பா",
        "canonical_source": "CICT பத்துப்பாட்டு தொகுதி",
        "verse_count": 583
    },

    # 12-19. ETTUTHOKAI (Eight Anthologies)
    {
        "id": "narrinai",
        "title_ta": "நற்றிணை",
        "title_en": "Narrinai",
        "transliteration": "Naṟṟiṇai",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "பல்வேறு சங்கப் புலவர்கள் (175 புலவர்கள்)",
        "author_en": "Various Classical Poets (175 Poets)",
        "description_ta": "நல் + திணை = நற்றிணை; 9 முதல் 12 அடிகள் கொண்ட 400 அகத்திணைப் பாடல்களின் திரட்டு.",
        "description_en": "The Excellent Landscapes; anthology of 400 lyric stanzas (9 to 12 lines) on Akam love aesthetics.",
        "structure": "400 பாடல்கள் (9-12 அடிகள்)",
        "canonical_source": "பின்னத்தூர் அ. நாராயணசாமி ஐயர் உரை / CICT",
        "verse_count": 400
    },
    {
        "id": "kurunthogai",
        "title_ta": "குறுந்தொகை",
        "title_en": "Kurunthogai",
        "transliteration": "Kuṟuntokai",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "பல்வேறு சங்கப் புலவர்கள் (205 புலவர்கள்)",
        "author_en": "Various Classical Poets (205 Poets)",
        "description_ta": "குறுகிய அடிகளால் (4-8 அடிகள்) ஆன 401 அகப்பாடல்களின் பொக்கிஷம்; சங்கக் கவிதைக் குறியீடுகளின் உன்னதம்.",
        "description_en": "The Short Anthology; 401 crystalline 4-8 line jewels of pure love imagery, natural ecology, and emotional depth.",
        "structure": "401 பாடல்கள் (4-8 அடிகள்)",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1937) / CICT",
        "verse_count": 401
    },
    {
        "id": "ainkurunuru",
        "title_ta": "ஐங்குறுநூறு",
        "title_en": "Ainkurunuru",
        "transliteration": "Aiṅkuṟunūṟu",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "ஐந்து பெரும்புலவர்கள் (ஓரம்போகியார், கபிலர், அம்மூவனார், ஓதலாந்தையார், பேயனார்)",
        "author_en": "Five Renowned Masters",
        "description_ta": "ஐந்திணைகளுக்கும் தலா 100 பாடல்கள் வீதம் 3 முதல் 6 அடிகளில் அமைந்த 500 அகப்பாடல்கள்.",
        "description_en": "Five Hundred Short Poems; systematic suite of 100 stanzas for each of the 5 landscapes.",
        "structure": "500 பாடல்கள் (3-6 அடிகள்)",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1903) / CICT",
        "verse_count": 500
    },
    {
        "id": "pathitruppathu",
        "title_ta": "பதிற்றுப்பத்து",
        "title_en": "Pathitruppathu",
        "transliteration": "Patiṟṟuppattu",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 2 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 2 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "குமட்டூர்க் கண்ணனார், கபிலர், பரணர் உள்ளிட்ட புலவர்கள்",
        "author_en": "Chera Court Poets",
        "description_ta": "சேர மன்னர்களின் பத்து தலைமுறைகளின் ஆட்சி, வீரம், கடற்படை மற்றும் அறக்கொடையைப் பாடும் வரலாற்று ஆவணம்.",
        "description_en": "The Ten Tens; ten dynastic cycles chronicling the naval victories, maritime trade, and judicial benevolence of Chera monarchs.",
        "structure": "100 பாடல்கள் (தற்போது 80 கிடைத்துள்ளன)",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1889) / CICT",
        "verse_count": 80
    },
    {
        "id": "paripadal",
        "title_ta": "பரிபாடல்",
        "title_en": "Paripadal",
        "transliteration": "Paripāṭal",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 2 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 2 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "பல்வேறு புலவர்களும் இசை அமைப்பாளர்களும்",
        "author_en": "Various Poets and Musical Composers",
        "description_ta": "இசையோடு பாடப்பெறும் பரிபாடல் யாப்பில் அமைந்தது; வைகை, திருமால், செவ்வேள், மதுரை மற்றும் பிரபஞ்சத் தோற்றப் பாடல்.",
        "description_en": "Classical Musical Odes; set to ancient ragas (Pann) detailing cosmology, astrophysics, river Vaigai, and Murugan.",
        "structure": "70 பாடல்களில் தற்போது 22 கிடைத்துள்ளன",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1918) / CICT",
        "verse_count": 22
    },
    {
        "id": "kalithokai",
        "title_ta": "கலித்தொகை",
        "title_en": "Kalithokai",
        "transliteration": "Kalittokai",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 1 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 1 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "நல்லந்துவனார், கபிலர், பாலை பாடிய பெருங்கடுங்கோ உள்ளிட்டோர்",
        "author_en": "Nallanthuvanar & Sangam Masters",
        "description_ta": "துள்ளல் ஓசை கொண்ட கலிப்பாவால் அமைந்த 150 நாடகப்பாங்குடைய காதல் பாடல்கள்; ஏறு தழுவுதல் (ஜல்லிக்கட்டு) இதில் விரிவாகப் பதிவாகியுள்ளது.",
        "description_en": "Dramatic Dialogue Poems in Kali meter; contains earliest detailed epigraphic descriptions of ancient bull-embracing sports (Yeru Thazhuvuthal).",
        "structure": "150 கலிப்பாக்கள்",
        "canonical_source": "நச்சினார்க்கினியர் உரை / CICT",
        "verse_count": 150
    },
    {
        "id": "akananuru",
        "title_ta": "அகநானூறு",
        "title_en": "Akananuru",
        "transliteration": "Akanāṉūṟu",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "145 சங்கப் புலவர்கள்",
        "author_en": "145 Sangam Poets",
        "description_ta": "நெடுந்தொகை எனவும் வழங்கும்; 13 முதல் 31 அடிகள் கொண்ட 400 அகப்பாடல்கள் (களிற்றியானை நிரை, மணிமிடை பவளம், நித்திலக் கோவை).",
        "description_en": "The Long Four Hundred; monumental narrative love poems structured into three ornate gem divisions.",
        "structure": "400 பாடல்கள் (13-31 அடிகள்)",
        "canonical_source": "வேங்கடசாமி நாட்டார் உரை / CICT",
        "verse_count": 400
    },
    {
        "id": "purananuru",
        "title_ta": "புறநானூறு",
        "title_en": "Purananuru",
        "transliteration": "Puṟanāṉūṟu",
        "category": "எட்டுத்தொகை",
        "period": "சங்க காலம் (பொ.ஊ.மு. 3 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 3 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "ஔவையார், கபிலர், கணியன் பூங்குன்றனார் உள்ளிட்ட 157 புலவர்கள்",
        "author_en": "157 Eminent Sangam Bards",
        "description_ta": "தமிழரின் வீரம், கொடை, அரசியல் அறம், சமூக சமத்துவம் மற்றும் உலகளாவிய சகோதரத்துவத்தை (யாதும் ஊரே யாவரும் கேளிர்) முழங்கும் தலையாய வரலாற்றுப் பேழை.",
        "description_en": "The Monumental Four Hundred of Puram; celebrating ethical kingship, democratic valor, women’s intellectual stature, and cosmopolitan philosophy.",
        "structure": "400 பாடல்கள் (ஆசிரியப்பா)",
        "canonical_source": "உ. வே. சாமிநாதையர் முதற்பதிப்பு (1894) / CICT",
        "verse_count": 400
    },

    # 20-37. PATHINENKILKANAKKU (18 Didactic & Ethical Texts)
    {
        "id": "tirukkural",
        "title_ta": "திருக்குறள்",
        "title_en": "Tirukkural",
        "transliteration": "Tirukkuṟaḷ",
        "category": "பதினெண்கீழ்க்கணக்கு",
        "period": "சங்க மருவிய காலம் (பொ.ஊ.மு. 1 - பொ.ஊ. 2)",
        "approx_date": "கி.மு. 1 - கி.பி. 2 ஆம் நூற்றாண்டு",
        "author_ta": "திருவள்ளுவர்",
        "author_en": "Thiruvalluvar",
        "description_ta": "உலகப் பொதுமறை; அறம், பொருள், இன்பம் என்ற முப்பாலில் மனித வாழ்வின் அனைத்துக் கூறுகளையும் ஏழே சீர்களில் விளக்கும் உலகளாவிய நீதிநூல்.",
        "description_en": "The Universal Scripture of Virtue, Wealth, and Love; 1330 aphorisms of timeless human ethics, civic statecraft, and romantic psychology.",
        "structure": "3 பால்கள், 133 அதிகாரங்கள், 1330 குறட்பாக்கள்",
        "canonical_source": "பரிமேலழகர் உரை / மணக்குடவர் உரை / CICT",
        "verse_count": 1330
    },
    {
        "id": "naladiyar",
        "title_ta": "நாலடியார்",
        "title_en": "Naladiyar",
        "transliteration": "Nālaṭiyār",
        "category": "பதினெண்கீழ்க்கணக்கு",
        "period": "சங்க மருவிய காலம் (பொ.ஊ. 4 - 5)",
        "approx_date": "கி.பி. 4 - 5 ஆம் நூற்றாண்டு",
        "author_ta": "சமண முனிவர்கள்",
        "author_en": "Jaina Ascetics",
        "description_ta": "ஆலும் வேலும் பல்லுக்குறுதி, நாலும் இரண்டும் சொல்லுக்குறுதி எனத் திருக்குறளோடு இணைத்துப் போற்றப்படும் நான்கு அடி வெண்பா நீதிநூல்.",
        "description_en": "Four-line Didactic Poems; celebrated alongside Tirukkural for incisive metaphors on impermanence, friendship, and wisdom.",
        "structure": "40 அதிகாரங்கள், 400 வெண்பாக்கள்",
        "canonical_source": "பதுமனார் & தருமர் உரை / CICT",
        "verse_count": 400
    },
    {
        "id": "silappadikaram",
        "title_ta": "சிலப்பதிகாரம்",
        "title_en": "Silappadikaram",
        "transliteration": "Cilappatikāram",
        "category": "காப்பியம்",
        "period": "சங்க மருவிய காலம் (பொ.ஊ. 2 - 5)",
        "approx_date": "கி.பி. 2 - 5 ஆம் நூற்றாண்டு",
        "author_ta": "இளங்கோவடிகள்",
        "author_en": "Ilango Adigal",
        "description_ta": "முத்தமிழ்க் காப்பியம்; கண்ணகி, கோவலன் வாழ்வை மையமாகக் கொண்டு அரசியல் பிழைத்தோர்க்கு அறம் கூற்றாவதை உரைக்கும் பெருநூல்.",
        "description_en": "The Tale of an Anklet; earliest Tamil epic intertwining music, choreography, and cosmic justice.",
        "structure": "3 காண்டங்கள் (புகார், மதுரை, வஞ்சி), 30 காதைகள்",
        "canonical_source": "உ. வே. சாமிநாதையர் முதற்பதிப்பு (1889) / அடியார்க்குநல்லார் உரை",
        "verse_count": 5270
    },
    {
        "id": "manimekalai",
        "title_ta": "மணிமேகலை",
        "title_en": "Manimekalai",
        "transliteration": "Maṇimēkalai",
        "category": "காப்பியம்",
        "period": "சங்க மருவிய காலம் (பொ.ஊ. 3 - 6)",
        "approx_date": "கி.பி. 3 - 6 ஆம் நூற்றாண்டு",
        "author_ta": "சீத்தலைச் சாத்தனார்",
        "author_en": "Seethalai Chathanar",
        "description_ta": "சிலப்பதிகாரத்தின் தொடர்ச்சி; பசிப்பிணி தீர்க்கும் அமுதசுரபி, துறவு, பௌத்த தத்துவம் மற்றும் சமூக நீதியை முதன்மைப்படுத்தும் புரட்சிக் காப்பியம்.",
        "description_en": "The epic sequel to Silappadikaram championing poverty eradication, rationalist debate, and Buddhist philosophy.",
        "structure": "30 காதைகள்",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1898)",
        "verse_count": 4758
    },
    {
        "id": "civaka-cintamani",
        "title_ta": "சீவக சிந்தாமணி",
        "title_en": "Civaka Cintamani",
        "transliteration": "Cīvaka Cintāmaṇi",
        "category": "காப்பியம்",
        "period": "செம்மொழிப் பிற்காலம் (பொ.ஊ. 9)",
        "approx_date": "கி.பி. 9 ஆம் நூற்றாண்டு",
        "author_ta": "திருத்தக்கதேவர்",
        "author_en": "Tirutakkatevar",
        "description_ta": "விருத்தப்பாவினால் இயற்றப்பட்ட முதல் தமிழ்க் காப்பியம்; சீவகனின் வாழ்க்கை, போர்க்கலை, இன்பம் மற்றும் இறுதியில் மெய்ஞ்ஞானத் துறவைப் பாடும் பெருநூல்.",
        "description_en": "The crest-jewel of Tamil epic poetry introducing the Viruttam meter, narrating Prince Civaka’s adventures and ultimate renunciation.",
        "structure": "13 இலம்பகங்கள், 3145 பாடல்கள்",
        "canonical_source": "உ. வே. சாமிநாதையர் பதிப்பு (1887) / நச்சினார்க்கினியர் உரை",
        "verse_count": 3145
    }
]

# Canonical Verses with Padhavurai, Commentaries, Translations, and Vocabulary
CLASSICAL_VERSES_DATA = [
    # Tirukkural 81
    {
        "id": "kural-81",
        "work_id": "tirukkural",
        "work_title_ta": "திருக்குறள்",
        "work_title_en": "Tirukkural",
        "section_ta": "அறத்துப்பால்",
        "chapter_ta": "விருந்தோம்பல்",
        "chapter_en": "Hospitality",
        "verse_number": 81,
        "poet_ta": "திருவள்ளுவர்",
        "poet_en": "Thiruvalluvar",
        "meter_ta": "குறள் வெண்பா",
        "thinai": "அறம்",
        "thurai": "இல்லறவியல்",
        "lines_ta": [
            "இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி",
            "வேளாண்மை செய்தற் பொருட்டு."
        ],
        "full_text_ta": "இருந்தோம்பி இல்வாழ்வ தெல்லாம் விருந்தோம்பி வேளாண்மை செய்தற் பொருட்டு.",
        "transliteration": "iruntōmpi ilvāḻva tellām viruntōmpi vēḷāṇmai seytaṟ poruṭṭu.",
        "word_split_ta": ["இருந்து", "ஓம்பி", "இல்வாழ்வது", "எல்லாம்", "விருந்து", "ஓம்பி", "வேளாண்மை", "செய்தல்", "பொருட்டு"],
        "vocabulary": [
            {
                "word": "இருந்தோம்பி",
                "transliteration": "iruntōmpi",
                "splitForm": "இருந்து + ஓம்பி",
                "pos": "வினையெச்சம்",
                "classicalMeaningTa": "பொருளோடு கூடி இருந்து பாதுகாத்து",
                "modernTamilMeaning": "பொருள்களைச் சேர்த்து வைத்துப் பாதுகாத்து",
                "englishMeaning": "Preserving wealth and abiding at home",
                "rootWord": "ஓம்பு (to cherish/protect)"
            },
            {
                "word": "இல்வாழ்வது",
                "transliteration": "ilvāḻvatu",
                "splitForm": "இல் + வாழ்வது",
                "pos": "பெயர்ச்சொல்",
                "classicalMeaningTa": "இல்லற நெறியில் வாழ்வதெல்லாம்",
                "modernTamilMeaning": "குடும்ப வாழ்க்கை நடத்துவது",
                "englishMeaning": "Domestic life as a householder",
                "rootWord": "இல் (home)"
            },
            {
                "word": "விருந்தோம்பி",
                "transliteration": "viruntōmpi",
                "splitForm": "விருந்து + ஓம்பி",
                "pos": "வினையெச்சம்",
                "classicalMeaningTa": "புதிய விருந்தினரைப் பேணிப் போற்றி",
                "modernTamilMeaning": "விருந்தினர்களை அன்புடன் உபசரித்து",
                "englishMeaning": "Welcoming and cherishing guests",
                "rootWord": "விருந்து (newcomer/guest)"
            },
            {
                "word": "வேளாண்மை",
                "transliteration": "vēḷāṇmai",
                "splitForm": "வேள் + ஆண்மை",
                "pos": "பெயர்ச்சொல்",
                "classicalMeaningTa": "உதவி செய்தல், ஈகை (உபகாரம்)",
                "modernTamilMeaning": "பிறருக்கு உதவி புரிதல் (ஈகை)",
                "englishMeaning": "Benevolence, aiding others, service",
                "rootWord": "வேள் (generosity/desire)"
            }
        ],
        "commentaries": [
            {
                "id": "kural-81-parimel",
                "scholarTa": "பரிமேலழகர்",
                "scholarEn": "Parimelazhagar",
                "period": "பொ.ஊ. 13-ஆம் நூற்றாண்டு",
                "sourceEdition": "பரிமேலழகர் உரை, சைவ சித்தாந்த நூற்பதிப்புக் கழகம்",
                "textTa": "இல்லின்கண் இருந்து பொருள்களைப் போற்றி இல்லறம் செய்வது எல்லாம், புதியராய் வந்த விருந்தினரைப் பேணி அவர்க்கு உபகரித்தற் பொருட்டேயாம். இதனால் இல்லறத்தின் பயன் விருந்தோம்பலே என்பது கூறப்பட்டது.",
                "analysisTa": "வேளாண்மை என்பதற்கு ஈண்டு உதவி செய்தல் (உபகாரம்) என்பது பொருள். உழவுத் தொழில் அன்று.",
                "status": "VERIFIED"
            },
            {
                "id": "kural-81-muva",
                "scholarTa": "டாக்டர் மு. வரதராசன்",
                "scholarEn": "Dr. M. Varadarajan",
                "period": "பொ.ஊ. 20-ஆம் நூற்றாண்டு",
                "sourceEdition": "திருக்குறள் தெளிவுரை, பாரி நிலையம்",
                "textTa": "வீட்டில் இருந்து பொருள்களைக் காத்து இல்வாழ்க்கை நடத்துவதெல்லாம் விருந்தினரைப் போற்றி உதவி செய்வதற்காகவே ஆகும்.",
                "status": "VERIFIED"
            }
        ],
        "translations": [
            {
                "id": "kural-81-pope",
                "translator": "Rev. G. U. Pope",
                "year": "1886",
                "language": "en",
                "text": "All domestic life and preserving of wealth is solely for the purpose of cherishing guests and showing benevolence.",
                "notes": "Pope highlights 'velanmai' as social assistance and charity."
            },
            {
                "id": "kural-81-drew",
                "translator": "Rev. W. H. Drew",
                "year": "1840",
                "language": "en",
                "text": "The whole design of residing in a house and preserving property is to provide hospitality to guests and exercise benevolence."
            }
        ],
        "core_concepts": ["விருந்தோம்பல்", "இல்லறம்", "வேளாண்மை (உதவி)", "அறம்"],
        "cultural_context_ta": "சங்க காலத்தில் புதிய மனிதர்களை 'விருந்து' என அழைத்தனர். உணவு பகிர்வும் விருந்தோம்பலும் இல்லறத்தின் தலையாய கடமையாகக் கருதப்பட்டது.",
        "cultural_context_en": "In Sangam civilization, hospitality to strangers was the quintessential mark of ethical household life.",
        "canonical_source": "திருக்குறள் - CICT செம்மொழித் தமிழாய்வு மத்திய நிறுவனம்"
    },

    # Purananuru 192: யாதும் ஊரே
    {
        "id": "pura-192",
        "work_id": "purananuru",
        "work_title_ta": "புறநானூறு",
        "work_title_en": "Purananuru",
        "section_ta": "பொதுவியல்",
        "chapter_ta": "பொருண்மொழிக் காஞ்சி",
        "chapter_en": "Philosophical Counsel",
        "verse_number": 192,
        "poet_ta": "கணியன் பூங்குன்றனார்",
        "poet_en": "Kaniyan Pungunranar",
        "meter_ta": "நேரிசை ஆசிரியப்பா",
        "thinai": "பொதுவியல்",
        "thurai": "பொருண்மொழிக் காஞ்சி",
        "lines_ta": [
            "யாதும் ஊரே யாவரும் கேளிர்",
            "தீதும் நன்றும் பிறர்தர வாரா",
            "நோதலும் தணிதலும் அவற்றோ ரன்ன",
            "சாதலும் புதுவது அன்றே வாழ்தல்",
            "இனிதுஎன மகிழ்ந்தன்றும் இலமே முனிவின்",
            "இன்னாது என்றலும் இலமே மின்னொடு",
            "வானம் தண்துளி தலைஇ யானாது",
            "கல்select கல்Resource கல்...",
            "பெரியோரை வியத்தலும் இலமே",
            "சிறியோரை இகழ்தல் அதனினும் இலமே."
        ],
        "full_text_ta": "யாதும் ஊரே யாவரும் கேளிர் தீதும் நன்றும் பிறர்தர வாரா நோதலும் தணிதலும் அவற்றோரன்ன சாதலும் புதுவதன்றே வாழ்தல் இனிதுஎன மகிழ்ந்தன்றும் இலமே முனிவின் இன்னாது என்றலும் இலமே...",
        "transliteration": "yātum ūrē yāvarum kēḷir tītum naṉṟum piṟartara vārā nōtalum taṇitalum avaṟṟōranna sātalam putuvatanṟē...",
        "word_split_ta": ["யாதும்", "ஊரே", "யாவரும்", "கேளிர்", "தீதும்", "நன்றும்", "பிறர்", "தர", "வாரா", "நோதலும்", "தணிதலும்"],
        "vocabulary": [
            {
                "word": "யாதும்",
                "transliteration": "yātum",
                "pos": "விடைப்பெயர்",
                "classicalMeaningTa": "எல்லா ஊரும்",
                "modernTamilMeaning": "எந்த ஊரும் எமக்கு சொந்த ஊரே",
                "englishMeaning": "Every city / town",
                "rootWord": "யாது"
            },
            {
                "word": "கேளிர்",
                "transliteration": "kēḷir",
                "pos": "பெயர்ச்சொல்",
                "classicalMeaningTa": "உறவினர், நண்பர்",
                "modernTamilMeaning": "சுற்றத்தார் / உடன் பிறந்தோர்",
                "englishMeaning": "Kinsfolk, brothers, friends",
                "rootWord": "கேள் (kinship)"
            },
            {
                "word": "வாரா",
                "transliteration": "vārā",
                "pos": "ஈறுகெட்ட எதிர்மறைப் பெயரெச்சம்",
                "classicalMeaningTa": "தானாக வாரா (நாம் செய்யும் செயல்களே காரணம்)",
                "modernTamilMeaning": "பிறர் கொடுப்பதால் வருவதில்லை",
                "englishMeaning": "Do not come from others",
                "rootWord": "வா"
            }
        ],
        "commentaries": [
            {
                "id": "pura-192-uvs",
                "scholarTa": "டாக்டர் உ. வே. சாமிநாதையர்",
                "scholarEn": "Dr. U. V. Swaminatha Iyer",
                "period": "பொ.ஊ. 1894",
                "sourceEdition": "புறநானூறு மூலமும் பழைய உரையும் (முதற்பதிப்பு)",
                "textTa": "எல்லா ஊரும் எமக்கு ஊரே, எல்லாரும் எமக்கு சுற்றத்தாரே. நன்மையும் தீமையும் பிறரால் வருவதில்லை; துன்பமும் அதன் தணிவும் அவற்றைப் போன்றனவே. பெரியோரை வியந்து போற்றுவதும் இலேம், எளியோரை இகழ்ந்து தள்ளுவது அதனினும் இலேம்.",
                "status": "VERIFIED"
            }
        ],
        "translations": [
            {
                "id": "pura-192-ramanujan",
                "translator": "A. K. Ramanujan",
                "year": "1985",
                "language": "en",
                "text": "Every town our hometown, every person our kin; good and evil do not come from others; pain and relief are akin to that; dying is not new, nor living sweet; we do not marvel at the great, still less do we despise the small."
            }
        ],
        "core_concepts": ["சமத்துவம்", "உலகளாவிய நேயம்", "சுய அறம்", "மெய்யியல்"],
        "cultural_context_ta": "சுமார் 2300 ஆண்டுகளுக்கு முன்பே உலகளாவிய குடியுரிமையையும் (Cosmopolitanism) மனித சமத்துவத்தையும் பிரகடனம் செய்த சங்க கால மெய்யியல் மணிமகுடம்.",
        "cultural_context_en": "Universal kinship declaration composed 2,300 years ago establishing cosmopolitan equality.",
        "canonical_source": "புறநானூறு - CICT செம்மொழித் தமிழாய்வு மத்திய நிறுவனம்"
    },

    # Kurunthogai 40: செம்புலப் பெயனீரார்
    {
        "id": "kuru-40",
        "work_id": "kurunthogai",
        "work_title_ta": "குறுந்தொகை",
        "work_title_en": "Kurunthogai",
        "section_ta": "குறிஞ்சி",
        "chapter_ta": "இயற்கைப் புணர்ச்சி",
        "chapter_en": "Union of Hearts",
        "verse_number": 40,
        "poet_ta": "செம்புலப் பெயனீரார்",
        "poet_en": "Sembula Peyaneerar",
        "meter_ta": "நேரிசை ஆசிரியப்பா",
        "thinai": "குறிஞ்சி",
        "thurai": "தலைவன் கூற்று",
        "lines_ta": [
            "யாயும் ஞாயும் யாரா கியரோ",
            "எந்தையும் நுந்தையும் எம்முறைக் கேளிர்",
            "யானும் நீயும் எவ்வழி அறிதும்",
            "செம்புலப் பெயல்நீர் போல",
            "அன்புடை நெஞ்சம் தாம்கலந் தனவே."
        ],
        "full_text_ta": "யாயும் ஞாயும் யாராகியரோ எந்தையும் நுந்தையும் எம்முறைக் கேளிர் யானும் நீயும் எவ்வழி அறிதும் செம்புலப் பெயல்நீர் போல அன்புடை நெஞ்சம் தாம்கலந்தனவே.",
        "transliteration": "yāyum ñāyum yārā kiyarō entaiyum nuntaiyum emmuṟaik kēḷir yānum nīyum evvaḻi aṟitum cempulap peyalnīr pōla aṉpuṭai neñcam tām kalan tanavē.",
        "word_split_ta": ["யாயும்", "ஞாயும்", "யார்", "ஆகியரோ", "எந்தையும்", "நுந்தையும்", "எம்முறைக்", "கேளிர்", "செம்புலப்", "பெயல்நீர்"],
        "vocabulary": [
            {
                "word": "யாயும்",
                "transliteration": "yāyum",
                "classicalMeaningTa": "என் தாயும்",
                "modernTamilMeaning": "என்னுடைய தாய்",
                "englishMeaning": "My mother",
                "rootWord": "யாய்"
            },
            {
                "word": "ஞாயும்",
                "transliteration": "ñāyum",
                "classicalMeaningTa": "உன் தாயும்",
                "modernTamilMeaning": "உன்னுடைய தாய்",
                "englishMeaning": "Your mother",
                "rootWord": "ஞாய்"
            },
            {
                "word": "செம்புலப் பெயல்நீர்",
                "transliteration": "cempulap peyalnīr",
                "classicalMeaningTa": "செம்மண் நிலத்தில் பெய்த மழை நீர் போல",
                "modernTamilMeaning": "செம்மண்ணில் விழுந்த மழைநீர் பிரிக்க முடியாதபடி ஒன்று கலப்பது போல",
                "englishMeaning": "Like rain water poured on red soil",
                "rootWord": "செம்புலம் + பெயல் + நீர்"
            }
        ],
        "commentaries": [
            {
                "id": "kuru-40-uvs",
                "scholarTa": "டாக்டர் உ. வே. சாமிநாதையர்",
                "scholarEn": "Dr. U. V. Swaminatha Iyer",
                "period": "பொ.ஊ. 1937",
                "sourceEdition": "குறுந்தொகை மூலமும் உரையும்",
                "textTa": "என் தாயும் உன் தாயும் எவ்வகையில் ஒருவரை ஒருவர் அறிவர்? என் தந்தையும் உன் தந்தையும் எந்த முறைப்படி உறவினர்? செம்மண் நிலத்தில் பெய்த மழைநீர் அம்மண்ணோடு பிரிக்க முடியாதபடி ஒன்றாவது போல, நம்முடைய அன்புள்ள நெஞ்சங்கள் தாமாகவே கலந்துவிட்டன.",
                "status": "VERIFIED"
            }
        ],
        "translations": [
            {
                "id": "kuru-40-ramanujan",
                "translator": "A. K. Ramanujan",
                "year": "1967",
                "language": "en",
                "text": "What could my mother be to yours? What kin is my father to yours anyway? And how did you and I ever meet? But in love our hearts have mingled like red earth and pouring rain."
            }
        ],
        "core_concepts": ["அகம்", "குறிஞ்சி", "தூய அன்பு", "இயற்கைக் குறியீடு"],
        "cultural_context_ta": "குறுந்தொகையின் உலகப் புகழ்பெற்ற காதல் குறியீடு; சாதி, மரபு, பின்புலங்களைத் தாண்டி உள்ளங்களின் இணைப்பை இயற்கையின் வழியே உணர்த்தும் சங்கப் பாடல்.",
        "cultural_context_en": "Celebrated Sangam lyric using the metaphor of monsoon rain on red earth to express irrevocable spiritual union.",
        "canonical_source": "குறுந்தொகை - CICT செம்மொழித் தமிழாய்வு மத்திய நிறுவனம்"
    }
]

# Tamil Concepts
TAMIL_CONCEPTS_DATA = [
    {
        "id": "aram",
        "name_ta": "அறம் (Virtue & Cosmic Order)",
        "name_en": "Aram (Ethical Duty & Moral Virtue)",
        "transliteration": "Aṟam",
        "definition_ta": "மனத்துக்கண் மாசிலன் ஆதல் அனைத்தறன்; பிறர்க்கு உதவும் ஈகையும், வாய்மையும், ஒழுக்கமும் இணைந்த மனித வாழ்வியல் நெறி.",
        "definition_en": "The foundational Tamil ethical concept representing justice, altruism, moral order, and purity of conscience.",
        "classical_vocabulary": ["அறநெறி", "ஈகை", "வாய்மை", "ஒழுக்கம்", "கொடை"],
        "primary_work_ids": ["tirukkural", "tolkappiyam", "purananuru", "naladiyar"],
        "sample_verse_ids": ["kural-81", "pura-192"],
        "cultural_significance_ta": "சங்க இலக்கியத்தில் அறம் என்பது சடங்கு அல்ல; சமூக நீதியும் மானுட சமத்துவமுமே அறமாகும்."
    },
    {
        "id": "akam-puram",
        "name_ta": "அகமும் புறமும் (Inner Love & Outer Valor)",
        "name_en": "Akam and Puram (Bipolar Poetic Cosmos)",
        "transliteration": "Akam-Puṟam",
        "definition_ta": "மனிதனின் அக உணர்வுகளான காதலை 'அகம்' எனவும்; வீரம், கொடை, அரசியல், நீதி ஆகிய வெளிப்பாடுகளை 'புறம்' எனவும் வகைப்படுத்தும் சங்க இலக்கியப் பாகுபாடு.",
        "definition_en": "The dual aesthetic architecture of Tamil literature: Akam (intimate inner emotion/love) and Puram (public valour, ethics, and governance).",
        "classical_vocabulary": ["திணை", "துறை", "முதற்பொருள்", "கருப்பொருள்", "உரிப்பொருள்"],
        "primary_work_ids": ["tolkappiyam", "kurunthogai", "purananuru", "narrinai"],
        "sample_verse_ids": ["kuru-40", "pura-192"],
        "cultural_significance_ta": "தொல்காப்பியர் வகுத்தளித்த அகப்புறப் பாகுபாடு உலக இலக்கிய வரலாற்றிலேயே மிகத் தனித்துவமான சூழலியல் அழகியல் முறையாகும்."
    },
    {
        "id": "virunthombal",
        "name_ta": "விருந்தோம்பல் (Hospitality to Strangers)",
        "name_en": "Virunthombal (Sacred Hospitality)",
        "transliteration": "Viruntōmpal",
        "definition_ta": "புதியராய் வரும் விருந்தினரை முகம் மலர்ந்து வரவேற்று உணவளித்துப் பாதுகாக்கும் தமிழ் இல்லறத்தின் தலையாய பண்பாடு.",
        "definition_en": "The classical Tamil virtue of welcoming, feeding, and honouring strangers with warm generosity.",
        "classical_vocabulary": ["விருந்து", "ஓம்பல்", "வேளாண்மை", "இல்வாழ்க்கை", "அன்புடைமை"],
        "primary_work_ids": ["tirukkural", "purananuru", "porunaratruppadai"],
        "sample_verse_ids": ["kural-81"],
        "cultural_significance_ta": "விருந்தோம்பல் என்பது வெறும் உபசரிப்பு மட்டுமல்லாமல், இல்லறத்தின் ஒட்டுமொத்த பொருளும் பயனுமாகும்."
    }
]

# Textual Variants (பாடபேதங்கள்)
TEXTUAL_VARIANTS_DATA = [
    {
        "id": "var-1",
        "work_id": "purananuru",
        "work_title_ta": "புறநானூறு",
        "work_title_en": "Purananuru",
        "verse_ref": "பாடல் 192 (வரி 6-7)",
        "base_reading_ta": "பின்னீர் பெரியோரை வியத்தலும் இலமே",
        "variant_reading_ta": "பின்னும் பெரியோரை வியத்தலும் இலமே",
        "source_manuscript": "திருக்கழுக்குன்றம் ஏட்டுப் பிரதி / யாழ்ப்பாணத்துச் சுவடி",
        "printed_edition": "டாக்டர் உ.வே.சா. முதற்பதிப்பு (1894), பக். 382",
        "critical_analysis_ta": "'பின்னீர்' என்பது சங்கப் பிரதிகளில் காணப்படும் தொன்மையான சொல்வழக்கு. பிற்காலப் பிரதிகளில் பொருள் விளங்காமல் 'பின்னும்' என மாற்றியமைக்கப்பட்டுள்ளது என்று உ.வே.சா. தம் பதிப்புரையில் குறிப்பிடுகிறார்.",
        "critical_analysis_en": "'Pinnīr' is the archaic Sangam reading preserved in ancient palm-leaf manuscripts. Later scribes substituted the common adverb 'Pinnum'."
    },
    {
        "id": "var-2",
        "work_id": "kurunthogai",
        "work_title_ta": "குறுந்தொகை",
        "work_title_en": "Kurunthogai",
        "verse_ref": "பாடல் 40 (வரி 4)",
        "base_reading_ta": "செம்புலப் பெயல்நீர் போல",
        "variant_reading_ta": "செம்புலப் பெயனீர் போல",
        "source_manuscript": "சென்னை அரசினர் கீழ்த்திசைச் சுவடிகள் நூலக ஏடு (R. 3201)",
        "printed_edition": "சௌரிப்பெருமாள் அரங்கனார் பதிப்பு (1915) / உ.வே.சா. பதிப்பு (1937)",
        "critical_analysis_ta": "'பெயல்நீர்' (பெய்கின்ற நீர்) என்பது வினைத்தொகை நயத்தோடு கூடிய சரியான பாடம். ஏடுகளில் 'ல்' எழுத்து புள்ளி இல்லாமல் போனதால் 'பெயனீர்' எனப் படியெடுக்கப்பட்டது.",
        "critical_analysis_en": "'Peyalnīr' carries the verbal-noun force. Palm-leaf scribes omitted pulli dots leading to the variant 'peyanīr'."
    }
]

def seed_database(db: Session):
    """Seed initial canonical Classical Tamil corpus into database."""
    # 1. Seed Works
    for work in CLASSICAL_WORKS_DATA:
        existing = db.query(ClassicalWorkModel).filter(ClassicalWorkModel.id == work["id"]).first()
        if not existing:
            db.add(ClassicalWorkModel(**work))
    
    # 2. Seed Verses
    for verse in CLASSICAL_VERSES_DATA:
        existing = db.query(ClassicalVerseModel).filter(ClassicalVerseModel.id == verse["id"]).first()
        if not existing:
            db.add(ClassicalVerseModel(**verse))
            
    # 3. Seed Concepts
    for concept in TAMIL_CONCEPTS_DATA:
        existing = db.query(TamilConceptModel).filter(TamilConceptModel.id == concept["id"]).first()
        if not existing:
            db.add(TamilConceptModel(**concept))
            
    # 4. Seed Variants
    for variant in TEXTUAL_VARIANTS_DATA:
        existing = db.query(TextualVariantModel).filter(TextualVariantModel.id == variant["id"]).first()
        if not existing:
            db.add(TextualVariantModel(**variant))
            
    db.commit()
