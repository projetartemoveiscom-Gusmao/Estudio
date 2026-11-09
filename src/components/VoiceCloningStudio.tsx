import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Sparkles,
  Dna,
  Volume2,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  User,
  ArrowRight,
  Info,
  Layers,
  FastForward,
} from 'lucide-react';
import { ClonedVoice, GeneratedAudio } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface VoiceCloningStudioProps {
  onUseClonedVoiceInStudio: (clonedVoice: ClonedVoice) => void;
}

export interface DemoVoiceSample {
  id: string;
  name: string;
  gender: 'male' | 'female';
  baseVoice: 'Charon' | 'Kore' | 'Puck';
  role: string;
  timbre: string;
  accent: string;
  text: string;
}

export const DEMO_VOICE_SAMPLES: DemoVoiceSample[] = [
  {
    id: 'fabio',
    name: 'Fábio - Locutor Comercial',
    gender: 'male',
    baseVoice: 'Charon',
    role: 'Locução Publicitária',
    timbre: 'Voz masculina grave, aveludada, confiante e ressonante',
    accent: 'Paulista contemporâneo (neutro/urbano)',
    text: 'Seja muito bem-vindo! Nossos projetos de móveis planejados sob medida combinam design contemporâneo, durabilidade e sofisticação para valorizar o seu espaço.',
  },
  {
    id: 'helena',
    name: 'Helena - Narradora Literária',
    gender: 'female',
    baseVoice: 'Kore',
    role: 'Audiolivro & Didático',
    timbre: 'Voz feminina suave, acolhedora, clara e muito articulada',
    accent: 'Neutro (Padrão Brasil contemporâneo)',
    text: 'A manhã começou com uma suave brisa entre as árvores douradas. A tecnologia agora nos permite criar novas narrativas com emoção, sensibilidade e profundidade.',
  },
  {
    id: 'lucas',
    name: 'Lucas - Criador & Podcast',
    gender: 'male',
    baseVoice: 'Puck',
    role: 'Podcasts & Redes Sociais',
    timbre: 'Voz masculina jovem, ágil, expressiva e dinâmica',
    accent: 'Carioca contemporâneo (descontraído)',
    text: 'Fala pessoal, tudo bem com vocês? No episódio de hoje vamos descobrir como a inteligência artificial está transformando a criação de voz e áudio no Brasil!',
  },
];

