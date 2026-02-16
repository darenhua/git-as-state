import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  type BranchMetadata,
  type PrototypeBranch,
  type PrototypeCommit,
  type PrototypeStage,
  type PrototypeType,
  PREFIX_TO_TYPE,
  PROTOTYPE_TYPE_PREFIXES,
  PROTOTYPE_TYPES,
  STAGE_ORDER,
} from '../types';

// --- Configuration ---
const REPO_ROOT = process.cwd();
const PROTOTYPES_DIR = path.join(REPO_ROOT, 'prototypes');
const BASE_BRANCH = 'main';
// All branch prefixes we manage (prototype/, integration/, completion/)
const ALL_PREFIXES = Object.values(PROTOTYPE_TYPE_PREFIXES);

// --- Low-level helpers ---

function exec(command: string, opts?: { allowFailure?: boolean }): string {
  try {
    return execSync(command, {
      cwd: REPO_ROOT,
      encoding: 'utf-8',
      timeout: 30_000,
    }).trim();
  } catch (error: unknown) {
    if (opts?.allowFailure) return '';
    const msg =
      error instanceof Error
        ? (error as Error & { stderr?: string }).stderr || error.message
        : String(error);
    throw new Error(`Git command failed: ${command}\n${msg}`);
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

// --- Branch name format: {type_prefix}/{NNN}-{slug} ---
// e.g. prototype/001-auth-flow, integration/002-data-sync

const BRANCH_SLUG_RE = /^(\d{3})-(.+)$/;

function parseBranchFull(fullName: string): BranchMetadata | null {
  for (const prefix of ALL_PREFIXES) {
    if (fullName.startsWith(`${prefix}/`)) {
      const rest = fullName.slice(prefix.length + 1);
      const match = rest.match(BRANCH_SLUG_RE);
      if (!match) return null;
      return {
        type: PREFIX_TO_TYPE[prefix],
        id: parseInt(match[1], 10),
        slug: match[2],
      };
    }
  }
  return null;
}

function nextId(): number {
  let max = 0;
  for (const prefix of ALL_PREFIXES) {
    const out = exec(
      `git branch --list "${prefix}/*" --format="%(refname:short)"`,
      { allowFailure: true },
    );
    if (!out) continue;
    for (const b of out.split('\n').filter(Boolean)) {
      const meta = parseBranchFull(b);
      if (meta && meta.id > max) max = meta.id;
    }
  }
  return max + 1;
}

function parseStageFromMessage(message: string): PrototypeStage | null {
  const match = message.match(/^\[([^\]]+)\]/);
  if (!match) return null;
  const tag = match[1] as PrototypeStage;
  return STAGE_ORDER.includes(tag) ? tag : null;
}

function stageCommitMessage(
  stage: PrototypeStage,
  prototypeName: string,
  customMessage?: string,
): string {
  switch (stage) {
    case 'init-folder':
      return `[init-folder] Initialize prototype: ${prototypeName}`;
    case 'clone-reference':
      return `[clone-reference] Clone reference template: ${prototypeName}`;
    case 'include-spec':
      return `[include-spec] Add specification: ${prototypeName}`;
    case 'implementation-done':
      return `[implementation-done] Implementation complete: ${prototypeName}`;
    case 'generic':
      return customMessage || `Update prototype: ${prototypeName}`;
  }
}

// --- Branch safety: stash/unstash ---

function stash(): boolean {
  const result = exec('git stash push -m "git-as-state-auto-stash"', {
    allowFailure: true,
  });
  return !!result && !result.includes('No local changes');
}

function unstash(): void {
  exec('git stash pop', { allowFailure: true });
}

// --- Read-only queries (no branch switching needed) ---

export function getCurrentBranch(): string {
  return exec('git rev-parse --abbrev-ref HEAD');
}

export function getCommitsForBranch(branchName: string): PrototypeCommit[] {
  const log = exec(
    `git log ${BASE_BRANCH}..${branchName} --format="%H|%s|%ai|%an" --reverse`,
    { allowFailure: true },
  );
  if (!log) return [];

  return log
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const parts = line.split('|');
      const hash = parts[0];
      const message = parts[1];
      const date = parts[2];
      const author = parts.slice(3).join('|'); // author may contain |
      return {
        hash,
        message,
        stage: parseStageFromMessage(message),
        date,
        author,
      };
    });
}

export function getCompletedStages(
  commits: PrototypeCommit[],
): PrototypeStage[] {
  return commits
    .map((c) => c.stage)
    .filter((s): s is PrototypeStage => s !== null && s !== 'generic');
}

