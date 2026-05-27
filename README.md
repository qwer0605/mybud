# 가계부 - 스마트 예산 관리 앱

React 18 + TypeScript + Vite로 제작된 완전한 가계부 웹 애플리케이션입니다.

## 주요 기능

- **거래 내역 관리**: 수입/지출 기록, 수정, 삭제
- **예산 설정**: 월별 전체 예산 및 카테고리별 예산 관리
- **자산 관리**: 자산/부채 등록 및 순자산 추이 차트
- **통계 차트**: 월별 수입/지출 바 차트, 카테고리별 파이 차트, 잔액 추이 라인 차트
- **멀티 프로필**: 독립적인 통장/가계부 여러 개 관리
- **다크/라이트 모드**: 시스템 설정 연동 또는 수동 전환
- **반응형 디자인**: 모바일/태블릿/데스크탑 최적화
- **로컬 스토리지**: Firebase 없이도 완전히 작동 (데이터 로컬 저장)
- **Google 동기화**: Firebase 로그인 후 Firestore로 데이터 동기화 (선택사항)

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18 + TypeScript |
| 빌드 도구 | Vite 5 |
| 스타일링 | Tailwind CSS 3 |
| 상태 관리 | Zustand 4 |
| 라우팅 | React Router v6 |
| 차트 | Recharts 2 |
| 날짜 유틸 | date-fns 3 |
| 데이터 저장 | localStorage (Firebase 선택적 연동) |

## 설치 및 실행

### 요구 사항

- Node.js 18 이상
- npm 또는 yarn 또는 pnpm

### 설치

```bash
# 프로젝트 디렉토리로 이동
cd budget-app

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

## Firebase 연동 (선택사항)

Firebase 없이도 모든 기능이 로컬 스토리지로 동작합니다.

### Firebase 프로젝트 생성

1. [Firebase 콘솔](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭 후 프로젝트 이름 입력
3. Google Analytics 설정 (선택)
4. 프로젝트 생성 후 "웹 앱 추가" 클릭
5. 앱 닉네임 입력 후 Firebase SDK 설정값 복사

### .env.local 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일에 Firebase 콘솔에서 복사한 값을 입력:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

Firebase 콘솔에서 추가 설정:
- **Authentication** > "시작하기" > Google 로그인 활성화
- **Firestore Database** > "데이터베이스 만들기" > 테스트 모드로 시작

## Vercel 배포

### 최초 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포 (프로젝트 루트에서 실행)
vercel

# 프로덕션 배포
vercel --prod
```

### 환경변수 설정 (Firebase 사용 시)

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서
`.env.local`의 모든 `VITE_FIREBASE_*` 값을 동일하게 추가합니다.

### 이후 자동 배포

GitHub 저장소와 연동하면 `main` 브랜치에 push할 때마다 자동으로 배포됩니다:

```bash
# Vercel CLI로 GitHub 연동
vercel link
vercel git connect
```

또는 [Vercel 대시보드](https://vercel.com/dashboard)에서 GitHub 저장소를 직접 import할 수 있습니다.

## 프로젝트 구조

```
src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, BottomNav, Header
│   ├── transactions/    # TransactionForm, TransactionItem, TransactionList, TransactionFilter
│   ├── budget/          # BudgetForm, BudgetProgressCard
│   ├── statistics/      # MonthlyBarChart, CategoryPieChart, BalanceLineChart
│   └── ui/              # Button, Modal, Card, Badge, ProgressBar
├── pages/
│   ├── Dashboard.tsx    # 대시보드 (홈)
│   ├── Transactions.tsx # 거래 내역 페이지
│   ├── Budget.tsx       # 예산 관리 페이지
│   └── Statistics.tsx   # 통계 페이지
├── hooks/
│   ├── useMonthlyStats.ts        # 월별 통계 훅
│   ├── useBudgetProgress.ts      # 예산 진행률 훅
│   └── useFilteredTransactions.ts # 필터링된 거래 훅
├── store/
│   ├── transactionStore.ts  # 거래 내역 Zustand 스토어
│   ├── budgetStore.ts       # 예산 Zustand 스토어
│   └── settingsStore.ts     # 앱 설정 Zustand 스토어
├── types/
│   └── index.ts         # TypeScript 타입 정의
├── utils/
│   ├── constants.ts     # 카테고리, 색상 등 상수
│   ├── formatters.ts    # 날짜/금액 포맷 유틸
│   └── sampleData.ts    # 초기 샘플 데이터
└── firebase/
    └── config.ts        # Firebase 설정 (선택사항)
```

## 카테고리

### 지출 카테고리
식비, 교통, 쇼핑, 의료, 문화/여가, 교육, 공과금, 기타

### 수입 카테고리
급여, 부업, 투자, 기타

## 데이터 저장 방식

모든 데이터는 브라우저의 `localStorage`에 JSON 형태로 저장됩니다.

| 키 | 저장 내용 |
|-------|---------|
| `budget_app_transactions` | 거래 내역 배열 |
| `budget_app_budgets` | 월별 예산 배열 |
| `budget_app_settings` | 앱 설정 (테마 등) |

> 처음 실행 시 샘플 데이터가 자동으로 로드됩니다.

## 라이선스

MIT
