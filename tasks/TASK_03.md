# TASK 03 — Sound Cue Engine

## 목표
oscillator 기반 효과음 5종 완성. 분석 로직보다 먼저 만들어야 TASK_04~06에서 바로 연결 가능.

## 만들 파일
- `src/lib/audio/soundCue.ts`

## 효과음 스펙
| 메서드 | 주파수 | 길이 | 파형 |
|---|---|---|---|
| `play('filler')` | 880Hz | 80ms | sine |
| `play('fast')` | 440→880Hz sweep | 150ms | sine |
| `play('slow')` | 880→440Hz sweep | 150ms | sine |
| `play('section-over')` | 220Hz | 500ms | sine |
| `play('pause-cue')` | 220Hz × 2회 | 200ms | sine |

## 인터페이스
```typescript
// 외부에서 이렇게만 호출
soundCue.play('filler');
soundCue.play('fast');
soundCue.play('slow');
soundCue.play('section-over');
soundCue.play('pause-cue');   // 220Hz 2회 재생 후 TTS는 pauseDetector에서 처리
```

## 완료 기준
`src/app/test/page.tsx`에 버튼 5개 추가해서 각 효과음 직접 눌러서 확인.
```
[filler 테스트] [fast 테스트] [slow 테스트] [section-over 테스트] [pause-cue 테스트]
```

## 주의
- AudioContext는 싱글턴. 여러 곳에서 new AudioContext() 생성 금지.
- soundCue는 외부에서 AudioContext를 주입받거나 내부 싱글턴 사용.

## 다음 태스크로 넘길 것
- `soundCue.play(type)` 호출 인터페이스
