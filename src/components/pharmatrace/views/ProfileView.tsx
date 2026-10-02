'use client'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader } from '../States'
import { GlassCard } from '../GlassCard'
import { RoleBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { fmtDate } from '@/lib/client/format'
import { Building2, MapPin, Mail, Calendar, LogOut, LayoutDashboard, Boxes } from 'lucide-react'

export function ProfileView() {
  const { user, logout } = useAuth()
  const { navigate } = useRouter()
  if (!user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Please sign in.</p>
        <Button className="mt-4" onClick={() => navigate('login')}>Sign in</Button>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your PharmaTrace account details." />
      <div className="grid lg:grid-cols-3 gap-4">
        <GlassCard glow="cyan" className="lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-black" style={{ backgroundColor: user.avatarColor ?? '#22d3ee' }}>
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
