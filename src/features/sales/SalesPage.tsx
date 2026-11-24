import { useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import type { HeldSale, PaymentInput, Product, Sale } from '@/types'
import { useActions, useCategories, useHeldSales, useOpenShift, useProducts, useSettings } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentDialog } from '@/features/checkout/PaymentDialog'
import { DiscountDialog } from '@/features/checkout/DiscountDialog'
import { ReceiptDialog } from '@/features/checkout/ReceiptDialog'
import { formatTime } from '@/lib/format'
import { errorMessage, useSave } from '@/hooks/useSave'
import { quietly } from '@/lib/quietly'
import { toast } from 'sonner'
import { cartTotals, lineAmount, toSaleDraft } from './cart'
import { useCart } from './cartStore'
import { CartPanel } from './CartPanel'
import { CategoryTabs, ProductGrid } from './ProductGrid'
import { HeldSalesSheet } from './HeldSalesSheet'
import { useSalesShortcuts } from './useSalesShortcuts'

export function SalesPage() {
  const products = useProducts()
  const categories = useCategories()
  const settings = useSettings()
  const held = useHeldSales()
  const shift = useOpenShift()
  const actions = useActions()

  const [stored, dispatch] = useCart()
  // always use the current product details (price, GST) for lines already in the cart
  const cart = useMemo(() => ({
    ...stored,
    lines: stored.lines.map((l) => ({ ...l, product: products.find((p) => p.id === l.product.id) ?? l.product })),
  }), [stored, products])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [paying, setPaying] = useState(false)
  const [discountFor, setDiscountFor] = useState<'cart' | string | null>(null)
  const [holding, setHolding] = useState(false)
  const [holdLabel, setHoldLabel] = useState('')
  const [showHeld, setShowHeld] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const hold = useSave()

  const totals = cartTotals(cart, settings)
  const empty = cart.lines.length === 0

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products
      .filter((p) => !p.isHidden)
      .filter((p) => category === 'all' || p.categoryId === category)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q))
  }, [products, query, category])

  const add = (p: Product) => dispatch({ type: 'add', product: p })

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const q = query.trim()
    const byCode = products.find((p) => p.barcode === q && !p.isHidden)
    const only = visible.length === 1 ? visible[0] : undefined
    const hit = byCode ?? only
    if (hit && !(hit.trackStock && hit.currentStock <= 0)) {
      add(hit)
      setQuery('')
    }
  }

  const startHold = () => {
    if (empty) return
    setHoldLabel(`Sale ${formatTime(new Date().toISOString())}`)
    setHolding(true)
  }
  const confirmHold = async () => {
    const done = await hold.run(() => actions.holdSale(toSaleDraft(cart), holdLabel.trim() || 'Held sale', totals.total))
    if (!done) return
    dispatch({ type: 'clear' })
    setHolding(false)
  }
  const resume = async (h: HeldSale) => {
    try { await actions.removeHeldSale(h.id) } catch (e) { return toast.error(errorMessage(e)) }
    dispatch({ type: 'load', draft: h, products })
    setShowHeld(false)
  }

  const complete = async (payments: PaymentInput[]) => {
    const sale = await actions.completeSale(toSaleDraft(cart), payments)
    dispatch({ type: 'clear' })
    setPaying(false)
    setReceipt(sale)
    if (settings.autoPrintReceipt) setTimeout(() => window.print(), 300)
  }

  useSalesShortcuts({
    focusSearch: () => searchRef.current?.focus(),
    pay: () => { if (!empty && shift) setPaying(true) },
    hold: startHold,
    discount: () => { if (!empty) setDiscountFor('cart') },
  })

  const lineForDiscount = discountFor && discountFor !== 'cart' ? cart.lines.find((l) => l.product.id === discountFor) : undefined

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-3 bg-muted/30 p-5">
        <div className="flex h-11 items-center gap-2 rounded-md border bg-background px-3 focus-within:border-foreground/40">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Search or scan barcode"
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 text-[11px] text-muted-foreground">/</kbd>
        </div>
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ProductGrid products={visible} onAdd={add} onHide={(p) => quietly(actions.updateProduct(p.id, { isHidden: true }))} />
        </div>
      </div>

      <CartPanel
        cart={cart}
        dispatch={dispatch}
        totals={totals}
        settings={settings}
        heldCount={held.length}
        onPay={() => setPaying(true)}
        onHold={startHold}
        onDiscount={() => setDiscountFor('cart')}
        onLineDiscount={(id) => setDiscountFor(id)}
        onShowHeld={() => setShowHeld(true)}
      />

      <PaymentDialog total={totals.total} open={paying} onOpenChange={setPaying} onComplete={complete} />
      <DiscountDialog
        key={discountFor ?? 'none'}
        open={discountFor !== null}
        onOpenChange={(o) => { if (!o) setDiscountFor(null) }}
        title={lineForDiscount ? `Discount on ${lineForDiscount.product.name}` : 'Discount on this sale'}
        baseAmount={lineForDiscount ? lineAmount({ ...lineForDiscount, lineDiscount: 0 }) : totals.gross}
        current={lineForDiscount ? lineForDiscount.lineDiscount : cart.cartDiscount}
        onApply={(amount) =>
          lineForDiscount
            ? dispatch({ type: 'setLineDiscount', productId: lineForDiscount.product.id, amount })
            : dispatch({ type: 'setCartDiscount', amount })
        }
      />
      <ReceiptDialog sale={receipt} open={receipt !== null} onOpenChange={(o) => { if (!o) setReceipt(null) }} />
      <HeldSalesSheet open={showHeld} onOpenChange={setShowHeld} held={held} cartHasItems={!empty} onResume={resume} onDelete={(h) => quietly(actions.removeHeldSale(h.id))} />

      <Dialog open={holding} onOpenChange={setHolding}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Hold this sale</DialogTitle>
            <DialogDescription>Give it a name so you can find it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="hold-label">Name</Label>
            <Input id="hold-label" value={holdLabel} onChange={(e) => setHoldLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') confirmHold() }} autoFocus />
          </div>
          {hold.error && <p role="alert" className="text-sm text-destructive">{hold.error}</p>}
          <Button variant="primary" disabled={hold.saving} onClick={confirmHold}>{hold.saving ? 'Saving…' : 'Hold sale'}</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