export function getNextStage(
  commits: PrototypeCommit[],
): PrototypeStage | null {
  const completed = getCompletedStages(commits);

  if (completed.length === 0) return 'init-folder';

  const lastCompleted = completed[completed.length - 1];
  const lastIndex = STAGE_ORDER.indexOf(lastCompleted);

  // If we've reached implementation-done, only generic is allowed
  if (lastCompleted === 'implementation-done') return 'generic';

  // If somehow past the ordered stages, allow generic
  if (lastIndex >= STAGE_ORDER.length - 2) return 'generic';

  return STAGE_ORDER[lastIndex + 1];
}

export function listPrototypeBranches(): PrototypeBranch[] {
  const currentBranch = getCurrentBranch();
  const branches: PrototypeBranch[] = [];

  // Scan all managed prefixes
  for (const prefix of ALL_PREFIXES) {
    const branchOutput = exec(
      `git branch --list "${prefix}/*" --format="%(refname:short)|%(upstream:short)"`,
      { allowFailure: true },
    );
    if (!branchOutput) continue;

    for (const line of branchOutput.split('\n')) {
      if (!line.trim()) continue;
      const [name, upstream] = line.split('|');
      const meta = parseBranchFull(name);

      // Skip branches that don't match our naming convention
      if (!meta) continue;

      const commits = getCommitsForBranch(name);
      const completedStages = getCompletedStages(commits);
      const nextStage = getNextStage(commits);

      branches.push({
        name,
        displayName: meta.slug,
        meta,
        completedStages,
        nextStage,
        commits,
        isCurrentBranch: name === currentBranch,
        hasRemote: !!upstream,
        hasPR: false, // checked separately if needed
      });
    }
  }

  // Sort by ID ascending
  branches.sort((a, b) => a.meta.id - b.meta.id);
  return branches;
}

// --- Mutating operations (need branch switching) ---

export function createBranch(name: string, type: PrototypeType): PrototypeBranch {
  if (!PROTOTYPE_TYPES.includes(type)) {
    throw new Error(`Invalid prototype type '${type}'. Must be one of: ${PROTOTYPE_TYPES.join(', ')}`);
  }

  const slug = slugify(name);
  if (!slug) {
    throw new Error('Name must contain at least one alphanumeric character');
  }

  const prefix = PROTOTYPE_TYPE_PREFIXES[type];
  const id = nextId();
  const branchName = `${prefix}/${String(id).padStart(3, '0')}-${slug}`;

  // Check if branch already exists (shouldn't with auto-increment, but safety check)
  const existing = exec(`git branch --list "${branchName}"`, {
    allowFailure: true,
  });
  if (existing) {
    throw new Error(`Branch '${branchName}' already exists`);
  }

  // Create branch from base without switching
  exec(`git branch ${branchName} ${BASE_BRANCH}`);

  const meta: BranchMetadata = { type, id, slug };

  return {
    name: branchName,
    displayName: slug,
    meta,
    completedStages: [],
    nextStage: 'init-folder',
    commits: [],
    isCurrentBranch: false,
    hasRemote: false,
    hasPR: false,
  };
}

export function createCommit(
  branchName: string,
  stage: PrototypeStage,
  options?: { specContent?: string; message?: string },
): PrototypeCommit {
  const meta = parseBranchFull(branchName);
  if (!meta) {
    throw new Error(`Branch '${branchName}' does not match managed naming convention`);
  }
  // Use the full NNN-slug as the prototype directory name
  const prototypeName = `${String(meta.id).padStart(3, '0')}-${meta.slug}`;
  const previousBranch = getCurrentBranch();
  const didStash = stash();

  try {
    // Switch to prototype branch
    exec(`git checkout ${branchName}`);

    // Validate stage order
    const commits = getCommitsForBranch(branchName);
    const nextAllowed = getNextStage(commits);

    if (nextAllowed !== stage) {
      throw new Error(
        `Stage '${stage}' not allowed. Next required stage: '${nextAllowed}'. ` +
          `Complete previous stages first.`,
      );
    }

    // Execute the side-effect for this stage
    runSideEffect(stage, prototypeName, options);

    // Stage the prototype files (scoped to prototype dir for non-generic)
    if (stage === 'generic') {
      exec('git add -A');
    } else {
      exec(`git add prototypes/${prototypeName}`);
    }

    // Create the commit
    const message = stageCommitMessage(stage, prototypeName, options?.message);
    exec(`git commit -m "${message.replace(/"/g, '\\"')}"`);

    const hash = exec('git rev-parse HEAD');

    return {
      hash,
      message,
      stage,
      date: new Date().toISOString(),
      author: exec('git config user.name', { allowFailure: true }) || 'unknown',
    };
  } finally {
    // Always switch back
    if (previousBranch !== branchName) {
      exec(`git checkout ${previousBranch}`, { allowFailure: true });
    }
    if (didStash) unstash();
  }
}

