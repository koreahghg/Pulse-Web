# Pulse Web — 프론트엔드 성능 분석 대시보드 아키텍처

> 최초 작성일: 2026-05-03  
> 스택: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4

---

## 1. 시스템 구조

### 1-1. 역할 분리 개요

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Client)                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ AuditForm   │  │ ScoreCards   │  │ HistoryList           │  │
│  │ (URL 입력)  │  │ (결과 표시)  │  │ (이력 조회)           │  │
│  └──────┬──────┘  └──────────────┘  └───────────────────────┘  │
└─────────┼───────────────────────────────────────────────────────┘
          │ POST /api/audit
          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js Server (Route Handlers)                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ /api/audit                                               │   │
│  │  - API 키 보호 (서버 전용 env: LIGHTHOUSE_API_KEY)       │   │
│  │  - 요청 유효성 검증                                      │   │
│  │  - lighthouse.ts 서비스 호출                             │   │
│  │  - 응답 직렬화 후 반환                                   │   │
│  └──────────────────────────────┬───────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ fetch (LIGHTHOUSE_API_KEY 포함)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  PageSpeed Insights API (Google)                                │
│  https://www.googleapis.com/pagespeedonline/v5/runPagespeed     │
└─────────────────────────────────────────────────────────────────┘
```

**클라이언트 책임**
- 사용자 입력(URL, 전략) 수집 및 유효성 검증
- 분석 요청 전송 및 로딩 상태 관리
- 결과 시각화 (점수 카드, 메트릭 목록)
- 측정 이력 유지 (localStorage)

**서버 책임**
- `LIGHTHOUSE_API_KEY` 보호 (브라우저에 절대 노출하지 않음)
- PSI API 프록시 및 응답 변환
- 요청 타임아웃 제어 (`AUDIT_TIMEOUT`)
- 향후 DB 쓰기 작업 처리 지점

### 1-2. Lighthouse API 호출 흐름

```
사용자 → URL 입력 → 전략 선택 (mobile | desktop)
         │
         ▼
[AuditForm] POST /api/audit
{
  "url": "https://example.com",
  "strategy": "mobile"
}
         │
         ▼
[Route Handler: /api/audit/route.ts]
  1. URL 파싱 및 허용 프로토콜 확인 (http/https)
  2. lighthouse.ts → runLighthouseAudit(url, strategy)
  3. AbortController 타임아웃 (기본 30초)
         │
         ▼
[PSI API] → lighthouseResult JSON 반환
         │
         ▼
[transformResponse()] → LighthouseReport 타입으로 정규화
         │
         ▼
[클라이언트] → 결과 렌더링 + localStorage 저장
```

---

## 2. 렌더링 전략

### 선택: **하이브리드 (Server Component 기본 + 선택적 CSR)**

| 페이지 / 컴포넌트 | 전략 | 이유 |
|---|---|---|
| `layout.tsx` | **SSR** (Server Component) | 레이아웃은 정적, `LIGHTHOUSE_API_KEY` 노출 불필요 |
| `Header`, `Sidebar` | **SSR** (Server Component) | 서버에서 렌더링 가능, JS 번들 절감 |
| `/` (대시보드) | **CSR** | 최신 분석 결과는 클라이언트 상태에서 읽어야 함 |
| `/audit` (감사 실행) | **CSR** | 실시간 로딩 상태, 인터랙티브 폼 필요 |
| `/history` (측정 이력) | **CSR → ISR (DB 연동 후)** | 현재는 localStorage 기반 / DB 도입 후 ISR로 전환 |

**SSR/ISR을 선택하지 않은 이유**

Lighthouse 분석은 사용자 트리거 온디맨드 작업이다. 결과는 사용자별·요청 시점별로 다르므로 SSG/ISR의 이점이 없다. Next.js App Router의 Server Component는 레이아웃과 정적 콘텐츠에만 활용하고, 동적 데이터 영역은 클라이언트에서 Route Handler를 호출하는 CSR 패턴을 유지한다.

---

## 3. 데이터 흐름 설계

### 3-1. 전체 흐름

```
[사용자 입력]          [클라이언트 상태]         [서버]              [외부]
URL + Strategy
    │
    ▼
