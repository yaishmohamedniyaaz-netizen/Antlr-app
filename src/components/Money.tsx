import { formatMvr } from '@/lib/money'
import type { Laari } from '@/types'
import { cn } from '@/lib/utils'

export function Money({ value, className }: { value: Laari; className?: string }) {
  return <span className={cn('tabular-nums whitespace-nowrap', className)}>{formatMvr(value)}</span>
}
