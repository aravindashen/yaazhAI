export type Language = 'ta' | 'en';

export interface TranslationDictionary {
  appName: string;
  appSubtitle: string;
  tagline: string;
  sourceBeforeAi: string;
  
  // Platform selector
  selectPlatform: string;
  selectPlatformDesc: string;
  studyPlatformTitle: string;
  studyPlatformDesc: string;
  learnerPlatformTitle: string;
  learnerPlatformDesc: string;
  researchPlatformTitle: string;
  researchPlatformDesc: string;
  enterPlatform: string;
  switchPlatform: string;
  currentRole: string;
  logout: string;

  // Study Platform
  studyWorkspace: string;
  studySubtitle: string;
  inputSection: string;
  inputPlaceholder: string;
  uploadDoc: string;
  supportedFormats: string;
  analyzeButton: string;
  analyzing: string;
  verifiedSamples: string;
  tabAnalysis: string;
  tabPractice: string;
  tabTrail: string;
  originalText: string;
  wordBreakdown: string;
  splitForm: string;
  commentaryText: string;
  englishExplanation: string;
  culturalBackground: string;
  flashcardTitle: string;
  clickToReveal: string;
  prevWord: string;
  nextWord: string;
  quizTitle: string;
  checkAnswer: string;
  correctAnswer: string;
  sourceExplanation: string;
  sourceTrailTitle: string;
  sourceTrailDesc: string;
  viewFullEvidence: string;

  // Learner Platform
  learnerWorkspace: string;
  learnerSubtitle: string;
  tabJourney: string;
  tabAtlas: string;
  tabLexicon: string;
  tabDaily: string;
  levelBadge: string;
  learningProgress: string;
  startModule: string;
  moduleCompleted: string;
  coreConcepts: string;
  conceptDefinition: string;
  classicalVocab: string;
  culturalSignificance: string;
  evidenceVerses: string;
  wordExplorer: string;
  searchWordPlaceholder: string;
  pronunciationGuide: string;
  listenRecitation: string;
  meterCadence: string;
  dailyVerseTitle: string;

  // Research Platform
  researchWorkspace: string;
  researchSubtitle: string;
  tabSearch: string;
  tabSynthesizer: string;
  tabCompare: string;
  tabVariants: string;
  tabCollection: string;
  searchPlaceholder: string;
  searchButton: string;
  filterByWork: string;
  filterByConcept: string;
  resetFilters: string;
  retrievedCount: string;
  inquiryTitle: string;
  inquiryDesc: string;
  inquiryPlaceholder: string;
  synthesizeButton: string;
  academicSynthesis: string;
  evidenceBySource: string;
  comparativeMatrix: string;
  comparativeDesc: string;
  selectVerseToCompare: string;
  textualVariantsTitle: string;
  textualVariantsDesc: string;
  savedCollection: string;
  exportFormat: string;
  copyCitation: string;
  copied: string;

  // Trust statuses
  verified: string;
  sourceSupported: string;
  interpretive: string;
  userProvided: string;

  // Mobile App & First Page Flow
  welcomeGreeting: string;
  welcomeSubtitle: string;
  yaazhDescription: string;
  askYaazhPlaceholder: string;
  liveScanButton: string;
  threeModesSectionTitle: string;
  threeModesSectionDesc: string;
  studyModeCardTitle: string;
  studyModeCardDesc: string;
  exploreModeCardTitle: string;
  exploreModeCardDesc: string;
  researchModeCardTitle: string;
  researchModeCardDesc: string;
  navHome: string;
  navStudy: string;
  navExplore: string;
  navResearch: string;
  navVoice: string;
  translationTitle: string;
  originalTextLabel: string;
  translatedTextLabel: string;
  audioPronounce: string;
  copySuccess: string;
  backToHome: string;

