
export interface Task {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'growth' | 'admin';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  synced: boolean;
}

export interface SyncConnection {
  sourceId: string;
  targetId: string;
  strength: number;
  label: string;
}

export interface TranscriptionMessage {
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
}

export interface PromptEntry {
  id: string;
  timestamp: string;
  prompt: string;
  outcome: string;
}

export interface ProjectManifest {
  versionId: string; // synchronX-YYMMDD
  createdAt: string;
  promptLineage: PromptEntry[];
  coreSettings: Record<string, any>;
}
