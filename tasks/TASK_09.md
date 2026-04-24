# TASK 09 — PWA 설정 + 온보딩

## 목표
iOS Safari PWA 설치 + 마이크 권한 안내 + 효과음 튜토리얼.

## 만들 파일
- `public/manifest.json`
- `src/app/onboarding/page.tsx`
- `src/app/layout.tsx` 수정 (PWA 메타태그 추가)

## manifest.json
```json
{
  "name": "PRESENT:AI-ON",
  "short_name": "PRESENT",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "start_url": "/prepare",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## layout.tsx에 추가할 메타태그
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black" />
<link rel="manifest" href="/manifest.json" />
```

## 온보딩 화면 (스텝 2개)
```
스텝 1: 마이크 권한
  "발표 중 마이크가 필요합니다"
  [권한 허용] → getUserMedia() 호출

스텝 2: 효과음 확인
  "이어폰을 꽂고 각 효과음을 확인하세요"
  [filler 듣기] [빠름 듣기] [느림 듣기] [섹션초과 듣기]
  [시작하기 →] → /prepare
```

## 완료 기준
1. iOS Safari에서 "홈 화면에 추가" 후 앱처럼 실행
2. 마이크 권한 요청 정상 동작
3. 효과음 버튼 탭 시 소리 재생
4. [시작하기] → `/prepare` 이동