  // Additional granular keys for 100% localization
  close: string;
  copy: string;
  citations: string;
  poet: string;
  meter: string;
  allWorks: string;
  allConcepts: string;
  relevanceScore: string;
  match: string;
  inCollection: string;
  saveToCollection: string;
  criticalApparatus: string;
  criticalReading: string;
  printedEdition: string;
  manuscriptVariant: string;
  manuscriptSource: string;
  philologicalNote: string;
  evidenceTrustSummary: string;
  verifiedPassages: string;
  classicalCommentaries: string;
  scholarlyTranslations: string;
  scholarlyNote: string;
  edition: string;
  addResearchNote: string;
  noteTitle: string;
  noteTitlePlaceholder: string;
  observations: string;
  observationsPlaceholder: string;
  tags: string;
  saveNote: string;
  saving: string;
  savedResearchNotes: string;
  savedVersesCount: string;
  total: string;
  studyMode: string;
  exploreMode: string;
  researchMode: string;
  voiceMode: string;
  homeMode: string;
  openStudy: string;
  openExplore: string;
  openResearch: string;
  cictActive: string;
  scholar: string;
  sangamThinai: string;
  tolkappiyamAkattinai: string;
  ask: string;
  processing: string;
  tryPrompts: string;
  closeResult: string;
  inspectInStudy: string;
  canonicalAnswer: string;
  versesFound: string;
  noVersesFound: string;
  listenCadence: string;
  pause: string;
  retake: string;
  frontCamera: string;
  backCamera: string;
  liveCamera: string;
  fileUpload: string;
  demoSamples: string;
  scanSource: string;
  extractedText: string;
  examExplanation: string;
  culturalInsight: string;
  transliterationLabel: string;
  chatbotTitle: string;
  chatbotSubtitle: string;
  chatbotBadge: string;
  chatbotPlaceholder: string;
  chatbotWelcome: string;
  chatbotSuggestions: string;
  chatbotClearHistory: string;
  chatbotMinimize: string;
  chatbotFloatingTooltip: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  ta: {
    appName: 'யாழ்',
    appSubtitle: 'செம்மொழித் தமிழ் அறிவுத்தளம்',
    tagline: 'சான்று முதலில், செயற்கை நுண்ணறிவு பின்பே · இலக்கிய வரலாற்று மெய்ப்பிக்கப்பட்ட அறிவு',
    sourceBeforeAi: 'சான்று சார்ந்த மெய்ப்பொருள்',

    selectPlatform: 'உங்கள் பயன்பாட்டுத் தளத்தைத் தேர்வுசெய்க',
    selectPlatformDesc: 'மாணவர் படிப்பு, மொழி கற்றல், மற்றும் ஆய்வுக்கான மூன்று தனித்துவமான பணித்தளங்கள்',
    studyPlatformTitle: 'மாணவர் பயிலும் தளம்',
    studyPlatformDesc: 'தேர்வு மற்றும் பாடத்திட்டக் கல்விக்கானது. குறிப்புகள்/படங்கள் பதிவேற்றம், OCR எழுத்துணரி, சொல்-பொருள் பிரிப்பு, இலக்கணம், மற்றும் மனன வினாடிவினா.',
    learnerPlatformTitle: 'கற்போர் கண்டறிதல் தளம்',
    learnerPlatformDesc: 'தமிழ் மொழி மற்றும் பண்பாட்டு ஆர்வலர்களுக்கானது. தொடக்க நிலை முதல் உயர் நிலை வரையிலான கற்றல் வழிகள், விழுமிய வரைபடம், உச்சரிப்பு வழிகாட்டி, தினசரிப் பாடல்.',
    researchPlatformTitle: 'செம்மொழி ஆய்வுக்களம்',
    researchPlatformDesc: 'ஆராய்ச்சியாளர்களுக்கான பிரத்யேக ஆய்வகம். கலப்புத் தேடல், பாடபேதங்கள், உரைகள் ஒப்பாய்வு, ஆதாரக் கேள்வி தொகுப்பாளர், மேற்கோள் ஏற்றுமதி.',
    enterPlatform: 'தளத்திற்குள் நுழைக',
    switchPlatform: 'தளம் மாற்றுக',
    currentRole: 'தற்போதைய தளம்',
    logout: 'வெளியேறுக',

    // Mobile App & First Page Flow
    welcomeGreeting: 'வணக்கம், அன்பரே! நல்வரவு.',
    welcomeSubtitle: 'செம்மொழித் தமிழின் 41 செவ்வியல் நூல்களையும் இலக்கிய செழுமையையும் இன்றே அறிவோம்.',
    yaazhDescription: 'யாழ் (YAAZH AI) என்பது 41 செம்மொழித் தமிழ் நூல்கள், கல்வெட்டுச் சான்றுகள் மற்றும் தொல்லியல் தரவுகளின் அடிப்படையில் இயங்கும் பிரத்யேக அறிவுப் பொறி. ஏதேனும் கேளுங்கள், செய்யுள்களை நேரடியாக மொழிபெயர்க்கச் சொல்லுங்கள், அல்லது கேமரா வழியே ஓலைச்சுவடி / பாடநூல்களை ஸ்கேன் செய்யுங்கள்.',
    askYaazhPlaceholder: 'யாழிடம் கேளுங்கள், செய்யுளை மொழிபெயர்க்கச் சொல்லுங்கள்...',
    liveScanButton: 'கேமரா ஸ்கேன்',
    threeModesSectionTitle: 'மூன்று முதன்மைப் பயன்பாட்டுத் தளங்கள்',
    threeModesSectionDesc: 'உங்கள் தேவைக்கேற்ப பயில, அறிய அல்லது ஆய்வு செய்ய கீழே உள்ள தளங்களைத் தேர்ந்தெடுக்கவும்',
    studyModeCardTitle: 'கற்றல் தளம்',
    studyModeCardDesc: 'பாடத்திட்டச் செய்யுள் பதம் பிரித்தல், இலக்கணக் குறிப்பு, சொல் மனன அட்டை மற்றும் வினாடிவினா பயிற்சி.',
    exploreModeCardTitle: 'கண்டறிதல் தளம்',
    exploreModeCardDesc: '41 செம்மொழி நூல்கள், ஐந்திணை நிலங்கள், இலக்கியக் காலக்கோடு மற்றும் விழுமிய வரைபடம்.',
    researchModeCardTitle: 'ஆராய்ச்சித் தளம்',
    researchModeCardDesc: 'ஆய்வுக் கேள்வி தொகுப்பாளர், ஏட்டுச்சுவடி பாடபேதங்கள் மற்றும் முறையான மேற்கோள் ஏற்றுமதி.',
    navHome: 'முகப்பு',
    navStudy: 'கற்றல்',
    navExplore: 'அறிதல்',
    navResearch: 'ஆய்வு',
    navVoice: 'குரல்',
    translationTitle: 'செவ்வியல் மொழிபெயர்ப்பு முடிவு',
    originalTextLabel: 'மூல உரை',
    translatedTextLabel: 'மொழிபெயர்க்கப்பட்ட உரை',
    audioPronounce: 'ஒலி உச்சரிப்பு',
    copySuccess: 'நகலெடுக்கப்பட்டது!',
    backToHome: 'முகப்புக்குத் திரும்பு',

    studyWorkspace: 'மாணவர் பயிலும் தளம்',
    studySubtitle: 'படித்தல் → எழுத்துணரி / ஆய்வு → மூல நூல் அடையாளம் → சான்று உரை → பயிற்சி',
    inputSection: 'உரை உள்ளீடு / ஆவணம்',
    inputPlaceholder: 'செம்மொழித் தமிழ், திருக்குறள் அல்லது சங்க இலக்கிய வரிகளை இங்கே உள்ளிடவும்...',
    uploadDoc: 'படம் / PDF / OCR ஆவணம் பதிவேற்றுக',
    supportedFormats: 'JPG, PNG, PDF, TXT (அதிகபட்சம் 10MB)',
    analyzeButton: 'சான்று அடிப்படையிலான ஆய்வு',
    analyzing: 'ஆய்வு செய்யப்படுகிறது...',
    verifiedSamples: 'மாதிரிப் பாடல்கள்',
    tabAnalysis: 'பாடல் ஆய்வு & உரை',
    tabPractice: 'சொல் மனனம் & வினாடிவினா',
    tabTrail: 'சான்று வழித்தடம்',
    originalText: 'செவ்வியல் மூலப் பாடம்',
    wordBreakdown: 'பதம் பிரித்தல் & சொல்வளம்',
    splitForm: 'பிரிப்பு',
    commentaryText: 'செவ்வியல் உரை விளக்கம்',
    englishExplanation: 'ஆங்கில புலமை விளக்கம்',
    culturalBackground: 'பண்பாட்டு வரலாற்றுப் பின்னணி',
    flashcardTitle: 'செவ்வியல் சொல் அட்டை',
    clickToReveal: 'பொருள் அறிய அழுத்தவும்',
    prevWord: 'முந்தைய சொல்',
    nextWord: 'அடுத்த சொல்',
    quizTitle: 'புரிதல் வினாடிவினா',
    checkAnswer: 'விடை சரிபார்க்க',
    correctAnswer: 'சரியான விடை!',
    sourceExplanation: 'சான்று விளக்கம்',
    sourceTrailTitle: 'நம்பகத்தன்மை & சான்று வழித்தடம்',
    sourceTrailDesc: 'ஒவ்வொரு பதிலும் மூல இலக்கியச் சான்றுகளிலிருந்து பெறப்பட்ட வெளிப்படையான வரிசை',
    viewFullEvidence: 'முழு சான்று காண்க',

    learnerWorkspace: 'கற்போர் கண்டறிதல் களம்',
    learnerSubtitle: 'தமிழ் கற்றல் நிலைகள், செவ்வியல் விழுமிய வரைபடம், உச்சரிப்பு மற்றும் சொல்வளம்',
    tabJourney: 'கற்றல் நிலைகள்',
    tabAtlas: 'விழுமிய வரைபடம்',
    tabLexicon: 'சொற்களஞ்சியம்',
    tabDaily: 'இன்றைய செவ்வியல் பாடல்',
    levelBadge: 'நிலை',
    learningProgress: 'கற்றல் முன்னேற்றம்',
    startModule: 'பாடத்தைத் தொடங்குக',
    moduleCompleted: 'நிறைவுற்றது',
    coreConcepts: 'தமிழர் முதன்மை விழுமியங்கள்',
    conceptDefinition: 'விழுமிய விளக்கம்',
    classicalVocab: 'செவ்வியல் சொல் தொகுப்பு',
    culturalSignificance: 'பண்பாட்டு வரலாற்று முதன்மை',
    evidenceVerses: 'மூலப் பாடல் சான்றுகள்',
    wordExplorer: 'செவ்வியல் சொல் தேடல்',
    searchWordPlaceholder: 'சொல் அல்லது பொருள் தேடுக (எ.கா. விருந்து, கேளிர், என்பு)...',
    pronunciationGuide: 'செவ்வியல் உச்சரிப்பு & யாப்பு ஓசை',
    listenRecitation: 'பாடலைக் கேட்க',
    meterCadence: 'யாப்பு ஓசை சீரமைப்பு',
    dailyVerseTitle: 'இன்றைய விழுமியப் பாடல்',

    researchWorkspace: 'செம்மொழி ஆராய்ச்சித் தளம்',
    researchSubtitle: 'கலப்புத் தேடல் · பாடபேதங்கள் · உரைகள் ஒப்பாய்வு · ஆதாரக் கேள்வி தொகுப்பு · மேற்கோள்',
    tabSearch: 'கலப்புத் தேடல்',
    tabSynthesizer: 'ஆய்வுக் கேள்வி தொகுப்பு',
    tabCompare: 'உரைகள் ஒப்பாய்வு',
    tabVariants: 'பாடபேதங்கள்',
    tabCollection: 'சேகரிப்பு & மேற்கோள்',
    searchPlaceholder: 'சொல், வரி, யாப்பு அல்லது விழுமியத்தைத் தேடுக...',
    searchButton: 'சான்று தேடுக',
    filterByWork: 'நூல் தெரிவு',
    filterByConcept: 'விழுமியம் தெரிவு',
    resetFilters: 'வடிகட்டிகளை மீட்டமை',
    retrievedCount: 'கண்டறியப்பட்ட சான்றுகள்',
    inquiryTitle: 'ஆய்வுக் கேள்வி தொகுப்பாளர்',
    inquiryDesc: 'பல நூல்களிலிருந்து சான்றுகளைத் திரட்டி, ஒப்பாய்வு செய்து, முறையான மேற்கோள்களோடு தொகுக்கும் ஆய்வுக் கருவி',
    inquiryPlaceholder: 'எ.கா. சங்க இலக்கியங்களில் விருந்தோம்பல் மரபின் கூறுகள் எவை?',
    synthesizeButton: 'சான்றுகளுடன் தொகுக்க',
    academicSynthesis: 'ஆய்வுத் தொகுப்புரை',
    evidenceBySource: 'திரட்டப்பட்ட மூல நூல்களும் பாடல்களும்',
    comparativeMatrix: 'உரைகள் & மொழிபெயர்ப்புகள் ஒப்பாய்வு',
    comparativeDesc: 'பல்வேறு செவ்வியல் உரைகளையும் ஆங்கில மொழிபெயர்ப்புகளையும் அருகருகே வைத்து ஒப்பிடுக',
    selectVerseToCompare: 'ஒப்பிடப் பாடலைத் தேர்ந்தெடுக்கவும்',
    textualVariantsTitle: 'ஓலைச்சுவடி & பதிப்புப் பாடபேதங்கள்',
    textualVariantsDesc: 'பல்வேறு ஓலைச்சுவடிகளுக்கும் அச்சுப் பதிப்புகளுக்கும் இடையிலான சொல் வேறுபாடுகளின் மூலச் சான்றுகள்',
    savedCollection: 'சேமிக்கப்பட்ட ஆய்வுப் பாடல்கள்',
    exportFormat: 'மேற்கோள் வடிவம்',
    copyCitation: 'நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது!',

    verified: 'மெய்ப்பிக்கப்பட்ட சான்று',
    sourceSupported: 'சான்று வழி பெறப்பட்டது',
    interpretive: 'ஆய்வு விளக்கம்',
    userProvided: 'பயனர் வழங்கியது',

    close: 'மூடுக',
    copy: 'நகலெடு',
    citations: 'சான்றுகள்',
    poet: 'புலவர்',
    meter: 'யாப்பு',
    allWorks: 'அனைத்து செவ்வியல் நூல்கள்',
    allConcepts: 'அனைத்து விழுமியங்கள்',
    relevanceScore: 'பொருத்த அளவு',
    match: 'பொருத்தம்',
    inCollection: 'சேகரிப்பில் உள்ளது',
    saveToCollection: 'சேகரிப்பில் சேர்க்க',
    criticalApparatus: 'பாடபேத ஆய்வு',
    criticalReading: 'ஏற்றுக்கொள்ளப்பட்ட மூலப் பாடம்',
    printedEdition: 'பதிப்பு ஆதாரம்',
    manuscriptVariant: 'சுவடிப் பாடபேதம்',
    manuscriptSource: 'சுவடி ஆதாரம்',
    philologicalNote: 'பதிப்பு வரலாற்று நுட்பம்',
    evidenceTrustSummary: 'சான்றாதார உறுதி நிலை',
    verifiedPassages: 'சான்றுப் பாடல்கள்',
    classicalCommentaries: 'செவ்வியல் உரைகள்',
    scholarlyTranslations: 'ஆங்கில மொழிபெயர்ப்புகள் ஒப்பீடு',
    scholarlyNote: 'நுட்பக்குறிப்பு',
    edition: 'பதிப்பு',
    addResearchNote: 'புதிய ஆராய்ச்சிக் குறிப்பு',
    noteTitle: 'குறிப்புத் தலைப்பு',
    noteTitlePlaceholder: 'எ.கா. சிலப்பதிகாரத்தில் அரசியல் அறம்...',
    observations: 'ஆராய்ச்சிக் குறிப்பு உரை',
    observationsPlaceholder: 'உங்கள் கருத்துக்கள், சொல்லாய்வு மற்றும் சான்றுகளின் தொடர்பு...',
    tags: 'குறிச்சொற்கள்',
    saveNote: 'குறிப்பைச் சேமி',
    saving: 'சேமிக்கப்படுகிறது...',
    savedResearchNotes: 'பதிவு செய்யப்பட்ட ஆராய்ச்சிக் குறிப்புகள்',
    savedVersesCount: 'பாடல்கள் சேகரிக்கப்பட்டுள்ளன',
    total: 'மொத்தம்',
    studyMode: 'கற்றல்',
    exploreMode: 'அறிதல்',
    researchMode: 'ஆய்வு',
    voiceMode: 'குரல்',
    homeMode: 'முகப்பு',
    openStudy: 'பயிலத் தொடங்குக',
    openExplore: 'கண்டறியத் தொடங்குக',
    openResearch: 'ஆய்வைத் தொடங்குக',
    cictActive: 'செம்மொழித் தரவுத்தளம் இயங்குகிறது',
    scholar: 'மாணவர் / ஆய்வாளர்',
    sangamThinai: 'சங்கத் தமிழரின் ஐந்திணை நிலங்கள்',
    tolkappiyamAkattinai: 'தொல்காப்பியம் அகத்திணையியல்',
    ask: 'வினவு',
    processing: 'ஆராய்கிறது...',
    tryPrompts: 'எடுத்துக்காட்டுகள்',
    closeResult: 'முடிவை அடைக்கவும்',
    inspectInStudy: 'பதம் பிரித்துப் பயில்க',
    canonicalAnswer: 'செம்மொழி சான்றாதார விளக்கம்',
    versesFound: 'சான்றுகள் கண்டறியப்பட்டன',
    noVersesFound: 'சான்றுகள் கிடைக்கவில்லை. வேறு சொல்லைப் பயன்படுத்தித் தேடவும்.',
    listenCadence: 'ஓசையைக் கேட்க',
    pause: 'நிறுத்து',
    retake: 'மீண்டும் எடுக்க',
    frontCamera: 'முன்புற கேமரா',
    backCamera: 'பின்புற கேமரா',
    liveCamera: 'நேரடி கேமரா',
    fileUpload: 'கோப்பு பதிவேற்றம்',
    demoSamples: 'மாதிரி ஏடுகள்',
    scanSource: 'ஸ்கேன் செய்யப்பட்ட படம்',
    extractedText: 'கண்டறியப்பட்ட மூல உரை',
    examExplanation: 'தேர்வு உரை விளக்கம்',
    culturalInsight: 'வாழ்வியல் பண்பாட்டுக் குறிப்பு',
    transliterationLabel: 'ஒலிபெயர்ப்பு',
    chatbotTitle: 'யாழ் அறிவார்ந்த உரையாடல்',
    chatbotSubtitle: 'எல்லாப் பயன்முறையிலும் உடனடி செம்மொழி உதவி',
    chatbotBadge: 'யாழ் AI',
    chatbotPlaceholder: 'கேள்வி கேளுங்கள் அல்லது "மொழிபெயர்..." எனக் கூறுங்கள்...',
    chatbotWelcome: 'வணக்கம்! நான் யாழ் AI. செம்மொழிப் பாடல்கள், சொல்வளம், உரை விளக்கம், இலக்கணம் அல்லது மொழிபெயர்ப்பு பற்றி எது வேண்டுமானாலும் கேளுங்கள்.',
    chatbotSuggestions: 'பரிந்துரைகள்',
    chatbotClearHistory: 'வரலாற்றை அழி',
    chatbotMinimize: 'சுருக்கு',
    chatbotFloatingTooltip: 'யாழ் AI உடன் உரையாடு'
  },
  en: {
    appName: 'YAAZH AI',
    appSubtitle: 'Classical Tamil Knowledge Platform',
    tagline: 'Source Before AI · Evidence Before Generation · Verified Classical Knowledge',
    sourceBeforeAi: 'EVIDENCE BEFORE GENERATION',

    selectPlatform: 'Select Your Dedicated Platform',
    selectPlatformDesc: 'Three specialized workspaces designed for students, language learners, and researchers',
    studyPlatformTitle: 'Student Study Workspace',
    studyPlatformDesc: 'Built for coursework, school & college exams. Document/image OCR extraction, morphological word breakdown, grammatical notes, flashcards, and comprehension tests.',
    learnerPlatformTitle: 'Learner & Cultural Discovery',
    learnerPlatformDesc: 'Designed for language enthusiasts and heritage learners. Step-by-step learning modules, Tamil Concept Atlas, pronunciation & meter audio cadence, and daily classical challenges.',
    researchPlatformTitle: 'Scholarly Research Lab',
    researchPlatformDesc: 'Professional digital humanities research workbench. Faceted hybrid search, textual variants, multi-commentary matrix, grounded inquiry synthesis, and citation exports.',
    enterPlatform: 'Enter Workspace',
    switchPlatform: 'Switch Platform',
    currentRole: 'Active Workspace',
    logout: 'Exit / Change Role',

    // Mobile App & First Page Flow
    welcomeGreeting: 'Welcome, Scholar!',
    welcomeSubtitle: 'Discover the ethical wisdom, epigraphy, and literary depth of 41 Classical Tamil works.',
    yaazhDescription: 'YAAZH AI is an authoritative intelligence engine grounded in the 41 canonical Classical Tamil works & epigraphical evidence. Ask any literary question, request instant verse translations, or scan physical books and palm-leaf manuscripts with live OCR.',
    askYaazhPlaceholder: 'Ask YAAZH, request a translation, or explore...',
    liveScanButton: 'Live Scan',
    threeModesSectionTitle: 'Three Dedicated Platforms',
    threeModesSectionDesc: 'Select an environment tailored to your purpose: coursework study, cultural discovery, or scholarly research',
    studyModeCardTitle: 'Study Mode',
    studyModeCardDesc: 'Verse morphology, Sandhi word splits, grammatical tagging, active-recall flashcards, and quizzes.',
    exploreModeCardTitle: 'Explore Mode',
    exploreModeCardDesc: '41 classical works library, historical timeline, Sangam Thinai landscapes, and concept atlas.',
    researchModeCardTitle: 'Research Mode',
    researchModeCardDesc: 'Grounded inquiry synthesizer, critical edition textual variants, and citation exports.',
    navHome: 'Home',
    navStudy: 'Study',
    navExplore: 'Explore',
    navResearch: 'Research',
    navVoice: 'Voice',
    translationTitle: 'Classical Translation Result',
    originalTextLabel: 'Original Text',
    translatedTextLabel: 'Translated Text',
    audioPronounce: 'Audio Pronunciation',
    copySuccess: 'Copied to Clipboard!',
    backToHome: 'Back to Home',

    studyWorkspace: 'Student Learning Center',
    studySubtitle: 'Read & Upload → OCR Extraction → Verse Identification → Grounded Commentary → Practice',
    inputSection: 'Text Input / Document Ingestion',
    inputPlaceholder: 'Enter Classical Tamil lines, Tirukkural, or Sangam poems here...',
    uploadDoc: 'Upload Image / PDF / Notes for OCR',
    supportedFormats: 'JPG, PNG, PDF, TXT (Max 10MB)',
    analyzeButton: 'Analyze & Verify with Sources',
    analyzing: 'Analyzing text against corpus...',
    verifiedSamples: 'Canonical Sample Texts',
    tabAnalysis: 'Analysis & Commentary',
    tabPractice: 'Vocabulary Flashcards & Quiz',
    tabTrail: 'Audit & Source Trail',
    originalText: 'Original Classical Verse',
    wordBreakdown: 'Word-by-Word Morphology',
    splitForm: 'Split',
    commentaryText: 'Canonical Commentary',
    englishExplanation: 'Scholarly English Digest',
    culturalBackground: 'Cultural & Historical Context',
    flashcardTitle: 'Classical Vocabulary Card',
    clickToReveal: 'Click card to reveal meaning',
    prevWord: 'Previous Word',
    nextWord: 'Next Word',
    quizTitle: 'Evidence Comprehension Quiz',
    checkAnswer: 'Check Answer',
    correctAnswer: 'Correct Answer!',
    sourceExplanation: 'Textual Evidence Note',
    sourceTrailTitle: 'Verification & Source Trail',
    sourceTrailDesc: 'Transparent step-by-step resolution showing exact primary editions and scholars consulted',
    viewFullEvidence: 'View Full Evidence',

    learnerWorkspace: 'Tamil Cultural & Language Discovery',
    learnerSubtitle: 'Progressive learning stages, classical concept atlas, pronunciation cadence, and vocabulary',
    tabJourney: 'Learning Stages',
    tabAtlas: 'Concept Atlas',
    tabLexicon: 'Word Intelligence',
    tabDaily: 'Daily Verse Challenge',
    levelBadge: 'Level',
    learningProgress: 'Curriculum Progress',
    startModule: 'Start Lesson',
    moduleCompleted: 'Completed',
    coreConcepts: 'Core Classical Virtues',
    conceptDefinition: 'Philosophical Definition',
    classicalVocab: 'Classical Vocabulary Cluster',
    culturalSignificance: 'Cultural & Historical Significance',
    evidenceVerses: 'Primary Evidence Verses',
    wordExplorer: 'Classical Word Explorer',
    searchWordPlaceholder: 'Search classical words (e.g. virunthu, kelir, enbu)...',
    pronunciationGuide: 'Classical Recitation & Meter Cadence',
    listenRecitation: 'Listen to Recitation',
    meterCadence: 'Metrical Rhythm & Sandhi Flow',
    dailyVerseTitle: 'Today\'s Classical Verse',

    researchWorkspace: 'Scholarly Research Lab',
    researchSubtitle: 'Hybrid Search · Textual Variants · Comparative Matrix · Grounded Synthesis · Citations',
    tabSearch: 'Hybrid Corpus Search',
    tabSynthesizer: 'Inquiry Synthesizer',
    tabCompare: 'Comparative Matrix',
    tabVariants: 'Textual Variants',
    tabCollection: 'Collections & Citations',
    searchPlaceholder: 'Search words, lines, meter, or concepts across corpus...',
    searchButton: 'Search Corpus',
    filterByWork: 'Filter by Work',
    filterByConcept: 'Filter by Concept',
    resetFilters: 'Reset Filters',
    retrievedCount: 'Retrieved Primary Passages',
    inquiryTitle: 'Research Inquiry Synthesizer',
    inquiryDesc: 'Synthesizes multi-source evidence with source citations and academic rigor without hallucinating',
    inquiryPlaceholder: 'e.g. What references to hospitality exist across Classical Tamil literature?',
    synthesizeButton: 'Synthesize with Evidence',
    academicSynthesis: 'Academic Synthesis',
    evidenceBySource: 'Retrieved Evidence Grouped by Work',
    comparativeMatrix: 'Commentaries & Translations Comparison',
    comparativeDesc: 'Side-by-side contrast of classical scholiasts and English translators',
    selectVerseToCompare: 'Select Target Verse to Compare',
    textualVariantsTitle: 'Critical Edition & Textual Variants',
    textualVariantsDesc: 'Documented readings between palm-leaf manuscripts and print editions (Dr. U.V.S. & CICT)',
    savedCollection: 'Saved Research Collection',
    exportFormat: 'Citation Standard',
    copyCitation: 'Copy Citation',
    copied: 'Copied to Clipboard!',

    verified: 'VERIFIED SOURCE',
    sourceSupported: 'SOURCE-SUPPORTED',
    interpretive: 'SCHOLARLY INTERPRETIVE',
    userProvided: 'USER-PROVIDED',

    close: 'Close',
    copy: 'Copy',
    citations: 'Citations',
    poet: 'Poet',
    meter: 'Meter',
    allWorks: 'All 41 Classical Works',
    allConcepts: 'All Classical Concepts',
    relevanceScore: 'Relevance Score',
    match: 'Match',
    inCollection: 'In Collection',
    saveToCollection: 'Save to Collection',
    criticalApparatus: 'Critical Apparatus',
    criticalReading: 'Critical Reading',
    printedEdition: 'Printed Edition',
    manuscriptVariant: 'Manuscript Variant',
    manuscriptSource: 'Manuscript Source',
    philologicalNote: 'Philological Justification',
    evidenceTrustSummary: 'Evidence Trust Summary',
    verifiedPassages: 'Verified Passages',
    classicalCommentaries: 'Classical Commentaries',
    scholarlyTranslations: 'Comparative English Translations',
    scholarlyNote: 'Scholarly Note',
    edition: 'Edition',
    addResearchNote: 'Add Research Note',
    noteTitle: 'Note Title',
    noteTitlePlaceholder: 'e.g., Political ethics in Silappadikaram...',
    observations: 'Scholarly Observations',
    observationsPlaceholder: 'Your observations, philological notes, and references...',
    tags: 'Tags (comma-separated)',
    saveNote: 'Save Note',
    saving: 'Saving...',
    savedResearchNotes: 'Saved Research Notes',
    savedVersesCount: 'verses collected',
    total: 'Total',
    studyMode: 'Study',
    exploreMode: 'Explore',
    researchMode: 'Research',
    voiceMode: 'Voice',
    homeMode: 'Home',
    openStudy: 'Open Study',
    openExplore: 'Open Explore',
    openResearch: 'Open Research',
    cictActive: 'CICT Canon Active',
    scholar: 'Scholar',
    sangamThinai: 'The Five Classical Thinai Landscapes',
    tolkappiyamAkattinai: 'Tolkappiyam Akattinai',
    ask: 'Ask',
    processing: 'Processing...',
    tryPrompts: 'Try',
    closeResult: 'Close Result',
    inspectInStudy: 'Inspect in Study Mode',
    canonicalAnswer: 'Canonical Scholarly Answer',
    versesFound: 'verses found',
    noVersesFound: 'No matching verses found. Try another query.',
    listenCadence: 'Listen Cadence',
    pause: 'Pause',
    retake: 'Retake',
    frontCamera: 'Front Camera',
    backCamera: 'Back Camera',
    liveCamera: 'Live Camera',
    fileUpload: 'File Upload',
    demoSamples: 'Demo Samples',
    scanSource: 'Scanned Image Source',
    extractedText: 'Extracted Text',
    examExplanation: 'Canonical Explanation',
    culturalInsight: 'Cultural & Philosophical Context',
    transliterationLabel: 'Transliteration',
    chatbotTitle: 'YAAZH AI Assistant',
    chatbotSubtitle: 'Contextual Classical Tamil intelligence across all modes',
    chatbotBadge: 'YAAZH AI',
    chatbotPlaceholder: 'Ask a question or type "Translate..."',
    chatbotWelcome: 'Greetings! I am YAAZH AI. Ask anything about classical Tamil verses, vocabulary, commentaries, grammar, or translations.',
    chatbotSuggestions: 'Suggestions',
    chatbotClearHistory: 'Clear Chat',
    chatbotMinimize: 'Minimize',
    chatbotFloatingTooltip: 'Chat with YAAZH AI'
  }
};
