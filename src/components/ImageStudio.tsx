import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Maximize2,
  X,
  Volume2,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  Copy,
  Check,
  Wand2,
} from 'lucide-react';
import { ImageSize, AspectRatio, GeneratedImage } from '../types';

interface ImageStudioProps {
  onSendToAudio?: (caption: string) => void;
}

const SIZE_OPTIONS: { id: ImageSize; label: string; resolution: string; desc: string }[] = [
  {
    id: '1K',
    label: '1K Padrão',
    resolution: '1024 × 1024',
    desc: 'Rápido, ideal para prévias e redes sociais',
  },
  {
    id: '2K',
    label: '2K Alta Definição',
    resolution: '2048 × 2048',
    desc: 'Equilíbrio excelente entre detalhamento e nitidez',
  },
  {
    id: '4K',
    label: '4K Ultra Definição',
    resolution: '4096 × 4096',
    desc: 'Máxima resolução, riqueza extrema de texturas e iluminação',
  },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; desc: string; iconSize: string }[] = [
  { id: '1:1', label: '1:1', desc: 'Quadrado (Feed)', iconSize: 'w-4 h-4' },
  { id: '16:9', label: '16:9', desc: 'Widescreen (Vídeo)', iconSize: 'w-5 h-3' },
  { id: '9:16', label: '9:16', desc: 'Vertical (Stories/Reels)', iconSize: 'w-3 h-5' },
  { id: '4:3', label: '4:3', desc: 'Clássico', iconSize: 'w-4 h-3.5' },
  { id: '3:4', label: '3:4', desc: 'Retrato', iconSize: 'w-3.5 h-4' },
];

