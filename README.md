# Pulse Web

Lighthouse(PageSpeed Insights API) 기반 웹 프론트엔드 성능 분석 대시보드.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Linting**: ESLint + Prettier

## 프로젝트 구조

```
src/
├── app/           # Next.js App Router 페이지 및 레이아웃
├── components/
│   ├── layout/    # Header, Sidebar 등 전역 레이아웃 컴포넌트
│   └── ui/        # 재사용 가능한 UI 프리미티브
├── hooks/         # 커스텀 React 훅
├── lib/           # 순수 유틸리티 함수
├── services/      # 외부 API 연동 레이어 (Lighthouse 등)
└── types/         # 공통 TypeScript 타입 정의
```

## 시작하기

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## 환경변수

| 변수명 | 설명 | 필수 |
|---|---|---|
| `NEXT_PUBLIC_LIGHTHOUSE_API_KEY` | Google PageSpeed Insights API 키 | 선택 (없으면 쿼터 제한) |
| `NEXT_PUBLIC_APP_URL` | 앱 기본 URL | 선택 |
| `NEXT_PUBLIC_AUDIT_TIMEOUT` | 감사 요청 타임아웃 (ms) | 선택 |
