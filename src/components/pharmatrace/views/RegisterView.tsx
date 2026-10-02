'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { BrandLockup, BrandMark } from '../Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '../GlassCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiPost } from '@/lib/client/api'
import { Loader2, UserPlus, User, Lock, Mail, Building2, MapPin, Network, Boxes, ShieldCheck, Activity } from 'lucide-react'
import { motion } from 'framer-motion'

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer / Verifier', desc: 'Verify drugs & view public traceability', color: '#94a3b8' },
  { value: 'MANUFACTURER', label: 'Manufacturer', desc: 'Register drug batches & generate QR codes', color: '#a78bfa' },
  { value: 'DISTRIBUTOR', label: 'Distributor', desc: 'Receive & transfer batches', color: '#fbbf24' },
  { value: 'WHOLESALER', label: 'Wholesaler', desc: 'Receive, transfer & track batches', color: '#60a5fa' },
  { value: 'PHARMACY', label: 'Pharmacy', desc: 'Receive, verify & dispense drugs', color: '#fb7185' },
]

export function RegisterView() {
  const { navigate } = useRouter()
  const { fetchMe } = useAuth()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', role: 'CUSTOMER',
    organization: '', location: '',
  })
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await apiPost('/api/auth/register', {
        name: form.name, email: form.email, password: form.password,
        role: form.role, organization: form.organization, location: form.location,
      })
      await fetchMe()
      toast.success('Account created — welcome to PharmaTrace')
      navigate('dashboard')
    } catch (err) {
      toast.error((err as Error).message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find((r) => r.value === form.role)

  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2 gap-8 py-8">
      {/* Left: branded panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-center px-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6">
            <BrandMark className="h-16 w-16" />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Join the <span className="gradient-text">network.</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Create your PharmaTrace account and become part of the blockchain-powered
            pharmaceutical supply chain. Verify drugs, track batches, and ensure authenticity.
          </p>

          {/* Role descriptions */}
          <div className="mt-8 space-y-3">
            {ROLES.map((r, i) => (
              <motion.div
                key={r.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                  form.role === r.value ? 'border-primary/40 bg-primary/5' : 'border-border/40 hover:bg-muted/20'
                }`}
                onClick={() => update('role', r.value)}
              >
                <span className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: r.color }} />
                <div className="flex-1">
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right: register form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-center px-4 sm:px-8"
      >
        <div className="lg:hidden flex justify-center mb-6">
          <BrandLockup />
        </div>
        <GlassCard glow="violet" className="p-7 max-w-lg mx-auto w-full">
          <h1 className="text-2xl font-semibold text-center">Create your PharmaTrace account</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Selected role: <span className="text-foreground font-medium">{selectedRole?.label}</span>
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required className="pl-9" placeholder="John Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required className="pl-9" placeholder="you@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirm" type="password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} required className="pl-9" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select value={form.role} onValueChange={(v) => update('role', v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="org">Organization</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="org" value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="NovaCure Pharma" className="pl-9" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="loc" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Mumbai, India" className="pl-9" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create account
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="text-primary hover:underline">Sign in</button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
