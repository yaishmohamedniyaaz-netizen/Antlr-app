import { useState } from 'react'
import type { Table } from '@/types'
import { useActions, useOpenShift, useOrders, useTables } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/Money'
import { ShiftGate } from '@/components/ShiftGate'
import { EmptyState } from '@/components/EmptyState'
import { minutesSince } from '@/lib/format'
import { cn } from '@/lib/utils'
import { OrderBuilder } from './OrderBuilder'
import { useSave } from '@/hooks/useSave'
import { tableDot, tableStatusLabel } from './labels'

type Merge = { step: 'off' } | { step: 'source' } | { step: 'target'; source: Table }

export function FloorPage() {
  const tables = useTables()
  const orders = useOrders()
  const shift = useOpenShift()
  const actions = useActions()
  const [openOrder, setOpenOrder] = useState<string | null>(null)
  const [merge, setMerge] = useState<Merge>({ step: 'off' })
  const saver = useSave()

  if (openOrder) return <OrderBuilder orderId={openOrder} onClose={() => setOpenOrder(null)} />

  const onTable = (t: Table) => {
    if (merge.step === 'source') {
      if (t.currentOrderId) setMerge({ step: 'target', source: t })
      return
    }
    if (merge.step === 'target') {
      if (t.id === merge.source.id) return setMerge({ step: 'source' })
      if (t.currentOrderId && merge.source.currentOrderId) {
        const from = merge.source.currentOrderId
        const to = t.currentOrderId
        void saver.run(async () => { await actions.mergeOrders(from, to); return true }).then((ok) => { if (ok) setMerge({ step: 'off' }) })
      }
      return
    }
    if (t.currentOrderId) return setOpenOrder(t.currentOrderId)
    if (!shift || saver.saving) return
    void saver.run(() => actions.createOrder({ type: 'dine_in', tableId: t.id, peopleCount: Math.min(2, t.seats) })).then((o) => o && setOpenOrder(o.id))
  }

  const busy = tables.filter((t) => t.status !== 'free').length

  return (
    <>
      <PageHeader
        title="Floor"
        actions={merge.step === 'off'
          ? <Button onClick={() => setMerge({ step: 'source' })} disabled={busy < 2}>Merge tables</Button>
          : <Button variant="ghost" onClick={() => setMerge({ step: 'off' })}>Cancel merge</Button>}
      >
        <span className="text-sm text-muted-foreground">{busy} of {tables.length} tables in use</span>
      </PageHeader>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
        {saver.error && <p role="alert" className="rounded-md border border-destructive/30 px-4 py-3 text-sm text-destructive">{saver.error}</p>}
        {!shift && <ShiftGate message="Open a shift to take orders">{null}</ShiftGate>}
        {merge.step !== 'off' && (
          <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
            {merge.step === 'source' ? 'Choose the table to move from.' : `Moving ${merge.source.label}. Choose the table to move it to.`}
          </div>
        )}
        {tables.length === 0 ? <EmptyState title="No tables yet" body="Add tables in Settings." /> : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {tables.map((t) => {
              const order = orders.find((o) => o.id === t.currentOrderId)
              const pickable = merge.step === 'off' || (!!t.currentOrderId && !(merge.step === 'target' && merge.source.id === t.id)) || (merge.step === 'target' && merge.source.id === t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onTable(t)}
                  aria-label={`${t.label}, ${t.seats} seats, ${tableStatusLabel[t.status]}`}
                  className={cn(
                    'flex h-32 flex-col justify-between rounded-md border bg-background p-4 text-left hover:border-foreground/30',
                    merge.step !== 'off' && !pickable && 'opacity-40',
                    merge.step === 'target' && merge.source.id === t.id && 'border-foreground',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl font-semibold">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.seats} seats</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={cn('size-2 rounded-full', tableDot[t.status])} />
                      <span>{tableStatusLabel[t.status]}</span>
                      {t.status !== 'free' && <span className="text-muted-foreground">· {minutesSince(t.statusChangedAt)} min</span>}
                    </div>
                    {order && <Money value={order.total} className="text-sm text-muted-foreground" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
