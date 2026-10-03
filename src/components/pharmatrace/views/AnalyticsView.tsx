'use client'
import { useEffect, useState } from 'react'
import { PageHeader, LoadingState, ErrorState } from '../States'
import { GlassCard } from '../GlassCard'
import { StatCard } from '../StatCard'
import { apiGet } from '@/lib/client/api'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, ShieldCheck, Truck, Activity, TrendingUp, PieChart as PieIcon } from 'lucide-react'
import { VerificationHeatmap } from '../VerificationHeatmap'

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#60a5fa']

export function AnalyticsView() {
  const [verif, setVerif] = useState<any>(null)
  const [supply, setSupply] = useState<any>(null)
  const [dash, setDash] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [v, s, d] = await Promise.all([
        apiGet('/api/analytics/verifications'),
        apiGet('/api/analytics/supply-chain'),
        apiGet('/api/analytics/dashboard'),
      ])
      setVerif(v); setSupply(s); setDash(d)
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  if (loading) return <LoadingState label="Loading analytics…" />
  if (error || !verif || !supply || !dash) return <ErrorState description={error ?? undefined} onRetry={load} />

  const verifTimeseries = (verif.timeseries ?? []).map((t: any) => ({
    date: t.date.slice(5),
    AUTHENTIC: t.AUTHENTIC,
    NOT_FOUND: t.NOT_FOUND,
    FLAGGED: t.FLAGGED,
    EXPIRED: t.EXPIRED,
  }))
  const supplyTimeseries = (supply.timeseries ?? []).map((t: any) => ({
    date: t.date.slice(5),
    Transfers: t.TRANSFERS,
    Receipts: t.RECEIPTS,
    Registrations: t.REGISTRATIONS,
  }))
  const byResult = (verif.byResult ?? []).map((r: any) => ({ name: r.result, value: r._count }))
  const byStatus = (supply.byStatus ?? []).map((s: any) => ({ name: s.status, value: s._count }))
  const byType = (supply.byType ?? []).map((t: any) => ({ name: t.eventType, value: t._count }))

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Analytics"
        subtitle="Live insights from the PharmaTrace blockchain ledger."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Verifications" value={verif.total ?? 0} accent="emerald" icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="Supply Chain Events" value={supply.totalEvents ?? 0} accent="violet" icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Transactions" value={dash.stats.totalTransactions ?? 0} accent="cyan" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Registered Drugs" value={dash.stats.totalDrugs ?? 0} accent="amber" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="font-semibold mb-3">Verification Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={verifTimeseries}>
                <defs>
                  <linearGradient id="g-auth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-notfound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="AUTHENTIC" stroke="#34d399" fill="url(#g-auth)" />
                <Area type="monotone" dataKey="NOT_FOUND" stroke="#fb7185" fill="url(#g-notfound)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Supply Chain Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={supplyTimeseries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Transfers" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Receipts" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Registrations" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Verifications by Result</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byResult} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {byResult.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold mb-3">Drugs by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }} />
                <Bar dataKey="value" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="font-semibold mb-3">Supply Chain Events by Type</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff20', borderRadius: 8 }} />
              <Bar dataKey="value" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Verification Heatmap */}
      <VerificationHeatmap />
    </div>
  )
}
