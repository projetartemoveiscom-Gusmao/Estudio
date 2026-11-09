import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Volume2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Zap,
  Cpu,
  Brain,
  AlertCircle,
} from 'lucide-react';
import { ChatModel, ChatMessage, ChatRolePreset } from '../types';

interface ChatStudioProps {
  onSendToAudio: (text: string) => void;
}

const ROLE_PRESETS: ChatRolePreset[] = [
  {
    id: 'scriptwriter',
    title: 'Roteirista de Voz & Podcast',
    description: 'Escreve textos naturais, com ritmo, pausas e reações para narração em áudio',
    systemInstruction:
      'Você é um roteirista profissional de voz, podcasts e vídeos. Ao responder, crie textos naturais, fluidos e perfeitos para serem convertidos em áudio falado. Sempre que for apropriado, insira tags vocais naturais como <breath> para respiração, <laugh> para risos ou pausas expressivas.',
    iconName: 'mic',
  },
  {
    id: 'creative',
    title: 'Assistente Criativo Geral',
    description: 'Responde dúvidas, dá ideias de conteúdo e ajuda em qualquer tarefa',
    systemInstruction:
      'Você é um assistente criativo de inteligência artificial prestativo, perspicaz e amigável. Responda em português claro, elegante e estruturado.',
    iconName: 'sparkles',
  },
  {
    id: 'reasoning',
    title: 'Especialista em Raciocínio & Análise',
    description: 'Análise profunda, lógica, códigos e estratégias complexas (ideal para Gemini 4 Argon)',
    systemInstruction:
      'Você é um especialista analítico com capacidade de raciocínio profundo. Apresente explicações completas, passo a passo, detalhando a lógica e as melhores práticas com rigor técnico.',
    iconName: 'brain',
  },
  {
    id: 'custom',
    title: 'Papel Personalizado',
    description: 'Defina você mesmo a instrução de sistema que o assistente deve seguir',
    systemInstruction: 'Você é um assistente sob medida.',
    iconName: 'sliders',
  },
];

const MODELS: { id: ChatModel; name: string; tag: string; desc: string; icon: any }[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Geral & Equilibrado',
    desc: 'Melhor modelo para tarefas gerais, criatividade e conversação diária.',
    icon: Sparkles,
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    tag: 'Raciocínio Complexo',
    desc: 'Capacidade máxima para tarefas de alta complexidade, lógica e análise profunda.',
    icon: Brain,
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    tag: 'Ultra-Rápido',
    desc: 'Otimizado para baixa latência e respostas praticamente instantâneas.',
    icon: Zap,
  },
];

const QUICK_PROMPTS = [
  'Escreva um roteiro curto de 30 segundos sobre como converter texto em voz de forma profissional.',
  'Crie uma introdução animada para um podcast sobre tecnologia e inteligência artificial.',
  'Dê 3 dicas para deixar uma gravação de áudio ou locução mais natural e humanizada.',
  'Crie um prompt detalhado para gerar uma imagem de capa futurista para um podcast de IA.',
];

export const ChatStudio: React.FC<ChatStudioProps> = ({ onSendToAudio }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'model',
      text: 'Olá! Sou seu assistente Gemini. Você pode me pedir para redigir roteiros de áudio com reações humanas, criar prompts para imagens ou tirar qualquer dúvida técnica. Como posso ajudar agora?',
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [inputText, setInputText] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ChatModel>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<string>('scriptwriter');
  const [customInstruction, setCustomInstruction] = useState<string>(
    ROLE_PRESETS[0].systemInstruction
  );
  const [isEditingRole, setIsEditingRole] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const found = ROLE_PRESETS.find((r) => r.id === roleId);
    if (found) {
      setCustomInstruction(found.systemInstruction);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    setErrorMessage(null);
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      // Format messages history for server endpoint
      const formattedHistory = updatedMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          systemInstruction: customInstruction,
          model: selectedModel,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na resposta do assistente.');
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Sem resposta gerada.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao comunicar com o modelo Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Deseja iniciar uma nova conversa?')) {
      setMessages([
        {
          id: `init-${Date.now()}`,
          role: 'model',
          text: 'Conversa reiniciada. O que vamos criar juntos agora?',
          timestamp: Date.now(),
          modelUsed: selectedModel,
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <Bot className="w-3.5 h-3.5" />
              <span>Chatbot Multi-Turn Gemini</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Assistente Inteligente & Roteirista Criativo
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Converse em múltiplos turnos mantendo todo o histórico da sessão. Personalize o papel do chatbot e ouça as respostas geradas no conversor de voz com 1 clique.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearHistory}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Nova Conversa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Row: Model Switcher & Role Selector */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Model Switcher (6 cols) */}
        <div className="md:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-2.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Modelo de Inteligência Artificial:
            </span>
            <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase">
              {selectedModel}
            </span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {MODELS.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSelected ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                    />
                    <span className="font-bold text-xs truncate">{m.name.replace('Gemini ', '')}</span>
                  </div>
                  <span className="text-[10px] text-indigo-300/80 block font-medium truncate">
                    {m.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Instruction / Role Selector (6 cols) */}
        <div className="md:col-span-6 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Papel do Chatbot (System Instruction):
            </label>
            <button
              onClick={() => setIsEditingRole(!isEditingRole)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              {isEditingRole ? 'Fechar Editor' : 'Personalizar Instrução'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ROLE_PRESETS.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  selectedRole === role.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300 font-semibold'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {role.title}
              </button>
            ))}
          </div>

          {isEditingRole && (
            <textarea
              rows={2}
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Digite as instruções de sistema para direcionar o comportamento do assistente..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none mt-2"
            />
          )}
        </div>
      </div>

      {/* Main Chat Thread */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
        {/* Messages Scrollable Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-md ${
                    isUser
                      ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950'
                      : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl space-y-2 max-w-[85%] ${
                    isUser
                      ? 'bg-cyan-950/40 border border-cyan-800/60 text-slate-100 rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </p>

                  {/* Actions footer for bot response */}
                  {!isUser && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span className="font-mono text-[10px] text-indigo-400/80">
                        {msg.modelUsed || selectedModel}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Send directly to TTS */}
                        <button
                          onClick={() => onSendToAudio(msg.text)}
                          className="px-2 py-1 rounded-md bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 flex items-center gap-1 font-medium transition-colors"
                          title="Enviar este texto para o Conversor de Voz"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Ouvir em Voz (TTS)</span>
                        </button>

                        {/* Copy text */}
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                <div
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
                <span className="ml-2 font-mono text-[11px] text-indigo-300">
                  {selectedModel} pensando...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 text-[11px] shrink-0">Sugestões:</span>
            {QUICK_PROMPTS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white shrink-0 truncate max-w-xs transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {errorMessage && (
            <div className="text-xs text-red-400 flex items-center gap-1 px-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte algo, peça um roteiro para narração ou sugestão de imagens..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className={`p-3 rounded-xl font-semibold flex items-center justify-center transition-all ${
                isLoading || !inputText.trim()
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
