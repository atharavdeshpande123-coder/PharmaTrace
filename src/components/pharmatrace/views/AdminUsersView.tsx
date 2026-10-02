'use client'
import { useEffect, useState } from 'react'
import { useRouter } from '@/store/router'
import { useAuth } from '@/store/auth'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { RoleBadge } from '../Badges'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiGet, apiPost } from '@/lib/client/api'
import { BulkOperationsWidget } from '../BulkOperationsWidget'
import { fmtDate } from '@/lib/client/format'
import { toast } from 'sonner'
import { ShieldCheck, Users, Search, RefreshCw, Boxes, Package, Truck, Building2 } from 'lucide-react'

interface UserItem {
  id: string; email: string; name: string; role: string
  organization: string | null; location: string | null
  avatarColor: string | null; createdAt: string; drugCount: number
}

export function AdminUsersView() {
  const { user } = useAuth()
  const { navigate } = useRouter()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [seeding, setSeeding] = useState(false)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      if (role !== 'ALL') params.set('role', role)
      const res = await apiGet<{ users: UserItem[] }>(`/api/users?${params}`)
      setUsers(res.users)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [role])

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Admin access required.</p>
        <Button className="mt-4" onClick={() => navigate('dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.organization ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {} as Record<string, number>)

  const reseed = async () => {
    setSeeding(true)
    try {
      const res = await apiPost<{ success: boolean; stdout?: string; stderr?: string }>('/api/seed')
      toast.success('Demo data re-seeded')
      await load()
    } catch (e) { toast.error((e as Error).message) }
    finally { setSeeding(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Admin Dashboard"
        subtitle="Manage users, monitor the network, and inspect all records."
        actions={
          <Button variant="outline" size="sm" onClick={reseed} disabled={seeding}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${seeding ? 'animate-spin' : ''}`} /> Reseed Demo Data
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={users.length} accent="cyan" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Manufacturers" value={roleCounts.MANUFACTURER ?? 0} accent="violet" icon={<Package className="h-5 w-5" />} />
        <StatCard label="Distributors" value={(roleCounts.DISTRIBUTOR ?? 0) + (roleCounts.WHOLESALER ?? 0)} accent="sky" icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Pharmacies" value={roleCounts.PHARMACY ?? 0} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      {/* Bulk Operations */}
      <BulkOperationsWidget />

      <GlassCard className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users…" className="pl-9" />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="sm:w-44"><SelectValue placeholder="All roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {['ADMIN', 'MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'PHARMACY', 'CUSTOMER'].map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {loading ? <LoadingState label="Loading users…" /> :
        error ? <ErrorState description={error} onRetry={load} /> :
        filtered.length === 0 ? (
          <GlassCard><EmptyState title="No users found" /></GlassCard>
        ) : (
          <GlassCard>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3 hidden md:table-cell">Organization</th>
                    <th className="py-2 pr-3 hidden md:table-cell">Location</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3 hidden sm:table-cell">Drugs</th>
                    <th className="py-2 pr-3 hidden sm:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold text-black" style={{ backgroundColor: u.avatarColor ?? '#22d3ee' }}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{u.email}</td>
                      <td className="py-2 pr-3 hidden md:table-cell text-muted-foreground">{u.organization ?? '—'}</td>
                      <td className="py-2 pr-3 hidden md:table-cell text-muted-foreground">{u.location ?? '—'}</td>
                      <td className="py-2 pr-3"><RoleBadge role={u.role} /></td>
                      <td className="py-2 pr-3 hidden sm:table-cell text-muted-foreground">{u.drugCount}</td>
                      <td className="py-2 pr-3 hidden sm:table-cell text-muted-foreground text-xs">{fmtDate(u.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}
    </div>
  )
}
