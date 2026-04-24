import { create } from "zustand";

interface LiveState {
  fillerCounts: Record<string, number>;
  speedHistory: number[];
  pauseCount: number;
  sessionActive: boolean;
  sectionIndex: number;
  sectionElapsed: number;

  incrementFiller: (word: string) => void;
  addSpeed: (speed: number) => void;
  incrementPause: () => void;
  startSession: () => void;
  endSession: () => void;
  setSectionProgress: (index: number, elapsed: number) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  fillerCounts: {},
  speedHistory: [],
  pauseCount: 0,
  sessionActive: false,
  sectionIndex: 0,
  sectionElapsed: 0,

  incrementFiller: (word) =>
    set((s) => ({
      fillerCounts: {
        ...s.fillerCounts,
        [word]: (s.fillerCounts[word] ?? 0) + 1,
      },
    })),
  addSpeed: (speed) =>
    set((s) => ({ speedHistory: [...s.speedHistory, speed] })),
  incrementPause: () => set((s) => ({ pauseCount: s.pauseCount + 1 })),
  startSession: () => set({ sessionActive: true }),
  endSession: () => set({ sessionActive: false }),
  setSectionProgress: (index, elapsed) =>
    set({ sectionIndex: index, sectionElapsed: elapsed }),
  reset: () =>
    set({
      fillerCounts: {},
      speedHistory: [],
      pauseCount: 0,
      sessionActive: false,
      sectionIndex: 0,
      sectionElapsed: 0,
    }),
}));
