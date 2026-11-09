import React from 'react';
import { X, Volume2, Wand2, Mic, Play, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryExample: (sampleText: string, voice: 'Puck' | 'Kore' | 'Charon', style: string) => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onTryExample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Como converter Texto em Áudio?</h2>
            <p className="text-sm text-slate-400">
              Guia rápido para transformar seus textos em vozes humanas ultrarrealistas
            </p>
          </div>
        </div>

        {/* 5 Steps */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Digite ou Cole seu Texto</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Escreva qualquer frase, roteiro, artigo ou anúncio na caixa principal. O estúdio calcula em tempo real o número de palavras e o tempo estimado de fala.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Escolha entre Voz Masculina ou Feminina</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Filtre por gênero e selecione o timbre ideal: <strong className="text-blue-300">👨 Masculinas:</strong> <span className="text-cyan-300 font-medium">Puck</span> (jovem), <span className="text-cyan-300 font-medium">Charon</span> (grave cinematográfico), <span className="text-cyan-300 font-medium">Fenrir</span> (corporativo); ou <strong className="text-purple-300">👩 Femininas:</strong> <span className="text-cyan-300 font-medium">Kore</span> (suave e elegante), <span className="text-cyan-300 font-medium">Zephyr</span> (serena e relaxante).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Selecione o Sotaque Regional Desejado</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Escolha a pronúncia regional perfeita: <strong>Neutro</strong> (Brasil), <strong>Paulista</strong>, <strong>Carioca</strong> (com chiado), <strong>Nordestino</strong> (expressivo e musical), <strong>Mineiro</strong> (cadenciado), <strong>Gaúcho / Sul</strong>, <strong>Português de Portugal</strong> (europeu) ou até <strong>Inglês Internacional</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              4
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Ajuste a Velocidade de Leitura da Fala</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Utilize o controle deslizante ou botões rápidos para diminuir a velocidade (0.75x para leituras calmas e didáticas) ou aumentar (1.25x a 1.5x para podcasts ágeis e resumos rápidos).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              5
            </div>
            <div>
              <h3 className="font-semibold text-slate-200 text-sm">Gere e Baixe seu Áudio WAV</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Clique em "Converter Texto em Áudio" para gerar um arquivo WAV cristalino (24kHz). Você pode reproduzir na hora ou salvar no seu dispositivo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
              6
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300 text-sm flex items-center gap-1.5">
                <span>Clone Sua Própria Voz</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Novo</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Na aba <strong>Clonar Voz</strong>, grave de 5 a 20 segundos da sua fala pelo microfone ou envie um arquivo de áudio (.mp3/.wav). A IA analisa as propriedades acústicas da sua voz (timbre, sotaque e respiração) para sintetizar novos textos com a sua voz!
              </p>
            </div>
          </div>
        </div>

        {/* Try sample button */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-slate-800 border border-cyan-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">Quer testar agora?</span>
            <p className="text-xs text-slate-300 mt-0.5">
              Carregue um exemplo pronto com risadas e respiração natural.
            </p>
          </div>
          <button
            onClick={() => {
              onTryExample(
                "Olá! Seja muito bem-vindo ao conversor de texto em voz. <breath> É impressionante como a inteligência artificial consegue interpretar emoções, entonação e até risadas! <laugh> O que você gostaria de criar hoje?",
                'Puck',
                'Entusiasta, acolhedor e expressivo'
              );
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md shadow-cyan-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Carregar Exemplo & Começar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
