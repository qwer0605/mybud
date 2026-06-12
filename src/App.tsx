import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen'
import { Dashboard } from '@/pages/Dashboard'
import { Transactions } from '@/pages/Transactions'
import { Budget } from '@/pages/Budget'
import { Statistics } from '@/pages/Statistics'
import { Assets } from '@/pages/Assets'
import { Settings } from '@/pages/Settings'
import { ONBOARDING_DONE_KEY } from '@/utils/constants'

export function App() {
  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem(ONBOARDING_DONE_KEY) !== '1'
  )

  if (showWelcome) {
    return <WelcomeScreen onDone={() => setShowWelcome(false)} />
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}
