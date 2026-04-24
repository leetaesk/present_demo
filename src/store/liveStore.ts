import { create } from "zustand";

export interface TranscriptWord {
  text: string;
  isFiller: boolean;
}

export interface TranscriptLine {
  id: number;
  words: TranscriptWord[];
}

interface LiveState {
  fillerCounts: Record<string, number>;
  speedHistory: number[];
  pauseCount: number;
  sessionActive: boolean;
  sectionIndex: number;
  sectionElapsed: number;
  transcriptLines: TranscriptLine[];

  incrementFiller: (word: string) => void;
  addSpeed: (speed: number) => void;
  incrementPause: () => void;
  startSession: () => void;
  endSession: () => void;
  setSectionProgress: (index: number, elapsed: number) => void;
  addTranscriptLine: (words: TranscriptWord[]) => void;
  reset: () => void;
}

let lineId = 0;

export const useLiveStore = create<LiveState>((set) => ({
  fillerCounts: {},
  speedHistory: [],
  pauseCount: 0,
  sessionActive: false,
  sectionIndex: 0,
  sectionElapsed: 0,
  transcriptLines: [],

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
  addTranscriptLine: (words) =>
    set((s) => ({
      transcriptLines: [
        ...s.transcriptLines.slice(-49), // 최대 50줄
        { id: ++lineId, words },
      ],
    })),
  reset: () =>
    set({
      fillerCounts: {},
      speedHistory: [],
      pauseCount: 0,
      sessionActive: false,
      sectionIndex: 0,
      sectionElapsed: 0,
      transcriptLines: [],
    }),
}));
