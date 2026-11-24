/**
 * In-memory demo store. All demo data and all code that changes it lives in src/data/.
 * Screens never import this file; they use the hooks in ./hooks.ts.
 * This is demo behavior so the app feels real. It is not an API or server design.
 */
import type {
  AppState, Category, HeldSale, NewOrderInput, Order, OrderItem, OrderItemInput, OrderItemStatus, OrderStatus,
  Payment, PaymentInput, PaymentMethod, Product, ProductInput, Refund, Sale, SaleDraft, SaleItem, Shift,
  ShopSettings, Table, TableStatus,
} from '@/types'
import { seedState } from './seed'
import { computeTotals } from '@/lib/tax'
import { divRound } from '@/lib/money'
import { localDateKey } from '@/lib/format'
import { orderLineAmount, orderTotals } from '@/lib/orderMath'
import { refundLineAmount } from '@/lib/refund'
import { expectedCash } from '@/lib/shift'

let state: AppState = seedState()
const listeners = new Set<() => void>()

export const getState = (): AppState => state
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
function set(next: Partial<AppState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()
const zero = () => ({ qr: 0, card: 0, transfer: 0, cash: 0 })

function openShiftOrThrow(): Shift {
  const s = state.shifts.find((x) => x.status === 'open')
  if (!s) throw new Error('No open shift')
  return s
}

function nextSaleNumber(): string {
  const key = localDateKey()
  const prefix = `ANTLR-${key}-`
  const used = state.sales.filter((s) => s.saleNumber.startsWith(prefix)).map((s) => Number(s.saleNumber.slice(prefix.length)))
  return prefix + String((used.length ? Math.max(...used) : 0) + 1).padStart(3, '0')
}

function toPayments(payments: PaymentInput[]): Payment[] {
  return payments.map((p) => ({
    ...p,
    id: newId(),
    createdAt: now(),
    ...(p.method === 'cash' && p.amountReceived !== undefined ? { changeGiven: Math.max(0, p.amountReceived - p.amount) } : {}),
  }))
}

function addToShift(shifts: Shift[], shiftId: string, method: PaymentMethod, amount: number, key: 'tenderTotals' | 'refundTotals') {
  return shifts.map((s) => (s.id === shiftId ? { ...s, [key]: { ...s[key], [method]: s[key][method] + amount } } : s))
}

function buildSale(lines: { product: Pick<Product, 'id' | 'name' | 'gstApplicable'>; unitPrice: number; quantity: number; lineDiscount: number }[],
  cartDiscount: number, payments: PaymentInput[], extra: Partial<Sale> = {}): Sale {
  const shift = openShiftOrThrow()
  const { gstRateBps, pricesIncludeGst } = state.settings
  const amounts = lines.map((l) => l.unitPrice * l.quantity - l.lineDiscount)
  const t = computeTotals(lines.map((l, i) => ({ amount: amounts[i], gstApplies: l.product.gstApplicable })), {
    rateBps: gstRateBps, pricesIncludeGst, cartDiscount,
  })
  // what each line actually cost the customer, after the cart discount
  const shares = amounts.map((a) => (t.gross === 0 ? 0 : divRound(a * t.net, t.gross)))
  const drift = t.net - shares.reduce((a, b) => a + b, 0)
  if (shares.length) shares[shares.length - 1] += drift
  const items: SaleItem[] = lines.map((l, i) => ({
    id: newId(), productId: l.product.id, productName: l.product.name, unitPrice: l.unitPrice, quantity: l.quantity,
    lineDiscount: l.lineDiscount, lineTotal: amounts[i], gstAmount: t.lineGst[i],
    paidTotal: shares[i] + (pricesIncludeGst ? 0 : t.lineGst[i]), refundedQty: 0,
  }))
  const lineDiscounts = lines.reduce((s, l) => s + l.lineDiscount, 0)
  return {
    id: newId(), saleNumber: nextSaleNumber(), shiftId: shift.id, operator: shift.operator, items,
    subtotal: t.gross, discountTotal: lineDiscounts + t.discount, gstAmount: t.gst, total: t.total,
    payments: toPayments(payments), status: 'completed', refunds: [], createdAt: now(), ...extra,
  }
}

function recordSale(sale: Sale, products = state.products) {
  let shifts = state.shifts
  for (const p of sale.payments) shifts = addToShift(shifts, sale.shiftId, p.method, p.amount, 'tenderTotals')
  set({ sales: [sale, ...state.sales], shifts, products })
}

const tableStatusFor: Partial<Record<OrderStatus, TableStatus>> = {
  open: 'order_open', sent: 'sent', served: 'served', awaiting_payment: 'awaiting_payment', paid: 'free', voided: 'free',
}

function withTotals(order: Order): Order {
  const gst = (pid: string) => state.products.find((p) => p.id === pid)?.gstApplicable ?? true
  return { ...order, ...orderTotals(order.items, gst, { rateBps: state.settings.gstRateBps, pricesIncludeGst: state.settings.pricesIncludeGst }) }
}

function replaceOrder(order: Order) {
  set({ orders: state.orders.map((o) => (o.id === order.id ? order : o)) })
}

function orderOrThrow(id: string): Order {
  const o = state.orders.find((x) => x.id === id)
  if (!o) throw new Error('Order not found')
  return o
}

export const actions = {
  resetDemoData() {
    state = seedState()
    listeners.forEach((l) => l())
  },

  updateSettings(patch: Partial<ShopSettings>) {
    set({ settings: { ...state.settings, ...patch } })
  },

  // ── Catalog ──
  addCategory(name: string): Category {
    const c = { id: newId(), name, sortOrder: Math.max(0, ...state.categories.map((x) => x.sortOrder)) + 1 }
    set({ categories: [...state.categories, c] })
    return c
  },
  renameCategory(id: string, name: string) {
    set({ categories: state.categories.map((c) => (c.id === id ? { ...c, name } : c)) })
  },
  deleteCategory(id: string, moveProductsTo?: string) {
    const used = state.products.some((p) => p.categoryId === id)
    if (used && !moveProductsTo) throw new Error('Category has products')
    set({
      categories: state.categories.filter((c) => c.id !== id),
      products: used ? state.products.map((p) => (p.categoryId === id ? { ...p, categoryId: moveProductsTo! } : p)) : state.products,
    })
  },
  addProduct(input: ProductInput): Product {
    const p = { ...input, id: newId(), createdAt: now(), updatedAt: now() }
    set({ products: [...state.products, p] })
    return p
  },
  updateProduct(id: string, patch: Partial<ProductInput>) {
    set({ products: state.products.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)) })
  },
  updateProducts(ids: string[], patch: Partial<ProductInput>) {
    set({ products: state.products.map((p) => (ids.includes(p.id) ? { ...p, ...patch, updatedAt: now() } : p)) })
  },
  deleteProducts(ids: string[]) {
    set({ products: state.products.filter((p) => !ids.includes(p.id)) })
  },

  // ── Sales ──
  completeSale(cart: SaleDraft, payments: PaymentInput[]): Sale {
    const lines = cart.lines.map((l) => {
      const product = state.products.find((p) => p.id === l.productId)
      if (!product) throw new Error('Product not found')
      return { product, unitPrice: product.price, quantity: l.quantity, lineDiscount: l.lineDiscount }
    })
    const sale = buildSale(lines, cart.cartDiscount, payments)
    const products = state.products.map((p) => {
      const sold = cart.lines.filter((l) => l.productId === p.id).reduce((s, l) => s + l.quantity, 0)
      return sold && p.trackStock ? { ...p, currentStock: Math.max(0, p.currentStock - sold) } : p
    })
    recordSale(sale, products)
    return sale
  },

  refundSale(saleId: string, lines: { saleItemId: string; quantity: number }[], method: PaymentMethod, reason?: string): Sale {
    const sale = state.sales.find((s) => s.id === saleId)
    if (!sale) throw new Error('Sale not found')
    const wanted = lines.filter((l) => l.quantity > 0)
    if (!wanted.length) throw new Error('Nothing to refund')
    const refundLines = wanted.map((l) => {
      const it = sale.items.find((i) => i.id === l.saleItemId)
      if (!it || l.quantity > it.quantity - it.refundedQty) throw new Error('Refund is more than was sold')
      return { saleItemId: it.id, quantity: l.quantity, amount: refundLineAmount(it, l.quantity) }
    })
    const shift = state.shifts.find((s) => s.status === 'open')
    const refund: Refund = {
      id: newId(), lines: refundLines, amount: refundLines.reduce((s, l) => s + l.amount, 0), method, reason,
      operator: shift?.operator ?? sale.operator, createdAt: now(),
    }
    const items = sale.items.map((i) => {
      const r = refundLines.find((l) => l.saleItemId === i.id)
      return r ? { ...i, refundedQty: i.refundedQty + r.quantity } : i
    })
    const all = items.every((i) => i.refundedQty === i.quantity)
    const updated: Sale = { ...sale, items, refunds: [...sale.refunds, refund], status: all ? 'refunded' : 'partially_refunded' }
    const products = state.products.map((p) => {
      const back = refundLines.reduce((s, l) => s + (sale.items.find((i) => i.id === l.saleItemId)!.productId === p.id ? l.quantity : 0), 0)
      return back && p.trackStock ? { ...p, currentStock: p.currentStock + back } : p
    })
    set({
      sales: state.sales.map((s) => (s.id === saleId ? updated : s)),
      products,
      shifts: shift ? addToShift(state.shifts, shift.id, method, refund.amount, 'refundTotals') : state.shifts,
    })
    return updated
  },

  holdSale(draft: SaleDraft, label: string, total: number): HeldSale {
    const h = { ...draft, id: newId(), label, total, createdAt: now() }
    set({ heldSales: [...state.heldSales, h] })
    return h
  },
  removeHeldSale(id: string) {
    set({ heldSales: state.heldSales.filter((h) => h.id !== id) })
  },

  // ── Shifts ──
  openShift(operator: string, openingFloat: number): Shift {
    if (state.shifts.some((s) => s.status === 'open')) throw new Error('A shift is already open')
    const s: Shift = { id: newId(), operator, openingFloat, openedAt: now(), status: 'open', tenderTotals: zero(), refundTotals: zero(), cashMovements: [] }
    set({ shifts: [s, ...state.shifts] })
    return s
  },
  closeShift(countedCash: number): Shift {
    const s = openShiftOrThrow()
    const expected = expectedCash(s)
    const closed: Shift = { ...s, status: 'closed', closedAt: now(), expectedCash: expected, countedCash, cashVariance: countedCash - expected }
    set({ shifts: state.shifts.map((x) => (x.id === s.id ? closed : x)) })
    return closed
  },
  addCashMovement(type: 'pay_in' | 'pay_out', amount: number, reason: string) {
    const s = openShiftOrThrow()
    const m = { id: newId(), type, amount, reason, createdAt: now() }
    set({ shifts: state.shifts.map((x) => (x.id === s.id ? { ...x, cashMovements: [...x.cashMovements, m] } : x)) })
  },

  // ── Orders ──
  createOrder(input: NewOrderInput): Order {
    const shift = openShiftOrThrow()
    const table = input.tableId ? state.tables.find((t) => t.id === input.tableId) : undefined
    const order: Order = {
      ...input, id: newId(), tableLabel: table?.label, status: 'open', items: [], subtotal: 0, gstAmount: 0, total: 0,
      shiftId: shift.id, operator: shift.operator, openedAt: now(),
    }
    set({
      orders: [...state.orders, order],
      tables: table ? state.tables.map((t) => (t.id === table.id ? { ...t, status: 'order_open', currentOrderId: order.id, statusChangedAt: now() } : t)) : state.tables,
    })
    return order
  },
  updateOrderItems(orderId: string, items: OrderItemInput[]) {
    const o = orderOrThrow(orderId)
    const full: OrderItem[] = items.map((i) => ({ ...i, id: i.id ?? newId(), status: i.status ?? 'active' }))
    replaceOrder(withTotals({ ...o, items: full }))
  },
  setOrderItemStatus(orderId: string, itemId: string, status: OrderItemStatus, reason?: string) {
    const o = orderOrThrow(orderId)
    const items = o.items.map((i) => (i.id === itemId ? { ...i, status, voidCompReason: reason } : i))
    replaceOrder(withTotals({ ...o, items }))
  },
  setOrderStatus(orderId: string, status: OrderStatus) {
    const o = orderOrThrow(orderId)
    const done = status === 'paid' || status === 'voided'
    const order = { ...o, status, ...(status === 'sent' ? { sentAt: now() } : {}), ...(done ? { closedAt: now() } : {}) }
    const ts = tableStatusFor[status]
    set({
      orders: state.orders.map((x) => (x.id === orderId ? order : x)),
      tables: o.tableId && ts ? state.tables.map((t) => (t.id === o.tableId ? { ...t, status: ts, statusChangedAt: now(), currentOrderId: done ? undefined : t.currentOrderId } : t)) : state.tables,
    })
  },
  mergeOrders(sourceId: string, targetId: string) {
    const src = orderOrThrow(sourceId)
    const dst = orderOrThrow(targetId)
    const merged = withTotals({ ...dst, items: [...dst.items, ...src.items] })
    set({
      orders: state.orders.filter((o) => o.id !== sourceId).map((o) => (o.id === targetId ? merged : o)),
      tables: state.tables.map((t) => (t.id === src.tableId ? { ...t, status: 'free', currentOrderId: undefined, statusChangedAt: now() } : t)),
    })
  },
  payOrder(orderId: string, payments: PaymentInput[]): Sale {
    const o = orderOrThrow(orderId)
    const lines = o.items.filter((i) => i.status === 'active').map((i) => {
      const p = state.products.find((x) => x.id === i.productId)
      return {
        product: { id: i.productId, name: i.name, gstApplicable: p?.gstApplicable ?? true },
        unitPrice: orderLineAmount(i) / i.qty, quantity: i.qty, lineDiscount: 0,
      }
    })
    const sale = buildSale(lines, 0, payments, { orderId: o.id, notes: o.notes })
    recordSale(sale)
    actions.setOrderStatus(orderId, 'paid')
    return sale
  },

  // ── Tables ──
  addTable(label: string, seats: number): Table {
    const t: Table = { id: newId(), label, seats, status: 'free', statusChangedAt: now() }
    set({ tables: [...state.tables, t] })
    return t
  },
  updateTable(id: string, patch: Partial<Pick<Table, 'label' | 'seats'>>) {
    set({ tables: state.tables.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  },
  /** Makes the table count n: adds T7, T8… or removes free tables, highest number first. Busy tables stay. */
  setTableCount(n: number) {
    let tables = [...state.tables]
    const num = (t: Table) => Number(/\d+/.exec(t.label)?.[0] ?? 0)
    let next = Math.max(0, ...tables.map(num)) + 1
    while (tables.length < n) tables.push({ id: newId(), label: `T${next++}`, seats: 4, status: 'free', statusChangedAt: now() })
    const free = tables.filter((t) => !t.currentOrderId).sort((a, b) => num(b) - num(a))
    while (tables.length > n && free.length) { const drop = free.shift()!; tables = tables.filter((t) => t !== drop) }
    set({ tables })
  },
  deleteTable(id: string) {
    const t = state.tables.find((x) => x.id === id)
    if (t?.currentOrderId) throw new Error('This table has an open order')
    set({ tables: state.tables.filter((x) => x.id !== id) })
  },
}

export type Actions = typeof actions
