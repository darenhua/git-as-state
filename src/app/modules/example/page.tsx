"use client";

import { useState } from "react";
import { Counter } from "./components/Counter";
import { INITIAL_COUNTERS } from "./types";
import type { CounterState } from "./types";

export default function ExamplePage() {
  const [counters, setCounters] = useState<CounterState[]>(INITIAL_COUNTERS);

  function updateCounter(index: number, delta: number) {
    setCounters((prev) =>
      prev.map((c, i) => (i === index ? { ...c, count: c.count + delta } : c))
    );
  }

  const total = counters.reduce((sum, c) => sum + c.count, 0);

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
            Example Module
          </h1>
          <p className="mt-1 text-zinc-500">
            A demo module showing the standard structure: page, types, and components.
          </p>
        </header>

        <main className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Counters
            </h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-mono tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Total: {total}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {counters.map((counter, i) => (
              <Counter
                key={counter.label}
                label={counter.label}
                count={counter.count}
                onIncrement={() => updateCounter(i, 1)}
                onDecrement={() => updateCounter(i, -1)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