// Generates a valid 22.05kHz 16-bit PCM WAV blob simulating voice frequency
export function generateDemoWavBlob(sample: DemoVoiceSample): Blob {
  const sampleRate = 22050;
  const duration = 3.5;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  const baseFreq = sample.gender === 'female' ? 220 : sample.id === 'fabio' ? 125 : 155;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const syllable = Math.max(0, Math.sin(t * Math.PI * 3.5)) * (0.6 + 0.4 * Math.sin(t * 2));
    const f0 = baseFreq + Math.sin(t * 6) * 15;
    const sampleVal = (Math.sin(2 * Math.PI * f0 * t) * 0.6 + Math.sin(2 * Math.PI * (f0 * 2) * t) * 0.25) * syllable;
    const val = Math.floor(Math.max(-1, Math.min(1, sampleVal)) * 0x7fff);
    view.setInt16(44 + i * 2, val, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

const READING_PROMPTS = [
  'O vento suave soprava entre as montanhas enquanto o sol iluminava a manhã dourada. A inteligência artificial agora nos permite criar novas narrativas com emoção e autenticidade.',
  'Seja muito bem-vindo! Hoje vamos aprender como transformar ideias em realidade com tecnologia moderna, criatividade e uma comunicação clara e envolvente.',
  'Para criar móveis planejados sob medida, cada detalhe importa: o acabamento da madeira, a iluminação suave e a harmonia que transforma qualquer ambiente em um lar acolhedor.',
];

export const VoiceCloningStudio: React.FC<VoiceCloningStudioProps> = ({
  onUseClonedVoiceInStudio,
}) => {
  // Mode: Record, Upload or Demo Preset
  const [sourceMode, setSourceMode] = useState<'record' | 'upload' | 'demo'>('record');
  const [micBlocked, setMicBlocked] = useState<boolean>(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoVoiceSample | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [readingPromptIndex, setReadingPromptIndex] = useState<number>(0);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string>('Minha Voz Clonada');

  // Preview player for reference audio
  const [isPlayingReference, setIsPlayingReference] = useState<boolean>(false);
  const referenceAudioRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzedVoice, setAnalyzedVoice] = useState<ClonedVoice | null>(null);

  // Testing cloned voice state
  const [testText, setTestText] = useState<string>(
    'Olá! Esta é a minha voz clonada por inteligência artificial. Como você achou o resultado? Ficou bem parecido com a minha fala original!'
  );
  const [isGeneratingTest, setIsGeneratingTest] = useState<boolean>(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cloned voices library
  const [savedClonedVoices, setSavedClonedVoices] = useState<ClonedVoice[]>([]);

  // Load saved cloned voices from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cloned_voices_library');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedClonedVoices(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load cloned voices', e);
    }
  }, []);

  const saveClonedVoiceToLibrary = (voice: ClonedVoice) => {
    setSavedClonedVoices((prev) => {
      const filtered = prev.filter((v) => v.id !== voice.id);
      const updated = [voice, ...filtered];
      try {
        localStorage.setItem('cloned_voices_library', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save cloned voice to localStorage', e);
      }
      return updated;
    });
  };

  const deleteClonedVoice = (id: string) => {
    if (confirm('Deseja excluir esta voz clonada da sua biblioteca?')) {
      const updated = savedClonedVoices.filter((v) => v.id !== id);
      setSavedClonedVoices(updated);
      try {
        localStorage.setItem('cloned_voices_library', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to update localStorage', e);
      }
      if (analyzedVoice?.id === id) {
        setAnalyzedVoice(null);
      }
    }
  };

  // Start browser audio recording
  const startRecording = async () => {
    setAnalysisError(null);
    setMicBlocked(false);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de microfone não suportada pelo navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicBlocked(false);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Stop media stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 45) {
            stopRecording();
            return 45;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.message?.includes('Permission denied') ||
        err?.message?.includes('negada');

      if (isDenied) {
        setMicBlocked(true);
        setAnalysisError(
          'Permissão de microfone bloqueada pelo navegador. Ative a permissão de microfone nas configurações do seu navegador ou clique na aba "Amostras Prontas Demo" para testar a clonagem agora mesmo sem precisar de microfone.'
        );
      } else {
        setAnalysisError(err?.message || 'Não foi possível acessar o dispositivo de áudio.');
      }
    }
  };

  // Select pre-recorded demo voice sample for instant testing without physical microphone
  const handleSelectDemoSample = (sample: DemoVoiceSample) => {
    setAnalysisError(null);
    setMicBlocked(false);
    setSelectedDemo(sample);
    setVoiceName(sample.name);

    const blob = generateDemoWavBlob(sample);
    setRecordedAudioBlob(blob);
    const url = URL.createObjectURL(blob);
    setRecordedAudioUrl(url);

    if (referenceAudioRef.current) {
      referenceAudioRef.current.src = url;
      setIsPlayingReference(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Handle uploaded audio file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setAnalysisError('Por favor, selecione um arquivo de áudio válido (.mp3, .wav, .m4a, .ogg, .webm).');
      return;
    }

    setAnalysisError(null);
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);

    // Auto set name from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 25);
    if (!voiceName || voiceName === 'Minha Voz Clonada') {
      setVoiceName(`Voz: ${cleanName}`);
    }
  };

  // Helper to convert Blob to Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/*;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Process and analyze acoustic DNA with Gemini
  const handleAnalyzeAndClone = async () => {
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      let audioBlobToSend: Blob | null = null;
      let mimeType = 'audio/webm';

      if (sourceMode === 'record' || sourceMode === 'demo') {
        if (!recordedAudioBlob) {
          throw new Error('Por favor, grave alguns segundos de voz ou selecione uma amostra demonstrativa antes de clonar.');
        }
        audioBlobToSend = recordedAudioBlob;
        mimeType = recordedAudioBlob.type || 'audio/wav';
      } else {
        if (!uploadedFile) {
          throw new Error('Por favor, envie um arquivo de áudio para ser clonado.');
        }
        audioBlobToSend = uploadedFile;
        mimeType = uploadedFile.type || 'audio/mp3';
      }

      const base64Data = await blobToBase64(audioBlobToSend);

      const res = await fetch('/api/clone-voice/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType,
          customName: voiceName.trim() || 'Minha Voz Clonada',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao analisar a voz para clonagem.');
      }

      const newClonedVoice: ClonedVoice = {
        ...data.clonedVoice,
        name: voiceName.trim() || data.clonedVoice.name || 'Minha Voz Clonada',
        originalAudioSnippetUrl: sourceMode === 'record' ? recordedAudioUrl || '' : uploadedAudioUrl || '',
      };

      setAnalyzedVoice(newClonedVoice);
      saveClonedVoiceToLibrary(newClonedVoice);
    } catch (err: any) {
      setAnalysisError(err.message || 'Erro ao processar clonagem de voz.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Test speaking with the cloned voice
  const handleTestClonedVoice = async () => {
    if (!analyzedVoice) return;
    if (!testText.trim()) {
      alert('Digite um texto para testar a voz clonada.');
      return;
    }

    setIsGeneratingTest(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText.trim(),
          voice: analyzedVoice.baseVoice,
          gender: analyzedVoice.gender,
          clonedVoice: analyzedVoice,
          speed: 1.0,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao sintetizar áudio com a voz clonada.');
      }

      const url = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      setTestAudioUrl(url);

      if (testAudioRef.current) {
        testAudioRef.current.src = url;
        testAudioRef.current.play().then(() => setIsPlayingTest(true)).catch(console.error);
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Falha ao sintetizar teste com voz clonada.');
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const toggleReferencePlay = () => {
    if (!referenceAudioRef.current) return;
    if (isPlayingReference) {
      referenceAudioRef.current.pause();
      setIsPlayingReference(false);
    } else {
      referenceAudioRef.current.play().then(() => setIsPlayingReference(true)).catch(console.error);
    }
  };

  const toggleTestPlay = () => {
    if (!testAudioRef.current || !testAudioUrl) return;
    if (isPlayingTest) {
      testAudioRef.current.pause();
      setIsPlayingTest(false);
    } else {
      testAudioRef.current.play().then(() => setIsPlayingTest(true)).catch(console.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio players */}
      <audio
        ref={referenceAudioRef}
        onEnded={() => setIsPlayingReference(false)}
        src={sourceMode === 'record' ? recordedAudioUrl || undefined : uploadedAudioUrl || undefined}
      />
      <audio
        ref={testAudioRef}
        onEnded={() => setIsPlayingTest(false)}
      />

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-slate-800 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Dna className="w-3.5 h-3.5" />
              <span>Clonagem de Voz & Análise de DNA Vocal</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Clone Sua Própria Voz com Inteligência Artificial
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Grave alguns segundos da sua fala pelo microfone ou envie um arquivo de áudio. O Gemini extrai as propriedades acústicas (timbre, sotaque, tom e cadência) para criar uma réplica digital que lê qualquer texto com a sua voz!
            </p>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Grave de 5 a 20s de voz ou faça upload</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>A IA analisa o DNA vocal e cria o perfil</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>Sintetize qualquer novo texto com sua voz clonada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recording / Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Audio Input Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Dna className="w-4 h-4 text-emerald-400" />
                <span>Origem da Amostra de Voz</span>
              </label>

              {/* Toggle Record vs Upload vs Demo */}
              <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs gap-1">
                <button
                  type="button"
                  onClick={() => setSourceMode('record')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sourceMode === 'record'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Gravar Microfone</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sourceMode === 'upload'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Arquivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('demo')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                    sourceMode === 'demo'
                      ? 'bg-teal-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-teal-400 hover:text-teal-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Amostras Prontas Demo</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Microphone Recording */}
            {sourceMode === 'record' && (
              <div className="space-y-4">
                {/* Reading Prompt Guide */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Texto sugerido para ler em voz alta (grave de 5 a 20 segundos):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReadingPromptIndex((prev) => (prev + 1) % READING_PROMPTS.length)
                      }
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      Trocar Frase
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                    "{READING_PROMPTS[readingPromptIndex]}"
                  </p>
                </div>

                {/* Recorder Control Box */}
                <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                  {micBlocked ? (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left space-y-3 w-full">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Permissão de microfone bloqueada pelo navegador</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Para gravar diretamente pelo microfone: clique no ícone de configurações ou cadeado 🔒 na barra de endereços do seu navegador e marque a opção <strong>Microfone</strong> como <strong>Permitir</strong>.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Tentar Novamente</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceMode('demo')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Usar Amostras Prontas Demo</span>
                        </button>
                      </div>
                    </div>
                  ) : isRecording ? (
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-red-500/20 animate-ping absolute inset-0" />
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/40 relative z-10 transition-transform active:scale-95"
                        >
                          <Square className="w-7 h-7 fill-white" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xl font-mono font-bold text-red-400 flex items-center justify-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span>00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                        </div>
                        <p className="text-xs text-slate-400">Gravando sua voz... fale com clareza e ritmo natural!</p>
                      </div>
                      <AudioWaveform isPlaying={true} barCount={28} />
                    </>
                  ) : recordedAudioUrl ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={toggleReferencePlay}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-md transition-all"
                        >
                          {isPlayingReference ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                          <span>{isPlayingReference ? 'Pausar Áudio' : 'Ouvir Minha Gravação'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Regravar</span>
                        </button>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Gravação concluída ({recordingSeconds}s) pronta para clonagem!
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95"
                      >
                        <Mic className="w-8 h-8" />
                      </button>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-200">Clique para Iniciar a Gravação</h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          Fale perto do microfone com sua entonação habitual por cerca de 5 a 15 segundos.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Demo Pre-recorded Samples */}
            {sourceMode === 'demo' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 space-y-1">
                  <h4 className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Amostras Demonstrativas para Teste Imediato</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Selecione uma das vozes abaixo para carregar um áudio demonstrativo e testar a extração de DNA e clonagem em 1 clique, sem precisar de microfone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DEMO_VOICE_SAMPLES.map((sample) => {
                    const isSelected = selectedDemo?.id === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 shadow-md ring-1 ring-emerald-500/30'
                            : 'border-slate-800 bg-slate-950/70 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-100">{sample.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                              {sample.gender === 'female' ? '👩 Fem' : '👨 Masc'}
                            </span>
                          </div>
                          <span className="text-[10px] text-teal-300 font-medium block">
                            {sample.role}
                          </span>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {sample.timbre}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectDemoSample(sample)}
                          className={`w-full py-1.5 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Amostra Carregada</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Usar Esta Amostra</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {recordedAudioUrl && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2 truncate">
                      <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-200 font-medium truncate">
                        Amostra ativa: {voiceName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleReferencePlay}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0"
                    >
                      {isPlayingReference ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingReference ? 'Pausar' : 'Ouvir Amostra'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Audio File Upload */}
            {sourceMode === 'upload' && (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-950">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm text-slate-200">
                    {uploadedFile ? uploadedFile.name : 'Clique para escolher ou arraste um arquivo de áudio'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos suportados: .mp3, .wav, .m4a, .ogg, .webm (Recomendado: 5 a 60 segundos de fala)
                  </p>
                </label>

                {uploadedAudioUrl && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs text-slate-300 truncate font-medium">
                        {uploadedFile?.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={toggleReferencePlay}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0"
                    >
                      {isPlayingReference ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isPlayingReference ? 'Pausar' : 'Ouvir Arquivo'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cloned Voice Name Field */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">
                Nome para a Voz Clonada:
              </label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="Ex: Minha Voz Principal, Voz do Locutor X..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Action Trigger Button */}
            <div className="space-y-3 pt-2">
              {analysisError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isAnalyzing || ((sourceMode === 'record' || sourceMode === 'demo') ? !recordedAudioBlob : !uploadedFile)}
                onClick={handleAnalyzeAndClone}
                className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  isAnalyzing || ((sourceMode === 'record' || sourceMode === 'demo') ? !recordedAudioBlob : !uploadedFile)
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 shadow-emerald-500/25 active:scale-[0.99]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Analisando DNA Acústico com Gemini 3.8...</span>
                  </>
                ) : (
                  <>
                    <Dna className="w-5 h-5" />
                    <span>Extrair DNA Vocal & Clonar Voz</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Voice Profile Details & Live Testing (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {analyzedVoice ? (
            <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/40 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    {analyzedVoice.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{analyzedVoice.name}</h3>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {analyzedVoice.gender === 'female' ? '👩 Voz Feminina' : '👨 Voz Masculina'} • Base: {analyzedVoice.baseVoice}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onUseClonedVoiceInStudio(analyzedVoice)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                  title="Abrir no Estúdio de Texto em Áudio"
                >
                  <span>Usar no Estúdio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* DNA Attributes */}
              <div className="space-y-2 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 font-semibold block">Timbre Detectado:</span>
                  <span className="text-slate-200">{analyzedVoice.timbreDescription}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Sotaque / Entonação:</span>
                  <span className="text-slate-200">{analyzedVoice.accentDescription}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Cadência & Ritmo:</span>
                  <span className="text-slate-200">{analyzedVoice.cadenceDescription}</span>
                </div>
                {analyzedVoice.sampleTranscription && (
                  <div className="pt-1.5 border-t border-slate-800">
                    <span className="text-slate-500 font-mono text-[10px] block">Transcrição da amostra:</span>
                    <span className="text-slate-400 italic text-[11px]">"{analyzedVoice.sampleTranscription}"</span>
                  </div>
                )}
              </div>

              {/* Interactive Test Sandbox */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  Testar Voz Clonada em Novo Texto:
                </label>

                <textarea
                  rows={3}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Digite qualquer texto para ser falado com a voz clonada..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />

                <button
                  type="button"
                  disabled={isGeneratingTest}
                  onClick={handleTestClonedVoice}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isGeneratingTest
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                  }`}
                >
                  {isGeneratingTest ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Sintetizando com a voz clonada...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Falar Texto com Esta Voz Clonada</span>
                    </>
                  )}
                </button>

                {testAudioUrl && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                    <button
                      type="button"
                      onClick={toggleTestPlay}
                      className="flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      {isPlayingTest ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      <span>{isPlayingTest ? 'Pausar Teste' : 'Reproduzir Áudio Clonado'}</span>
                    </button>

                    <a
                      href={testAudioUrl}
                      download={`voz_clonada_${analyzedVoice.name.replace(/\s+/g, '_')}.wav`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Baixar arquivo WAV da voz clonada"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 border border-slate-700/60">
                <Dna className="w-7 h-7" />
              </div>
              <h4 className="font-semibold text-sm text-slate-200">Nenhuma Voz Clonada Ativa</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Grave pelo microfone ou envie um áudio à esquerda para extrair o DNA vocal e gerar sua primeira voz clonada.
              </p>
            </div>
          )}

          {/* Saved Cloned Voices Library */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Biblioteca de Vozes Clonadas ({savedClonedVoices.length})</span>
            </h4>

            {savedClonedVoices.length > 0 ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {savedClonedVoices.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 truncate">{v.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono">
                          {v.gender === 'female' ? '👩 Fem' : '👨 Masc'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {v.timbreDescription} • {v.accentDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setAnalyzedVoice(v);
                          setVoiceName(v.name);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                      >
                        Carregar
                      </button>
                      <button
                        onClick={() => onUseClonedVoiceInStudio(v)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center gap-1"
                        title="Usar esta voz no estúdio principal"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteClonedVoice(v.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                        title="Excluir voz clonada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                Suas vozes clonadas salvas aparecerão aqui para você reutilizar quando quiser.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
