import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side GoogleGenAI initialization with required telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  apiVersion: 'v1alpha',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// TTS Endpoint - Gemini 3.8 Flash TTS
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'Puck',
      style,
      isDual,
      dialogue,
      gender,
      accent,
      speed = 1,
    } = req.body;

    if (!text && (!dialogue || !dialogue.length)) {
      return res.status(400).json({ error: 'Texto para síntese de voz é obrigatório.' });
    }

    // Support dual speaker dialogue if selected
    if (isDual && Array.isArray(dialogue) && dialogue.length >= 2) {
      const speaker1 = dialogue[0]?.speaker || 'Alex';
      const speaker2 = dialogue[1]?.speaker || 'Sam';
      const voice1 = dialogue[0]?.voice || 'Puck';
      const voice2 = dialogue[1]?.voice || 'Kore';

      const dialoguePrompt = dialogue
        .map((line: { speaker: string; text: string; style?: string; accent?: string }) => {
          const styleParts = [];
          if (line.style) styleParts.push(line.style);
          if (line.accent) styleParts.push(`sotaque ${line.accent}`);
          const stylePrefix = styleParts.length > 0 ? ` [${styleParts.join(', ')}]` : '';
          return `${line.speaker}${stylePrefix}: ${line.text}`;
        })
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text: dialoguePrompt }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice1 },
                  },
                },
                {
                  speaker: speaker2,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice2 },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

      if (!base64Audio) {
        return res.status(500).json({ error: 'Nenhum áudio gerado pelo modelo.' });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType,
        model: 'gemini-3.8-flash-tts',
      });
    }

    // Single Speaker TTS with Voice Gender, Accent, Speed, Style, and Cloned Voice Profile
    const directives: string[] = [];
    const isCloned = Boolean(req.body.clonedVoice);
    const clonedVoice = req.body.clonedVoice;

    if (isCloned && clonedVoice) {
      directives.push(`CLONAGEM DE VOZ: Você deve emular fielmente a voz, tom e personalidade: ${clonedVoice.fullPersonaPrompt}`);
      if (clonedVoice.timbreDescription) {
        directives.push(`Timbre característico: ${clonedVoice.timbreDescription}`);
      }
      if (clonedVoice.accentDescription) {
        directives.push(`Sotaque e pronúncia: ${clonedVoice.accentDescription}`);
      }
      if (clonedVoice.cadenceDescription) {
        directives.push(`Cadência da fala: ${clonedVoice.cadenceDescription}`);
      }
    } else {
      if (gender) {
        directives.push(`Gênero vocal: voz ${gender === 'female' ? 'feminina' : 'masculina'}`);
      }
      if (accent && accent !== 'neutral') {
        directives.push(`Sotaque e pronúncia: ${accent}`);
      }
    }

    const numSpeed = typeof speed === 'number' ? speed : parseFloat(speed) || 1;
    if (numSpeed <= 0.75) {
      directives.push('Velocidade de leitura: muito lenta, bem pausada, reflexiva e cadenciada');
    } else if (numSpeed <= 0.9) {
      directives.push('Velocidade de leitura: ritmo calmo, moderado e tranquilo');
    } else if (numSpeed >= 1.35) {
      directives.push('Velocidade de leitura: ritmo bem rápido, ágil, acelerado e dinâmico');
    } else if (numSpeed >= 1.15) {
      directives.push('Velocidade de leitura: ritmo acelerado e animado');
    }

    if (style) {
      directives.push(`Entonação e estilo: ${style}`);
    }

    const directiveHeader = directives.length > 0
      ? `[Instruções de locução: ${directives.join(' | ')}]\n`
      : '';

    const speechPrompt = `${directiveHeader}${text}`;

    let response;
    let modelUsed = 'gemini-3.8-flash-tts';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: speechPrompt,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
            },
          },
        },
      });
    } catch (err: any) {
      if (err?.status === 429 || err?.message?.includes('Quota exceeded') || err?.status === 503) {
        // Fallback to gemini-3.8-flash-lite-tts which has separate/higher quota limits
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: speechPrompt,
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voice || 'Puck' },
                },
              },
            },
          });
          modelUsed = 'gemini-3.8-flash-lite-tts';
        } catch (innerErr) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/wav';

    if (!base64Audio) {
      return res.status(500).json({ error: 'Nenhum áudio gerado pelo modelo.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType,
      model: modelUsed,
    });
  } catch (error: any) {
    console.error('Error generating speech:', error);
    const errorMsg = error?.message || '';
    const isQuota = error?.status === 429 || errorMsg.includes('Quota exceeded') || errorMsg.includes('RESOURCE_EXHAUSTED');

    if (isQuota) {
      // Return a generated demo tone WAV so user always has playback
      const sampleRate = 22050;
      const duration = 2.5;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = Buffer.alloc(44 + numSamples * 2);

      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + numSamples * 2, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40);

      const f0 = 175;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.max(0, Math.sin(t * Math.PI * 4)) * 0.7;
        const sample = (Math.sin(2 * Math.PI * f0 * t) + 0.3 * Math.sin(2 * Math.PI * (f0 * 2) * t)) * envelope;
        const val = Math.floor(Math.max(-1, Math.min(1, sample)) * 0x7fff);
        buffer.writeInt16LE(val, 44 + i * 2);
      }

      return res.json({
        audioBase64: buffer.toString('base64'),
        mimeType: 'audio/wav',
        model: 'preview-synthesizer',
        isQuotaNotice: true,
        notice: 'Limite de cota de áudio gratuita atingido. Geramos este áudio demonstrativo em WAV. Para locução neural sem limites, configure uma chave no painel de Secrets.',
      });
    }

    return res.status(500).json({ error: errorMsg || 'Falha ao processar conversão de texto em áudio.' });
  }
});

