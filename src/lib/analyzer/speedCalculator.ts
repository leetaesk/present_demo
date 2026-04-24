import { soundCue } from "../audio/soundCue";
import { useLiveStore } from "../../store/liveStore";
import type { DeepgramWord } from "../stt/deepgramClient";

interface SpeedSettings {
  min: number;
  max: number;
}

const DEFAULT_SPEED: SpeedSettings = { min: 200, max: 300 }; // 음절/분

export class SpeedCalculator {
  private settings: SpeedSettings;

  constructor(settings: SpeedSettings = DEFAULT_SPEED) {
    this.settings = { ...settings };
  }

  update(words: DeepgramWord[]) {
    if (words.length < 2) return;
    const speed = this.calc(words);
    if (speed === null) return;

    useLiveStore.getState().addSpeed(speed);

    if (speed > this.settings.max) soundCue.play("fast");
    else if (speed < this.settings.min) soundCue.play("slow");
  }

  private calc(words: DeepgramWord[]): number | null {
    const duration = words.at(-1)!.end - words[0].start;
    if (duration <= 0) return null;
    const syllables = words.reduce(
      (acc, w) => acc + [...w.word].filter((c) => /[가-힣]/.test(c)).length,
      0,
    );
    if (syllables === 0) return null;
    return (syllables / duration) * 60; // 음절/분
  }

  setSettings(settings: Partial<SpeedSettings>) {
    this.settings = { ...this.settings, ...settings };
  }
}
