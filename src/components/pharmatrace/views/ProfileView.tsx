'use client'
import { useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader } from '../States'
import { GlassCard } from '../GlassCard'
import { RoleBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiPost } from '@/lib/client/api'
import { toast } from 'sonner'
import { fmtDate } from '@/lib/client/format'
import {
  Building2, MapPin, Mail, Calendar, LogOut, LayoutDashboard, Boxes,
  Save, Loader2, Palette, User as UserIcon,
} from 'lucide-react'
import type { AppUser } from '@/store/auth'

const AVATAR_COLORS = [
  '#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185',
  '#60a5fa', '#f472b6', '#4ade80', '#c084fc', '#f97316',
]

export function ProfileView() {
  const { user, logout, setUser } = useAuth()
  const { navigate } = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    organization: user?.organization ?? '',
    location: user?.location ?? '',
    avatarColor: user?.avatarColor ?? '#22d3ee',
  })

  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Please sign in.</p>
        <Button className="mt-4" onClick={() => navigate('login')}>Sign in</Button>
      </div>
    )
  }

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    setLoading(true)
    try {
      const res = await apiPost<{ user: AppUser }>('/api/auth/profile', form)
      setUser(res.user)
      toast.success('Profile updated')
      setEditing(false)
    } catch (e) {
      toast.error((e as Error).message || 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  const cancel = () => {
    setForm({
      name: user.name,
      organization: user.organization ?? '',
      location: user.location ?? '',
      avatarColor: user.avatarColor ?? '#22d3ee',
    })
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle="Manage your PharmaTrace account details."
        actions={
          editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <UserIcon className="h-4 w-4 mr-1.5" /> Edit Profile
            </Button>
          )
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard glow="cyan" className="lg:col-span-2">
          {!editing ? (
            /* Read-only view */
            <div className="flex items-start gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-black shrink-0 ring-2 ring-background"
                style={{ backgroundColor: user.avatarColor ?? '#22d3ee' }}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  <RoleBadge role={user.role} />
                </div>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {user.email}</div>
                  {user.organization && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> {user.organization}</div>}
                  {user.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {user.location}</div>}
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Joined {fmtDate(user.createdAt)}</div>
                </div>
              </div>
            </div>
          ) : (
            /* Edit form */
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-black shrink-0 ring-2 ring-background transition-colors"
                  style={{ backgroundColor: form.avatarColor }}
                >
                  {form.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Avatar Color</Label>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update('avatarColor', c)}
                        className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${form.avatarColor === c ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="org">Organization</Label>
                  <Input id="org" value={form.organization} onChange={(e) => update('organization', e.target.value)} placeholder="e.g. NovaCure Pharma" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc">Location</Label>
                  <Input id="loc" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Mumbai, India" />
                </div>
              </div>
              <div className="rounded-md bg-muted/30 border border-border/40 px-3 py-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 inline mr-1" />
                Email ({user.email}) and role ({user.role}) cannot be changed here.
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('dashboard')}>
              <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('drugs')}>
              <Boxes className="h-4 w-4 mr-2" /> Browse Drugs
            </Button>
            <Button variant="outline" className="w-full justify-start text-rose-300 hover:text-rose-200" onClick={async () => { await logout(); navigate('landing') }}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-3">Role Capabilities</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {roleCapabilities(user.role).map((c) => (
            <div key={c} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {c}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}

function roleCapabilities(role: string): string[] {
  switch (role) {
    case 'MANUFACTURER': return ['Register drug batches', 'Generate QR codes', 'View own batches', 'Transfer drugs']
    case 'DISTRIBUTOR': return ['Receive batches', 'Transfer batches', 'View supply chain']
    case 'WHOLESALER': return ['Receive', 'Transfer', 'Track']
    case 'PHARMACY': return ['Receive', 'Verify', 'Dispense']
    case 'CUSTOMER': return ['Verify drug', 'View authenticity', 'View public traceability']
    case 'ADMIN': return ['Manage users', 'View all drugs', 'View all transactions', 'Inspect blockchain', 'Monitor suspicious records']
    default: return ['Verify drugs']
  }
}
