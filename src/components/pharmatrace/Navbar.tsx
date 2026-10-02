'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useNavigate, type RouteName } from '@/store/router'
import { useAuth } from '@/store/auth'
import { BrandLockup } from './Brand'
import { RoleBadge } from './Badges'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, ScanLine, Truck, PackagePlus, Boxes,
  Activity, BarChart3, Info, LogOut, User, Bell, ChevronDown, ShieldCheck, Network, FileText,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NotificationBell } from './NotificationBell'
import { CommandPalette } from './CommandPalette'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  route: RouteName
  label: string
  icon: React.ReactNode
  authRequired?: boolean
  adminOnly?: boolean
  manufacturerOnly?: boolean
}

const NAV: NavItem[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, authRequired: true },
  { route: 'verify', label: 'Verify Drug', icon: <ScanLine className="h-4 w-4" /> },
  { route: 'supply-chain', label: 'Supply Chain', icon: <Truck className="h-4 w-4" /> },
  { route: 'register-drug', label: 'Register Drug', icon: <PackagePlus className="h-4 w-4" />, authRequired: true, manufacturerOnly: true },
  { route: 'drugs', label: 'Drugs', icon: <Boxes className="h-4 w-4" /> },
  { route: 'blockchain', label: 'Blockchain', icon: <Network className="h-4 w-4" /> },
  { route: 'transactions', label: 'Transactions', icon: <Activity className="h-4 w-4" /> },
  { route: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
  { route: 'admin-users', label: 'Admin', icon: <ShieldCheck className="h-4 w-4" />, authRequired: true, adminOnly: true },
  { route: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" />, authRequired: true, adminOnly: true },
  { route: 'about', label: 'About', icon: <Info className="h-4 w-4" /> },
]

export function Navbar() {
  const { route, navigate } = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visibleNav = NAV.filter((n) => {
    if (n.adminOnly) return user?.role === 'ADMIN'
    if (n.manufacturerOnly) return user?.role === 'MANUFACTURER' || user?.role === 'ADMIN'
    if (n.authRequired) return !!user
    return true
  })

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button onClick={() => navigate('landing')} className="shrink-0">
          <BrandLockup />
        </button>

        {/* desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {visibleNav.map((item) => (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
                route === item.route
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CommandPalette />
          <ThemeToggle />
          {user && <NotificationBell />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-1.5 py-1 hover:bg-muted transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback
                      style={{ backgroundColor: user.avatarColor ?? '#22d3ee' }}
                      className="text-xs font-semibold text-black"
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span>{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                  <RoleBadge role={user.role} className="mt-1 w-fit" />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('profile')}>
                  <User className="h-4 w-4 mr-2" /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-300 focus:text-rose-200"
                  onClick={async () => { await logout(); navigate('landing') }}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('login')}>Sign in</Button>
              <Button size="sm" onClick={() => navigate('register')} className="bg-primary text-primary-foreground">
                Get Started
              </Button>
            </>
          )}
          {/* mobile menu toggle */}
          <button
            className="lg:hidden inline-flex items-center justify-center rounded-lg border border-border/60 p-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" d={mobileOpen ? 'M6 18 18 6 M6 6l12 12' : 'M4 6h16 M4 12h16 M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>
      {/* mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border/60 bg-background/95 px-4 py-2 grid grid-cols-2 gap-1">
          {visibleNav.map((item) => (
            <button
              key={item.route}
              onClick={() => { navigate(item.route); setMobileOpen(false) }}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                route === item.route
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}

export function MobileTabBar() {
  const { route, navigate } = useRouter()
  const { user } = useAuth()
  const tabs: { route: RouteName; icon: React.ReactNode; label: string; auth?: boolean }[] = [
    { route: 'dashboard', icon: <LayoutDashboard className="h-5 w-5" />, label: 'Home', auth: true },
    { route: 'verify', icon: <ScanLine className="h-5 w-5" />, label: 'Verify' },
    { route: 'blockchain', icon: <Network className="h-5 w-5" />, label: 'Chain' },
    { route: 'drugs', icon: <Boxes className="h-5 w-5" />, label: 'Drugs' },
    { route: 'about', icon: <Info className="h-5 w-5" />, label: 'About' },
  ]
  const visible = tabs.filter((t) => !t.auth || user)
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}>
        {visible.map((t) => {
          const active = route === t.route
          return (
            <button
              key={t.route}
              onClick={() => navigate(t.route)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={cn('transition-transform', active && 'scale-110')}>{t.icon}</span>
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
