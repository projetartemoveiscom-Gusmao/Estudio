import React, { useState, useRef, useEffect } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  Users,
  Mic,
  Sliders,
  Clock,
  Trash2,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
  Wand2,
  User,
  Globe2,
  Compass,
  Gauge,
} from 'lucide-react';
import { VoiceName, VoiceGender, VoiceOption, AccentOption, GeneratedAudio, ClonedVoice } from '../types';
import { AudioWaveform } from './AudioWaveform';

interface AudioStudioProps {
  onOpenGuide: () => void;
  onSendToChat?: (text: string) => void;
  onNavigateToClone?: () => void;
  initialText?: string;
  initialVoice?: VoiceName;
  initialClonedVoice?: ClonedVoice | null;
  initialStyle?: string;
}

const VOICES: VoiceOption[] = [
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'male',
    tag: 'Jovem & Enérgico',
    desc: 'Voz masculina expressiva e ágil, perfeita para podcasts modernos, vídeos de redes sociais e publicidade.',
    color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'male',
    tag: 'Grave & Cinematográfico',
    desc: 'Voz masculina profunda e autoritária, ideal para trailers, narrações épicas, documentários e storytelling.',
    color: 'border-blue-500/50 bg-blue-950/20 text-blue-400',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'male',
    tag: 'Firme & Corporativo',
    desc: 'Voz masculina segura, com excelente dicção formal para jornalismo, palestras e comunicados institucionais.',
    color: 'border-amber-500/50 bg-amber-950/20 text-amber-400',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'female',
    tag: 'Suave & Acolhedora',
    desc: 'Voz feminina elegante, clara e muito articulada, perfeita para audiolivros, tutoriais e assistentes virtuais.',
    color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'female',
    tag: 'Serena & Melodiosa',
    desc: 'Voz feminina tranquila e relaxante, ótima para meditação guiada, histórias infantis, poesia e bem-estar.',
    color: 'border-purple-500/50 bg-purple-950/20 text-purple-400',
  },
];

const ACCENT_OPTIONS: AccentOption[] = [
  {
    id: 'neutral',
    label: 'Neutro (Padrão Brasil)',
    region: 'Nacional',
    flag: '🇧🇷',
    desc: 'Pronúncia padrão brasileira, sem regionalismos marcados',
  },
  {
    id: 'Sotaque Paulista contemporâneo (São Paulo, dicção dinâmica e urbana)',
    label: 'Paulista',
    region: 'Sudeste',
    flag: '🏙️',
    desc: 'Ritmo moderno e cadência típica da capital paulista',
  },
  {
    id: 'Sotaque Carioca autêntico (Rio de Janeiro, com chiado característico e entonação melódica descontraída)',
    label: 'Carioca',
    region: 'Sudeste',
    flag: '🏖️',
    desc: 'Entonação melódica com o tradicional chiado carioca',
  },
  {
    id: 'Sotaque Nordestino acolhedor e expressivo (vogais abertas, musical e caloroso)',
    label: 'Nordestino',
    region: 'Nordeste',
    flag: '🌵',
    desc: 'Expressivo, rítmico, caloroso e de vogais abertas',
  },
  {
    id: 'Sotaque Mineiro suave e cantado (cadenciado, acolhedor e pausado)',
    label: 'Mineiro',
    region: 'Sudeste',
    flag: '☕',
    desc: 'Suave, amigável e com cadência cantada de Minas Gerais',
  },
  {
    id: 'Sotaque Gaúcho / Sulista (forte, rítmico, com cadência característica do Sul)',
    label: 'Gaúcho / Sul',
    region: 'Sul',
    flag: '🧉',
    desc: 'Entonação marcante, firme e rítmica do Sul do Brasil',
  },
  {
    id: 'Português de Portugal autêntico (sotaque europeu lusitano, dicção formal e tradicional)',
    label: 'Português Europeu',
    region: 'Portugal',
    flag: '🇵🇹',
    desc: 'Sotaque lusitano tradicional com fonética europeia autêntica',
  },
  {
    id: 'Inglês com pronúncia internacional clara (American English accent)',
    label: 'Inglês / Global',
    region: 'Internacional',
    flag: '🌎',
    desc: 'Pronúncia bilíngue fluente para conteúdos internacionais',
  },
];

