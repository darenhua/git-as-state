import Link from "next/link";
import { getModules, createModule } from "./actions";
import { CreateModuleForm } from "./create-module-form";

export default async function ModulesDirectoryPage() {
  const modules = await getModules();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <a
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            &larr; Home
          </a>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Modules
          </h1>
          <p className="mt-1 text-zinc-500">
            Isolated prototype pages. Each module is self-contained with its own
            components, types, and hooks.
          </p>
        </header>

        <CreateModuleForm createModule={createModule} />

        {modules.length === 0 ? (
          <p className="text-zinc-500">
            No modules yet. Create one above to get started.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((mod) => (
              <Link
                key={mod.slug}
                href={`/modules/${mod.slug}`}
                className="group rounded-lg border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <h2 className="font-semibold text-zinc-900 group-hover:text-zinc-700 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                  {mod.name}
                </h2>
                <p className="mt-1 font-mono text-sm text-zinc-400">
                  /modules/{mod.slug}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
