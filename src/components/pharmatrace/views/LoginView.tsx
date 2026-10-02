'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { BrandLockup } from '../Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '../GlassCard'
import { toast } from 'sonner'
import { apiPost } from '@/lib/client/api'
import { Loader2, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'

const DEMO_ACCOUNTS = [
  { email: 'admin@pharmatrace.demo', role: 'Admin' },
  { email: 'manufacturer@pharmatrace.demo', role: 'Manufacturer' },
  { email: 'distributor@pharmatrace.demo', role: 'Distributor' },
  { email: 'pharmacy@pharmatrace.demo', role: 'Pharmacy' },
  { email: 'customer@pharmatrace.demo', role: 'Customer' },
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
    <div className="mx-auto max-w-md py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex justify-center mb-6">
          <BrandLockup />
        </div>
        <GlassCard glow="cyan" className="p-7">
          <h1 className="text-2xl font-semibold text-center">Sign in to PharmaTrace</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Access your role-based dashboard
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
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

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2 text-center">Demo Accounts (password: demo1234)</p>
          <div className="grid gap-1.5">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => { setEmail(a.email); setPassword('demo1234') }}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              >
                <span className="font-mono">{a.email}</span>
                <span className="text-muted-foreground">{a.role}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
