import { useMemo, useState } from 'react'
import { ArrowLeft, Minus, MoreHorizontal, Plus, Search } from 'lucide-react'
import type { OrderItem, OrderItemModifier, OrderStatus, PaymentInput, Product, Sale } from '@/types'
import { useSave } from '@/hooks/useSave'
import { quietly } from '@/lib/quietly'
import { useActions, useCategories, useOrders, useProducts, useSettings } from '@/data/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Money } from '@/components/Money'
import { ShiftGate } from '@/components/ShiftGate'
import { CategoryTabs, ProductGrid } from '@/features/sales/ProductGrid'
import { PaymentDialog } from '@/features/checkout/PaymentDialog'
import { ReceiptDialog } from '@/features/checkout/ReceiptDialog'
import { orderLineAmount } from '@/lib/orderMath'
import { formatRate } from '@/lib/tax'
import { minutesSince } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ModifierDialog } from './ModifierDialog'
import { modifierLabel, orderDot, orderStatusLabel, orderTitle } from './labels'

const sameMods = (a: OrderItemModifier[], b: OrderItemModifier[]) =>
  a.length === b.length && a.every((m, i) => m.label === b[i].label && m.prefix === b[i].prefix)

type LineAction = { item: OrderItem; kind: 'void' | 'comp' | 'note' }

