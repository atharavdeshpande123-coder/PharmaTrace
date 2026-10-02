'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { BrandLockup, BrandMark } from '../Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '../GlassCard'
import { toast } from 'sonner'
import { apiPost } from '@/lib/client/api'
import { Loader2, ShieldCheck, Lock, Mail, Network, Boxes, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const DEMO_ACCOUNTS = [
  { email: 'admin@pharmatrace.demo', role: 'Admin', color: '#22d3ee' },
  { email: 'manufacturer@pharmatrace.demo', role: 'Manufacturer', color: '#a78bfa' },
  { email: 'distributor@pharmatrace.demo', role: 'Distributor', color: '#fbbf24' },
  { email: 'pharmacy@pharmatrace.demo', role: 'Pharmacy', color: '#fb7185' },
  { email: 'customer@pharmatrace.demo', role: 'Customer', color: '#94a3b8' },
]

export function LoginView() {
  const { navigate } = useRouter()
  const { fetchMe } = useAuth()
  const [email, setEmail] = useState('admin@pharmatrace.demo')
  const [password, setPassword] = useState('demo1234')
  const [loading, setLoading] = useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    try {
      await apiPost('/api/auth/login', { email, password })
      await fetchMe()
      toast.success('Welcome back to PharmaTrace')
      navigate('dashboard')
    } catch (err) {
      toast.error((err as Error).message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8 py-8">
      {/* Left: branded panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-center px-12 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6">
            <BrandMark className="h-16 w-16" />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Trust Every <span className="gradient-text">Dose.</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Sign in to access your blockchain-powered pharmaceutical supply chain dashboard.
            Verify drugs, track batches, and explore the immutable ledger.
          </p>

          {/* Feature highlights */}
          <div className="mt-8 space-y-3">
            {[
              { icon: <ShieldCheck className="h-4 w-4" />, text: 'Tamper-evident blockchain verification', color: 'text-emerald-300' },
              { icon: <Network className="h-4 w-4" />, text: 'Full supply-chain traceability', color: 'text-cyan-300' },
              { icon: <Boxes className="h-4 w-4" />, text: 'QR code generation & scanning', color: 'text-violet-300' },
              { icon: <Activity className="h-4 w-4" />, text: 'Real-time analytics & audit trail', color: 'text-amber-300' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className={`rounded-lg bg-muted/40 p-2 ring-1 ring-border/60 ${f.color}`}>{f.icon}</span>
                <span className="text-sm">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right: login form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center px-4 sm:px-8"
      >
        <div className="lg:hidden flex justify-center mb-6">
          <BrandLockup />
        </div>
        <GlassCard glow="cyan" className="p-7 max-w-md mx-auto w-full">
          <h1 className="text-2xl font-semibold text-center">Sign in to PharmaTrace</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Access your role-based dashboard
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pl-9" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Sign in
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            New to PharmaTrace?{' '}
            <button onClick={() => navigate('register')} className="text-primary hover:underline">
              Create an account
            </button>
          </div>
        </GlassCard>

        <div className="mt-5 max-w-md mx-auto w-full">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 text-center">Demo Accounts (password: demo1234)</p>
          <div className="grid gap-1.5">
            {DEMO_ACCOUNTS.map((a, i) => (
              <motion.button
                key={a.email}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                onClick={() => { setEmail(a.email); setPassword('demo1234') }}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs hover:bg-muted transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                  <span className="font-mono">{a.email}</span>
                </span>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{a.role}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
