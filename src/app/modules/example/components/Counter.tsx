"use client";

interface CounterProps {
  label: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function Counter({
  label,
  count,
  onIncrement,
  onDecrement,
}: CounterProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-200 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          -
        </button>
        <span className="w-8 text-center font-mono text-lg tabular-nums text-zinc-900 dark:text-zinc-100">
          {count}
        </span>
        <button
          onClick={onIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 transition-colors hover:bg-zinc-200 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