export function OrderBuilder({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const order = useOrders().find((o) => o.id === orderId)
  const products = useProducts()
  const categories = useCategories()
  const settings = useSettings()
  const actions = useActions()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [options, setOptions] = useState<Product | null>(null)
  const [lineAction, setLineAction] = useState<LineAction | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [receipt, setReceipt] = useState<Sale | null>(null)
  const busy = useSave()
  const lineSave = useSave()

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => !p.isHidden && (category === 'all' || p.categoryId === category) && (!q || p.name.toLowerCase().includes(q)))
  }, [products, query, category])

  if (!order) {
    if (receipt) return <ReceiptDialog sale={receipt} open onOpenChange={(o) => { if (!o) { setReceipt(null); onClose() } }} />
    return null
  }

  const editable = order.status === 'open'
  const active = order.items.filter((i) => i.status === 'active')

  // one save at a time, so quick taps never overwrite each other
  const save = (items: OrderItem[]) => busy.run(async () => {
    await actions.updateOrderItems(order.id, items)
    if (order.status !== 'open') await actions.setOrderStatus(order.id, 'open')
  })
  const setStatus = (status: OrderStatus) => busy.run(() => actions.setOrderStatus(order.id, status))

  const addItem = (p: Product, mods: OrderItemModifier[]) => {
    const same = order.items.find((i) => i.status === 'active' && i.productId === p.id && !i.note && sameMods(i.modifiers, mods))
    save(same
      ? order.items.map((i) => (i === same ? { ...i, qty: i.qty + 1 } : i))
      : [...order.items, { id: crypto.randomUUID(), productId: p.id, name: p.name, unitPrice: p.price, qty: 1, modifiers: mods, status: 'active' }])
  }
  const onProduct = (p: Product) => { if (busy.saving) return; if (p.modifiers?.length && settings.modifiersEnabled) setOptions(p); else addItem(p, []) }
  const setQty = (item: OrderItem, qty: number) =>
    save(qty <= 0 ? order.items.filter((i) => i.id !== item.id) : order.items.map((i) => (i.id === item.id ? { ...i, qty } : i)))

  const openLineAction = (a: LineAction) => { setLineAction(a); setText(a.kind === 'note' ? a.item.note ?? '' : ''); setError('') }
  const confirmLineAction = async () => {
    if (!lineAction) return
    if (lineAction.kind !== 'note' && !text.trim()) return setError('Enter a reason')
    const done = await lineSave.run(async () => { await (lineAction.kind === 'note'
      ? actions.updateOrderItems(order.id, order.items.map((i) => (i.id === lineAction.item.id ? { ...i, note: text.trim() || undefined } : i)))
      : actions.setOrderItemStatus(order.id, lineAction.item.id, lineAction.kind, text.trim())); return true })
    if (done) setLineAction(null)
  }

  const pay = async (payments: PaymentInput[]) => {
    const sale = await actions.payOrder(order.id, payments)
    setPaying(false)
    setReceipt(sale)
  }

  const payIsMain = order.status === 'served' || order.status === 'awaiting_payment' || (order.type === 'takeaway' && order.status !== 'open')
  const subtitle = order.type === 'dine_in'
    ? `${order.peopleCount ?? 1} ${order.peopleCount === 1 ? 'person' : 'people'}`
    : [order.customerNumber, order.source && order.source !== 'walkin' ? order.source[0].toUpperCase() + order.source.slice(1) : null].filter(Boolean).join(' · ')

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-3 bg-muted/30 p-5">
        <div className="flex h-11 items-center gap-2 rounded-md border bg-background px-3">
          <Search className="size-4 text-muted-foreground" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <CategoryTabs categories={categories} active={category} onChange={setCategory} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ProductGrid products={visible} onAdd={onProduct} onHide={(p) => quietly(actions.updateProduct(p.id, { isHidden: true }))} />
        </div>
      </div>

      <section aria-label="Order" className="flex w-[380px] shrink-0 flex-col border-l bg-background">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Button size="icon" variant="ghost" aria-label="Back" onClick={onClose}><ArrowLeft /></Button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{orderTitle(order)}</h2>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <span className="flex items-center gap-1.5 pr-2 text-xs text-muted-foreground">
            <span className={cn('size-2 rounded-full', orderDot[order.status])} />
            {orderStatusLabel[order.status]} · {minutesSince(order.openedAt)} min
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {order.items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Tap a dish to add it.</p>
          ) : (
            <ul>
              {order.items.map((i) => {
                const off = i.status !== 'active'
                return (
                  <li key={i.id} className="border-b py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={cn('text-sm font-medium', off && 'text-muted-foreground line-through')}>{i.qty} × {i.name}</div>
                        {i.modifiers.length > 0 && <div className="text-xs text-muted-foreground">{i.modifiers.map(modifierLabel).join(', ')}</div>}
                        {i.note && <div className="text-xs text-muted-foreground">Note: {i.note}</div>}
                        {off && <div className="text-xs text-muted-foreground">{i.status === 'void' ? 'Voided' : 'Free (comp)'}{i.voidCompReason ? ` · ${i.voidCompReason}` : ''}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Money value={orderLineAmount(i)} className="text-sm font-medium" />
                        {!off && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" aria-label={`More actions for ${i.name}`}><MoreHorizontal /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openLineAction({ item: i, kind: 'note' })}>{i.note ? 'Edit note' : 'Add note'}</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openLineAction({ item: i, kind: 'comp' })}>Make free (comp)</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openLineAction({ item: i, kind: 'void' })}>Void</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    {editable && !off && (
                      <div className="mt-2 flex items-center gap-1">
                        <Button size="icon" className="size-11" aria-label={`Less ${i.name}`} disabled={busy.saving} onClick={() => setQty(i, i.qty - 1)}><Minus /></Button>
                        <span className="w-10 text-center text-sm font-medium tabular-nums">{i.qty}</span>
                        <Button size="icon" className="size-11" aria-label={`More ${i.name}`} disabled={busy.saving} onClick={() => setQty(i, i.qty + 1)}><Plus /></Button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-1.5 border-t px-5 py-4 text-sm">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{settings.pricesIncludeGst ? 'Includes' : 'Plus'} GST {formatRate(settings.gstRateBps)}</span>
            <Money value={order.gstAmount} />
          </div>
          <div className="flex items-baseline justify-between pb-2">
            <span className="font-medium">Total</span>
            <Money value={order.total} className="text-2xl font-semibold" />
          </div>
          {busy.error && <p role="alert" className="pb-2 text-sm text-destructive">{busy.error}</p>}
          <ShiftGate message="Open a shift to take orders">
            <div className="space-y-2">
              {order.status === 'open' && (
                <Button variant="primary" size="xl" className="w-full" disabled={active.length === 0 || busy.saving} onClick={() => setStatus('sent')}>{busy.saving ? 'Saving…' : 'Send to kitchen'}</Button>
              )}
              <div className="flex gap-2 empty:hidden [&>*]:flex-1">
                {order.status === 'sent' && <Button size="lg" disabled={busy.saving} onClick={() => setStatus('served')}>Mark served</Button>}
                {order.type === 'dine_in' && (order.status === 'sent' || order.status === 'served') && (
                  <Button size="lg" disabled={busy.saving} onClick={() => setStatus('awaiting_payment')}>Request bill</Button>
                )}
              </div>
              {order.total > 0 && (
                <Button variant={payIsMain ? 'primary' : 'default'} size={payIsMain ? 'xl' : 'lg'} className="w-full" onClick={() => setPaying(true)}>
                  Pay <Money value={order.total} />
                </Button>
              )}
              {active.length === 0 && (
                <Button variant="ghost" className="w-full" disabled={busy.saving} onClick={async () => { if (await setStatus('voided') !== undefined) onClose() }}>Cancel order</Button>
              )}
            </div>
          </ShiftGate>
        </div>
      </section>

      <ModifierDialog product={options} onClose={() => setOptions(null)} onAdd={(mods) => { if (options) addItem(options, mods); setOptions(null) }} />
      <PaymentDialog total={order.total} open={paying} onOpenChange={setPaying} onComplete={pay} />
      <ReceiptDialog sale={receipt} open={receipt !== null} onOpenChange={(o) => { if (!o) { setReceipt(null); onClose() } }} />

      <Dialog open={lineAction !== null} onOpenChange={(o) => { if (!o) setLineAction(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{lineAction?.kind === 'note' ? 'Note for the kitchen' : lineAction?.kind === 'void' ? 'Void item' : 'Make item free'}</DialogTitle>
            <DialogDescription>{lineAction?.item.qty} × {lineAction?.item.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="line-text">{lineAction?.kind === 'note' ? 'Note' : 'Reason'}</Label>
            <Input id="line-text" value={text} onChange={(e) => { setText(e.target.value); setError('') }} placeholder={lineAction?.kind === 'note' ? 'Less spicy' : 'Wrong dish'} autoFocus />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          </div>
          {lineSave.error && <p role="alert" className="text-sm text-destructive">{lineSave.error}</p>}
          <Button variant="primary" disabled={lineSave.saving} onClick={confirmLineAction}>
            {lineAction?.kind === 'note' ? 'Save note' : lineAction?.kind === 'void' ? 'Void item' : 'Make free'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
