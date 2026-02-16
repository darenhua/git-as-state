"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ApiResponse,
  MainCommit,
  PrototypeBranch,
  PrototypeCommit,
  PrototypeStage,
  PrototypeType,
} from "./types";
import {
  PROTOTYPE_TYPE_COLORS,
  PROTOTYPE_TYPE_LABELS,
  PROTOTYPE_TYPE_PREFIXES,
  PROTOTYPE_TYPES,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  STAGE_ORDER,
} from "./types";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const API_BASE = "/modules/git-as-state/api";

async function apiFetch<T>(
  path: string,
  opts?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  return res.json();
}

async function fetchBranches() {
  return apiFetch<PrototypeBranch[]>("/branches");
}

async function apiCreateBranch(name: string, type: PrototypeType) {
  return apiFetch<PrototypeBranch>("/create-branch", {
    method: "POST",
    body: JSON.stringify({ name, type }),
  });
}

async function apiCommit(
  branch: string,
  stage: PrototypeStage,
  extra?: { message?: string; specContent?: string }
) {
  return apiFetch<PrototypeCommit>("/commit", {
    method: "POST",
    body: JSON.stringify({ branch, stage, ...extra }),
  });
}

async function apiPush(branch: string) {
  return apiFetch<{ output: string }>("/push", {
    method: "POST",
    body: JSON.stringify({ branch }),
  });
}

async function apiCreatePR(branch: string, title: string, body?: string) {
  return apiFetch<{ url: string; stubbed: boolean }>("/create-pr", {
    method: "POST",
    body: JSON.stringify({ branch, title, body }),
  });
}

async function apiSync(branch: string) {
  return apiFetch<{ output: string }>("/sync", {
    method: "POST",
    body: JSON.stringify({ branch }),
  });
}

async function apiGetMainCommits(limit = 30) {
  return apiFetch<MainCommit[]>(`/main-commits?limit=${limit}`);
}

async function apiRebase(branch: string, ontoCommit: string) {
  return apiFetch<{ message: string }>("/rebase", {
    method: "POST",
    body: JSON.stringify({ branch, ontoCommit }),
  });
}

// ---------------------------------------------------------------------------
// Stage progress component
// ---------------------------------------------------------------------------

