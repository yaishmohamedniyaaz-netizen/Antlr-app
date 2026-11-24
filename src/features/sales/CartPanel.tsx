import { Minus, Percent, Plus, Trash2 } from 'lucide-react'
import type { Dispatch } from 'react'
import type { ShopSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/Money'
import { ShiftGate } from '@/components/ShiftGate'
import { formatMvr } from '@/lib/money'
import { formatRate, type Totals } from '@/lib/tax'
import { type CartAction, type CartState, lineAmount } from './cart'

interface Props {
  cart: CartState
  dispatch: Dispatch<CartAction>
  totals: Totals
  settings: ShopSettings
  heldCount: number
  onPay: () => void
  onHold: () => void
  onDiscount: () => void
  onLineDiscount: (productId: string) => void
  onShowHeld: () => void
}

export function CartPanel({ cart, dispatch, totals, settings, heldCount, onPay, onHold, onDiscount, onLineDiscount, onShowHeld }: Props) {
  const count = cart.lines.reduce((s, l) => s + l.quantity, 0)
  const empty = cart.lines.length === 0
  const lineDiscounts = cart.lines.reduce((s, l) => s + l.lineDiscount, 0)
  return (
    <section aria-label="Current sale" className="flex w-[360px] shrink-0 flex-col border-l bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-5">
        <div>
          <h2 className="text-sm font-semibold">Current sale</h2>
          <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'item' : 'items'}</p>
        </div>
        {heldCount > 0 && <Button size="sm" variant="ghost" onClick={onShowHeld}>Held ({heldCount})</Button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">
        {empty ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Scan a barcode or tap a product to start.</p>
        ) : (
          <ul>
            {cart.lines.map((l) => (
              <li key={l.product.id} className="border-b py-3">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{l.product.name}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">{formatMvr(l.product.price)} each</div>
                    {l.lineDiscount > 0 && <div className="text-xs text-muted-foreground tabular-nums">Discount −{formatMvr(l.lineDiscount)}</div>}
                  </div>
                  <Money value={lineAmount(l)} className="text-sm font-medium" />
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <Button size="icon" className="size-11" aria-label={`Less ${l.product.name}`} onClick={() => dispatch({ type: 'setQty', productId: l.product.id, quantity: l.quantity - 1 })}><Minus /></Button>
                  <span className="w-10 text-center text-sm font-medium tabular-nums" aria-label="Quantity">{l.quantity}</span>
                  <Button size="icon" className="size-11" aria-label={`More ${l.product.name}`} onClick={() => dispatch({ type: 'setQty', productId: l.product.id, quantity: l.quantity + 1 })}><Plus /></Button>
                  <div className="flex-1" />
                  <Button size="icon" variant="ghost" className="size-11 text-muted-foreground" aria-label={`Discount on ${l.product.name}`} onClick={() => onLineDiscount(l.product.id)}><Percent /></Button>
                  <Button size="icon" variant="ghost" className="size-11 text-muted-foreground" aria-label={`Remove ${l.product.name}`} onClick={() => dispatch({ type: 'remove', productId: l.product.id })}><Trash2 /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-1.5 border-t px-5 py-4 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><Money value={totals.gross + lineDiscounts} /></div>
        {totals.discount + lineDiscounts > 0 && (
          <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="tabular-nums">−{formatMvr(totals.discount + lineDiscounts)}</span></div>
        )}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{settings.pricesIncludeGst ? 'Includes' : 'Plus'} GST {formatRate(settings.gstRateBps)}</span>
          <Money value={totals.gst} />
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <span className="font-medium">Total</span>
          <Money value={totals.total} className="text-2xl font-semibold" />
        </div>
        <div className="pt-2">
          <ShiftGate>
            <Button variant="primary" size="xl" className="w-full" disabled={empty} onClick={onPay}>
              Pay {formatMvr(totals.total)}
            </Button>
            <div className="mt-2 grid grid-cols-3 gap-1">
              <Button variant="ghost" disabled={empty} onClick={onHold}>Hold</Button>
              <Button variant="ghost" disabled={empty} onClick={onDiscount}>Discount</Button>
              <Button variant="ghost" disabled={empty} onClick={() => dispatch({ type: 'clear' })}>Clear</Button>
            </div>
          </ShiftGate>
        </div>
      </div>
    </section>
  )
}
