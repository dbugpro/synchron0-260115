
import { GoogleGenAI, Type, LiveServerMessage, Modality, Blob } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async analyzeSynchronicity(tasks: any[], notes: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these tasks and notes for "Synchronicity" - hidden patterns or connections that could lead to higher productivity or insight. 
      Tasks: ${JSON.stringify(tasks)}
      Notes: ${notes}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  connectionStrength: { type: Type.NUMBER }
                },
                required: ["title", "description", "connectionStrength"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["insights", "summary"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  connectLive(callbacks: {
    onOpen?: () => void;
    onMessage?: (message: LiveServerMessage) => void;
    onError?: (e: ErrorEvent) => void;
    onClose?: (e: CloseEvent) => void;
  }) {
    return this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: callbacks.onOpen || (() => {}),
        onmessage: callbacks.onMessage || (() => {}),
        onerror: callbacks.onError || (() => {}),
        onclose: callbacks.onClose || (() => {}),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: "You are Synchronos, a calm, efficient AI orchestration entity. You help users find harmony in their chaotic schedules. Speak concisely and intelligently.",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      }
    });
  }
}

export const gemini = new GeminiService();

// Audio Helpers
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
