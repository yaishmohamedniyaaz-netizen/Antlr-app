import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'
import { nextValue } from '@/lib/numpad'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'] as const

export function Numpad({ value, onChange, maxDecimals = 2, className }: {
  value: string; onChange: (v: string) => void; maxDecimals?: number; className?: string
}) {
  const key = 'flex h-12 items-center justify-center rounded-md border bg-background text-lg font-medium hover:bg-muted active:bg-secondary'
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {KEYS.map((k) => (
        <button key={k} type="button" className={key} aria-label={k === 'delete' ? 'Delete' : k} onClick={() => onChange(nextValue(value, k, maxDecimals))}>
          {k === 'delete' ? <Delete className="size-5" /> : k}
        </button>
      ))}
      <button type="button" className={cn(key, 'col-span-3 h-10 text-sm text-muted-foreground')} onClick={() => onChange('')}>
        Clear
      </button>
    </div>
  )
}
