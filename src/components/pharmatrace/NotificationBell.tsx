'use client'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/store/auth'
import { Bell, Check } from 'lucide-react'
import { apiPost } from '@/lib/client/api'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        const data = await res.json()
        if (!active) return
        setItems(data.notifications ?? [])
        setUnread(data.unreadCount ?? 0)
      } catch { /* noop */ }
    }
    load()
    const id = setInterval(load, 25_000)
    return () => { active = false; clearInterval(id) }
  }, [user])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markAll = async () => {
    setLoading(true)
    try {
      await apiPost('/api/notifications', { all: true })
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } finally { setLoading(false) }
  }

  if (!user) return null
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-muted/40 hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto scrollbar-thin glass-strong rounded-xl p-2 animate-scale-in">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={markAll}
              disabled={loading || unread === 0}
              className="text-xs text-primary hover:underline disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
          <div className="space-y-1">
            {items.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                You're all caught up.
              </div>
            ) : items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  'rounded-lg p-2.5 text-sm',
                  n.read ? 'opacity-70' : 'bg-primary/10',
                )}
              >
                <div className="flex items-start gap-2">
                  <div className={cn('mt-1 h-2 w-2 rounded-full', n.read ? 'bg-muted-foreground' : 'bg-primary')} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
