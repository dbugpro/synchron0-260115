
import React, { useEffect, useState, useRef } from 'react';
import { gemini, createPcmBlob, decode, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';

interface PulseRingProps {
  onTranscription: (text: string, sender: 'user' | 'ai') => void;
}

const PulseRing: React.FC<PulseRingProps> = ({ onTranscription }) => {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    try {
      setStatus('connecting');
      setIsActive(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const sessionPromise = gemini.connectLive({
        onOpen: () => {
          setStatus('listening');
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const blob = createPcmBlob(inputData);
            sessionPromise.then(session => {
              session.sendRealtimeInput({ media: blob });
            });
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        },
        onMessage: async (message: LiveServerMessage) => {
          // Audio Output
          const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audioBase64 && outputContextRef.current) {
            setStatus('speaking');
            const ctx = outputContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.onended = () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setStatus('listening');
            };
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }

          // Transcription
          if (message.serverContent?.inputTranscription) {
            onTranscription(message.serverContent.inputTranscription.text, 'user');
          }
          if (message.serverContent?.outputTranscription) {
            onTranscription(message.serverContent.outputTranscription.text, 'ai');
          }
          
          if (message.serverContent?.interrupted) {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setStatus('listening');
          }
        },
        onError: () => setStatus('idle'),
        onClose: () => stopSession()
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setStatus('idle');
      setIsActive(false);
    }
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('idle');
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    sessionPromiseRef.current?.then((s: any) => s.close());
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div 
        className="relative group cursor-pointer"
        onClick={() => isActive ? stopSession() : startSession()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Rings */}
        <div className={`absolute -inset-8 bg-cyan-500/20 rounded-full blur-2xl transition-all duration-1000 ${isActive ? 'opacity-100 scale-110 animate-pulse' : 'opacity-0 scale-90'}`} />
        <div className={`absolute -inset-4 border border-cyan-500/30 rounded-full transition-all duration-700 ${isActive ? 'opacity-100 scale-100 rotate-180' : 'opacity-0 scale-75'}`} />
        
        {/* Core Button */}
        <div className={`
          relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500
          ${isActive ? 'bg-cyan-600 shadow-[0_0_50px_rgba(8,145,178,0.5)]' : 'bg-slate-800 border-2 border-slate-700 hover:border-cyan-500'}
        `}>
          {status === 'connecting' ? (
            <div className="w-8 h-8 border-4 border-t-cyan-200 border-cyan-900 rounded-full animate-spin" />
          ) : status === 'speaking' ? (
            <div className="flex items-end space-x-1 h-8">
               {[...Array(5)].map((_, i) => (
                 <div key={i} className="w-1 bg-white animate-bounce" style={{ animationDelay: `${i * 0.1}s`, height: `${40 + Math.random() * 60}%` }} />
               ))}
            </div>
          ) : (
            <svg 
              className={`w-12 h-12 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'} ${isActive ? 'text-white' : 'text-slate-400'}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-medium text-slate-100 mono tracking-wider">
          {isActive ? 'SYNCHRONOS ACTIVE' : 'ORCHESTRATE'}
        </h3>
        <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest">
          {status === 'listening' ? 'Hearing your thoughts...' : status === 'speaking' ? 'Sharing insight...' : 'Click to begin synchronization'}
        </p>
      </div>
    </div>
  );
};

export default PulseRing;
