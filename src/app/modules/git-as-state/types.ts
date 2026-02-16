// Types for the git-as-state module
// Git branches as prototype state machines

// --- Prototype types encoded in branch name ---

export type PrototypeType = 'PRO' | 'INT' | 'COM';

export const PROTOTYPE_TYPES: PrototypeType[] = ['PRO', 'INT', 'COM'];

export const PROTOTYPE_TYPE_LABELS: Record<PrototypeType, string> = {
  PRO: 'Prototype',
  INT: 'Integration',
  COM: 'Completion',
};

export const PROTOTYPE_TYPE_PREFIXES: Record<PrototypeType, string> = {
  PRO: 'prototype',
  INT: 'integration',
  COM: 'completion',
};

// Reverse lookup: prefix string → type
export const PREFIX_TO_TYPE: Record<string, PrototypeType> = {
  prototype: 'PRO',
  integration: 'INT',
  completion: 'COM',
};

export const PROTOTYPE_TYPE_COLORS: Record<
  PrototypeType,
  { bg: string; text: string; border: string }
> = {
  PRO: {
    bg: 'bg-sky-500/20',
    text: 'text-sky-400',
    border: 'border-sky-500/30',
  },
  INT: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  COM: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
};

// --- Pipeline stages ---

export type PrototypeStage =
  | 'init-folder'
  | 'clone-reference'
  | 'include-spec'
  | 'implementation-done'
  | 'generic';

export const STAGE_ORDER: PrototypeStage[] = [
  'init-folder',
  'clone-reference',
  'include-spec',
  'implementation-done',
  'generic',
];

export const STAGE_LABELS: Record<PrototypeStage, string> = {
  'init-folder': 'Init Folder',
  'clone-reference': 'Clone Reference',
  'include-spec': 'Include Spec',
  'implementation-done': 'Impl Done',
  generic: 'Custom Commit',
};

export const STAGE_DESCRIPTIONS: Record<PrototypeStage, string> = {
  'init-folder': 'Create empty folder with blank page.tsx',
  'clone-reference': 'Scaffold reference template into prototype folder',
  'include-spec': 'Add spec.md with prototype instructions',
  'implementation-done': 'Mark implementation as complete',
  generic: 'Free-form commit (any message)',
};

export interface PrototypeCommit {
  hash: string;
  message: string;
  stage: PrototypeStage | null;
  date: string;
  author: string;
}

export interface BranchMetadata {
  type: PrototypeType;
  id: number;
  slug: string;
}

export interface PrototypeBranch {
  name: string;
  displayName: string;
  meta: BranchMetadata;
  completedStages: PrototypeStage[];
  nextStage: PrototypeStage | null;
  commits: PrototypeCommit[];
  isCurrentBranch: boolean;
  hasRemote: boolean;
  hasPR: boolean;
  prUrl?: string;
}

// API request/response types

export interface CreateBranchRequest {
  name: string;
  type: PrototypeType;
}

export interface CreateCommitRequest {
  branch: string;
  stage: PrototypeStage;
  message?: string;
  specContent?: string;
}

export interface PushRequest {
  branch: string;
}

export interface CreatePRRequest {
  branch: string;
  title: string;
  body?: string;
}

export interface SyncRequest {
  branch: string;
}

export interface RebaseRequest {
  branch: string;
  ontoCommit: string; // commit hash on main to rebase onto
}

// A commit on the main branch (for rebase target selection)
export interface MainCommit {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
  author: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