const SPEED_PRESETS = [
  { value: 0.75, label: '0.75x Lenta', desc: 'Didática & Pausada', icon: '🐢' },
  { value: 0.85, label: '0.85x Calma', desc: 'Cadenciada', icon: '⏳' },
  { value: 1.0, label: '1.0x Normal', desc: 'Conversa Natural', icon: '🎯' },
  { value: 1.25, label: '1.25x Ágil', desc: 'Dinâmica', icon: '🚀' },
  { value: 1.5, label: '1.5x Rápida', desc: 'Acelerada & Notícias', icon: '⚡' },
];

const STYLE_PRESETS = [
  { label: '🎙️ Locutor Comercial', prompt: 'Locutor profissional com energia alta e entusiasmo publicitário' },
  { label: '🎧 Podcast Descontraído', prompt: 'Apresentador de podcast jovem, informal e muito espontâneo' },
  { label: '📖 Narrador de Audiolivro', prompt: 'Narrador envolvente, expressivo e com ritmo pausado de literatura' },
  { label: '🧘 Calmo & Meditativo', prompt: 'Voz serena, suave, respirada e com tom relaxante e desacelerado' },
  { label: '⚡ Noticiário Urgente', prompt: 'Jornalista sério, rápido, informativo e objetivo' },
  { label: '🎭 Dramático & Emocional', prompt: 'Interpretação teatral, profunda e comovente' },
];

const SAMPLE_TEXTS = [
  {
    title: 'Apresentação & Demonstração',
    text: 'Olá! Seja muito bem-vindo ao estúdio de voz com inteligência artificial. <breath> Aqui você pode converter qualquer texto em áudio realista, escolher entre vozes masculinas e femininas, ajustar sotaques regionais e controlar a velocidade da fala. <laugh> É simples, rápido e de alta qualidade!',
    style: 'Acolhedor, dinâmico e amigável',
    voice: 'Puck' as VoiceName,
    accent: 'neutral',
    speed: 1.0,
  },
  {
    title: 'Chamada Comercial',
    text: 'Você já imaginou transformar a comunicação da sua marca com tecnologia de ponta? Conheça nossos móveis planejados sob medida com acabamento impecável. Solicite seu orçamento hoje mesmo!',
    style: 'Locutor profissional com tom sofisticado e persuasivo',
    voice: 'Charon' as VoiceName,
    accent: 'Sotaque Paulista contemporâneo (São Paulo, dicção dinâmica e urbana)',
    speed: 1.15,
  },
  {
    title: 'Podcast com Risadas & Reações',
    text: 'E aí pessoal, tudo bem com vocês? <breath> Olha só o que aconteceu hoje no estúdio! |yeah| A gente testou o novo modelo de voz com controle de sotaques e o resultado ficou inacreditável. <laugh> Confiram só!',
    style: 'Apresentador de podcast descontraído e empolgado',
    voice: 'Puck' as VoiceName,
    accent: 'Sotaque Carioca autêntico (Rio de Janeiro, com chiado característico e entonação melódica descontraída)',
    speed: 1.25,
  },
  {
    title: 'Minuto de Relaxamento',
    text: 'Feche os olhos por um instante. <breath> Respire profundamente... inspire calma, expire todas as preocupações. Este é o seu momento de paz e renovação.',
    style: 'Guia de meditação sereno, suave e desacelerado',
    voice: 'Zephyr' as VoiceName,
    accent: 'neutral',
    speed: 0.8,
  },
];

