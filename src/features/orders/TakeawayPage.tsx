import { useState } from 'react'
import type { TakeawaySource } from '@/types'
import { useActions, useOpenShift, useOrders, useSettings } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { ShiftGate } from '@/components/ShiftGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OrderBuilder } from './OrderBuilder'
import { useSave } from '@/hooks/useSave'
import { FilterTabs, OrderList } from './OrderList'
import { isActiveOrder, sourceLabel } from './labels'

type Filter = 'all' | 'open' | 'viber'

export function TakeawayPage() {
  const all = useOrders().filter((o) => o.type === 'takeaway' && isActiveOrder(o))
  const settings = useSettings()
  const shift = useOpenShift()
  const actions = useActions()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<TakeawaySource>('walkin')
  const create = useSave()

  if (open) return <OrderBuilder orderId={open} onClose={() => setOpen(null)} />

  const sources: TakeawaySource[] = settings.viberEnabled ? ['walkin', 'phone', 'viber'] : ['walkin', 'phone']
  const shown = all.filter((o) => filter === 'all' || (filter === 'open' ? o.status === 'open' : o.source === 'viber'))
  const start = async () => {
    const o = await create.run(() => actions.createOrder({ type: 'takeaway', customerName: name.trim() || undefined, customerNumber: phone.trim() || undefined, source }))
    if (!o) return
    setCreating(false); setName(''); setPhone(''); setSource('walkin')
    setOpen(o.id)
  }

  return (
    <>
      <PageHeader title="Takeaway" actions={shift && <Button variant="primary" onClick={() => setCreating(true)}>New takeaway order</Button>} />
      {!shift && <div className="px-6 pt-4"><ShiftGate message="Open a shift to take orders">{null}</ShiftGate></div>}
      <FilterTabs value={filter} onChange={setFilter} tabs={[
        { value: 'all', label: 'All', count: all.length },
        { value: 'open', label: 'Not sent', count: all.filter((o) => o.status === 'open').length },
        ...(settings.viberEnabled ? [{ value: 'viber' as const, label: 'Viber', count: all.filter((o) => o.source === 'viber').length }] : []),
      ]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <OrderList orders={shown} onOpen={setOpen} showViber={settings.viberEnabled} />
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>New takeaway order</DialogTitle>
            <DialogDescription>Name and number are optional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label htmlFor="ta-name">Customer name</Label><Input id="ta-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aishath" autoFocus /></div>
            <div className="space-y-1.5"><Label htmlFor="ta-phone">Phone number</Label><Input id="ta-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="777 1234" /></div>
            <div className="space-y-1.5">
              <Label>Order came by</Label>
              <ToggleGroup type="single" variant="outline" value={source} onValueChange={(v) => v && setSource(v as TakeawaySource)} className="w-full">
                {sources.map((s) => <ToggleGroupItem key={s} value={s} className="flex-1">{sourceLabel[s]}</ToggleGroupItem>)}
              </ToggleGroup>
            </div>
          </div>
          {create.error && <p role="alert" className="text-sm text-destructive">{create.error}</p>}
          <Button variant="primary" size="lg" disabled={create.saving} onClick={start}>{create.saving ? 'Saving…' : 'Start order'}</Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