function runSideEffect(
  stage: PrototypeStage,
  prototypeName: string,
  options?: { specContent?: string },
): void {
  const protoDir = path.join(PROTOTYPES_DIR, prototypeName);

  switch (stage) {
    case 'init-folder': {
      fs.mkdirSync(protoDir, { recursive: true });
      const componentName = toPascalCase(prototypeName);
      fs.writeFileSync(
        path.join(protoDir, 'page.tsx'),
        [
          `export default function ${componentName}Page() {`,
          `  return (`,
          `    <div>`,
          `      <h1>Prototype: ${prototypeName}</h1>`,
          `      <p>This prototype is under construction.</p>`,
          `    </div>`,
          `  );`,
          `}`,
          ``,
        ].join('\n'),
      );
      break;
    }

    case 'clone-reference': {
      // STUB: In production this would run `npx create-next-app` or clone a
      // reference repo. For now we scaffold a minimal template structure.
      fs.mkdirSync(protoDir, { recursive: true });

      fs.writeFileSync(
        path.join(protoDir, 'package.json'),
        JSON.stringify(
          {
            name: prototypeName,
            version: '0.1.0',
            private: true,
            scripts: {
              dev: 'next dev',
              build: 'next build',
              start: 'next start',
            },
            dependencies: {
              next: 'latest',
              react: 'latest',
              'react-dom': 'latest',
            },
          },
          null,
          2,
        ) + '\n',
      );

      fs.writeFileSync(
        path.join(protoDir, 'tsconfig.json'),
        JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2017',
              lib: ['dom', 'dom.iterable', 'esnext'],
              jsx: 'react-jsx',
              strict: true,
              module: 'esnext',
              moduleResolution: 'bundler',
            },
          },
          null,
          2,
        ) + '\n',
      );

      fs.writeFileSync(
        path.join(protoDir, 'next.config.ts'),
        [
          'import type { NextConfig } from "next";',
          '',
          'const nextConfig: NextConfig = {};',
          '',
          'export default nextConfig;',
          '',
        ].join('\n'),
      );

      fs.writeFileSync(
        path.join(protoDir, 'layout.tsx'),
        [
          'export const metadata = {',
          `  title: "${prototypeName}",`,
          '};',
          '',
          'export default function RootLayout({ children }: { children: React.ReactNode }) {',
          '  return (',
          '    <html lang="en">',
          '      <body>{children}</body>',
          '    </html>',
          '  );',
          '}',
          '',
        ].join('\n'),
      );
      break;
    }

    case 'include-spec': {
      const content =
        options?.specContent ||
        [
          `# ${prototypeName} — Specification`,
          '',
          '## Overview',
          '',
          'TODO: Describe what this prototype does.',
          '',
          '## Requirements',
          '',
          '- [ ] Requirement 1',
          '- [ ] Requirement 2',
          '',
          '## Implementation Notes',
          '',
          'TODO: Add implementation details.',
          '',
        ].join('\n');

      fs.writeFileSync(path.join(protoDir, 'spec.md'), content);
      break;
    }

    case 'implementation-done': {
      fs.writeFileSync(
        path.join(protoDir, '.complete'),
        `Implementation completed at ${new Date().toISOString()}\n`,
      );
      break;
    }

    case 'generic':
      // No predefined side-effect — user makes changes manually or via message
      break;
  }
}

export function pushBranch(branchName: string): string {
  return exec(`git push -u origin ${branchName}`);
}

export function createPullRequest(
  branchName: string,
  title: string,
  body?: string,
): { url: string; stubbed: boolean } {
  try {
    // Check if gh CLI is available
    exec('which gh');
    const bodyArg = body
      ? ` --body "${body.replace(/"/g, '\\"')}"`
      : ' --body ""';
    const url = exec(
      `gh pr create --base ${BASE_BRANCH} --head ${branchName} --title "${title.replace(/"/g, '\\"')}"${bodyArg}`,
    );
    return { url, stubbed: false };
  } catch {
    // STUB: gh CLI not available or not authenticated
    return {
      url: `(stubbed) https://github.com/your-org/your-repo/compare/${BASE_BRANCH}...${branchName}?title=${encodeURIComponent(title)}`,
      stubbed: true,
    };
  }
}

export function syncBranch(branchName: string): string {
  const previousBranch = getCurrentBranch();
  const didStash = stash();

  try {
    exec(`git checkout ${branchName}`);
    return exec(`git pull origin ${branchName}`, { allowFailure: true });
  } finally {
    if (previousBranch !== branchName) {
      exec(`git checkout ${previousBranch}`, { allowFailure: true });
    }
    if (didStash) unstash();
  }
}
