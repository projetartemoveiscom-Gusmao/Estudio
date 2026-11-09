import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AudioStudio } from './components/AudioStudio';
import { ImageStudio } from './components/ImageStudio';
import { ChatStudio } from './components/ChatStudio';
import { HowItWorksModal } from './components/HowItWorksModal';
import { VoiceCloningStudio } from './components/VoiceCloningStudio';
import { VoiceName, ClonedVoice } from './types';
import { Volume2, Sparkles, MessageSquare, HelpCircle, Layers, Radio, Dna } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'image' | 'chat'>('tts');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // States to pass text/voice across tabs
  const [audioInputText, setAudioInputText] = useState<string>('');
  const [audioInputVoice, setAudioInputVoice] = useState<VoiceName>('Puck');
  const [clonedVoiceToUse, setClonedVoiceToUse] = useState<ClonedVoice | null>(null);
  const [audioInputStyle, setAudioInputStyle] = useState<string>('');

  const handleSendToAudio = (text: string, voice?: VoiceName, style?: string) => {
    setAudioInputText(text);
    if (voice) setAudioInputVoice(voice);
    if (style) setAudioInputStyle(style);
    setActiveTab('tts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUseClonedVoiceInStudio = (clonedVoice: ClonedVoice) => {
    setClonedVoiceToUse(clonedVoice);
    setActiveTab('tts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendToChat = (text: string) => {
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Studio Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'tts' && (
          <AudioStudio
            onOpenGuide={() => setIsGuideOpen(true)}
            onSendToChat={handleSendToChat}
            onNavigateToClone={() => setActiveTab('clone')}
            initialText={audioInputText}
            initialVoice={audioInputVoice}
            initialClonedVoice={clonedVoiceToUse}
            initialStyle={audioInputStyle}
          />
        )}

        {activeTab === 'clone' && (
          <VoiceCloningStudio
            onUseClonedVoiceInStudio={handleUseClonedVoiceInStudio}
          />
        )}

        {activeTab === 'image' && (
          <ImageStudio
            onSendToAudio={(caption) => handleSendToAudio(caption, 'Charon', 'Narrador épico e cinematográfico')}
          />
        )}

        {activeTab === 'chat' && (
          <ChatStudio
            onSendToAudio={(text) => handleSendToAudio(text, 'Kore', 'Narrador expressivo, claro e agradável')}
          />
        )}
      </main>

      {/* Instructional Modal */}
      <HowItWorksModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onTryExample={(text, voice, style) => handleSendToAudio(text, voice, style)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-500" />
            <span className="font-semibold text-slate-400">Voz & Criação Studio AI</span>
            <span>—</span>
            <span>Síntese de Voz, Imagens 1K/2K/4K e Chatbot Multi-Turn</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="text-slate-400">Modelos integrados:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-mono">
              gemini-3.8-flash-tts
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-purple-400 border border-slate-800 font-mono">
              gemini-3-pro-image-preview
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800 font-mono">
              gemini-4-argon / gemini-3.8-flash
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
