import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  settings: {
    resolution: { width: number; height: number };
    fps: number;
    duration: number;
    codec: string;
  };
  assets: Asset[];
  createdAt: string;
  updatedAt: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  proxyUrl?: string;
  thumbnailUrl?: string;
  mimeType: string;
  size: number;
  duration?: number;
}

interface Clip {
  id: string;
  name: string;
  assetId: string;
  startTime: number;
  endTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
}

interface EditOperation {
  id: string;
  type: string;
  sourceClipId: string;
  startTime: number;
  endTime: number;
  priority: number;
  status: string;
  confidence: number;
  parameters: Record<string, unknown>;
}

interface EditPlan {
  id: string;
  operations: EditOperation[];
  renderStrategy: string;
  qualityTarget: string;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  duration: number;
}

interface UIState {
  selectedClipId: string | null;
  selectedOperationId: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isProcessing: boolean;
  processProgress: number;
  error: string | null;
}

interface AppState {
  project: Project | null;
  clips: Clip[];
  operations: EditOperation[];
  editPlan: EditPlan | null;
  playback: PlaybackState;
  ui: UIState;

  setProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  updateAsset: (assetId: string, updates: Partial<Asset>) => void;
  
  setClips: (clips: Clip[]) => void;
  addClip: (clip: Clip) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  removeClip: (clipId: string) => void;
  
  setOperations: (operations: EditOperation[]) => void;
  addOperation: (operation: EditOperation) => void;
  updateOperation: (operationId: string, updates: Partial<EditOperation>) => void;
  removeOperation: (operationId: string) => void;
  
  setEditPlan: (plan: EditPlan | null) => void;
  
  setPlayback: (updates: Partial<PlaybackState>) => void;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  
  setUI: (updates: Partial<UIState>) => void;
  selectClip: (clipId: string | null) => void;
  selectOperation: (operationId: string | null) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  project: null,
  clips: [],
  operations: [],
  editPlan: null,
  playback: {
    isPlaying: false,
    currentTime: 0,
    volume: 1,
    duration: 0,
  },
  ui: {
    selectedClipId: null,
    selectedOperationId: null,
    isUploading: false,
    uploadProgress: 0,
    isProcessing: false,
    processProgress: 0,
    error: null,
  },

  setProject: (project) => set({ project }),
  updateProject: (updates) => set((state) => ({
    project: state.project ? { ...state.project, ...updates } : null,
  })),

  addAsset: (asset) => set((state) => ({
    project: state.project
      ? { ...state.project, assets: [...state.project.assets, asset] }
      : null,
  })),
  removeAsset: (assetId) => set((state) => ({
    project: state.project
      ? { ...state.project, assets: state.project.assets.filter((a) => a.id !== assetId) }
      : null,
  })),
  updateAsset: (assetId, updates) => set((state) => ({
    project: state.project
      ? {
          ...state.project,
          assets: state.project.assets.map((a) =>
            a.id === assetId ? { ...a, ...updates } : a
          ),
        }
      : null,
  })),

  setClips: (clips) => set({ clips }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  updateClip: (clipId, updates) => set((state) => ({
    clips: state.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
  })),
  removeClip: (clipId) => set((state) => ({
    clips: state.clips.filter((c) => c.id !== clipId),
  })),

  setOperations: (operations) => set({ operations }),
  addOperation: (operation) => set((state) => ({
    operations: [...state.operations, operation],
  })),
  updateOperation: (operationId, updates) => set((state) => ({
    operations: state.operations.map((o) =>
      o.id === operationId ? { ...o, ...updates } : o
    ),
  })),
  removeOperation: (operationId) => set((state) => ({
    operations: state.operations.filter((o) => o.id !== operationId),
  })),

  setEditPlan: (editPlan) => set({ editPlan }),

  setPlayback: (updates) => set((state) => ({
    playback: { ...state.playback, ...updates },
  })),
  play: () => set((state) => ({
    playback: { ...state.playback, isPlaying: true },
  })),
  pause: () => set((state) => ({
    playback: { ...state.playback, isPlaying: false },
  })),
  seek: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: time },
  })),

  setUI: (updates) => set((state) => ({
    ui: { ...state.ui, ...updates },
  })),
  selectClip: (clipId) => set((state) => ({
    ui: { ...state.ui, selectedClipId: clipId },
  })),
  selectOperation: (operationId) => set((state) => ({
    ui: { ...state.ui, selectedOperationId: operationId },
  })),
  setError: (error) => set((state) => ({
    ui: { ...state.ui, error },
  })),
}));
