'use client'
import { useEffect } from 'react'
import { useWatchlist } from '@/store/watchlist'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function FavoriteButton({ drugId, drugName, className }: { drugId: string; drugName?: string; className?: string }) {
  const { favorites, toggle, load, loaded } = useWatchlist()

  useEffect(() => { if (!loaded) load() }, [loaded, load])

  const isFav = favorites.includes(drugId)

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    toggle(drugId)
    toast.success(isFav ? `Removed${drugName ? ' ' + drugName : ''} from watchlist` : `Added${drugName ? ' ' + drugName : ''} to watchlist`)
  }

  return (
    <button
      onClick={onClick}
      aria-label={isFav ? 'Remove from watchlist' : 'Add to watchlist'}
      title={isFav ? 'Remove from watchlist' : 'Add to watchlist'}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-1.5 transition-all hover:scale-110',
        isFav ? 'text-amber-300' : 'text-muted-foreground hover:text-amber-300',
        className,
      )}
    >
      <Star className={cn('h-4 w-4 transition-all', isFav && 'fill-amber-300/40')} />
    </button>
  )
}
