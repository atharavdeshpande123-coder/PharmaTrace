'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { BrandLockup } from '../Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlassCard } from '../GlassCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { apiPost } from '@/lib/client/api'
import { Loader2, UserPlus } from 'lucide-react'
import { motion } from 'framer-motion'

const ROLES = [
  { value: 'CUSTOMER', label: 'Customer / Verifier' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'PHARMACY', label: 'Pharmacy' },
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

  return (
    <div className="mx-auto max-w-lg py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex justify-center mb-6">
          <BrandLockup />
        </div>
        <GlassCard glow="violet" className="p-7">
          <h1 className="text-2xl font-semibold text-center">Create your PharmaTrace account</h1>
          <p className="mt-1 text-sm text-muted-foreground text-center">
            Join the pharmaceutical supply chain network
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} required />
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
                <Input id="org" value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="e.g. NovaCure Pharma" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc">Location</Label>
                <Input id="loc" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Mumbai, India" />
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
