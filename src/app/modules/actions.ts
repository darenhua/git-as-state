"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";

const MODULES_DIR = path.join(process.cwd(), "src/app/modules");

export async function getModules(): Promise<
  { name: string; slug: string; createdAt: Date }[]
> {
  const entries = await fs.readdir(MODULES_DIR, { withFileTypes: true });

  const modules = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pagePath = path.join(MODULES_DIR, entry.name, "page.tsx");
    try {
      const stat = await fs.stat(pagePath);
      modules.push({
        name: entry.name
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        slug: entry.name,
        createdAt: stat.birthtime,
      });
    } catch {
      // skip directories without a page.tsx
    }
  }

  return modules.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function createModule(formData: FormData): Promise<{ error?: string }> {
  const rawName = formData.get("name") as string;

  if (!rawName || rawName.trim().length === 0) {
    return { error: "Module name is required" };
  }

  const slug = rawName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (slug.length === 0) {
    return { error: "Invalid module name" };
  }

  const moduleDir = path.join(MODULES_DIR, slug);

  try {
    await fs.access(moduleDir);
    return { error: `Module "${slug}" already exists` };
  } catch {
    // doesn't exist yet, good
  }

  const displayName = rawName.trim();

  await fs.mkdir(path.join(moduleDir, "components"), { recursive: true });

  await Promise.all([
    fs.writeFile(
      path.join(moduleDir, "page.tsx"),
      `"use client";

import { useState } from "react";

export default function ${toPascalCase(slug)}Page() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <a
            href="/modules"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            &larr; All Modules
          </a>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            ${displayName}
          </h1>
          <p className="mt-1 text-zinc-500">
            Prototype module — edit this page to start building.
          </p>
        </header>

        <main className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-600 dark:text-zinc-400">
            This is your blank canvas. Start prototyping here.
          </p>
        </main>
      </div>
    </div>
  );
}
`
    ),

    fs.writeFile(
      path.join(moduleDir, "types.ts"),
      `// Types for the ${displayName} module

export interface ${toPascalCase(slug)}State {
  // Define your module state here
}
`
    ),
  ]);

  revalidatePath("/modules");
  return {};
}

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}