const PROMPT_SUGGESTIONS = [
  {
    title: 'Estúdio de Gravação Moderno',
    prompt: 'Um estúdio de gravação de áudio e podcast futurista com iluminação indireta neon ciano e roxo, microfone condensador vintage em primeiro plano, mesa de mixagem iluminada e painéis acústicos sofisticados em madeira escura, fotografia cinematográfica ultra-detalhada.',
  },
  {
    title: 'Móveis Planejados de Luxo',
    prompt: 'Sala de estar contemporânea com móveis planejados sob medida em lâmina de nogueira natural, painel ripado iluminado por LED suave, sofá minimalista em linho bege, vista para jardim interno, render arquitetônico fotorrealista com iluminação natural matutina.',
  },
  {
    title: 'Ondas Sonoras Visuais',
    prompt: 'Representação abstrata e artística de ondas sonoras e frequências vocais fluindo no ar como filamentos de vidro luminescente dourado e azul elétrico sobre fundo escuro e aveludado, estilo render Octane 3D em alta resolução.',
  },
  {
    title: 'Paisagem Cinematográfica',
    prompt: 'Amanhecer cinematográfico nas montanhas cobertas por neblina suave, reflexo cristalino em um lago calmo, pássaros voando ao longe, iluminação dourada e calorosa, estética fotográfica National Geographic em altíssima definição.',
  },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({ onSendToAudio }) => {
  const [prompt, setPrompt] = useState<string>(
    'Estúdio de gravação de áudio futurista com microfone vintage dourado, iluminação ambiente ciano e violeta, estética cinematográfica em altíssima definição.'
  );
  const [imageSize, setImageSize] = useState<ImageSize>('2K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [modalImage, setModalImage] = useState<GeneratedImage | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Load saved images from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('image_studio_gallery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGallery(parsed);
          setCurrentImage(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load gallery from storage', e);
    }
  }, []);

  const saveToGallery = (img: GeneratedImage) => {
    setGallery((prev) => {
      const updated = [img, ...prev.slice(0, 11)];
      try {
        localStorage.setItem('image_studio_gallery', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save gallery', e);
      }
      return updated;
    });
  };

  const [activeNotice, setActiveNotice] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Por favor, descreva a imagem que você deseja gerar.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setActiveNotice(null);

    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageSize,
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem em alta resolução.');
      }

      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        url: data.imageUrl,
        prompt: prompt.trim(),
        imageSize,
        aspectRatio,
        timestamp: Date.now(),
        isFallback: Boolean(data.isFallback),
        quotaNotice: data.quotaNotice,
      };

      if (data.isFallback && data.quotaNotice) {
        setActiveNotice(data.quotaNotice);
      }

      setCurrentImage(newImage);
      saveToGallery(newImage);
    } catch (err: any) {
      const msg = err.message || '';
      setErrorMessage(msg || 'Falha na geração de imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (img: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = img.url;
    a.download = `imagem_${img.imageSize}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/30 to-slate-900 border border-slate-800 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modelo gemini-3-pro-image-preview</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Geração de Imagens em Alta Resolução (1K, 2K e 4K)
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Crie ilustrações, artes conceituais e fotografias cinematográficas escolhendo a proporção e a resolução desejada.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Form (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4">
            <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
              <span>Descrição da Imagem (Prompt)</span>
              <span className="text-xs text-purple-400 font-medium">Português ou Inglês</span>
            </label>

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Descreva todos os detalhes da imagem que você quer criar..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-y"
            />

            {/* Prompt Suggestions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                Ideias de prompts para testar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s.prompt)}
                    className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-300 hover:text-purple-300 transition-all group"
                  >
                    <span className="font-semibold block truncate group-hover:text-purple-400">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block line-clamp-1 mt-0.5">
                      {s.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Affordance for User to Specify Image Size (1K, 2K, 4K) */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Resolução da Imagem (Tamanho)
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                {imageSize} Ativado
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SIZE_OPTIONS.map((opt) => {
                const isSelected = imageSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setImageSize(opt.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/30 text-white shadow-md shadow-purple-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base text-slate-100">{opt.id}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500 text-slate-950">
                          SELECIONADO
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono block text-purple-300/80 mb-1">
                      {opt.resolution}
                    </span>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Proporção da Imagem (Aspect Ratio)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => {
                const isSelected = aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-purple-500 bg-purple-950/30 text-purple-300 shadow-sm'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-xs">{ratio.label}</span>
                    <span className="text-[10px] text-slate-500">{ratio.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Notices & Error Message */}
          <div className="space-y-3">
            {activeNotice && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-purple-300">
                      Prévia Gerada com Sucesso em Alta Definição ({imageSize})
                    </strong>
                    <span className="text-slate-300 text-[11px] leading-relaxed block mt-0.5">
                      {activeNotice}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNotice(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-md text-xs shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerate}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-lg ${
                isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Imagem {imageSize} com Gemini 3 Pro...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Gerar Imagem ({imageSize} • {aspectRatio})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Preview & Gallery (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Preview Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Visualizador de Imagem</span>
              </h3>
              {currentImage && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/50">
                    {currentImage.imageSize} • {currentImage.aspectRatio}
                  </span>
                </div>
              )}
            </div>

            {currentImage ? (
              <div className="space-y-4">
                <div className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center aspect-square max-h-[420px]">
                  <img
                    src={currentImage.url}
                    alt={currentImage.prompt}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setModalImage(currentImage)}
                      className="p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white shadow-xl transition-transform hover:scale-105"
                      title="Expandir em tela cheia"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownload(currentImage)}
                      className="p-3 rounded-full bg-purple-500 hover:bg-purple-400 text-white shadow-xl transition-transform hover:scale-105"
                      title="Baixar imagem em resolução original"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <p className="text-xs text-slate-300 line-clamp-3">
                    <strong className="text-slate-400 font-semibold">Prompt: </strong>
                    {currentImage.prompt}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>
                      {new Date(currentImage.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      {onSendToAudio && (
                        <button
                          onClick={() =>
                            onSendToAudio(
                              `Esta é uma imagem criada em ${currentImage.imageSize}: ${currentImage.prompt}`
                            )
                          }
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Narrar esta imagem no TTS</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDownload(currentImage)}
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500 border border-slate-700/60">
                  <Sparkles className="w-7 h-7" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Escolha um prompt, selecione o tamanho (1K, 2K ou 4K) e clique em "Gerar Imagem" para visualizar.
                </p>
              </div>
            )}
          </div>

          {/* Gallery of Recent Generations */}
          {gallery.length > 0 && (
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Galeria Recente ({gallery.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {gallery.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImage(img)}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition-all ${
                      currentImage?.id === img.id
                        ? 'border-purple-500 ring-2 ring-purple-500/40'
                        : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 py-0.5 rounded bg-slate-950/80 text-purple-300">
                      {img.imageSize}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setModalImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={modalImage.url}
              alt={modalImage.prompt}
              className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-800"
            />
            <div className="mt-3 w-full bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-300 line-clamp-2">{modalImage.prompt}</p>
              <button
                onClick={() => handleDownload(modalImage)}
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Baixar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