form submit
    │
    ├──────────────────▶ loading: true
    │
    │           POST /api/audit
    │──────────────────────────────────────────▶ /api/audit
    │                                                │
    │                                         runLighthouseAudit()
    │                                                │──────────▶ PSI API
    │                                                │◀────────── JSON 응답
    │                                         transformResponse()
    │◀──────────────────────────────────────── LighthouseReport
    │
    ├──────────────────▶ report: LighthouseReport
    ├──────────────────▶ loading: false
    └──────────────────▶ localStorage.setItem(cacheKey, report)
```

### 3-2. 클라이언트 상태 설계

```typescript
// /audit 페이지의 상태 구조
type AuditState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; report: LighthouseReport }
  | { status: 'error'; message: string };

// /history 페이지는 localStorage에서 파생
// JSON.parse는 데이터 오염 시 throw하므로 반드시 try-catch로 감싼다
function getHistory(): LighthouseReport[] {
  try {
    return JSON.parse(localStorage.getItem('pulse_history') ?? '[]');
  } catch {
    localStorage.removeItem('pulse_history'); // 오염된 데이터 제거
    return [];
  }
}
```

판별 유니온(discriminated union)으로 UI 상태를 명시적으로 표현해 `loading && !error` 같은 복합 조건문을 없앤다.

### 3-3. 결과 저장 전략 (단계별)

| 단계 | 저장소 | 이유 |
|---|---|---|
| 현재 (Phase 1) | `localStorage` | 서버 불필요, 빠른 구현 |
| Phase 2 | `Supabase` / `PlanetScale` | 다기기 동기화, GitHub 연동 |

---

## 4. 캐싱 전략

### 4-1. 캐시 레이어 구성

```
요청 흐름
   │
   ▼
[Layer 1: 클라이언트 캐시 (localStorage)]
   - Key: pulse_cache_${base64(url)}_${strategy}
   - TTL: 3,600,000ms (1시간)
   - 유효한 캐시 존재 시 → API 요청 없이 즉시 반환
   │ 캐시 미스
   ▼
[Layer 2: Route Handler (서버)]
   - 동일 URL 중복 호출 방지용 in-flight 요청 dedup (향후 Map 구조로 관리)
   │
   ▼
[Layer 3: PSI API 자체 캐시]
   - Google 내부적으로 최근 분석 결과를 일정 시간 캐싱
```

### 4-2. 클라이언트 캐시 구현 방향

```typescript
// src/lib/auditCache.ts
const CACHE_TTL = 60 * 60 * 1000; // 1시간

export function getCachedReport(
  url: string,
  strategy: AuditStrategy
): LighthouseReport | null {
  const key = `pulse_cache_${btoa(url)}_${strategy}`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const { data, timestamp }: { data: LighthouseReport; timestamp: number } =
      JSON.parse(raw);

    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    localStorage.removeItem(key); // 오염된 캐시 제거
    return null;
  }
}

