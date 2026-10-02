'use client'
import { useEffect } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { Navbar, MobileTabBar } from './Navbar'
import { Footer } from './Footer'
import { AnimatedBackground } from './AnimatedBackground'
import { LandingView } from './views/LandingView'
import { LoginView } from './views/LoginView'
import { RegisterView } from './views/RegisterView'
import { DashboardView } from './views/DashboardView'
import { VerifyView } from './views/VerifyView'
import { RegisterDrugView } from './views/RegisterDrugView'
import { SupplyChainView } from './views/SupplyChainView'
import { BlockchainView } from './views/BlockchainView'
import { BlockDetailView } from './views/BlockDetailView'
import { TransactionsView } from './views/TransactionsView'
import { AnalyticsView } from './views/AnalyticsView'
import { DrugsView } from './views/DrugsView'
import { DrugDetailView } from './views/DrugDetailView'
import { AboutView } from './views/AboutView'
import { AdminUsersView } from './views/AdminUsersView'
import { ReportsView } from './views/ReportsView'
import { ProfileView } from './views/ProfileView'
import { HelpTour } from './HelpTour'
import { motion, AnimatePresence } from 'framer-motion'

const AUTH_ROUTES = new Set(['dashboard', 'register-drug', 'profile'])

export function AppShell() {
  const { route, params } = useRouter()
  const { user, loading, fetchMe } = useAuth()

  useEffect(() => { fetchMe() }, [fetchMe])

  // Route guards
  useEffect(() => {
    if (loading) return
    if (AUTH_ROUTES.has(route) && !user) {
      useRouter.getState().navigate('login')
    }
  }, [loading, user, route])

  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 pb-24 lg:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={route + JSON.stringify(params)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {renderView(route, params)}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MobileTabBar />
      <HelpTour />
    </div>
  )
}

function renderView(route: string, params: Record<string, string>) {
  switch (route) {
    case 'landing': return <LandingView />
    case 'login': return <LoginView />
    case 'register': return <RegisterView />
    case 'dashboard': return <DashboardView />
    case 'verify': return <VerifyView />
    case 'register-drug': return <RegisterDrugView />
    case 'supply-chain': return <SupplyChainView />
    case 'blockchain': return <BlockchainView />
    case 'blockchain-detail': return <BlockDetailView />
    case 'transactions': return <TransactionsView />
    case 'analytics': return <AnalyticsView />
    case 'drugs': return <DrugsView />
    case 'drug-detail': return <DrugDetailView />
    case 'about': return <AboutView />
    case 'admin-users': return <AdminUsersView />
    case 'reports': return <ReportsView />
    case 'profile': return <ProfileView />
    default: return <LandingView />
  }
}
