import { soundCue } from "../audio/soundCue";
import { useLiveStore } from "../../store/liveStore";

export interface Section {
  name: string;
  duration: number; // seconds
  keyword?: string; // pauseDetector TTS 힌트
}

export class SectionTimer {
  private sections: Section[];
  private index: number = 0;
  private elapsed: number = 0;
  private overageCued: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(sections: Section[] = []) {
    this.sections = sections;
  }

  start() {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => this.tick(), 1000);
    useLiveStore.getState().setSectionProgress(this.index, this.elapsed);
  }

  private tick() {
    if (this.sections.length === 0) return;
    if (this.index >= this.sections.length) return;

    this.elapsed += 1;
    useLiveStore.getState().setSectionProgress(this.index, this.elapsed);

    const limit = this.sections[this.index].duration;
    if (this.elapsed > limit && !this.overageCued) {
      this.overageCued = true;
      soundCue.play("section");
    }
  }

  // 다음 섹션으로 수동 전환 (발표자가 버튼 누를 때)
  next() {
    if (this.index < this.sections.length - 1) {
      this.index += 1;
      this.elapsed = 0;
      this.overageCued = false;
      useLiveStore.getState().setSectionProgress(this.index, this.elapsed);
    }
  }

  currentKeyword(): string | null {
    return this.sections[this.index]?.keyword ?? null;
  }

  currentSection(): Section | null {
    return this.sections[this.index] ?? null;
  }

  get isOver(): boolean {
    const s = this.sections[this.index];
    return s != null && this.elapsed > s.duration;
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  destroy() {
    this.stop();
  }

  setSections(sections: Section[]) {
    this.sections = sections;
    this.index = 0;
    this.elapsed = 0;
    this.overageCued = false;
  }
}