function StageProgress({
  completedStages,
  nextStage,
}: {
  completedStages: PrototypeStage[];
  nextStage: PrototypeStage | null;
}) {
  const orderedStages = STAGE_ORDER.slice(0, 4); // exclude 'generic' from progress bar

  return (
    <div className="flex items-center gap-1">
      {orderedStages.map((stage, i) => {
        const done = completedStages.includes(stage);
        const isNext = stage === nextStage;
        const isGenericNext = nextStage === "generic";

        return (
          <div key={stage} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-0.5 w-4 sm:w-6 ${
                  done
                    ? "bg-emerald-500"
                    : "bg-zinc-700"
                }`}
              />
            )}
            <div className="group relative">
              <div
                className={`h-3 w-3 rounded-full border-2 transition-all ${
                  done
                    ? "border-emerald-500 bg-emerald-500"
                    : isNext
                      ? "border-indigo-400 bg-indigo-400/20 animate-pulse"
                      : isGenericNext
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-zinc-600 bg-transparent"
                }`}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] leading-tight bg-zinc-800 text-zinc-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {STAGE_LABELS[stage]}
                {done && " ✓"}
                {isNext && " (next)"}
              </div>
            </div>
          </div>
        );
      })}
      {nextStage === "generic" && (
        <>
          <div className="h-0.5 w-4 sm:w-6 bg-emerald-500" />
          <div className="group relative">
            <div className="h-3 w-3 rounded-full border-2 border-indigo-400 bg-indigo-400/20 animate-pulse" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] leading-tight bg-zinc-800 text-zinc-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Custom Commits (next)
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Commit timeline
// ---------------------------------------------------------------------------

function CommitTimeline({ commits }: { commits: PrototypeCommit[] }) {
  if (commits.length === 0) {
    return (
      <p className="text-xs text-zinc-500 italic">No commits yet</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {commits.map((c, i) => (
        <div key={c.hash} className="flex items-start gap-2 text-xs">
          <div className="flex flex-col items-center mt-1">
            <div
              className={`h-2 w-2 rounded-full ${
                c.stage ? "bg-emerald-500" : "bg-zinc-500"
              }`}
            />
            {i < commits.length - 1 && (
              <div className="h-4 w-px bg-zinc-700 mt-0.5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-zinc-200 truncate font-mono text-[11px]">
              {c.message}
            </p>
            <p className="text-zinc-500 text-[10px]">
              {c.hash.slice(0, 7)} &middot; {formatDate(c.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
}

// ---------------------------------------------------------------------------
// Next-step action panel
// ---------------------------------------------------------------------------

function NextStepPanel({
  branch,
  nextStage,
  loading,
  onExecute,
}: {
  branch: PrototypeBranch;
  nextStage: PrototypeStage;
  loading: boolean;
  onExecute: (
    stage: PrototypeStage,
    extra?: { message?: string; specContent?: string }
  ) => void;
}) {
  const [specContent, setSpecContent] = useState("");
  const [commitMsg, setCommitMsg] = useState("");

  if (nextStage === "include-spec") {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-zinc-400">
          Spec content (markdown)
        </label>
        <textarea
          value={specContent}
          onChange={(e) => setSpecContent(e.target.value)}
          rows={4}
          placeholder="# My Prototype Spec\n\n- requirement 1\n- requirement 2"
          className="w-full rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={() => onExecute("include-spec", { specContent })}
          disabled={loading}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
        >
          {loading ? "Committing..." : "Add Spec & Commit"}
        </button>
      </div>
    );
  }

  if (nextStage === "generic") {
    return (
      <div className="space-y-2">
        <label className="block text-xs text-zinc-400">Commit message</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Describe your changes..."
            className="flex-1 rounded border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && commitMsg.trim()) {
                onExecute("generic", { message: commitMsg.trim() });
                setCommitMsg("");
              }
            }}
          />
          <button
            onClick={() => {
              if (commitMsg.trim()) {
                onExecute("generic", { message: commitMsg.trim() });
                setCommitMsg("");
              }
            }}
            disabled={loading || !commitMsg.trim()}
            className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Commit"}
          </button>
        </div>
      </div>
    );
  }

  // For init-folder, clone-reference, implementation-done — just a button
  return (
    <button
      onClick={() => onExecute(nextStage)}
      disabled={loading}
      className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
    >
      {loading ? "Running..." : `Run: ${STAGE_LABELS[nextStage]}`}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Branch card
// ---------------------------------------------------------------------------

function BranchCard({
  branch,
  onRefresh,
}: {
  branch: PrototypeBranch;
  onRefresh: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "ok" | "err";
  } | null>(null);
  const [prTitle, setPrTitle] = useState(
    `Prototype: ${branch.displayName}`
  );
  const [showPRForm, setShowPRForm] = useState(false);
  const [showRebase, setShowRebase] = useState(false);
  const [mainCommits, setMainCommits] = useState<MainCommit[]>([]);
  const [loadingMainCommits, setLoadingMainCommits] = useState(false);
  const [selectedRebaseCommit, setSelectedRebaseCommit] = useState<string>("");

  function flash(msg: string, type: "ok" | "err") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleCommit(
    stage: PrototypeStage,
    extra?: { message?: string; specContent?: string }
  ) {
    setActionLoading("commit");
    const res = await apiCommit(branch.name, stage, extra);
    setActionLoading(null);
    if (res.ok) {
      flash(`Committed: ${res.data?.message}`, "ok");
      onRefresh();
    } else {
      flash(res.error || "Commit failed", "err");
    }
  }

  async function handlePush() {
    setActionLoading("push");
    const res = await apiPush(branch.name);
    setActionLoading(null);
    if (res.ok) {
      flash("Pushed to remote", "ok");
      onRefresh();
    } else {
      flash(res.error || "Push failed", "err");
    }
  }

  async function handleCreatePR() {
    if (!prTitle.trim()) return;
    setActionLoading("pr");
    const res = await apiCreatePR(branch.name, prTitle.trim());
    setActionLoading(null);
    if (res.ok && res.data) {
      flash(
        res.data.stubbed
          ? `PR stubbed: ${res.data.url}`
          : `PR created: ${res.data.url}`,
        res.data.stubbed ? "err" : "ok"
      );
      setShowPRForm(false);
      onRefresh();
    } else {
      flash(res.error || "PR creation failed", "err");
    }
  }

  async function handleSync() {
    setActionLoading("sync");
    const res = await apiSync(branch.name);
    setActionLoading(null);
    if (res.ok) {
      flash("Synced from remote", "ok");
      onRefresh();
    } else {
      flash(res.error || "Sync failed", "err");
    }
  }

  async function handleOpenRebase() {
    setShowRebase(true);
    setLoadingMainCommits(true);
    const res = await apiGetMainCommits();
    setLoadingMainCommits(false);
    if (res.ok && res.data) {
      setMainCommits(res.data);
      if (res.data.length > 0) {
        setSelectedRebaseCommit(res.data[0].hash);
      }
    } else {
      flash(res.error || "Failed to load main commits", "err");
      setShowRebase(false);
    }
  }

  async function handleRebase() {
    if (!selectedRebaseCommit) return;
    setActionLoading("rebase");
    const res = await apiRebase(branch.name, selectedRebaseCommit);
    setActionLoading(null);
    if (res.ok) {
      flash(res.data?.message || "Rebased successfully", "ok");
      setShowRebase(false);
      onRefresh();
    } else {
      flash(res.error || "Rebase failed", "err");
    }
  }

  const stageIndex = branch.completedStages.length;
  const totalStages = 4; // exclude generic
  const progress = Math.min(stageIndex / totalStages, 1);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4 relative overflow-hidden">
      {/* Progress bar at top of card */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono border ${PROTOTYPE_TYPE_COLORS[branch.meta.type].bg} ${PROTOTYPE_TYPE_COLORS[branch.meta.type].text} ${PROTOTYPE_TYPE_COLORS[branch.meta.type].border}`}
            >
              #{String(branch.meta.id).padStart(3, "0")} {PROTOTYPE_TYPE_LABELS[branch.meta.type]}
            </span>
            <h3 className="text-lg font-semibold text-zinc-100">
              {branch.displayName}
            </h3>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            {branch.name}
            <span className="ml-2 text-zinc-600">
              {PROTOTYPE_TYPE_LABELS[branch.meta.type]}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {branch.isCurrentBranch && (
            <span className="rounded-full bg-indigo-500/20 text-indigo-400 px-2 py-0.5 text-[10px] font-medium">
              CURRENT
            </span>
          )}
          {branch.hasRemote && (
            <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
              REMOTE
            </span>
          )}
          {branch.hasPR && (
            <span className="rounded-full bg-purple-500/20 text-purple-400 px-2 py-0.5 text-[10px] font-medium">
              PR
            </span>
          )}
        </div>
      </div>

      {/* Stage progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
            Progress
          </span>
          <span className="text-[10px] text-zinc-500">
            {stageIndex}/{totalStages} stages
          </span>
        </div>
        <StageProgress
          completedStages={branch.completedStages}
          nextStage={branch.nextStage}
        />
      </div>

      {/* Commits */}
      <div>
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium block mb-2">
          Commits
        </span>
        <CommitTimeline commits={branch.commits} />
      </div>

      {/* Next step */}
      {branch.nextStage && (
        <div className="border-t border-zinc-800 pt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              Next Step
            </span>
            <span className="text-[10px] text-zinc-400 bg-zinc-800 rounded px-1.5 py-0.5">
              {STAGE_DESCRIPTIONS[branch.nextStage]}
            </span>
          </div>
          <NextStepPanel
            branch={branch}
            nextStage={branch.nextStage}
            loading={actionLoading === "commit"}
            onExecute={handleCommit}
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="border-t border-zinc-800 pt-3 flex flex-wrap gap-2">
        <button
          onClick={handlePush}
          disabled={!!actionLoading}
          className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          {actionLoading === "push" ? "Pushing..." : "Push"}
        </button>

        {!showPRForm ? (
          <button
            onClick={() => setShowPRForm(true)}
            disabled={!!actionLoading}
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 transition-colors"
          >
            Create PR
          </button>
        ) : (
          <div className="flex gap-2 items-center flex-1 min-w-0">
            <input
              type="text"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="flex-1 min-w-0 rounded border border-zinc-700 bg-zinc-800/50 px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreatePR}
              disabled={!!actionLoading || !prTitle.trim()}
              className="rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {actionLoading === "pr" ? "..." : "Create"}
            </button>
            <button
              onClick={() => setShowPRForm(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={!!actionLoading}
          className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          {actionLoading === "sync" ? "Syncing..." : "Sync"}
        </button>

        {!showRebase ? (
          <button
            onClick={handleOpenRebase}
            disabled={!!actionLoading}
            className="rounded border border-orange-700/50 px-3 py-1.5 text-xs text-orange-400 hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50 transition-colors"
          >
            Rebase
          </button>
        ) : (
          <div className="basis-full mt-2 rounded border border-orange-700/30 bg-orange-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-orange-400">
                Rebase onto commit on main
              </span>
              <button
                onClick={() => setShowRebase(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
            {loadingMainCommits ? (
              <p className="text-xs text-zinc-500">Loading main commits...</p>
            ) : (
              <>
                <select
                  value={selectedRebaseCommit}
                  onChange={(e) => setSelectedRebaseCommit(e.target.value)}
                  className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-orange-500"
                >
                  {mainCommits.map((c) => (
                    <option key={c.hash} value={c.hash}>
                      {c.shortHash} — {c.message.slice(0, 60)}
                      {c.message.length > 60 ? "..." : ""}
                    </option>
                  ))}
                </select>
                {selectedRebaseCommit && (
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {mainCommits.find((c) => c.hash === selectedRebaseCommit)
                      ?.date
                      ? `${formatDate(
                          mainCommits.find(
                            (c) => c.hash === selectedRebaseCommit
                          )!.date
                        )} by ${
                          mainCommits.find(
                            (c) => c.hash === selectedRebaseCommit
                          )!.author
                        }`
                      : ""}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRebase}
                    disabled={
                      !!actionLoading || !selectedRebaseCommit
                    }
                    className="rounded bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "rebase"
                      ? "Rebasing..."
                      : "Rebase Branch"}
                  </button>
                  <span className="text-[10px] text-zinc-600">
                    Aborts on conflict — branch stays unchanged
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`absolute bottom-3 left-3 right-3 rounded px-3 py-2 text-xs font-medium transition-all ${
            toast.type === "ok"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-red-500/20 text-red-300 border border-red-500/30"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function GitAsStatePage() {
  const [branches, setBranches] = useState<PrototypeBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<PrototypeType>("PRO");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetchBranches();
    if (res.ok && res.data) {
      setBranches(res.data);
      setError(null);
    } else {
      setError(res.error || "Failed to fetch branches");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await apiCreateBranch(newName.trim(), newType);
    setCreating(false);
    if (res.ok) {
      setNewName("");
      setNewType("PRO");
      setShowCreate(false);
      refresh();
    } else {
      setError(res.error || "Failed to create branch");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <a
                href="/modules"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                &larr; All Modules
              </a>
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                Git as State
              </h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Manage prototypes as git branches with enforced commit pipelines
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={loading}
                className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
              <button
                onClick={() => setShowCreate(!showCreate)}
                className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
              >
                + New Prototype
              </button>
            </div>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
              {/* Type selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 mr-1">Type:</span>
                {PROTOTYPE_TYPES.map((t) => {
                  const colors = PROTOTYPE_TYPE_COLORS[t];
                  const selected = newType === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`rounded px-2.5 py-1 text-xs font-medium border transition-colors ${
                        selected
                          ? `${colors.bg} ${colors.text} ${colors.border}`
                          : "border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {t} — {PROTOTYPE_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
              {/* Name + submit */}
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-0 rounded border border-zinc-700 bg-zinc-900 overflow-hidden flex-1">
                  <span className="px-2.5 py-2 text-xs font-mono text-zinc-500 bg-zinc-800 border-r border-zinc-700 select-none">
                    {PROTOTYPE_TYPE_PREFIXES[newType]}/???-
                  </span>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="descriptive-name (e.g. auth-flow)"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                      if (e.key === "Escape") setShowCreate(false);
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newName.trim()}
                  className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create Branch"}
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-sm text-zinc-500 hover:text-zinc-300 px-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-200 text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-6">
        {loading && branches.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block h-6 w-6 border-2 border-zinc-600 border-t-indigo-500 rounded-full animate-spin" />
            <p className="mt-3 text-sm text-zinc-500">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg">
            <div className="text-4xl mb-3 opacity-30">&#9733;</div>
            <h2 className="text-lg font-medium text-zinc-300">
              No prototypes yet
            </h2>
            <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
              Create a new prototype to start. Each prototype is a git branch
              with an enforced commit pipeline: init folder → clone reference →
              include spec → implementation done → free commits.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              + Create Your First Prototype
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {branches.map((b) => (
              <BranchCard key={b.name} branch={b} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>

      {/* Legend / help */}
      <div className="mx-auto max-w-5xl px-6 pb-10">
        <details className="group">
          <summary className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Pipeline stages reference
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {STAGE_ORDER.map((stage, i) => (
              <div
                key={stage}
                className="rounded border border-zinc-800 bg-zinc-900/50 p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-zinc-500">
                    {i + 1}.
                  </span>
                  <span className="text-xs font-medium text-zinc-300">
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">
                  {STAGE_DESCRIPTIONS[stage]}
                </p>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
