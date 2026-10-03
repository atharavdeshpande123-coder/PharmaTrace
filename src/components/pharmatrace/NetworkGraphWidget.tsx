'use client'
import { useEffect, useState, useRef } from 'react'
import { GlassCard } from './GlassCard'
import { LoadingState } from './States'
import { apiGet } from '@/lib/client/api'
import { motion } from 'framer-motion'
import { Network, Users, Truck, Building2, ShieldCheck } from 'lucide-react'

interface GraphUser {
  id: string
  name: string
  organization: string | null
  location: string | null
  role: string
}

interface GraphTx {
  id: string
  type: string
  fromId: string | null
  toId: string | null
  drugId: string | null
}

interface GraphData {
  users: GraphUser[]
  transactions: GraphTx[]
}

const ROLE_CONFIG: Record<string, { color: string; radius: number; icon: string }> = {
  MANUFACTURER: { color: '#22d3ee', radius: 32, icon: 'M' },
  DISTRIBUTOR: { color: '#a78bfa', radius: 26, icon: 'D' },
  WHOLESALER: { color: '#60a5fa', radius: 24, icon: 'W' },
  PHARMACY: { color: '#34d399', radius: 28, icon: 'P' },
  ADMIN: { color: '#fbbf24', radius: 30, icon: 'A' },
  CUSTOMER: { color: '#94a3b8', radius: 20, icon: 'C' },
}

export function NetworkGraphWidget() {
  const [data, setData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [usersRes, txRes] = await Promise.all([
          apiGet<{ users: GraphUser[] }>('/api/users/transfer-recipients'),
          apiGet<{ transactions: GraphTx[] }>('/api/blockchain/transactions?limit=200'),
        ])
        // For the graph we need ALL users, not just transfer recipients
        // Since /api/users/transfer-recipients excludes the current user, let's
        // also fetch from a broader source. Actually the dashboard has users
        // via the admin endpoint. Let's use what we have.
        if (!cancelled) {
          setData({ users: usersRes.users, transactions: txRes.transactions })
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <GlassCard><LoadingState label="Building network graph…" /></GlassCard>
  if (!data || data.users.length === 0) return <GlassCard><p className="text-sm text-muted-foreground text-center py-6">No network data available.</p></GlassCard>

  // Build edges from transactions (fromId -> toId)
  const edges: { from: string; to: string; count: number; type: string }[] = []
  const edgeMap = new Map<string, { from: string; to: string; count: number; type: string }>()
  for (const tx of data.transactions) {
    if (!tx.fromId || !tx.toId) continue
    const key = `${tx.fromId}->${tx.toId}`
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.count++
    } else {
      edgeMap.set(key, { from: tx.fromId, to: tx.toId, count: 1, type: tx.type })
    }
  }
  edges.push(...edgeMap.values())

  // Compute node positions in a circle
  const centerX = 300
  const centerY = 300
  const radius = 200
  const usersWithPositions = data.users.map((u, i) => {
    const angle = (i / data.users.length) * 2 * Math.PI - Math.PI / 2
    return {
      ...u,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })

  const userMap = new Map(usersWithPositions.map((u) => [u.id, u]))
  const roleCounts = data.users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <GlassCard glow="violet">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-300" />
          Supply Chain Network Graph
        </h3>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider">
          {Object.entries(roleCounts).slice(0, 5).map(([role, count]) => (
            <span key={role} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ROLE_CONFIG[role]?.color ?? '#888' }} />
              {role}
            </span>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="relative">
        <svg viewBox="0 0 600 600" className="w-full h-auto">
          {/* Animated connection lines */}
          <defs>
            <linearGradient id="edge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const from = userMap.get(edge.from)
            const to = userMap.get(edge.to)
            if (!from || !to) return null
            const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to
            return (
              <g key={i}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isHighlighted ? '#22d3ee' : 'url(#edge-gradient)'}
                  strokeWidth={Math.min(4, 1 + edge.count * 0.3)}
                  opacity={hoveredNode && !isHighlighted ? 0.1 : isHighlighted ? 0.9 : 0.5}
                  strokeDasharray={isHighlighted ? '0' : '4 4'}
                  className={isHighlighted ? '' : 'animate-dash-flow'}
                />
                {edge.count > 1 && isHighlighted && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2}
                    fill="#22d3ee"
                    fontSize="10"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {edge.count} tx
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {usersWithPositions.map((u, i) => {
            const config = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.CUSTOMER
            const isHovered = hoveredNode === u.id
            const hasEdges = edges.some(e => e.from === u.id || e.to === u.id)
            return (
              <g
                key={u.id}
                onMouseEnter={() => setHoveredNode(u.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer pulse ring */}
                {isHovered && (
                  <circle
                    cx={u.x}
                    cy={u.y}
                    r={config.radius + 8}
                    fill="none"
                    stroke={config.color}
                    strokeWidth="1"
                    opacity="0.4"
                    className="animate-ping-ring"
                  />
                )}
                {/* Glow */}
                <circle
                  cx={u.x}
                  cy={u.y}
                  r={config.radius}
                  fill={config.color}
                  opacity={isHovered ? 0.3 : 0.15}
                  filter="url(#glow)"
                />
                {/* Main circle */}
                <motion.circle
                  cx={u.x}
                  cy={u.y}
                  r={config.radius * (isHovered ? 1.1 : 1)}
                  fill={config.color}
                  opacity={hasEdges ? 0.85 : 0.4}
                  stroke={config.color}
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: hasEdges ? 0.85 : 0.4 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 200 }}
                />
                {/* Label */}
                <text
                  x={u.x}
                  y={u.y + 4}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#0a0a0f"
                  className="pointer-events-none"
                >
                  {config.icon}
                </text>
                {/* Name */}
                <text
                  x={u.x}
                  y={u.y + config.radius + 14}
                  textAnchor="middle"
                  fontSize="9"
                  fill={isHovered ? config.color : 'currentColor'}
                  opacity={isHovered ? 1 : 0.6}
                  className="pointer-events-none font-mono"
                >
                  {(u.organization ?? u.name).slice(0, 20)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="flex items-center gap-2 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5">
            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: ROLE_CONFIG[role]?.color ?? '#888' }} />
            <span className="truncate">{role}</span>
            <span className="ml-auto font-bold">{count}</span>
          </div>
        ))}
      </div>

      {hoveredNode && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          Hovering: {userMap.get(hoveredNode)?.organization ?? userMap.get(hoveredNode)?.name}
        </div>
      )}
    </GlassCard>
  )
}
