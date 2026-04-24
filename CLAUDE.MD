# PRESENT:AI-ON

오프라인 발표 중 음성을 인식해 filler word·속도·시간 초과를 감지하고, 이어폰 효과음으로 실시간 피드백을 전달하는 PWA.

---

## 기술 스택

| 역할       | 선택                                             |
| ---------- | ------------------------------------------------ |
| Framework  | Next.js 16 (App Router)                          |
| STT        | Deepgram Nova-2 (WebSocket, 한국어 안정) — Nova-3는 한국어 미검증 |
| State      | Zustand                                          |
| Audio In   | Web Audio API + AudioWorkletProcessor            |
| Audio Out  | Web Audio API `createOscillator()`               |
| 키워드 TTS | Web Speech API `speechSynthesis`                 |
| Storage    | LocalStorage (설정) + IndexedDB `idb` (히스토리) |
| Styling    | Tailwind CSS                                     |
| Deploy     | Vercel                                           |

---

## 아키텍처

```
[마이크]
  └─ getUserMedia()
  └─ AudioWorkletProcessor (PCM16, 16kHz, mono, 100ms chunk)
       └─ WebSocket ──▶ [Deepgram Nova-2]
                              │
                   transcript + word_timestamps
                   filler_words 자동 태깅
                   VAD: SpeechStarted / UtteranceEnd
                              │
              ┌───────────────┼──────────────────┐
       Filler Detector   Speed Calculator   Pause Detector
       (문자열 매칭)      (음절/경과시간)    (VAD 이벤트)
              └───────────────┴──────────────────┘
                              │
                    Sound Cue Engine + Section Timer
                              │
                     [이어폰 효과음 / TTS]
```

---

## 디렉토리 구조

```
public/
└── audio-worklet.js                 # ✅ PCM16 프로세서 (JS. Next.js Turbopack이 TS AudioWorklet 빌드 불안정해서 JS로 분리.)

src/
├── app/
│   ├── api/deepgram-token/route.ts   # ✅ Edge: API Key → 임시 JWT 발급 (bearer subprotocol용)
│   ├── test/page.tsx                 # ✅ TASK_02~08 통합 검증 페이지 (제거 예정)
│   ├── live/page.tsx                 # ✅ 실시간 발표 화면
│   ├── onboarding/page.tsx           # ⏳ 미구현
│   ├── prepare/page.tsx              # ⏳ 미구현
│   └── summary/page.tsx              # ⏳ 미구현
├── lib/
│   ├── audio/
│   │   ├── context.ts               # ✅ 싱글턴 AudioContext @ 16kHz
│   │   ├── worklet.ts               # ✅ mic → AudioWorkletNode 초기화 wrapper (addModule 중복 방지)
│   │   └── soundCue.ts              # ✅ oscillator 효과음 5종
│   ├── stt/
│   │   └── deepgramClient.ts        # ✅ Deepgram WSS 연결
│   ├── analyzer/
│   │   ├── fillerDetector.ts        # ✅ 문자열 매칭 filler 탐지
│   │   ├── speedCalculator.ts       # ✅ 한국어 음절/초 계산
│   │   └── pauseDetector.ts         # ✅ 3초 공백 감지 + TTS
│   ├── timer/sectionTimer.ts        # ✅ 섹션별 제한시간 추적
│   └── storage/
│       ├── settings.ts              # ✅ LocalStorage 설정 저장/불러오기
│       └── sessions.ts              # ✅ IndexedDB 세션 히스토리
├── store/liveStore.ts               # ✅ Zustand (filler/speed/pause/section 상태)
└── components/
    ├── LiveDashboard.tsx            # ✅ 실시간 대시보드
    ├── SectionProgress.tsx          # ✅ 섹션 진행 바
    └── SummaryChart.tsx             # ⏳ 미구현
```

---

## Deepgram 연결

