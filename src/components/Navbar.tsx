import React from 'react';
import { Volume2, Sparkles, MessageSquare, HelpCircle, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: 'tts' | 'clone' | 'image' | 'chat';
  setActiveTab: (tab: 'tts' | 'clone' | 'image' | 'chat') => void;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenGuide }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-white tracking-tight">
                Voz & Criação <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Studio AI</span>
              </h1>
              <span className="hidden sm:inline-flex text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                Gemini 3.8
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Conversor de Voz, Clonagem por IA, Imagens em Alta Resolução & Chatbot
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'tts'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Texto em Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('clone')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'clone'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🧬</span>
            <span>Clonar Voz</span>
          </button>

          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md shadow-purple-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Imagens</span>
            <span className="md:hidden">Imagens</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-md shadow-indigo-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat IA</span>
          </button>
        </nav>

        {/* Help button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm text-slate-200 transition-colors shadow-sm"
            title="Como que faz para converter texto em áudio?"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline font-medium">Como Funciona?</span>
          </button>
        </div>
      </div>
    </header>
  );
};
