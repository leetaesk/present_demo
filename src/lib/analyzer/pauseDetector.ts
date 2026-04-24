import { soundCue } from "../audio/soundCue";
import { useLiveStore } from "../../store/liveStore";

export class PauseDetector {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pauseDuration: number;
  private getCurrentKeyword: () => string | null;

  constructor(options: {
    pauseDuration?: number;
    getCurrentKeyword?: () => string | null;
  } = {}) {
    this.pauseDuration = options.pauseDuration ?? 3;
    this.getCurrentKeyword = options.getCurrentKeyword ?? (() => null);
  }

  onStart() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  onEnd() {
    this.timer = setTimeout(() => {
      this.timer = null;
      soundCue.play("pause");
      useLiveStore.getState().incrementPause();

      const keyword = this.getCurrentKeyword();
      if (keyword && typeof speechSynthesis !== "undefined") {
        speechSynthesis.speak(new SpeechSynthesisUtterance(keyword));
      }
    }, this.pauseDuration * 1000);
  }

  setPauseDuration(seconds: number) {
    this.pauseDuration = seconds;
  }

  setGetCurrentKeyword(fn: () => string | null) {
    this.getCurrentKeyword = fn;
  }

  destroy() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
