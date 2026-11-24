import { useState } from 'react'
import { errorMessage } from '@/hooks/useSave'
import { Minus, Plus } from 'lucide-react'
import type { PaymentMethod, Sale } from '@/types'
import { useActions } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Money } from '@/components/Money'
import { formatMvr } from '@/lib/money'
import { refundLineAmount } from '@/lib/refund'
import { tenderLabel } from '@/features/checkout/payment'

const METHODS: PaymentMethod[] = ['cash', 'card', 'qr', 'transfer']

export function RefundDialog({ sale, open, onOpenChange }: { sale: Sale | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {open && sale && <RefundForm sale={sale} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function RefundForm({ sale, onDone }: { sale: Sale; onDone: () => void }) {
  const actions = useActions()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [method, setMethod] = useState<PaymentMethod>(sale.payments[0]?.method ?? 'cash')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const total = sale.items.reduce((s, i) => s + refundLineAmount(i, qty[i.id] ?? 0), 0)
  const submit = async () => {
    if (saving) return
    const lines = Object.entries(qty).filter(([, q]) => q > 0).map(([saleItemId, quantity]) => ({ saleItemId, quantity }))
    if (!lines.length) return setError('Choose at least one item to refund')
    setSaving(true)
    try { await actions.refundSale(sale.id, lines, method, reason.trim() || undefined) } catch (e) { setSaving(false); return setError(errorMessage(e)) }
    setSaving(false)
    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Refund</DialogTitle>
        <DialogDescription>{sale.saleNumber}</DialogDescription>
      </DialogHeader>
      <ul className="divide-y rounded-md border">
        {sale.items.map((i) => {
          const left = i.quantity - i.refundedQty
          const q = qty[i.id] ?? 0
          const set = (n: number) => { setQty((s) => ({ ...s, [i.id]: Math.max(0, Math.min(left, n)) })); setError('') }
          return (
            <li key={i.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{i.productName}</div>
                <div className="text-xs text-muted-foreground">
                  {left === 0 ? 'Already refunded' : `${left} of ${i.quantity} can be refunded · ${formatMvr(refundLineAmount(i, 1))} each`}
                </div>
              </div>
              <Button size="icon" className="size-11" aria-label={`Less ${i.productName}`} disabled={q === 0} onClick={() => set(q - 1)}><Minus /></Button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">{q}</span>
              <Button size="icon" className="size-11" aria-label={`More ${i.productName}`} disabled={q >= left} onClick={() => set(q + 1)}><Plus /></Button>
            </li>
          )
        })}
      </ul>
      <div className="space-y-1.5">
        <Label>Give money back by</Label>
        <ToggleGroup type="single" variant="outline" value={method} onValueChange={(v) => v && setMethod(v as PaymentMethod)} className="w-full">
          {METHODS.map((m) => <ToggleGroupItem key={m} value={m} className="flex-1">{tenderLabel(m)}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="refund-reason">Reason (optional)</Label>
        <Input id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged item" />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button variant="primary" size="lg" disabled={saving} onClick={submit}>{saving ? 'Saving…' : <>Refund <Money value={total} /></>}</Button>
    </>
  )
}
