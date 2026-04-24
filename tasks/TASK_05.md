# TASK 05 — Storage

## 목표
발표 설정 저장(LocalStorage) + 세션 히스토리 저장(IndexedDB) 완성.

## 만들 파일
- `src/lib/storage/settings.ts`
- `src/lib/storage/sessions.ts`
- `src/types/index.ts` (공유 타입 정의)

## 타입 정의 (src/types/index.ts)
```typescript
export interface Section {
  name: string;
  duration: number;   // 초
  keyword: string;
}

export interface PresentationSettings {
  speed: { min: number; max: number };  // 음절/초, 기본값: { min: 4, max: 6 }
  fillerWords: string[];
  pauseDuration: number;                // 초, 기본값: 3
  sections: Section[];
}

export interface SessionSummary {
  id: string;
  createdAt: number;                    // timestamp
  totalDuration: number;                // 초
  sections: {
    name: string;
    targetDuration: number;
    actualDuration: number;
  }[];
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  speedViolations: { fast: number; slow: number };
  avgSpeed: number;
}
```

## 기본값
```typescript
export const DEFAULT_SETTINGS: PresentationSettings = {
  speed: { min: 4, max: 6 },
  fillerWords: ['어', '음', '그', '저', '뭐', '그리고', '근데', '이제', '사실', '기본적으로'],
  pauseDuration: 3,
  sections: [
    { name: '오프닝', duration: 30, keyword: '문제' },
    { name: '문제 정의', duration: 60, keyword: '솔루션' },
    { name: '솔루션', duration: 90, keyword: '시장' },
    { name: '시장 규모', duration: 60, keyword: '팀' },
    { name: '팀', duration: 30, keyword: '마무리' },
  ],
};
```

## 완료 기준
```typescript
// 콘솔에서 직접 실행해서 확인
await saveSettings(mySettings);
const s = await loadSettings();   // → mySettings 반환

await saveSession(summary);
const list = await loadSessions(); // → [summary] 반환
```

## 다음 태스크로 넘길 것
- `loadSettings()`, `saveSettings()` 인터페이스
- `saveSession()`, `loadSessions()` 인터페이스
