# TASK 06 — Live 페이지 (실행 페이지)

## 목표
실전 발표 화면. TASK 02~05의 모든 로직을 연결하는 통합 페이지.

## 만들 파일
- `src/app/live/page.tsx`
- `src/components/LiveDashboard.tsx`
- `src/components/SectionProgress.tsx`

## 화면 구성 (모바일 기준, 세로 레이아웃)
```
┌─────────────────────────┐
│  섹션명: 솔루션           │  ← 현재 섹션
│  02:34 / 01:30           │  ← 경과 / 목표 (초과 시 빨간색)
├─────────────────────────┤
│  ████████░░░░  (진행바)  │  ← SectionProgress
├─────────────────────────┤
│  filler  12회            │
│  속도     정상            │  ← 실시간 지표
│  transcript: "..."       │
├─────────────────────────┤
│       [■ 중단]           │  ← 중단 버튼만. 시작은 prepare에서.
└─────────────────────────┘
```

## 페이지 진입 조건
- `app/prepare/`에서 설정 완료 후 진입
- 페이지 마운트 시 자동으로 발표 시작 (별도 시작 버튼 없음)
- `handleStart()` iOS 처리 포함:
  ```typescript
  useEffect(() => {
    handleStart();
  }, []);

  const handleStart = async () => {
    await audioContext.resume();
    await navigator.wakeLock.request('screen');
    await initAudioWorklet(audioContext);
    await connectDeepgram();
    sectionTimer.start(settings.sections);
    store.start();
  };
  ```

## 중단 처리
```typescript
const handleStop = () => {
  deepgramWs.close();
  sectionTimer.stop();
  store.stop();
  // 세션 요약 저장 후 /summary로 이동
  const summary = buildSummary(store);
  await saveSession(summary);
  router.push('/summary');
};
```

## liveStore 구독
- `isRunning`, `currentSectionIndex`, `elapsedSeconds`
- `fillerCount`, `fillerBreakdown`, `speedViolations`, `transcript`
- liveStore에서 직접 useStore()로 구독. props 드릴링 없음.

## 완료 기준
1. 페이지 열리면 마이크 권한 요청
2. 말하면 transcript 화면에 표시
3. "어" 말하면 효과음 재생
4. 섹션 타이머 카운트업
5. [중단] 누르면 `/summary`로 이동

## 다음 태스크로 넘길 것
- `buildSummary(store)` 함수 반환 형태 (SessionSummary 타입)
- `/summary?id=xxx` 쿼리 파라미터로 세션 ID 전달
