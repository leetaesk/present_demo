# TASK 01 — 프로젝트 초기화 + Edge Route

## 목표
Next.js 프로젝트 세팅 + Deepgram 임시 토큰 발급 API 완성

## 만들 파일
- `package.json` (의존성 설치 포함)
- `src/app/api/deepgram-token/route.ts`
- `.env.local.example`
- `src/app/page.tsx` (임시: "PRESENT:AI-ON" 텍스트만)

## 완료 기준
```bash
curl -X POST http://localhost:3000/api/deepgram-token
# → { "token": "..." } 반환되면 완료
```

## 설치할 패키지
```bash
npx create-next-app@latest present-ai-on \
  --typescript --tailwind --app --src-dir --no-eslint
cd present-ai-on
npm install idb zustand
```

## Edge Route 구현
```typescript
// src/app/api/deepgram-token/route.ts
// Deepgram 임시 토큰 발급 (TTL: 10초)
// POST /api/deepgram-token → { token: string }
// DEEPGRAM_API_KEY는 환경변수에서만 읽음. 클라이언트 노출 금지.
export const runtime = 'edge';
```

## 다음 태스크로 넘길 것
- Deepgram 임시 토큰 발급 엔드포인트 URL: `POST /api/deepgram-token`
- 토큰 응답 형태: `{ token: string }`
