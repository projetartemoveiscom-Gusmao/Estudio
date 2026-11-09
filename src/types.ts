export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
export type VoiceGender = 'male' | 'female';

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: VoiceGender;
  tag: string;
  desc: string;
  recommendedAccent?: string;
  color: string;
}

export interface AccentOption {
  id: string;
  label: string;
  region: string;
  flag: string;
  desc: string;
}

export interface ClonedVoice {
  id: string;
  name: string;
  gender: VoiceGender;
  baseVoice: VoiceName;
  timbreDescription: string;
  accentDescription: string;
  cadenceDescription: string;
  fullPersonaPrompt: string;
  sampleTranscription?: string;
  originalAudioSnippetUrl?: string;
  createdAt: number;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: VoiceName | string;
  isCloned?: boolean;
  clonedVoiceName?: string;
  gender?: VoiceGender;
  accent?: string;
  speed?: number;
  style?: string;
  audioUrl: string;
  timestamp: number;
  duration?: number;
  isDual?: boolean;
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  imageSize: ImageSize;
  aspectRatio: AspectRatio;
  timestamp: number;
  isFallback?: boolean;
  quotaNotice?: string;
}

export type ChatModel = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
}

export interface ChatRolePreset {
  id: string;
  title: string;
  description: string;
  systemInstruction: string;
  iconName: string;
}
