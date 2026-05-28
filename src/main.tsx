import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'
import { migrateInitialAmounts } from '@/utils/assetMigration'

// 앱 초기화 전 자산 기초잔액 마이그레이션 실행 (멱등 — 이미 완료된 계좌는 건너뜀)
migrateInitialAmounts()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