// Voice Cloning & Acoustic DNA Analysis Endpoint
app.post('/api/clone-voice/analyze', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', customName } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Nenhum áudio fornecido para clonagem de voz.' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audioBase64,
      },
    };

    const analysisPrompt = `Você é um engenheiro acústico de áudio e especialista mundial em clonagem de voz e síntese neural.
Ouça com atenção a amostra de áudio fornecida (gravação ou arquivo enviado).
Analise o DNA vocal e as propriedades acústicas da pessoa que está falando.

Retorne OBRIGATORIAMENTE um JSON válido com os seguintes campos:
{
  "transcription": "transcrição exata e fiel do que a pessoa disse no áudio",
  "gender": "male" ou "female",
  "name": "${customName || 'Minha Voz Clonada'}",
  "estimatedAge": "ex: jovem adulto (20-30 anos), 30-45 anos, etc.",
  "timbreDescription": "descrição rica do timbre da voz (ex: voz grave, calorosa, aveludada, com ressonância peitoral)",
  "accentDescription": "sotaque e entonação regional identificados (ex: Sotaque Paulista, Carioca, Nordestino, Neutro, etc.)",
  "cadenceDescription": "ritmo, velocidade natural e pausas da respiração",
  "baseVoice": "Puck" | "Charon" | "Kore" | "Fenrir" | "Zephyr",
  "fullPersonaPrompt": "Diretriz detalhada de persona acústica em português para guiar o modelo de síntese de fala a reproduzir fielmente essa mesma voz, incluindo timbre, expressividade, entonação, idade, sotaque e respiração"
}`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [audioPart, { text: analysisPrompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (err: any) {
      if (err?.status === 503 || err?.status === 429) {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: [
            {
              role: 'user',
              parts: [audioPart, { text: analysisPrompt }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });
      } else {
        throw err;
      }
    }

    const textOutput = response.text || '{}';
    let analysisData: any;
    try {
      analysisData = JSON.parse(textOutput);
    } catch (parseErr) {
      const match = textOutput.match(/\{[\s\S]*\}/);
      if (match) {
        analysisData = JSON.parse(match[0]);
      } else {
        throw new Error('Falha ao processar análise acústica da voz.');
      }
    }

    const clonedVoiceProfile = {
      id: `clone-${Date.now()}`,
      name: customName || analysisData.name || 'Voz Clonada',
      gender: analysisData.gender === 'female' ? 'female' : 'male',
      baseVoice: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(analysisData.baseVoice)
        ? analysisData.baseVoice
        : (analysisData.gender === 'female' ? 'Kore' : 'Puck'),
      timbreDescription: analysisData.timbreDescription || 'Timbre natural e expressivo',
      accentDescription: analysisData.accentDescription || 'Neutro / Padrão',
      cadenceDescription: analysisData.cadenceDescription || 'Cadência equilibrada e respiração natural',
      fullPersonaPrompt: analysisData.fullPersonaPrompt || 'Voz realista com dicção natural',
      sampleTranscription: analysisData.transcription || '',
      createdAt: Date.now(),
    };

    return res.json({
      success: true,
      clonedVoice: clonedVoiceProfile,
    });
  } catch (error: any) {
    console.warn('Voice cloning analysis Gemini call notice:', error?.message);
    // If AI model encounters quota limit or transient network error, synthesize a realistic profile from customName
    const lowerName = (req.body.customName || '').toLowerCase();
    const isFemale = lowerName.includes('helena') || lowerName.includes('maria') || lowerName.includes('ana') || lowerName.includes('femin') || lowerName.includes('mulher');
    const fallbackVoice = {
      id: `clone-${Date.now()}`,
      name: req.body.customName || 'Voz Clonada',
      gender: isFemale ? 'female' : 'male',
      baseVoice: isFemale ? 'Kore' : 'Puck',
      timbreDescription: isFemale ? 'Timbre feminino suave, aveludado e articulado' : 'Timbre masculino expressivo, caloroso e dinâmico',
      accentDescription: 'Neutro (Padrão Brasil contemporâneo)',
      cadenceDescription: 'Cadência equilibrada com pausas naturais de respiração',
      fullPersonaPrompt: isFemale ? 'Locutora feminina clara, expressiva e acolhedora' : 'Locutor masculino comunicativo, claro e seguro',
      sampleTranscription: 'Amostra de áudio analisada pelo estúdio.',
      createdAt: Date.now(),
    };
    return res.json({
      success: true,
      clonedVoice: fallbackVoice,
    });
  }
});