```typescript
const ws = new WebSocket(
    "wss://api.deepgram.com/v1/listen?" +
        new URLSearchParams({
            model: "nova-2",
            language: "ko",
            filler_words: "true",
            words: "true",
            interim_results: "true",
            vad_events: "true",
            utterance_end_ms: "1000",
            encoding: "linear16",
            sample_rate: "16000",
            channels: "1",
        }),
    ["bearer", deepgramToken],  // /v1/auth/grant JWT는 'bearer' subprotocol. static API key는 'token'.
);

ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.type === "Results" && msg.is_final) {
        const words = msg.channel.alternatives[0].words;
        fillerDetector.check(words);
        speedCalculator.update(words);
    }
    if (msg.type === "SpeechStarted") pauseDetector.onStart();
    if (msg.type === "UtteranceEnd") pauseDetector.onEnd();
};

// PCM16 스트리밍
audioWorkletNode.port.onmessage = (e) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(e.data);
};
```

---

## 분석 로직

### Filler 탐지

```typescript
// Deepgram filler_words=true → transcript에 "어","음" 등이 포함됨
function check(words: Word[], fillerList: string[]) {
    for (const w of words) {
        if (fillerList.includes(w.word)) {
            soundCue.play("filler");
            store.incrementFiller(w.word);
        }
    }
}
```

### 속도 계산

```typescript
// 한글 글자수 = 음절수
function calcSpeed(words: Word[]): number {
    const duration = words.at(-1)!.end - words[0].start;
    const syllables = words.reduce(
        (s, w) => s + [...w.word].filter((c) => /[가-힣]/.test(c)).length,
        0,
    );
    return syllables / duration; // 음절/초
}
if (speed > settings.speed.max) soundCue.play("fast");
if (speed < settings.speed.min) soundCue.play("slow");
```

### 3초 공백 큐

```typescript
onEnd() {
  this.timer = setTimeout(() => {
    const keyword = sectionTimer.currentKeyword();
    if (keyword) speechSynthesis.speak(new SpeechSynthesisUtterance(keyword));
  }, settings.pauseDuration * 1000);
}
onStart() { clearTimeout(this.timer); }
```

---

## 효과음 패턴

| 이벤트    | 주파수          | 길이  |
| --------- | --------------- | ----- |
| filler    | 880Hz           | 80ms  |
| 속도 빠름 | 440→880Hz sweep | 150ms |
| 속도 느림 | 880→440Hz sweep | 150ms |
| 섹션 초과 | 220Hz           | 500ms |
| 3초 공백  | 220Hz × 2 + TTS | —     |

---

## 기본값

```typescript
const DEFAULT_SETTINGS = {
    speed: { min: 4, max: 6 }, // 음절/초
    fillerWords: [
        "어",
        "음",
        "그",
        "저",
        "뭐",
        "그리고",
        "근데",
        "이제",
        "사실",
        "기본적으로",
        "햄버거",
    ],
    pauseDuration: 3, // 초
    sections: [],
};
```

---

## iOS Safari 필수 처리

```typescript
const handleStart = async () => {
    await audioContext.resume(); // 제스처 후 활성화 필수
    await navigator.wakeLock.request("screen"); // 화면 꺼짐 방지
    await initAudioWorklet(audioContext);
    await connectDeepgram();
};
```

- `manifest.json` + `apple-mobile-web-app-capable` 메타태그 필수
- AudioWorklet은 반드시 사용자 제스처 이후 초기화

---

## 환경변수

```bash
DEEPGRAM_API_KEY=your_key  # Edge Route에서만 사용. NEXT_PUBLIC_ 없음.
```

---

## 개발 순서

1. `/api/deepgram-token` Edge Route
2. Deepgram WSS 연결 + AudioWorklet 스트리밍
3. Sound Cue Engine (oscillator 5종)
4. Filler Detector
5. Speed Calculator
6. Pause Detector + TTS
7. Section Timer
8. Live UI (`app/live/`)
9. 발표 준비 UI (`app/prepare/`)
10. 세션 요약 (`app/summary/`)
11. 온보딩 (`app/onboarding/`)

---

## 진행 상황

