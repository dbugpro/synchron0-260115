
import React from 'react';
import { ProjectManifest, PromptEntry } from '../types';

interface ProjectManifestProps {
  manifest: ProjectManifest;
  onExport: () => void;
}

const ProjectManifestView: React.FC<ProjectManifestProps> = ({ manifest, onExport }) => {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full max-h-[500px]">
      <div className="bg-slate-800 px-4 py-2 border-bottom border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold mono text-amber-500 uppercase tracking-widest">System Manifest</span>
        </div>
        <button 
          onClick={onExport}
          className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-300 mono transition-colors"
        >
          EXPORT_LINEAGE
        </button>
      </div>
      
      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <label className="block text-[9px] text-slate-500 mono mb-1">PROJECT_ID</label>
            <div className="text-xs text-cyan-400 mono font-bold">{manifest.versionId}</div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <label className="block text-[9px] text-slate-500 mono mb-1">DEPLOY_STAMP</label>
            <div className="text-xs text-slate-300 mono font-bold">{manifest.createdAt}</div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[9px] text-slate-500 mono uppercase tracking-widest">Prompt Ledger</label>
          {manifest.promptLineage.length === 0 ? (
            <div className="text-[10px] text-slate-600 italic border border-dashed border-slate-800 p-4 rounded text-center">
              No prompts logged in this sequence yet.
            </div>
          ) : (
            manifest.promptLineage.map((entry, idx) => (
              <div key={entry.id} className="bg-slate-950 border-l-2 border-cyan-500 p-3 rounded-r">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] text-cyan-600 mono font-bold">SEQUENCE_00{idx + 1}</span>
                  <span className="text-[9px] text-slate-600 mono">{entry.timestamp}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 italic">"{entry.prompt}"</p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <p className="text-[9px] text-slate-500 leading-tight italic">
          CRITICAL: Cloning this project requires executing the Prompt Ledger in sequence within Google AI Studio to maintain synchronicity.
        </p>
      </div>
    </div>
  );
};

export default ProjectManifestView;