export const AudioStudio: React.FC<AudioStudioProps> = ({
  onOpenGuide,
  onSendToChat,
  onNavigateToClone,
  initialText,
  initialVoice,
  initialClonedVoice,
  initialStyle,
}) => {
  const [text, setText] = useState<string>(
    initialText ||
      'Olá! Seja bem-vindo ao conversor de texto em voz com Gemini 3.8 Flash TTS. <breath> Agora você pode escolher entre vozes masculinas e femininas, experimentar diferentes sotaques e ajustar a velocidade de leitura da fala! <laugh>'
  );

  // Voice Selection State
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(initialVoice || 'Puck');
  const [selectedAccent, setSelectedAccent] = useState<string>('neutral');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0); // Generation & reading speed
  const [customAccent, setCustomAccent] = useState<string>('');
  const [showCustomAccentInput, setShowCustomAccentInput] = useState<boolean>(false);

  const [selectedStyle, setSelectedStyle] = useState<string>(
    initialStyle || 'Entusiasta, voz clara e expressiva com dicção impecável'
  );

  // Dual Speaker Mode State
  const [isDualMode, setIsDualMode] = useState<boolean>(false);
  const [dialogueLines, setDialogueLines] = useState<
    { speaker: string; voice: VoiceName; text: string; style: string; accent?: string }[]
  >([
    {
      speaker: 'Alex',
      voice: 'Puck',
      text: 'Fala Sam! <breath> Você viu que agora dá para ajustar o sotaque e acelerar a velocidade de leitura da fala?',
      style: 'Entusiasta e curioso',
      accent: 'Paulista',
    },
    {
      speaker: 'Sam',
      voice: 'Kore',
      text: 'Com certeza, Alex! |yeah| Agora podemos escolher vozes masculinas e femininas com entonação regional perfeita para podcasts e audiolivros. <laugh>',
      style: 'Articulada e animada',
      accent: 'Carioca',
    },
  ]);

  // Loading & Playback states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioHistory, setAudioHistory] = useState<GeneratedAudio[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cloned Voice State
  const [activeClonedVoice, setActiveClonedVoice] = useState<ClonedVoice | null>(
    initialClonedVoice || null
  );
  const [savedClonedVoices, setSavedClonedVoices] = useState<ClonedVoice[]>([]);
  const [voiceSourceTab, setVoiceSourceTab] = useState<'standard' | 'cloned'>(
    initialClonedVoice ? 'cloned' : 'standard'
  );

  // Sync props if changed externally
  useEffect(() => {
    if (initialText) setText(initialText);
    if (initialVoice) setSelectedVoice(initialVoice);
    if (initialStyle) setSelectedStyle(initialStyle);
    if (initialClonedVoice) {
      setActiveClonedVoice(initialClonedVoice);
      setVoiceSourceTab('cloned');
    }
  }, [initialText, initialVoice, initialStyle, initialClonedVoice]);

  // Load history & cloned voices from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tts_audio_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAudioHistory(parsed);
          if (parsed.length > 0 && !currentAudio) {
            setCurrentAudio(parsed[0]);
          }
        }
      }

      const savedClones = localStorage.getItem('cloned_voices_library');
      if (savedClones) {
        const parsedClones = JSON.parse(savedClones);
        if (Array.isArray(parsedClones)) {
          setSavedClonedVoices(parsedClones);
        }
      }
    } catch (e) {
      console.warn('Could not load history from localStorage', e);
    }
  }, []);

  // Filtered voices list according to gender selection
  const filteredVoices = VOICES.filter((v) => {
    if (genderFilter === 'male') return v.gender === 'male';
    if (genderFilter === 'female') return v.gender === 'female';
    return true;
  });

  const handleGenderFilterChange = (filter: 'all' | 'male' | 'female') => {
    setGenderFilter(filter);
    // If the currently selected voice doesn't match the new gender filter, auto-select a compatible one
    if (filter === 'male') {
      const current = VOICES.find((v) => v.id === selectedVoice);
      if (current?.gender !== 'male') {
        setSelectedVoice('Puck');
      }
    } else if (filter === 'female') {
      const current = VOICES.find((v) => v.id === selectedVoice);
      if (current?.gender !== 'female') {
        setSelectedVoice('Kore');
      }
    }
  };

  // Save history
  const saveToHistory = (newAudio: GeneratedAudio) => {
    setAudioHistory((prev) => {
      const updated = [newAudio, ...prev.slice(0, 19)];
      try {
        localStorage.setItem('tts_audio_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed saving to localStorage', err);
      }
      return updated;
    });
  };

  // Insert vocal burst reaction tag into text
  const insertTag = (tag: string) => {
    if (!textareaRef.current) {
      setText((prev) => `${prev} ${tag} `);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = text.substring(0, start) + ` ${tag} ` + text.substring(end);
    setText(newText);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
      }
    }, 50);
  };

  // Calculate estimated speaking time based on word count & speed
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.max(1, Math.round((wordCount / (135 * speechSpeed)) * 60));

  // Convert text to speech
  const handleGenerateAudio = async () => {
    setErrorMessage(null);
    setInfoNotice(null);
    setIsLoading(true);

    try {
      let bodyData: any;
      const effectiveAccent = showCustomAccentInput && customAccent.trim()
        ? customAccent.trim()
        : selectedAccent;

      const currentVoiceObj = VOICES.find((v) => v.id === selectedVoice);

      if (isDualMode) {
        bodyData = {
          isDual: true,
          dialogue: dialogueLines,
          speed: speechSpeed,
        };
      } else {
        if (!text.trim()) {
          throw new Error('Por favor, digite ou cole um texto para ser convertido em voz.');
        }

        if (activeClonedVoice) {
          bodyData = {
            text: text.trim(),
            voice: activeClonedVoice.baseVoice,
            gender: activeClonedVoice.gender,
            clonedVoice: activeClonedVoice,
            accent: effectiveAccent !== 'neutral' ? effectiveAccent : activeClonedVoice.accentDescription,
            speed: speechSpeed,
            style: selectedStyle,
          };
        } else {
          bodyData = {
            text: text.trim(),
            voice: selectedVoice,
            gender: currentVoiceObj?.gender || 'male',
            accent: effectiveAccent,
            speed: speechSpeed,
            style: selectedStyle,
          };
        }
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar o áudio. Tente novamente.');
      }

      if (data.isQuotaNotice && data.notice) {
        setInfoNotice(data.notice);
      }

      const audioUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
      const newAudioItem: GeneratedAudio = {
        id: `aud-${Date.now()}`,
        text: isDualMode
          ? dialogueLines.map((d) => `${d.speaker}: ${d.text}`).join('\n')
          : text,
        voice: activeClonedVoice ? activeClonedVoice.name : selectedVoice,
        isCloned: Boolean(activeClonedVoice),
        clonedVoiceName: activeClonedVoice ? activeClonedVoice.name : undefined,
        gender: activeClonedVoice ? activeClonedVoice.gender : (currentVoiceObj?.gender || 'male'),
        accent: effectiveAccent,
        speed: speechSpeed,
        style: selectedStyle,
        audioUrl,
        timestamp: Date.now(),
        isDual: isDualMode,
      };

      setCurrentAudio(newAudioItem);
      saveToHistory(newAudioItem);
      setPlaybackSpeed(speechSpeed);

      // Play audio automatically
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.playbackRate = speechSpeed;
        audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.log('Autoplay prevented', e));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar conversão de áudio.');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio element event listeners
  const togglePlayPause = () => {
    if (!audioRef.current || !currentAudio) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleDownload = (audioItem: GeneratedAudio) => {
    const a = document.createElement('a');
    a.href = audioItem.audioUrl;
    const cleanTitle = audioItem.text.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_') || 'audio';
    a.download = `voz_${cleanTitle}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const clearHistory = () => {
    if (confirm('Deseja limpar todo o histórico de áudios salvos?')) {
      setAudioHistory([]);
      localStorage.removeItem('tts_audio_history');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Hero explanation banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Mic className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash TTS • Vozes Masculinas e Femininas • Sotaques & Velocidade</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Conversor de Texto em Voz com Ajuste Completo
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Personalize sua fala: escolha entre <strong className="text-slate-200">vozes masculinas ou femininas</strong>, aplique <strong className="text-slate-200">sotaques regionais</strong> (Paulista, Carioca, Nordestino, Mineiro, Gaúcho, Portugal) e ajuste com precisão a <strong className="text-slate-200">velocidade de leitura da fala</strong> (de 0.5x até 2.0x).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenGuide}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Guia Passo a Passo</span>
            </button>
          </div>
        </div>

        {/* 4 Feature Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <span>Voz Masculina ou Feminina</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <span>Sotaques Regionais & Globais</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <span>Velocidade de Leitura (0.5x a 2x)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">
              4
            </span>
            <span>Áudio WAV Studio (24kHz)</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input & Voice Configuration (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Text input card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span>Texto para Falar</span>
                <span className="text-xs font-normal text-slate-400">
                  ({text.length} caracteres • ~{wordCount} palavras • ~{estimatedSeconds}s de fala)
                </span>
              </label>

              {/* Mode switch: Single vs Dual speaker */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setIsDualMode(false)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    !isDualMode
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Voz Única
                </button>
                <button
                  type="button"
                  onClick={() => setIsDualMode(true)}
                  className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                    isDualMode
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Diálogo em Dupla</span>
                </button>
              </div>
            </div>

            {!isDualMode ? (
              <>
                {/* Text Area */}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    rows={5}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Digite aqui o que você quer que a voz fale..."
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-y"
                  />
                </div>

                {/* Vocal Bursts Tags (Human Reactions) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Inserir Expressões Vocais Humanas (clique para adicionar no texto):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertTag('<breath>')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500 border border-slate-700 text-xs font-mono text-cyan-300 transition-all flex items-center gap-1.5"
                      title="Inserir som sutil de respiração natural"
                    >
                      <span>&lt;breath&gt;</span>
                      <span className="text-[10px] text-slate-400 font-sans">(Respiração)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => insertTag('<laugh>')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500 border border-slate-700 text-xs font-mono text-cyan-300 transition-all flex items-center gap-1.5"
                      title="Inserir risada ou gargalhada"
                    >
                      <span>&lt;laugh&gt;</span>
                      <span className="text-[10px] text-slate-400 font-sans">(Risada)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => insertTag('<gasp>')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500 border border-slate-700 text-xs font-mono text-cyan-300 transition-all flex items-center gap-1.5"
                      title="Inserir suspiro ou som de surpresa"
                    >
                      <span>&lt;gasp&gt;</span>
                      <span className="text-[10px] text-slate-400 font-sans">(Suspiro/Susto)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => insertTag('|yeah|')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500 border border-slate-700 text-xs font-mono text-emerald-300 transition-all flex items-center gap-1.5"
                      title="Inserir concordância casual 'Yeah'"
                    >
                      <span>|yeah|</span>
                      <span className="text-[10px] text-slate-400 font-sans">(Concordância)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => insertTag('|mhm|')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:border-cyan-500 border border-slate-700 text-xs font-mono text-emerald-300 transition-all flex items-center gap-1.5"
                      title="Inserir som de afirmação 'Mhm'"
                    >
                      <span>|mhm|</span>
                      <span className="text-[10px] text-slate-400 font-sans">(Uhum / Afirmação)</span>
                    </button>
                  </div>
                </div>

                {/* Sample Templates */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-medium">
                    Exemplos prontos com diferentes vozes e velocidades:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SAMPLE_TEXTS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setText(sample.text);
                          setSelectedVoice(sample.voice);
                          setSelectedStyle(sample.style);
                          setSelectedAccent(sample.accent);
                          setSpeechSpeed(sample.speed);
                        }}
                        className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-white transition-all group"
                      >
                        <span className="font-semibold block truncate group-hover:text-cyan-400">
                          {sample.title}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {sample.voice} • {sample.speed}x
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Dual Speaker Dialogue Mode */
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Crie conversas naturais entre dois locutores para podcasts, roteiros e entrevistas.
                </p>
                {dialogueLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center">
                          {line.speaker[0]}
                        </span>
                        <input
                          type="text"
                          value={line.speaker}
                          onChange={(e) => {
                            const updated = [...dialogueLines];
                            updated[idx].speaker = e.target.value;
                            setDialogueLines(updated);
                          }}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 font-semibold focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Voz:</span>
                          <select
                            value={line.voice}
                            onChange={(e) => {
                              const updated = [...dialogueLines];
                              updated[idx].voice = e.target.value as VoiceName;
                              setDialogueLines(updated);
                            }}
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                          >
                            <optgroup label="👨 Vozes Masculinas">
                              <option value="Puck">Puck (Jovem/Enérgico)</option>
                              <option value="Charon">Charon (Grave/Cinema)</option>
                              <option value="Fenrir">Fenrir (Firme/Notícias)</option>
                            </optgroup>
                            <optgroup label="👩 Vozes Femininas">
                              <option value="Kore">Kore (Suave/Elegante)</option>
                              <option value="Zephyr">Zephyr (Serena/Calma)</option>
                            </optgroup>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-400">Sotaque:</span>
                          <input
                            type="text"
                            value={line.accent || ''}
                            onChange={(e) => {
                              const updated = [...dialogueLines];
                              updated[idx].accent = e.target.value;
                              setDialogueLines(updated);
                            }}
                            placeholder="Ex: Paulista, Carioca, Nordestino..."
                            className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={line.text}
                      onChange={(e) => {
                        const updated = [...dialogueLines];
                        updated[idx].text = e.target.value;
                        setDialogueLines(updated);
                      }}
                      className="w-full bg-slate-900/90 border border-slate-700/70 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Entonação:</span>
                      <input
                        type="text"
                        value={line.style}
                        onChange={(e) => {
                          const updated = [...dialogueLines];
                          updated[idx].style = e.target.value;
                          setDialogueLines(updated);
                        }}
                        placeholder="Ex: Entusiasmado, curioso, rindo..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1. Voice Selection (Standard Voices vs Cloned Voices) */}
          {!isDualMode && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              {/* Voice Source Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceSourceTab('standard');
                      setActiveClonedVoice(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      voiceSourceTab === 'standard' && !activeClonedVoice
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Vozes de Estúdio ({VOICES.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVoiceSourceTab('cloned');
                      if (savedClonedVoices.length > 0 && !activeClonedVoice) {
                        setActiveClonedVoice(savedClonedVoices[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                      voiceSourceTab === 'cloned' || activeClonedVoice
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-emerald-300 bg-slate-950'
                    }`}
                  >
                    <span>🧬</span>
                    <span>Minhas Vozes Clonadas ({savedClonedVoices.length})</span>
                  </button>
                </div>

                {onNavigateToClone && (
                  <button
                    type="button"
                    onClick={onNavigateToClone}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span>+ Gravar/Clonar Nova Voz</span>
                  </button>
                )}
              </div>

              {/* Active Cloned Voice Alert Banner */}
              {activeClonedVoice && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🧬</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-xs font-bold">{activeClonedVoice.name}</strong>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          {activeClonedVoice.gender === 'female' ? '👩 Voz Feminina' : '👨 Voz Masculina'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        {activeClonedVoice.timbreDescription} • {activeClonedVoice.accentDescription}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveClonedVoice(null);
                      setVoiceSourceTab('standard');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline shrink-0"
                  >
                    Desativar clonagem e usar voz padrão
                  </button>
                </div>
              )}

              {/* TAB 1: Standard Voices */}
              {voiceSourceTab === 'standard' && !activeClonedVoice && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300">
                        Vozes Nativas do Gemini 3.8 Flash TTS
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Selecione por gênero ou timbre característico
                      </p>
                    </div>

                    {/* Male vs Female Gender Tabs */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGenderFilterChange('all')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                          genderFilter === 'all'
                            ? 'bg-slate-800 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todas ({VOICES.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderFilterChange('male')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                          genderFilter === 'male'
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-blue-300'
                        }`}
                      >
                        <span>👨 Masculinas (3)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGenderFilterChange('female')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                          genderFilter === 'female'
                            ? 'bg-purple-600 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-purple-300'
                        }`}
                      >
                        <span>👩 Femininas (2)</span>
                      </button>
                    </div>
                  </div>

                  {/* Voice Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {filteredVoices.map((v) => {
                      const isSelected = selectedVoice === v.id && !activeClonedVoice;
                      const isMale = v.gender === 'male';
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVoice(v.id);
                            setActiveClonedVoice(null);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? `${v.color} shadow-md ring-2 ring-cyan-500/30`
                              : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-sm text-slate-100">{v.name}</span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                                  isMale
                                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                                    : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                                }`}
                              >
                                {isMale ? '👨 Masculina' : '👩 Feminina'}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[11px] font-medium block mb-1 text-cyan-300/90">
                            {v.tag}
                          </span>
                          <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                            {v.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* TAB 2: Cloned Voices List */}
              {(voiceSourceTab === 'cloned' || activeClonedVoice) && (
                <div className="space-y-3">
                  {savedClonedVoices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {savedClonedVoices.map((cloned) => {
                        const isSelected = activeClonedVoice?.id === cloned.id;
                        return (
                          <button
                            key={cloned.id}
                            type="button"
                            onClick={() => {
                              setActiveClonedVoice(cloned);
                              setVoiceSourceTab('cloned');
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md ring-2 ring-emerald-500/40'
                                : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-slate-100">{cloned.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
                                  {cloned.gender === 'female' ? '👩 Feminina' : '👨 Masculina'}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950">
                                  ATIVA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                              {cloned.timbreDescription}
                            </p>
                            <span className="text-[10px] text-emerald-400/80 block mt-1">
                              Sotaque: {cloned.accentDescription} • Base: {cloned.baseVoice}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                      <p className="text-xs text-slate-400">
                        Você ainda não possui nenhuma voz clonada salva.
                      </p>
                      {onNavigateToClone && (
                        <button
                          type="button"
                          onClick={onNavigateToClone}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                        >
                          <span>Gravar ou Enviar Áudio para Clonar</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Accents Selection (Sotaques Regionais e Internacionais) */}
          {!isDualMode && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-emerald-400" />
                    <span>Sotaques & Regionalismos</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione a pronúncia e entonação regional desejada para a locução.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCustomAccentInput(!showCustomAccentInput)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
                >
                  {showCustomAccentInput ? 'Fechar Personalizado' : 'Digitar Outro Sotaque'}
                </button>
              </div>

              {showCustomAccentInput ? (
                <div className="space-y-2 p-3 rounded-xl bg-slate-950 border border-cyan-800/50">
                  <label className="text-xs font-semibold text-cyan-300">
                    Definir Sotaque Personalizado:
                  </label>
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    placeholder="Ex: Sotaque Baiano clássico, Sotaque Pernambucano, Italiano cantado..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    O modelo adaptará o ritmo e a fonética ao estilo especificado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ACCENT_OPTIONS.map((acc) => {
                    const isSelected = selectedAccent === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setSelectedAccent(acc.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md shadow-emerald-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{acc.flag}</span>
                          <span className="font-bold text-xs truncate text-slate-200">
                            {acc.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight">
                          {acc.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Speech Reading Speed (Velocidade da Fala / Velocidade de Leitura) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span>Velocidade de Leitura da Fala</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste o ritmo: diminua para locuções calmas e didáticas, ou aumente para podcasts ágeis e resumos.
                </p>
              </div>

              {/* Speed Badge */}
              <div className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm">
                <span>{speechSpeed.toFixed(2)}x</span>
                <span className="text-[10px] font-normal text-amber-400/80">
                  {speechSpeed < 0.9 ? '(Lenta)' : speechSpeed > 1.15 ? '(Rápida)' : '(Padrão)'}
                </span>
              </div>
            </div>

            {/* Speed Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">🐢 0.5x (Muito Lenta)</span>
                <span className="flex items-center gap-1 text-slate-300 font-semibold">
                  1.0x (Humana Normal)
                </span>
                <span className="flex items-center gap-1">⚡ 2.0x (Ultra Rápida)</span>
              </div>

              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.05}
                value={speechSpeed}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
              />
            </div>

            {/* Quick Speed Preset Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SPEED_PRESETS.map((preset) => {
                const isActive = Math.abs(speechSpeed - preset.value) < 0.03;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSpeechSpeed(preset.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/20 text-amber-200 font-semibold shadow-sm'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Style & Vocal Emotion Selector */}
          {!isDualMode && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Estilo & Entonação Vocal Complementar</span>
                <span className="text-[11px] text-slate-500">
                  Instrução emotiva para a voz
                </span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {STYLE_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedStyle(p.prompt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                      selectedStyle === p.prompt
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                placeholder="Personalize o estilo: ex. Locutor de rádio fm, voz sussurrada e relaxante..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="space-y-3">
            {infoNotice && (
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold text-cyan-300">Áudio Demonstrativo Gerado</strong>
                  <span className="text-slate-300 text-[11px] leading-relaxed block mt-0.5">{infoNotice}</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Não foi possível gerar o áudio:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerateAudio}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
                isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Sintetizando Voz ({speechSpeed.toFixed(2)}x) com Gemini 3.8 Flash TTS...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>Converter Texto em Áudio (Gerar WAV)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Audio Player & History (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Audio Player Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Reprodutor de Áudio de Estúdio</span>
              </h3>
              {currentAudio && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-cyan-400 border border-slate-700">
                  WAV • 24kHz
                </span>
              )}
            </div>

            {currentAudio ? (
              <div className="space-y-4">
                {/* Visualizer Waveform */}
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 flex flex-col items-center justify-center">
                  <AudioWaveform isPlaying={isPlaying} barCount={32} />
                  <p className="text-[11px] text-slate-400 mt-2 text-center line-clamp-2 px-2 italic">
                    "{currentAudio.text.slice(0, 120)}..."
                  </p>
                </div>

                {/* Progress / Seek bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Playback speed selector for real-time player speed */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handlePlaybackSpeedChange(speed)}
                        className={`px-1.5 py-0.5 rounded font-mono transition-all ${
                          playbackSpeed === speed
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title={`Velocidade de reprodução ${speed}x`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  {/* Play / Pause button */}
                  <button
                    onClick={togglePlayPause}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
                  </button>

                  {/* Download button */}
                  <button
                    onClick={() => handleDownload(currentAudio)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Baixar arquivo WAV"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Baixar WAV</span>
                  </button>
                </div>

                {/* Metadata details pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{currentAudio.voice}</span>
                    <span>•</span>
                    <span className="text-cyan-400">
                      {currentAudio.gender === 'female' ? '👩 Feminina' : '👨 Masculina'}
                    </span>
                    {currentAudio.speed && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-mono">{currentAudio.speed}x</span>
                      </>
                    )}
                  </div>
                  {currentAudio.accent && currentAudio.accent !== 'neutral' && (
                    <span className="text-emerald-400 truncate max-w-[140px]">
                      {currentAudio.accent.slice(0, 18)}...
                    </span>
                  )}
                </div>

                {/* Quick actions: Send to chatbot */}
                {onSendToChat && (
                  <button
                    onClick={() => onSendToChat(currentAudio.text)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-cyan-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Continuar conversa sobre este texto no Chat</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <Volume2 className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Nenhum áudio gerado ainda. Selecione sua voz, velocidade e clique em "Converter Texto em Áudio"!
                </p>
              </div>
            )}
          </div>

          {/* History List Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Histórico de Gerações ({audioHistory.length})
                </h3>
              </div>
              {audioHistory.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {audioHistory.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {audioHistory.map((item) => {
                  const isCurrent = currentAudio?.id === item.id;
                  const isFemale = item.gender === 'female' || item.voice === 'Kore' || item.voice === 'Zephyr';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'border-cyan-500/50 bg-cyan-950/20'
                          : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-800/40'
                      }`}
                    >
                      <button
                        onClick={() => {
                          setCurrentAudio(item);
                          if (audioRef.current) {
                            audioRef.current.src = item.audioUrl;
                            audioRef.current.playbackRate = playbackSpeed;
                            audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
                          }
                        }}
                        className="flex-1 min-w-0 text-left flex items-start gap-2.5"
                      >
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-200 truncate font-medium">
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <span className="text-cyan-400 font-semibold">{item.voice}</span>
                            <span>•</span>
                            <span>{isFemale ? '👩 Feminina' : '👨 Masculina'}</span>
                            {item.speed && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-amber-400">{item.speed}x</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleDownload(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Baixar WAV"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Seus áudios convertidos com configurações de voz e velocidade ficarão salvos aqui.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
