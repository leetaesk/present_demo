# PRESENT:AI-ON

오프라인 발표 중 음성을 인식해 filler word·속도·시간 초과를 감지하고, 이어폰 효과음으로 실시간 피드백을 전달하는 PWA.

---

## 기술 스택

| 역할       | 선택                                             |
| ---------- | ------------------------------------------------ |
| Framework  | Next.js 15 (App Router)                          |
| STT        | Deepgram Nova-3 (WebSocket)                      |
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
       └─ WebSocket ──▶ [Deepgram Nova-3]
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
src/
├── app/
│   ├── api/deepgram-token/route.ts   # Edge: API Key → 임시 토큰 발급
│   ├── onboarding/page.tsx
│   ├── prepare/page.tsx
│   ├── live/page.tsx
│   └── summary/page.tsx
├── lib/
│   ├── audio/
│   │   ├── worklet.ts               # PCM16 변환
│   │   └── soundCue.ts              # oscillator 효과음
│   ├── stt/
│   │   └── deepgramClient.ts        # Deepgram WSS 연결
│   ├── analyzer/
│   │   ├── fillerDetector.ts
│   │   ├── speedCalculator.ts
│   │   └── pauseDetector.ts
│   ├── timer/sectionTimer.ts
│   └── storage/
│       ├── settings.ts              # LocalStorage
│       └── sessions.ts              # IndexedDB
├── store/liveStore.ts               # Zustand
└── components/
    ├── LiveDashboard.tsx
    ├── SectionProgress.tsx
    └── SummaryChart.tsx
```

---

## Deepgram 연결

```typescript
const ws = new WebSocket(
    "wss://api.deepgram.com/v1/listen?" +
        new URLSearchParams({
            model: "nova-3",
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
    ["token", deepgramToken],
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

## 하지 말 것

- 별도 서버 (Express / FastAPI) ❌
- OpenAI Realtime API ❌
- LLM으로 filler·속도 판단 ❌
- `DEEPGRAM_API_KEY` 클라이언트 노출 ❌
- `localStorage`에 세션 히스토리 저장 ❌ (IndexedDB 사용)
- 햅틱 API ❌ (효과음으로 대체)
