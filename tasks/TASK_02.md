# TASK 02 — AudioWorklet + Deepgram 스트리밍 검증

## 목표
마이크 → PCM16 변환 → Deepgram WebSocket 연결 파이프라인 완성.
**이 태스크가 전체에서 가장 위험. 먼저 검증.**

## 만들 파일
- `src/lib/audio/worklet.processor.ts` (AudioWorkletProcessor)
- `src/lib/audio/worklet.ts` (AudioWorkletNode 초기화)
- `src/lib/stt/deepgramClient.ts`
- `next.config.ts` (AudioWorklet 빌드 설정)
- `src/app/test/page.tsx` (임시 테스트 페이지, 나중에 삭제)

## 완료 기준
브라우저 콘솔에서 아래 로그가 찍히면 완료:
```
[Deepgram] connected
[Deepgram] transcript: "안녕하세요"   ← 실제 말한 내용
```

## AudioWorklet 주의사항
- `worklet.processor.ts`는 별도 워커 스레드에서 실행됨
- Next.js에서 AudioWorklet 파일 로드 시 `next.config.ts` 수정 필요:
  ```typescript
  // AudioWorklet 파일을 별도 번들로 분리해야 함
  // addAudioWorkletModule()에 넘기는 경로는 public/ 기준 또는 URL
  ```
- `audioContext.audioWorklet.addModule(url)` 호출은 반드시 사용자 제스처 이후
- iOS Safari: `audioContext.resume()` 제스처 후 필수

## Deepgram 연결 파라미터
```typescript
{
  model: 'nova-3',
  language: 'ko',
  filler_words: 'true',
  words: 'true',           // word_timestamps
  interim_results: 'true',
  vad_events: 'true',
  utterance_end_ms: '1000',
  encoding: 'linear16',
  sample_rate: '16000',
  channels: '1',
}
```

## 검증할 것
1. 한국어 "어", "음" 발화 → transcript에 포함되는지 확인
2. `filler_words: true` 파라미터가 실제로 한국어 filler를 태깅하는지 확인
   - 태깅 안 되면 TASK_04에서 순수 문자열 매칭으로 처리 (fallback 있음)

## 다음 태스크로 넘길 것
- AudioWorklet 초기화 함수 시그니처
- deepgramClient 이벤트 구조 (`onTranscript`, `onSpeechStart`, `onUtteranceEnd`)
- filler_words 한국어 동작 여부 (확인 결과 기록)
