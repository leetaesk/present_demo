# TASK 04 — Analyzer + Section Timer + Store

## 목표
분석 로직 3종 + 섹션 타이머 + Zustand store 완성. UI 없음, 로직만.

## 만들 파일
- `src/lib/analyzer/fillerDetector.ts`
- `src/lib/analyzer/speedCalculator.ts`
- `src/lib/analyzer/pauseDetector.ts`
- `src/lib/timer/sectionTimer.ts`
- `src/store/liveStore.ts`

## 각 파일 스펙

### fillerDetector.ts
```typescript
// TASK_02 결과에 따라 두 가지 중 하나 선택:
//
// [A] Deepgram filler_words 동작 확인된 경우:
//     transcript words 중 is_filler 플래그 있는 것만 감지
//
// [B] filler_words 미동작 확인된 경우 (fallback):
//     DEFAULT_FILLER_WORDS 목록과 단순 문자열 매칭
//
// TASK_02에서 확인한 결과를 여기 기록:
// filler_words 동작 여부: [ ]

const DEFAULT_FILLER_WORDS = ['어', '음', '그', '저', '뭐', '그리고', '근데', '이제', '사실', '기본적으로'];

// 감지 시: soundCue.play('filler') + store.incrementFiller(word)
```

### speedCalculator.ts
```typescript
// word_timestamps 기반 음절/초 계산
// 한글 글자수 = 음절수 (정규식: /[가-힣]/)
// 기준 벗어나면: soundCue.play('fast') or soundCue.play('slow')
// 계산 단위: is_final transcript 1건마다 측정
```

### pauseDetector.ts
```typescript
// Deepgram UtteranceEnd → setTimeout(pauseDuration * 1000)
// 타임아웃 발생 → soundCue.play('pause-cue') → speechSynthesis TTS
// Deepgram SpeechStarted → clearTimeout
```

### sectionTimer.ts
```typescript
// 섹션 배열을 받아 순서대로 타이머 실행
// 섹션 시간 초과 → soundCue.play('section-over')
// currentKeyword() → 현재 섹션의 키워드 반환 (pauseDetector에서 호출)
interface Section {
  name: string;
  duration: number;  // 초
  keyword: string;   // 3초 공백 시 TTS로 읽을 키워드
}
```

### liveStore.ts (Zustand)
```typescript
interface LiveStore {
  // 상태
  isRunning: boolean;
  currentSectionIndex: number;
  elapsedSeconds: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  speedViolations: { fast: number; slow: number };
  avgSpeed: number;
  transcript: string;  // 화면 표시용 최근 transcript

  // 액션
  start: () => void;
  stop: () => void;
  incrementFiller: (word: string) => void;
  recordSpeedViolation: (type: 'fast' | 'slow') => void;
  updateTranscript: (text: string) => void;
  nextSection: () => void;
}
```

## 완료 기준
브라우저 콘솔에서:
```
[Filler] "어" 감지 → soundCue.play('filler')
[Speed] 7.2 음절/초 → fast
[Pause] 3초 공백 → TTS: "시장규모"
[Section] 60초 초과 → soundCue.play('section-over')
```

## 다음 태스크로 넘길 것
- liveStore 상태 구조 (Live UI에서 그대로 구독)
- sectionTimer.start(sections) 호출 시그니처
