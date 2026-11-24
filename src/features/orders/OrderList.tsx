import { MessageCircle } from 'lucide-react'
import type { Order } from '@/types'
import { Money } from '@/components/Money'
import { EmptyState } from '@/components/EmptyState'
import { minutesSince } from '@/lib/format'
import { cn } from '@/lib/utils'
import { orderDot, orderStatusLabel, orderTitle, sourceLabel, viberLink } from './labels'

export function FilterTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="flex gap-5 border-b px-6">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn('-mb-px h-10 border-b-2 text-sm', value === t.value ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground')}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 text-muted-foreground">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function OrderList({ orders, onOpen, showViber }: { orders: Order[]; onOpen: (id: string) => void; showViber?: boolean }) {
  if (!orders.length) return <EmptyState title="No open orders" body="New orders show up here until they are paid." />
  return (
    <ul aria-label="Orders" className="divide-y">
      {orders.map((o) => {
        const items = o.items.filter((i) => i.status === 'active').reduce((s, i) => s + i.qty, 0)
        return (
          <li key={o.id} className="flex items-center gap-2 pr-6 hover:bg-muted/50">
            <button type="button" onClick={() => onOpen(o.id)} className="grid min-h-16 flex-1 grid-cols-[1fr_140px_140px_110px] items-center gap-4 py-3 pl-6 text-left">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{orderTitle(o)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {o.type === 'dine_in' ? 'Dine-in' : `Takeaway${o.source ? ' · ' + sourceLabel[o.source] : ''}`}
                  {o.customerNumber ? ` · ${o.customerNumber}` : ''}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <span className={cn('size-2 rounded-full', orderDot[o.status])} />{orderStatusLabel[o.status]}
              </span>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{items} items · {minutesSince(o.openedAt)} min</span>
              <Money value={o.total} className="text-right text-sm font-medium" />
            </button>
            {showViber && (o.source === 'viber' && o.customerNumber ? (
              <a href={viberLink(o.customerNumber)} aria-label={`Message ${orderTitle(o)} on Viber`} className="flex size-10 items-center justify-center rounded-md border text-muted-foreground hover:bg-muted hover:text-foreground">
                <MessageCircle className="size-4" />
              </a>
            ) : <span className="size-10 shrink-0" />)}
          </li>
        )
      })}
    </ul>
  )
}