export function setCachedReport(
  url: string,
  strategy: AuditStrategy,
  data: LighthouseReport
): void {
  const key = `pulse_cache_${btoa(url)}_${strategy}`;
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
}
```

### 4-3. 강제 재분석

- UI에서 "새로 측정" 버튼 제공 → 캐시 무시하고 직접 API 호출
- 캐시 항목에 `fetchTime` 표시 → 사용자가 캐시 여부 인지 가능

---

## 5. 확장성 — GitHub 연동 구조

### 5-1. 목표 시나리오

> PR이 생성되거나 `main`에 push될 때 대상 URL을 자동 감사하고, 결과를 GitHub Commit Status에 표시한다.

### 5-2. 확장 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│  GitHub                                                          │
│  push / pull_request event → Webhook (HMAC-SHA256 서명)          │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ POST /api/github/webhook
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  Route Handler: /api/github/webhook/route.ts                     │
│  1. GITHUB_WEBHOOK_SECRET으로 서명 검증                          │
│  2. 레포 → URL 매핑 테이블 조회                                  │
│     (예: "owner/repo" → "https://staging.example.com")           │
│  3. 감사 작업 큐에 추가 (또는 직접 실행)                         │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
                        runLighthouseAudit(url, strategy)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  DB (Supabase)                                                   │
│  audit_reports 테이블에 결과 INSERT                              │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  GitHub Commit Status API                                        │
│  POST /repos/{owner}/{repo}/statuses/{sha}                       │
│  { state: "success" | "failure", description: "Score: 87" }      │
└──────────────────────────────────────────────────────────────────┘
```

### 5-3. 타입 확장 계획

```typescript
// 현재 (Phase 1)
interface AuditTarget {
  id: string;
  url: string;
  label: string;
  createdAt: string;
}

// GitHub 연동 후 (Phase 2)
interface AuditTarget {
  id: string;
  url: string;
  label: string;
  createdAt: string;
  // GitHub 연동 필드 (선택적)
  githubRepo?: string;    // "owner/repo"
  githubBranch?: string;  // 감사 대상 브랜치
  autoAudit?: boolean;    // push 이벤트 시 자동 감사 여부
  performanceThreshold?: number; // 이 점수 미만이면 GitHub Status "failure"
}
```

### 5-4. 환경변수 추가 계획

```bash
# 현재
LIGHTHOUSE_API_KEY=...
AUDIT_TIMEOUT=30000

# GitHub 연동 후 추가
GITHUB_WEBHOOK_SECRET=...
GITHUB_APP_ID=...
GITHUB_PRIVATE_KEY=...  # GitHub App 인증용

# DB 연동 후 추가
DATABASE_URL=...
```

---

## 6. 디렉토리 구조 (목표 상태)

```
src/
├── app/
│   ├── layout.tsx               # Server Component (루트 레이아웃)
│   ├── page.tsx                 # 대시보드 (최근 결과 요약)
│   ├── audit/
│   │   └── page.tsx             # 감사 실행 페이지 (CSR)
│   ├── history/
│   │   └── page.tsx             # 측정 이력 (CSR → ISR)
│   └── api/
│       ├── audit/
│       │   └── route.ts         # PSI API 프록시
│       └── github/
│           └── webhook/
│               └── route.ts     # GitHub Webhook 수신 (Phase 2)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── audit/
│   │   ├── AuditForm.tsx        # URL 입력 폼
│   │   └── AuditResult.tsx      # 결과 카드
│   └── dashboard/
│       └── ScoreCard.tsx        # 카테고리 점수 카드
├── lib/
│   ├── utils.ts
│   └── auditCache.ts            # localStorage 캐시 유틸
├── services/
│   └── lighthouse.ts            # PSI API 호출 및 변환
└── types/
    └── index.ts
```

---

## 7. 의사결정 기록

| 결정 | 선택 | 거부한 대안 | 이유 |
|---|---|---|---|
| API 키 보호 | Route Handler (서버) | `NEXT_PUBLIC_*` 클라이언트 변수 | API 키 노출 방지 |
| 상태 관리 | `useState` + discriminated union | Redux, Zustand | 현 규모에서 과도한 의존성 |
| 이력 저장 | `localStorage` | Cookie, 서버 세션 | 서버 불필요, 초기 구현 속도 |
| 렌더링 | CSR (인터랙티브) + Server Component (레이아웃) | Full SSR | 온디맨드 분석 특성상 SSR 이점 없음 |
| 캐시 TTL | 1시간 | 24시간, 무제한 | PSI 결과는 배포/네트워크 환경 변화로 시간이 지나면 의미가 퇴색 |
