import { soundCue } from "../audio/soundCue";
import { useLiveStore } from "../../store/liveStore";
import type { DeepgramWord } from "../stt/deepgramClient";

export const DEFAULT_FILLER_WORDS = [
  "어", "음", "그", "저", "뭐", "그리고", "근데", "이제", "사실", "기본적으로", "햄버거",
];

export class FillerDetector {
  private fillerSet: Set<string>;

  constructor(fillerWords: string[] = DEFAULT_FILLER_WORDS) {
    this.fillerSet = new Set(fillerWords);
  }

  check(words: DeepgramWord[]) {
    const { incrementFiller } = useLiveStore.getState();
    for (const w of words) {
      if (this.fillerSet.has(w.word)) {
        soundCue.play("filler");
        incrementFiller(w.word);
      }
    }
  }

  setFillerWords(list: string[]) {
    this.fillerSet = new Set(list);
  }
}
