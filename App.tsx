
import React, { useState, useEffect, useCallback } from 'react';
import PulseRing from './components/PulseRing';
import SyncTimeline from './components/SyncTimeline';
import ProjectManifestView from './components/ProjectManifest';
import { Task, TranscriptionMessage, ProjectManifest, PromptEntry } from './types';
import { gemini } from './services/geminiService';

// Fallback metadata if JSON import fails in some ESM environments
const DEFAULT_METADATA = {
  name: "synchron0-250521",
  description: "Synchron Operating System Core"
};

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Deep Work Session', category: 'work', priority: 'high', dueDate: 'Today', synced: true },
  { id: '2', title: 'Meditation Practice', category: 'growth', priority: 'medium', dueDate: 'Today', synced: false },
  { id: '3', title: 'System Architecture Sync', category: 'work', priority: 'high', dueDate: 'Tomorrow', synced: true },
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [transcriptions, setTranscriptions] = useState<TranscriptionMessage[]>([]);
  const [insights, setInsights] = useState<{title: string, description: string, connectionStrength: number}[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notes, setNotes] = useState('');
  const [view, setView] = useState<'orchestration' | 'manifest'>('orchestration');
  
  // Dynamic Naming Logic: synchronX-YYMMDD
  const getDatestamp = () => {
    const d = new Date();
    const yy = d.getFullYear().toString().slice(-2);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yy}${mm}${dd}`;
  };

  const [manifest, setManifest] = useState<ProjectManifest>({
    versionId: DEFAULT_METADATA.name,
    createdAt: new Date().toISOString().split('T')[0],
    promptLineage: [],
    coreSettings: {}
  });

  // Load actual metadata.json safely
  useEffect(() => {
    fetch('./metadata.json')
      .then(res => res.json())
      .then(data => {
        setManifest(prev => ({ ...prev, versionId: data.name || prev.versionId }));
      })
      .catch(() => console.log("Using default project naming."));
  }, []);

  const getNextVersionId = () => {
    const parts = manifest.versionId.split('-');
    const currentName = parts[0]; // e.g., synchron0
    const match = currentName.match(/\d+$/);
    const n = match ? parseInt(match[0]) : 0;
    return `synchron${n + 1}-${getDatestamp()}`;
  };

  const handleTranscription = useCallback((text: string, sender: 'user' | 'ai') => {
    setTranscriptions(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev;
      return [...prev, { text, sender, timestamp: Date.now() }];
    });

    if (sender === 'user' && text.length > 5) {
      setManifest(prev => ({
        ...prev,
        promptLineage: [...prev.promptLineage, {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          prompt: text,
          outcome: 'LIVE_INTERACTION'
        }]
      }));
    }
  }, []);

  const runSynchronicityAnalysis = async () => {
    setIsAnalyzing(true);
    const promptText = `Analyze project synchronicity for: ${notes || 'Current workflow state'}`;
    
    setManifest(prev => ({
      ...prev,
      promptLineage: [...prev.promptLineage, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        prompt: promptText,
        outcome: 'ANALYSIS_COMPLETE'
      }]
    }));

    try {
      const result = await gemini.analyzeSynchronicity(tasks, notes);
      setInsights(result.insights);
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportManifest = () => {
    const data = {
      ...manifest,
      nextSuggestedVersion: getNextVersionId(),
      exportTimestamp: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${manifest.versionId}_sync_bundle.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const promptSuggestions = [
    "Refine the visual mapping logic for neural connections.",
    "Implement automated task categorization based on user intent.",
    "Add a 'Sync History' view to track progress over time.",
    "Optimize the audio processing buffer for lower latency."
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-80 border-r border-slate-800 bg-slate-900/30 p-6 flex flex-col">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white mono shadow-lg shadow-cyan-500/20">S</div>
          <div>
            <h1 className="text-lg font-bold tracking-tighter leading-none">SYNCHRONOS</h1>
            <span className="text-[10px] text-cyan-500 mono font-bold uppercase tracking-widest">{manifest.versionId}</span>
          </div>
        </div>

        <nav className="flex space-x-1 mb-6 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button 
            onClick={() => setView('orchestration')}
            className={`flex-1 py-2 text-[10px] mono rounded transition-all ${view === 'orchestration' ? 'bg-slate-800 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
          >
            SYSTEM_UI
          </button>
          <button 
            onClick={() => setView('manifest')}
            className={`flex-1 py-2 text-[10px] mono rounded transition-all ${view === 'manifest' ? 'bg-slate-800 text-amber-500 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
          >
            PROMPT_LEDGER
          </button>
        </nav>

        <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
          {view === 'orchestration' ? (
            <>
              <div>
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-1 h-3 bg-cyan-500 mr-2 rounded-full" /> Workflow Nodes
                </h2>
                <div className="space-y-2">
                  {tasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? {...t, synced: !t.synced} : t))}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${task.synced ? 'bg-cyan-950/20 border-cyan-800/50' : 'bg-slate-900/40 border-slate-800/50 hover:border-slate-700'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] mono text-slate-500">{task.category}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${task.synced ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                      </div>
                      <h3 className="text-xs font-semibold">{task.title}</h3>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                  <span className="w-1 h-3 bg-amber-500 mr-2 rounded-full" /> Prompt Suggestions
                </h2>
                <div className="space-y-2">
                  {promptSuggestions.map((suggestion, i) => (
                    <button 
                      key={i}
                      onClick={() => setNotes(suggestion)}
                      className="w-full text-left p-2 text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-950 border border-slate-800 rounded hover:border-cyan-800/50 transition-colors mono"
                    >
                      > {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <ProjectManifestView manifest={manifest} onExport={exportManifest} />
          )}
        </div>

        {view === 'orchestration' && (
          <button 
            onClick={runSynchronicityAnalysis}
            disabled={isAnalyzing}
            className="mt-6 w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>INITIATE_SYNC_ANALYSIS</span>}
          </button>
        )}
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-10 flex flex-col space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-slate-500 text-[10px] mono uppercase tracking-widest">
              <span>SYSTEM: ONLINE</span>
              <span>/</span>
              <span>LINEAGE: {manifest.promptLineage.length} NODES</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white">ORCHESTRATION <span className="text-cyan-500">CORE</span></h2>
          </div>
          
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center space-x-6">
            <div className="text-center">
              <div className="text-[9px] text-slate-500 mono uppercase mb-1">Next Version</div>
              <div className="text-xs text-amber-500 mono font-bold">{getNextVersionId()}</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <div className="text-[9px] text-slate-500 mono uppercase mb-1">Status</div>
              <div className="text-xs text-emerald-500 mono font-bold">STABLE</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SyncTimeline tasks={tasks} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.map((insight, idx) => (
                <div key={idx} className="group bg-slate-900/30 border border-slate-800 p-6 rounded-2xl hover:border-cyan-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="px-2 py-1 bg-cyan-950/40 border border-cyan-800/50 rounded text-[9px] text-cyan-400 mono font-bold">MATCH_{idx + 1}</div>
                    <span className="text-xs text-slate-600 mono">{Math.round(insight.connectionStrength * 100)}%</span>
                  </div>
                  <h4 className="font-bold text-lg text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">{insight.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{insight.description}</p>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="md:col-span-2 border-2 border-dashed border-slate-800/50 rounded-2xl p-16 text-center bg-slate-900/10">
                  <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-sm italic mono">SYSTEM_AWAITING_INPUT_MANIFEST...</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 bg-slate-900/20 border border-slate-800/60 rounded-3xl p-8 flex flex-col backdrop-blur-sm">
            <PulseRing onTranscription={handleTranscription} />
            
            <div className="mt-12 flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mono flex items-center">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" /> Live Stream
                </h4>
                <button onClick={() => setTranscriptions([])} className="text-[9px] text-slate-600 hover:text-slate-400 mono transition-colors">[CLEAR_LOG]</button>
              </div>
              
              <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 overflow-y-auto space-y-6 max-h-[450px] custom-scrollbar shadow-inner">
                {transcriptions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 text-[10px] mono opacity-50">
                    <p>> INITIATE_ORCHESTRATION_LINK</p>
                    <p>> AWAITING_VOICE_COMMAND...</p>
                  </div>
                ) : (
                  transcriptions.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[8px] text-slate-600 mono mb-1 uppercase opacity-50">{msg.sender}</span>
                      <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user' 
                        ? 'bg-slate-800 text-slate-300 rounded-tr-none border border-slate-700 shadow-sm' 
                        : 'bg-cyan-900/20 text-cyan-300 border border-cyan-800/30 rounded-tl-none shadow-[0_0_15px_rgba(8,145,178,0.05)]'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 h-1.5 bg-slate-900 overflow-hidden hidden md:block border-t border-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-700 shadow-[0_0_20px_rgba(8,145,178,0.4)]" style={{ width: `${(tasks.filter(t => t.synced).length / tasks.length) * 100}%` }} />
      </footer>
    </div>
  );
};

export default App;