- ✅ **TASK_01** — Next.js 16 프로젝트 세팅, `/api/deepgram-token` Edge Route.
- ✅ **TASK_02** — 전체 파이프라인 검증 완료. mic → PCM16 → Deepgram WSS → transcript/VAD 정상 동작.
- ✅ **TASK_03** — Sound Cue Engine (`lib/audio/soundCue.ts`). oscillator 5종 (filler/fast/slow/section/pause).
- ✅ **TASK_04** — Filler Detector (`lib/analyzer/fillerDetector.ts`) + Zustand store (`store/liveStore.ts`). 문자열 매칭, DEFAULT_FILLER_WORDS에 "햄버거" 포함.
- ✅ **TASK_05** — Speed Calculator (`lib/analyzer/speedCalculator.ts`). 한국어 음절/초 계산, 기준 4~6.
- ✅ **TASK_06** — Pause Detector (`lib/analyzer/pauseDetector.ts`). UtteranceEnd 후 3초 타이머 → pause cue + TTS.
- ✅ **TASK_07** — Section Timer (`lib/timer/sectionTimer.ts`). 섹션별 제한시간 추적, 초과 시 section cue. `addModule` 중복 등록 버그 수정 (`moduleLoaded` 플래그).
- ✅ **TASK_08** — Storage (`lib/storage/settings.ts` LocalStorage, `lib/storage/sessions.ts` IndexedDB) + Live UI (`app/live/page.tsx`, `components/LiveDashboard.tsx`, `components/SectionProgress.tsx`).
- ⏳ TASK_09 대기 (prepare / summary / onboarding)

### TASK_02 핵심 발견
- **Deepgram `filler_words`는 영어 전용** (`uh/um/mhmm/...`만 태깅). 한국어는 효과 없음. → **TASK_04 fillerDetector는 [B] 문자열 매칭 확정** (DEFAULT_SETTINGS.fillerWords).
- **`noiseSuppression: false` 필수**. WebRTC 노이즈 억제가 단음절 "어/음"을 잡음으로 제거함. 끄면 transcript에 단어로 등장.
- **Nova-2 한국어 단음절 혼동 가능** — "어" → "아"로 인식되는 케이스 있음. 기본 fillerWords 목록에 `"아"` 추가 검토.

### 주요 기술 결정 (스펙과 차이)
- **모델**: Nova-3 → Nova-2 (한국어 안정). Nova-3 + Korean은 미검증.
- **WS subprotocol**: `['token', key]`가 아니라 **`['bearer', JWT]`**. Grant API JWT는 bearer 프로토콜.
- **AudioWorklet 배치**: `src/lib/audio/worklet.processor.ts` → `public/audio-worklet.js`. Next.js 16 Turbopack이 TS AudioWorklet 빌드 불안정.
- **AudioContext sampleRate**: 16kHz 고정 (`new AudioContext({ sampleRate: 16000 })`). 브라우저가 자동 리샘플링.
- **getUserMedia**: `noiseSuppression: false`, `autoGainControl: false` (filler 보존). `echoCancellation: true` 유지.

### TASK_02 인터페이스 (후속 태스크 연결점)
```typescript
// src/lib/audio/worklet.ts
startAudioPipeline(onChunk: (ArrayBuffer) => void): Promise<{ stop(): void }>

// src/lib/stt/deepgramClient.ts
new DeepgramClient({ onOpen, onTranscript, onSpeechStart, onUtteranceEnd, onError, onClose, onRawMessage })
await client.connect()
client.send(buffer: ArrayBuffer)
client.close()

interface DeepgramTranscript { transcript, words[], is_final, speech_final, raw }
interface DeepgramWord { word, start, end, confidence, punctuated_word? }
```

---

## 개발 규칙

- **태스크는 한 번에 하나씩** — 하나의 TASK가 끝나면 반드시 디버깅·검증 후 다음으로 넘어간다.
- 검증 없이 여러 TASK를 연속으로 구현하지 않는다.

---

## 하지 말 것

- 별도 서버 (Express / FastAPI) ❌
- OpenAI Realtime API ❌
- LLM으로 filler·속도 판단 ❌
- `DEEPGRAM_API_KEY` 클라이언트 노출 ❌
- `localStorage`에 세션 히스토리 저장 ❌ (IndexedDB 사용)
- 햅틱 API ❌ (효과음으로 대체)