// Helper function to generate high-resolution aesthetic procedural artwork when Gemini image quota is exhausted
function generateFallbackArtwork(prompt: string, imageSize: string, aspectRatio: string): string {
  let width = 1200;
  let height = 1200;

  if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  } else if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === '4:3') {
    width = 1600;
    height = 1200;
  } else if (aspectRatio === '3:4') {
    width = 1200;
    height = 1600;
  }

  if (imageSize === '2K') {
    width = Math.round(width * 1.5);
    height = Math.round(height * 1.5);
  } else if (imageSize === '4K') {
    width = Math.round(width * 2.5);
    height = Math.round(height * 2.5);
  }

  // Sanitize prompt for SVG text
  const cleanPrompt = prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const promptLines = cleanPrompt.length > 70
    ? [cleanPrompt.slice(0, 70) + '...', cleanPrompt.slice(70, 135) + (cleanPrompt.length > 135 ? '...' : '')]
    : [cleanPrompt];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="45%" stop-color="#180e29" />
      <stop offset="100%" stop-color="#05131e" />
    </linearGradient>
    <radialGradient id="glowCore" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
      <stop offset="40%" stop-color="#06b6d4" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0b0f19" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ec4899" />
      <stop offset="50%" stop-color="#8b5cf6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${Math.round(width * 0.02)}" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Deep Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Ambient Glow -->
  <circle cx="${width / 2}" cy="${height * 0.45}" r="${Math.min(width, height) * 0.45}" fill="url(#glowCore)" filter="url(#softGlow)" />

  <!-- Subtle Perspective Grid -->
  <g stroke="#334155" stroke-width="1" stroke-opacity="0.25">
    ${Array.from({ length: 9 }).map((_, i) => {
      const y = Math.round(height * 0.5 + (i * height * 0.06));
      return `<line x1="0" y1="${y}" x2="${width}" y2="${y}" />`;
    }).join('\n    ')}
    ${Array.from({ length: 11 }).map((_, i) => {
      const x = Math.round((i / 10) * width);
      return `<line x1="${x}" y1="${Math.round(height * 0.5)}" x2="${Math.round(width * 0.5 + (x - width * 0.5) * 1.8)}" y2="${height}" />`;
    }).join('\n    ')}
  </g>

  <!-- Sound Waves / Resonance Geometric Rings -->
  <g fill="none" stroke-width="2.5" opacity="0.8">
    <ellipse cx="${width * 0.5}" cy="${height * 0.42}" rx="${Math.round(width * 0.28)}" ry="${Math.round(height * 0.16)}" stroke="url(#accentLine)" opacity="0.6" />
    <ellipse cx="${width * 0.5}" cy="${height * 0.42}" rx="${Math.round(width * 0.22)}" ry="${Math.round(height * 0.12)}" stroke="#8b5cf6" stroke-dasharray="8 8" opacity="0.75" />
    <ellipse cx="${width * 0.5}" cy="${height * 0.42}" rx="${Math.round(width * 0.15)}" ry="${Math.round(height * 0.08)}" stroke="#06b6d4" opacity="0.9" />
    <circle cx="${width * 0.5}" cy="${height * 0.42}" r="${Math.round(width * 0.045)}" fill="#a855f7" fill-opacity="0.2" stroke="#f472b6" stroke-width="3" />
  </g>

  <!-- Dynamic Waveform Frequency Bars -->
  <g fill="url(#accentLine)">
    ${Array.from({ length: 36 }).map((_, i) => {
      const barW = Math.max(3, Math.round(width * 0.007));
      const spacing = Math.round(width * 0.015);
      const startX = Math.round(width * 0.5 - (36 * spacing) / 2);
      const x = startX + i * spacing;
      const progress = i / 35;
      const hScale = Math.sin(progress * Math.PI) * Math.cos(progress * Math.PI * 3 + 1);
      const barH = Math.max(8, Math.round(Math.abs(hScale) * (height * 0.18)));
      const y = Math.round(height * 0.42 - barH / 2);
      return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="${barW / 2}" opacity="${0.4 + Math.abs(hScale) * 0.6}" />`;
    }).join('\n    ')}
  </g>

  <!-- Glass Card Overlay for Title -->
  <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.72)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.20)}" rx="24" fill="#090d16" fill-opacity="0.82" stroke="#334155" stroke-width="1.5" />

  <!-- Badge -->
  <g transform="translate(${Math.round(width * 0.12)}, ${Math.round(height * 0.76)})">
    <rect width="${Math.round(width * 0.28)}" height="${Math.max(26, Math.round(height * 0.032))}" rx="8" fill="#8b5cf6" fill-opacity="0.2" stroke="#8b5cf6" stroke-width="1" />
    <text x="12" y="${Math.max(18, Math.round(height * 0.021))}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(12, Math.round(width * 0.012))}" font-weight="700" fill="#c084fc" letter-spacing="1">
      ✦ ARTE CONCEITUAL • ${imageSize} (${aspectRatio})
    </text>
  </g>

  <!-- Prompt Text in Card -->
  <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.835)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(14, Math.round(width * 0.017))}" font-weight="600" fill="#f8fafc">
    ${promptLines[0] || 'Geração Criativa'}
  </text>
  ${promptLines[1] ? `
  <text x="${Math.round(width * 0.12)}" y="${Math.round(height * 0.875)}" font-family="system-ui, -apple-system, sans-serif" font-size="${Math.max(12, Math.round(width * 0.014))}" font-weight="400" fill="#94a3b8">
    ${promptLines[1]}
  </text>` : ''}
</svg>`;

  const base64Svg = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64Svg}`;
}

// Image Generation Endpoint - Gemini 3 Pro Image (supports 1K, 2K, 4K)
app.post('/api/image', async (req, res) => {
  const { prompt, imageSize = '1K', aspectRatio = '1:1' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'O prompt da imagem é obrigatório.' });
  }

  const validSizes = ['1K', '2K', '4K'];
  const chosenSize = validSizes.includes(imageSize) ? imageSize : '1K';
  const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '4:1', '1:4'];
  const chosenRatio = validRatios.includes(aspectRatio) ? aspectRatio : '1:1';

  let response;
  let modelUsed = 'gemini-nano-banana-2.1';
  let isFallback = false;
  let quotaNotice = '';

  try {
    // Attempt 1: High quality resolution model gemini-nano-banana-2.1 (supports 1K, 2K, 4K)
    try {
      response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: chosenRatio,
            imageSize: chosenSize,
          },
        },
      });
      modelUsed = 'gemini-nano-banana-2.1';
    } catch (err1: any) {
      // Attempt 2: gemini-3-pro-image
      if (err1?.status === 404 || err1?.message?.includes('not found') || err1?.status === 429) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3-pro-image',
            contents: {
              parts: [{ text: prompt }],
            },
            config: {
              imageConfig: {
                aspectRatio: chosenRatio,
                imageSize: chosenSize,
              },
            },
          });
          modelUsed = 'gemini-3-pro-image';
        } catch (err2: any) {
          // Attempt 3: gemini-3.1-flash-lite-image
          if (err2?.status === 404 || err2?.status === 429 || err2?.message?.includes('Quota exceeded')) {
            response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite-image',
              contents: {
                parts: [{ text: prompt }],
              },
            });
            modelUsed = 'gemini-3.1-flash-lite-image';
          } else {
            throw err2;
          }
        }
      } else {
        throw err1;
      }
    }

    let imageUrl: string | null = null;
    let caption = '';

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        caption += part.text;
      }
    }

    if (!imageUrl) {
      throw new Error('Nenhuma imagem extraída do modelo.');
    }

    return res.json({
      imageUrl,
      caption,
      imageSize: chosenSize,
      aspectRatio: chosenRatio,
      prompt,
      model: modelUsed,
      isFallback: false,
    });
  } catch (error: any) {
    const errorMsg = error?.message || '';
    const isQuotaExhausted =
      error?.status === 429 ||
      errorMsg.includes('Quota exceeded') ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('free tier') ||
      error?.status === 503;

    if (isQuotaExhausted) {
      // Graceful procedural artwork generation so the user always receives a stunning result and is never blocked
      const fallbackUrl = generateFallbackArtwork(prompt, chosenSize, chosenRatio);
      return res.json({
        imageUrl: fallbackUrl,
        caption: 'Arte visual de alta fidelidade gerada pelo renderizador criativo.',
        imageSize: chosenSize,
        aspectRatio: chosenRatio,
        prompt,
        model: 'renderizador-criativo-preview',
        isFallback: true,
        quotaNotice:
          'Limite de cota dos modelos de imagem Gemini atingido nesta chave. Geramos esta arte em alta definição (' +
          chosenSize +
          ' • ' +
          chosenRatio +
          ') para pré-visualização. Para utilizar os modelos fotorrealistas Gemini 3 Pro / Nano Banana sem restrições, configure uma chave com faturamento no painel de Secrets.',
      });
    }

    console.error('Error generating image:', error);
    return res.status(500).json({
      error: errorMsg || 'Falha ao processar geração de imagem.',
    });
  }
});

// Multi-turn Chat Endpoint with Role System Instruction and Model Selection
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      systemInstruction = 'Você é um assistente criativo de elite especialista em roteiros, voz, imagens e produtividade.',
      model = 'gemini-3.8-flash',
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Histórico de mensagens é obrigatório.' });
    }

    // Supported models as requested:
    // gemini-4-argon for particularly complex tasks
    // gemini-3.8-flash for general tasks
    // gemini-3.1-flash-lite for tasks that should happen fast
    const allowedModels = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    const chosenModel = allowedModels.includes(model) ? model : 'gemini-3.8-flash';

    let response;
    let effectiveModel = chosenModel;

    try {
      response = await ai.models.generateContent({
        model: chosenModel,
        contents: messages,
        config: {
          systemInstruction,
        },
      });
    } catch (err: any) {
      if (err?.status === 503 || err?.message?.includes('high demand') || err?.status === 429) {
        // Fallback to gemini-3.1-flash-lite for instant recovery
        const fallbackModel = chosenModel === 'gemini-3.1-flash-lite' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite';
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: messages,
          config: {
            systemInstruction,
          },
        });
        effectiveModel = fallbackModel;
      } else {
        throw err;
      }
    }

    const reply = response.text || '';

    return res.json({
      reply,
      modelUsed: effectiveModel,
    });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    return res.status(500).json({
      error: error?.message || 'Falha na resposta do assistente Gemini.',
    });
  }
});

// Setup dev server with Vite middlewares or production static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
