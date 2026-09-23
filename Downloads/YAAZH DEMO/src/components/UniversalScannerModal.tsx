import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, ShieldCheck, Sparkles, RefreshCw, Volume2, FileText, CheckCircle2, AlertCircle, Bookmark, BookOpen, Layers } from 'lucide-react';
import { UserRole, ClassicalVerse } from '../types/index.ts';
import { Language, TRANSLATIONS } from '../services/i18n.ts';
import { AudioPronunciation } from './AudioPronunciation.tsx';

interface UniversalScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  role: UserRole;
  language: Language;
  onSelectVerse?: (verse: ClassicalVerse) => void;
  onSaveNote?: (title: string, text: string) => void;
  onExtracted?: (resultText: string, identifiedVerse?: ClassicalVerse) => void;
}

export const UniversalScannerModal: React.FC<UniversalScannerModalProps> = ({
  isOpen = true,
  onClose,
  role,
  language,
  onSelectVerse,
  onSaveNote,
  onExtracted
}) => {
  const isTa = language === 'ta';
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [translateEn, setTranslateEn] = useState(false);
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera when activeTab is camera
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode, capturedImage]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        isTa
          ? 'கேமரா அனுமதி பெற இயலவில்லை. உங்கள் கோப்பைப் பதிவேற்றவும்.'
          : 'Unable to access camera. Please use file upload.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleFlipCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    runOcrAnalysis(dataUrl, 'image/jpeg');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCapturedImage(result);
      runOcrAnalysis(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const runOcrAnalysis = async (imageBase64?: string, mimeType?: string) => {
    if (!imageBase64) return;
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch('/api/scanner/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          mode: role
        })
      });

      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setScanResult(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  if (!isOpen) return null;

  const roleLabels: Record<string, { titleTa: string; titleEn: string; descTa: string; descEn: string }> = {
    study: {
      titleTa: 'பாடநூல் & தேர்வுத்தாள் ஸ்கேனர்',
      titleEn: 'Academic Textbook & Exam OCR Scanner',
      descTa: 'தமிழ் பாடநூல் பக்கங்கள் அல்லது வினாத்தாள்களை ஸ்கேன் செய்து பதம் பிரிப்பு, வேற்றுமை இலக்கணம் மற்றும் தெளிவுரை பெறுக.',
      descEn: 'Scan Tamil textbook pages or exam papers to extract text, sandhi breakdown, grammar POS, and study notes.'
    },
    student: {
      titleTa: 'பாடநூல் & தேர்வுத்தாள் ஸ்கேனர்',
      titleEn: 'Academic Textbook & Exam OCR Scanner',
      descTa: 'தமிழ் பாடநூல் பக்கங்கள் அல்லது வினாத்தாள்களை ஸ்கேன் செய்து பதம் பிரிப்பு, வேற்றுமை இலக்கணம் மற்றும் தெளிவுரை பெறுக.',
      descEn: 'Scan Tamil textbook pages or exam papers to extract text, sandhi breakdown, grammar POS, and study notes.'
    },
    explore: {
      titleTa: 'செவ்வியல் இலக்கியக் கேமரா',
      titleEn: 'Classical Literature & Text Explorer',
      descTa: 'செவ்வியல் தமிழ் நூல்கள், அச்சுப் பிரதிகள் மற்றும் ஓலைச்சுவடிகளை ஸ்கேன் செய்து 41 செம்மொழி நூல்களோடு ஒப்பிடுக.',
      descEn: 'Scan Classical Tamil books, print editions, or manuscripts to cross-reference with the 41 canonical works.'
    },
    learner: {
      titleTa: 'சுவரொட்டி & தமிழ் நூல் கேமரா',
      titleEn: 'Visual Tamil Real-Time Camera Explorer',
      descTa: 'தெருப் பலகைகள், விளம்பரங்கள், கதைப் புத்தகங்களை படம் பிடித்து நேரடி ஒலி உச்சரிப்பு, சொல் விளக்கம் மற்றும் பொருள் அறிக.',
      descEn: 'Capture street signs, storybooks, or banners to hear instant native pronunciation and understand everyday Tamil.'
    },
    research: {
      titleTa: 'ஏட்டுச்சுவடி & மூலப் பிரதி ஸ்கேனர்',
      titleEn: 'Palm-Leaf Manuscript & Epigraphy Scanner',
      descTa: 'பனை ஓலைச்சுவடிகள், செப்பேடுகள் மற்றும் கல்வெட்டுப் படங்களை பகுப்பாய்வு செய்து பாடபேதங்களையும் உரை மரபுகளையும் கண்டறிக.',
      descEn: 'Scan palm-leaf manuscripts and lithic epigraphs to identify verse variants, philological collations, and critical apparatus.'
    },
    researcher: {
      titleTa: 'ஏட்டுச்சுவடி & மூலப் பிரதி ஸ்கேனர்',
      titleEn: 'Palm-Leaf Manuscript & Epigraphy Scanner',
      descTa: 'பனை ஓலைச்சுவடிகள், செப்பேடுகள் மற்றும் கல்வெட்டுப் படங்களை பகுப்பாய்வு செய்து பாடபேதங்களையும் உரை மரபுகளையும் கண்டறிக.',
      descEn: 'Scan palm-leaf manuscripts and lithic epigraphs to identify verse variants, philological collations, and critical apparatus.'
    }
  };

  const currentRoleInfo = (role && roleLabels[role]) || roleLabels.study;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-[#faf8f5] w-full max-w-4xl rounded-2xl border border-stone-300 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tamil-serif font-bold text-stone-100 text-base">
                  {isTa ? currentRoleInfo.titleTa : currentRoleInfo.titleEn}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-stone-800 text-stone-300 border border-stone-700">
                  {role} MODE
                </span>
              </div>
              <p className="text-xs text-stone-400 font-tamil-sans">
                {isTa ? currentRoleInfo.descTa : currentRoleInfo.descEn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        {!capturedImage && (
          <div className="px-6 py-3 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('camera'); setCapturedImage(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-colors ${
                  activeTab === 'camera'
                    ? 'bg-stone-900 text-stone-100 shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {isTa ? 'நேரடி கேமரா' : 'Live Camera'}
              </button>

              <button
                onClick={() => { setActiveTab('upload'); setCapturedImage(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-stone-900 text-stone-100 shadow-2xs'
                    : 'text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                {isTa ? 'கோப்பு பதிவேற்றம்' : 'File Upload'}
              </button>
            </div>

            {activeTab === 'camera' && (
              <button
                onClick={handleFlipCamera}
                className="px-2.5 py-1 rounded text-xs font-mono text-stone-600 hover:bg-stone-200 flex items-center gap-1.5"
                title="Flip Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {facingMode === 'environment' ? (isTa ? 'பின் கேமரா' : 'Back Camera') : (isTa ? 'முன் கேமரா' : 'Front Camera')}
              </button>
            )}
          </div>
        )}

        {/* Body Workspace */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active View: Live Camera */}
          {activeTab === 'camera' && !capturedImage && (
            <div className="relative rounded-2xl overflow-hidden bg-stone-950 border border-stone-800 aspect-video max-h-[380px] flex items-center justify-center shadow-inner">
              {cameraError ? (
                <div className="p-6 text-center space-y-3 max-w-md">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-xs text-stone-300 font-tamil-sans">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-amber-600 text-stone-950 font-mono font-bold text-xs rounded-lg hover:bg-amber-500"
                  >
                    {isTa ? 'படத்தைப் பதிவேற்றவும்' : 'Upload Image File'}
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshairs & corner brackets */}
                  <div className="absolute inset-8 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                    </div>
                    <div className="text-center font-mono text-[11px] text-amber-300 bg-stone-950/60 py-1 px-3 rounded-full backdrop-blur-xs self-center">
                      {isTa ? 'தமிழ் வரிகளை சட்டகத்திற்குள் நேராக வைக்கவும்' : 'Align Tamil text or manuscript lines inside the frame'}
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-amber-400" />
                    </div>
                  </div>

                  {/* Shutter Button */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                    <button
                      onClick={handleCaptureFrame}
                      className="group p-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all active:scale-95"
                    >
                      <div className="w-14 h-14 rounded-full bg-amber-500 group-hover:bg-amber-400 flex items-center justify-center shadow-lg text-stone-950">
                        <Camera className="w-7 h-7" />
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Active View: File Upload */}
          {activeTab === 'upload' && !capturedImage && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-stone-500 rounded-2xl p-10 text-center cursor-pointer bg-stone-50/60 hover:bg-stone-50 transition-colors space-y-4"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-14 h-14 rounded-2xl bg-stone-200 flex items-center justify-center mx-auto text-stone-600">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-tamil-serif font-bold text-stone-800 text-sm">
                  {isTa ? 'படத்தை இங்கே பதிவேற்றவும்' : 'Click or drag Tamil image file here'}
                </h4>
                <p className="text-xs text-stone-500 font-tamil-sans mt-1">
                  JPG, PNG, WEBP, or PDF Screenshots (High resolution recommended)
                </p>
              </div>
            </div>
          )}

          {/* Captured / Scanning View */}
          {capturedImage && (
            <div className="space-y-6">
              {/* Image Preview Banner & Controls */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-100 border border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-600 font-semibold uppercase">
                    {isTa ? 'ஸ்கேன் செய்யப்பட்ட படம்' : 'Scanned Image Source'}
                  </span>
                  {scanResult?.confidence && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      OCR Confidence: {Math.round(scanResult.confidence * 100)}%
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Translate Toggle */}
                  <button
                    onClick={() => setTranslateEn(!translateEn)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors border ${
                      translateEn 
                        ? 'bg-amber-100 text-amber-900 border-amber-300' 
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    {translateEn ? (isTa ? 'தமிழ் வடிவம்' : 'Tamil Script') : (isTa ? 'ஆங்கில உரை' : 'English Trans.')}
                  </button>

                  <button
                    onClick={handleRetake}
                    className="px-3 py-1 rounded text-xs font-mono bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {isTa ? 'மீண்டும் எடுக்க' : 'Retake'}
                  </button>
                </div>
              </div>

              {/* Scanning Progress */}
              {isScanning && (
                <div className="p-8 rounded-xl bg-white border border-stone-200 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
                  <p className="font-tamil-serif font-bold text-stone-800 text-sm">
                    {isTa ? 'தமிழ் எழுத்துக்கள் பகுப்பாய்வு செய்யப்படுகின்றன...' : 'Transcribing Tamil script & aligning classical corpus...'}
                  </p>
                  <p className="text-xs font-mono text-stone-400">
                    NFC Unicode Normalization · Sandhi Splitter · Canonical Identification
                  </p>
                </div>
              )}

              {/* Extraction Results */}
              {scanResult && (
                <div className="space-y-6">
                  {/* No text detected alert */}
                  {scanResult.status === 'NO_TEXT' && (
                    <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-stone-800 space-y-3 text-center">
                      <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                      <h5 className="font-tamil-serif font-bold text-sm">
                        {isTa ? 'எழுத்துக்கள் எதுவும் கண்டறியப்படவில்லை' : 'No Legible Text Detected'}
                      </h5>
                      <p className="text-xs text-stone-600 font-tamil-sans max-w-md mx-auto">
                        {scanResult.message || (isTa ? 'படத்தை வெளிச்சம் உள்ள இடத்தில் நேராக வைத்து மீண்டும் எடுக்கவும் அல்லது தெளிவான படத்தைப் பதிவேற்றவும்.' : 'Please retake with proper focus and illumination, or upload a clearer file.')}
                      </p>
                      <button
                        onClick={handleRetake}
                        className="mt-2 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {isTa ? 'மீண்டும் எடுக்கவும்' : 'Retake Image'}
                      </button>
                    </div>
                  )}

                  {/* Extracted Text Box */}
                  {scanResult.extractedText && (
                    <div className="p-5 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block">
                          {isTa ? 'கண்டறியப்பட்ட தமிழ் உரை:' : 'Extracted Text:'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {scanResult.identification?.isKnownCorpusMatch ? 'CORPUS MATCHED' : 'REAL-TIME TRANSCRIPTION'}
                        </span>
                      </div>

                      <p className="font-tamil-serif text-lg font-bold text-stone-900 leading-relaxed pl-3 border-l-2 border-stone-800">
                        {scanResult.extractedText}
                      </p>

                      {scanResult.transliteration && (
                        <p className="text-xs font-mono text-stone-500 italic pt-1">
                          ISO 15919: {scanResult.transliteration}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mode-Specific Enriched Analysis */}
                  {/* 1. STUDENT MODE: Word-by-Word Sandhi Breakdown */}
                  {role === 'student' && scanResult.identification?.verse && (
                    <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                          {isTa ? 'சொல் பிரிப்பு & தேர்வு விளக்கம்' : 'Word Breakdown & Exam Explanation'}
                        </h4>
                        <span className="text-xs font-mono text-stone-500">
                          {isTa ? scanResult.identification.verse.workTitleTa : scanResult.identification.verse.workTitleEn}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {scanResult.identification.verse.vocabulary?.map((v: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs">
                            <div className="flex items-center justify-between font-tamil-serif font-bold text-stone-900">
                              <span>{v.word}</span>
                              <span className="text-[10px] font-mono text-stone-400">{v.pos}</span>
                            </div>
                            <p className="text-xs text-stone-700 font-tamil-sans mt-0.5">
                              {translateEn ? v.englishMeaning : v.classicalMeaningTa}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-lg bg-white border border-stone-200 text-xs font-tamil-sans text-stone-800">
                        <span className="font-bold text-stone-900 block mb-1">
                          {isTa ? 'தேர்வு உரை விளக்கம்:' : 'Canonical Explanation:'}
                        </span>
                        {translateEn 
                          ? scanResult.identification.verse.translations?.[0]?.text
                          : scanResult.identification.verse.commentaries?.[0]?.textTa}
                      </div>
                    </div>
                  )}

                  {/* 2. LEARNER MODE: Pronunciation & Audio Cadence */}
                  {role === 'learner' && scanResult.identification?.verse && (
                    <div className="space-y-4">
                      <AudioPronunciation
                        tamilText={scanResult.extractedText}
                        transliteration={scanResult.transliteration}
                        language={language}
                      />

                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2 text-xs font-tamil-sans">
                        <span className="font-bold text-amber-950 font-tamil-serif text-sm block">
                          {isTa ? 'வாழ்வியல் பண்பாட்டுக் குறிப்பு:' : 'Cultural Insight:'}
                        </span>
                        <p className="text-stone-700 leading-relaxed">
                          {translateEn 
                            ? scanResult.identification.verse.culturalContextEn 
                            : scanResult.identification.verse.culturalContextTa}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. RESEARCHER MODE: Critical Textual Variants & Collation */}
                  {role === 'researcher' && (
                    <div className="p-5 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-700">
                          {isTa ? 'சுவடிப் பாடபேதம் & ஆய்வு சான்றாதாரம்' : 'Manuscript Variants & Epigraphic Witnesses'}
                        </h4>
                        <span className="text-[11px] font-mono text-stone-500">
                          {isTa ? 'மூல நூல்' : 'Primary Source'}: {scanResult.identification?.verse?.primaryEvidenceReference || 'CICT Corpus'}
                        </span>
                      </div>

                      {scanResult.researchVariants && scanResult.researchVariants.length > 0 ? (
                        <div className="space-y-2">
                          {scanResult.researchVariants.map((varItem: any) => (
                            <div key={varItem.id} className="p-3 rounded-lg bg-white border border-stone-200 text-xs space-y-1">
                              <div className="flex items-center justify-between font-mono text-[11px]">
                                <span className="font-bold text-stone-900">{varItem.verseRef}</span>
                                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {isTa ? 'சுவடி பேதம்' : 'Variant'}
                                </span>
                              </div>
                              <p className="text-xs font-tamil-serif text-stone-800">
                                {isTa ? 'மூல பாடம்' : 'Base'}: <span className="font-bold text-stone-900">{varItem.baseReadingTa}</span> ➔ {isTa ? 'ஏட்டுப் பாடம்' : 'Variant'}: <span className="font-bold text-amber-900">{varItem.variantReadingTa}</span>
                              </p>
                              <p className="text-[11px] text-stone-600 font-tamil-sans pt-1">
                                {translateEn ? varItem.criticalAnalysisEn : varItem.criticalAnalysisTa}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-tamil-sans text-stone-500 italic">
                          {isTa 
                            ? 'இப்பாடலுக்கு நேரடி ஏட்டுப் பாடபேதம் பதிவாகவில்லை; மூலப் பாடம் துல்லியமாக உறுதிப்படுத்தப்பட்டுள்ளது.' 
                            : 'No direct manuscript variant recorded for this passage; standard critical text verified.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    {scanResult.identification?.verse && onSelectVerse && (
                      <button
                        onClick={() => {
                          onSelectVerse(scanResult.identification.verse);
                          onClose();
                        }}
                        className="px-4 py-2 bg-stone-900 text-stone-100 rounded-lg hover:bg-stone-800 text-xs font-mono font-medium flex items-center gap-2"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {isTa ? 'முழு ஆய்வுச் சான்றை விரித்து பார்' : 'View Full Evidence in Dossier'}
                      </button>
                    )}

                    {onSaveNote && scanResult.identification?.verse && (
                      <button
                        onClick={() => {
                          onSaveNote(
                            `${isTa ? 'ஸ்கேன் ஆய்வு' : 'Scan Research'}: ${scanResult.identification.verse.workTitleTa}`,
                            `${isTa ? 'கண்டறியப்பட்ட மூலப் பாடம்' : 'Identified text'}: ${scanResult.extractedText}\n${isTa ? 'பதிப்பு' : 'Edition'}: ${scanResult.identification.verse.canonicalSource}`
                          );
                          setIsNoteSaved(true);
                          setTimeout(() => setIsNoteSaved(false), 3000);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 border transition-colors ${
                          isNoteSaved
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        {isNoteSaved
                          ? (isTa ? '✓ குறிப்பில் சேர்க்கப்பட்டது' : '✓ Saved to Notebook')
                          : (isTa ? 'ஆய்வுக் குறிப்பில் சேமி' : 'Save to Notebook')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 font-mono">
          <span>YAAZH Multimodal Epigraphy & OCR</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded text-xs font-mono"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
