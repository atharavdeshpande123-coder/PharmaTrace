'use client'
import { useState, useEffect } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { useTheme } from 'next-themes'
import { PageHeader } from '../States'
import { GlassCard } from '../GlassCard'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Settings, Bell, Palette, HelpCircle, Trash2, Sun, Moon,
  CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'

const STORAGE_KEY = 'pharmatrace_settings'

interface AppSettings {
  notifications: {
    soundEnabled: boolean
    desktopNotifications: boolean
  }
  appearance: {
    defaultTheme: 'dark' | 'light'
  }
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: {
    soundEnabled: true,
    desktopNotifications: false,
  },
  appearance: {
    defaultTheme: 'dark',
  },
}

export function SettingsView() {
  const { user } = useAuth()
  const { navigate } = useRouter()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [tourReset, setTourReset] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (cancelled) return
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        }
      } catch { /* ignore */ }
    }, 0)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings)) } catch { /* ignore */ }
  }

  const updateNotif = (key: string, value: boolean) => {
    saveSettings({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
    toast.success('Settings updated')
  }

  const setDefaultTheme = (t: 'dark' | 'light') => {
    saveSettings({ ...settings, appearance: { defaultTheme: t } })
    setTheme(t)
    toast.success(`Default theme set to ${t}`)
  }

  const resetTour = () => {
    try {
      localStorage.removeItem('pharmatrace_tour_seen')
      setTourReset(true)
      toast.success('Tour reset — it will auto-open on next page load')
    } catch { /* ignore */ }
  }

  const clearWatchlist = () => {
    try {
      localStorage.removeItem('pharmatrace_watchlist')
      toast.success('Watchlist cleared')
    } catch { /* ignore */ }
  }

  const clearAllData = () => {
    try {
      localStorage.removeItem('pharmatrace_watchlist')
      localStorage.removeItem('pharmatrace_tour_seen')
      localStorage.removeItem('pharmatrace_settings')
      toast.success('All local data cleared')
      setSettings(DEFAULT_SETTINGS)
      setTourReset(false)
    } catch { /* ignore */ }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Please sign in to access settings.</p>
        <Button className="mt-4" onClick={() => navigate('login')}>Sign in</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        icon={<Settings className="h-5 w-5" />}
        title="Settings"
        subtitle="Manage your PharmaTrace preferences, theme, and notification options."
      />

      {/* Appearance */}
      <GlassCard glow="cyan">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-cyan-300" />
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Switch between dark and light mode.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDefaultTheme('dark')}
              >
                <Moon className="h-3.5 w-3.5 mr-1.5" /> Dark
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDefaultTheme('light')}
              >
                <Sun className="h-3.5 w-3.5 mr-1.5" /> Light
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard glow="violet">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-violet-300" />
          Notifications
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Sound effects</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Play a subtle sound when notifications arrive.</p>
            </div>
            <Switch
              checked={settings.notifications.soundEnabled}
              onCheckedChange={(v) => updateNotif('soundEnabled', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Desktop notifications</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show browser notifications (requires permission).</p>
            </div>
            <Switch
              checked={settings.notifications.desktopNotifications}
              onCheckedChange={async (v) => {
                if (v && 'Notification' in window) {
                  const perm = await Notification.requestPermission()
                  if (perm !== 'granted') {
                    toast.error('Desktop notification permission denied')
                    return
                  }
                }
                updateNotif('desktopNotifications', v)
              }}
            />
          </div>
        </div>
      </GlassCard>

      {/* Help & Tour */}
      <GlassCard glow="emerald">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-emerald-300" />
          Help & Onboarding
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Reset Help Tour</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Show the 6-step guided tour again on next visit.</p>
            </div>
            <Button variant="outline" size="sm" onClick={resetTour}>
              {tourReset ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Reset</> : 'Reset Tour'}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Data Management */}
      <GlassCard glow="rose">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-rose-300" />
          Data Management
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Clear Watchlist</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Remove all starred drugs from your watchlist.</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearWatchlist}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear
            </Button>
          </div>
          <div className="border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-rose-300">Clear All Local Data</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Reset settings, watchlist, and tour status.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={clearAllData}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Reset All
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Account info */}
      <GlassCard>
        <h3 className="font-semibold mb-3">Account</h3>
        <div className="text-sm space-y-1 text-muted-foreground">
          <div>Email: <span className="text-foreground font-mono">{user.email}</span></div>
          <div>Role: <span className="text-foreground">{user.role}</span></div>
          <div>Name: <span className="text-foreground">{user.name}</span></div>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('profile')}>
          Edit Profile
        </Button>
      </GlassCard>
    </div>
  )
}
