/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── 차곡 포인트 그린 (기존 primary orange 교체) ──────────
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#6ee7a6',
          400: '#34d583',
          500: '#10C57C',   // 차곡 그린 — 메인 포인트
          600: '#0da86a',
          700: '#0b8c59',
          800: '#097048',
          900: '#065c3a',
        },
        // ── 차곡 시맨틱 뉴트럴 ────────────────────────────────
        cream: {
          50:  '#FDFCF8',
          100: '#F4F1E9',   // 앱 배경 크림
          200: '#EAE6DC',   // 구분선
          300: '#DDD9CF',
        },
        ink: {
          DEFAULT: '#1C1A16',   // 메인 텍스트
          2:       '#54504A',   // 서브 텍스트
          muted:   '#94908A',   // 뮤트 텍스트
        },
        // ── 카테고리 컬러 팔레트 ─────────────────────────────
        cat: {
          food:      '#FF6B5E',
          cafe:      '#F5A623',
          transport: '#4C8DFF',
          shopping:  '#9B7BFF',
          living:    '#16C2A3',
          culture:   '#FF7AC6',
          health:    '#3DCB7F',
          fixed:     '#8C7B6B',
        },
        // ── 수입/지출 시맨틱 ─────────────────────────────────
        income: {
          light:   '#E2F6EC',
          DEFAULT: '#10C57C',
          dark:    '#0A7A4D',
        },
        expense: {
          light:   '#FEE2E2',
          DEFAULT: '#F0524B',
          dark:    '#C0392B',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans KR', 'Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
        num:  ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '28px',
        '5xl': '32px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,26,22,0.04), 0 8px 24px rgba(28,26,22,0.06)',
        'card-sm': '0 1px 2px rgba(28,26,22,0.05), 0 4px 12px rgba(28,26,22,0.05)',
        green: '0 8px 20px rgba(16,197,124,0.35)',
      },
    },
  },
  plugins: [],
}
