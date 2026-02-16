// Types for the Example module

export interface CounterState {
  count: number;
  label: string;
}

export const INITIAL_COUNTERS: CounterState[] = [
  { count: 0, label: "Alpha" },
  { count: 0, label: "Beta" },
  { count: 0, label: "Gamma" },
];
