import type { AppState, Category, Order, OrderItem, Product, Sale, SaleItem, Shift, ShopSettings, Table } from '@/types'
import { computeTotals } from '@/lib/tax'
import { orderTotals } from '@/lib/orderMath'
import { localDateKey } from '@/lib/format'

const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString()
const minsAgo = (m: number) => iso(m * 60_000)
const hoursAgo = (h: number) => iso(h * 3_600_000)
const created = '2026-01-15T08:00:00.000Z'
/** Product photos live in public/images; BASE_URL keeps the path right when the app is not served from the site root. */
const img = (file: string) => `${import.meta.env.BASE_URL}images/${file}`

export const seedSettings = (): ShopSettings => ({
  shopName: 'Island Cafe',
  address: 'Malé, Maldives',
  phone: '+960 300 1234',
  tin: 'GST-000123',
  gstRateBps: 800,
  pricesIncludeGst: true,
  receiptHeader: 'Thank you for dining with us',
  receiptFooter: 'We appreciate your visit',
  showLogoOnReceipt: true,
  autoPrintReceipt: false,
  bankName: 'Bank of Maldives',
  bankAccountNumber: '7701-XXXXXX-001',
  bankAccountName: 'Island Cafe Pvt Ltd',
  enabledTenders: ['qr', 'card', 'transfer', 'cash'],
  tenderOrder: ['qr', 'card', 'transfer', 'cash'],
  businessType: 'restaurant_takeaway',
  modifiersEnabled: true,
  viberEnabled: true,
  guidedSetupDone: true,
})

const categories: Category[] = [
  { id: 'cat-1', name: 'Beverages', sortOrder: 1 },
  { id: 'cat-2', name: 'Snacks', sortOrder: 2 },
  { id: 'cat-3', name: 'Household', sortOrder: 3 },
  { id: 'cat-4', name: 'Personal care', sortOrder: 4 },
  { id: 'cat-r1', name: 'Short eats', sortOrder: 5 },
  { id: 'cat-r2', name: 'Mains', sortOrder: 6 },
  { id: 'cat-r3', name: 'Drinks', sortOrder: 7 },
]

type P = [id: string, name: string, cat: string, price: number, stock: number | null, extra?: Partial<Product>]
const productRows: P[] = [
  ['p1', 'Coca-Cola 330ml', 'cat-1', 1200, 24, { imageUrl: img('coca-cola.jpg'), barcode: '1234567890123', costPrice: 950 }],
  ['p2', 'Sprite 330ml', 'cat-1', 1200, 18, { barcode: '1234567890124' }],
  ['p3', 'Red Bull 250ml', 'cat-1', 2500, 8, { imageUrl: img('red-bull.jpg'), barcode: '1234567890125' }],
  ['p4', 'Nescafe 3-in-1', 'cat-1', 500, 45, { barcode: '1234567890126' }],
  ['p5', 'Aquafina Water 500ml', 'cat-1', 500, 30, { barcode: '1234567890127' }],
  ['p6', 'Lays Classic Chips', 'cat-2', 1500, 12, { imageUrl: img('lays-chips.jpg'), barcode: '1234567890128' }],
  ['p7', 'KitKat 2-Finger', 'cat-2', 800, 3, { imageUrl: img('kitkat.jpg'), barcode: '1234567890129' }],
  ['p8', 'Oreo Original', 'cat-2', 1000, 20, { barcode: '1234567890130' }],
  ['p9', 'Cup Noodles', 'cat-2', 1200, 0, { barcode: '1234567890131' }],
  ['p10', 'Vim Dish Soap 500ml', 'cat-3', 2200, 9, { imageUrl: img('vim-soap.jpg'), barcode: '1234567890132' }],
  ['p11', 'Tide Detergent 1kg', 'cat-3', 4500, 5, { barcode: '1234567890133' }],
  ['p12', 'Harpic Toilet Cleaner', 'cat-3', 3000, 11, { barcode: '1234567890134' }],
  ['p13', 'Colgate Toothpaste', 'cat-4', 1800, 15, { imageUrl: img('colgate.jpg'), barcode: '1234567890135' }],
  ['p14', 'Dove Soap Bar', 'cat-4', 1500, 22, { imageUrl: img('dove-soap.jpg'), barcode: '1234567890136' }],
  ['p15', 'Head & Shoulders 200ml', 'cat-4', 3500, 6, { barcode: '1234567890137' }],
  ['pr1', 'Mas Huni', 'cat-r1', 3500, null],
  ['pr2', 'Roshi', 'cat-r1', 500, null],
  ['pr3', 'Bis Keemiya', 'cat-r1', 1200, null],
  ['pr4', 'Gulha', 'cat-r1', 1000, null],
  ['pr5', 'Fish Curry Rice', 'cat-r2', 5500, null],
  ['pr6', 'Chicken Fried Rice', 'cat-r2', 6500, null],
  ['pr7', 'Beef Burger', 'cat-r2', 7500, null, { modifiers: [{ id: 'mod1', name: 'Onions', prefix: 'no', upcharge: 0 }, { id: 'mod2', name: 'Cheese', prefix: 'extra', upcharge: 500 }] }],
  ['pr8', 'Grilled Fish', 'cat-r2', 8500, null],
  ['pr9', 'Black Tea', 'cat-r3', 800, null, { modifiers: [{ id: 'mod3', name: 'Sugar', prefix: 'no', upcharge: 0 }, { id: 'mod4', name: 'Milk', prefix: 'extra', upcharge: 300 }] }],
  ['pr10', 'Coffee', 'cat-r3', 1200, null],
  ['pr11', 'Iced Lemon Tea', 'cat-r3', 1500, null],
  ['pr12', 'Fresh Juice', 'cat-r3', 2500, null],
]

const products = (): Product[] =>
  productRows.map(([id, name, categoryId, price, stock, extra]) => ({
    id, name, categoryId, price,
    trackStock: stock !== null,
    currentStock: stock ?? 0,
    lowStockThreshold: 5,
    gstApplicable: true,
    isHidden: false,
    createdAt: created,
    updatedAt: created,
    ...extra,
  }))

const zero = () => ({ qr: 0, card: 0, transfer: 0, cash: 0 })

function seedSale(n: number, at: string, lines: [string, number][], method: Sale['payments'][0]['method'], prods: Product[], settings: ShopSettings): Sale {
  const items = lines.map(([pid, qty], i) => {
    const p = prods.find((x) => x.id === pid)!
    return { p, qty, id: `s${n}-i${i}` }
  })
  const t = computeTotals(items.map(({ p, qty }) => ({ amount: p.price * qty, gstApplies: p.gstApplicable })), {
    rateBps: settings.gstRateBps, pricesIncludeGst: settings.pricesIncludeGst, cartDiscount: 0,
  })
  const saleItems: SaleItem[] = items.map(({ p, qty, id }, i) => ({
    id, productId: p.id, productName: p.name, unitPrice: p.price, quantity: qty, lineDiscount: 0,
    lineTotal: p.price * qty, gstAmount: t.lineGst[i],
    paidTotal: p.price * qty + (settings.pricesIncludeGst ? 0 : t.lineGst[i]), refundedQty: 0,
  }))
  return {
    id: `sale-${n}`,
    saleNumber: `ANTLR-${localDateKey(new Date(at))}-${String(n).padStart(3, '0')}`,
    shiftId: 'shift-1', operator: 'Ahmed', items: saleItems,
    subtotal: t.gross, discountTotal: 0, gstAmount: t.gst, total: t.total,
    payments: [{ id: `pay-${n}`, method, amount: t.total, createdAt: at }],
    status: 'completed', refunds: [], createdAt: at,
  }
}

function item(id: string, productId: string, qty: number, prods: Product[], modifiers: OrderItem['modifiers'] = []): OrderItem {
  const p = prods.find((x) => x.id === productId)!
  return { id, productId, name: p.name, unitPrice: p.price, qty, modifiers, status: 'active' }
}

export function seedState(): AppState {
  const settings = seedSettings()
  const prods = products()
  const sales = [
    seedSale(3, hoursAgo(4), [['p11', 1], ['p13', 1]], 'card', prods, settings),
    seedSale(2, hoursAgo(5), [['p3', 1]], 'qr', prods, settings),
    seedSale(1, hoursAgo(6), [['p4', 2], ['p10', 1], ['p1', 1]], 'cash', prods, settings),
  ]
  const tenderTotals = zero()
  for (const s of sales) for (const p of s.payments) tenderTotals[p.method] += p.amount
  const shift: Shift = {
    id: 'shift-1', operator: 'Ahmed', openingFloat: 50000, openedAt: hoursAgo(8), status: 'open',
    tenderTotals, refundTotals: zero(), cashMovements: [],
  }
  const tables: Table[] = [
    { id: 't1', label: 'T1', seats: 2, status: 'free', statusChangedAt: hoursAgo(2) },
    { id: 't2', label: 'T2', seats: 4, status: 'sent', currentOrderId: 'ord-2', statusChangedAt: minsAgo(15) },
    { id: 't3', label: 'T3', seats: 2, status: 'order_open', currentOrderId: 'ord-3', statusChangedAt: minsAgo(5) },
    { id: 't4', label: 'T4', seats: 4, status: 'free', statusChangedAt: hoursAgo(1) },
    { id: 't5', label: 'T5', seats: 6, status: 'served', currentOrderId: 'ord-5', statusChangedAt: minsAgo(25) },
    { id: 't6', label: 'T6', seats: 2, status: 'awaiting_payment', currentOrderId: 'ord-6', statusChangedAt: minsAgo(40) },
  ]
  const base = { shiftId: 'shift-1', operator: 'Ahmed', subtotal: 0, gstAmount: 0, total: 0 }
  const rawOrders: Order[] = [
    { ...base, id: 'ord-1', type: 'takeaway', customerName: 'Amin', customerNumber: '+960 991 2345', source: 'viber', status: 'open', openedAt: minsAgo(10), peopleCount: 1,
      items: [item('oi1', 'pr9', 2, prods, [{ label: 'Sugar', prefix: 'no', upcharge: 0 }]), item('oi2', 'pr2', 2, prods), item('oi3', 'pr1', 1, prods)] },
    { ...base, id: 'ord-2', type: 'dine_in', tableId: 't2', tableLabel: 'T2', status: 'sent', openedAt: minsAgo(25), sentAt: minsAgo(15), peopleCount: 2,
      items: [item('oi4', 'pr7', 2, prods, [{ label: 'Cheese', prefix: 'extra', upcharge: 500 }]), item('oi5', 'pr10', 2, prods)] },
    { ...base, id: 'ord-3', type: 'dine_in', tableId: 't3', tableLabel: 'T3', status: 'open', openedAt: minsAgo(8), peopleCount: 1,
      items: [item('oi6', 'pr5', 1, prods), item('oi7', 'pr11', 1, prods)] },
    { ...base, id: 'ord-5', type: 'dine_in', tableId: 't5', tableLabel: 'T5', status: 'served', openedAt: hoursAgo(1), sentAt: minsAgo(35), peopleCount: 4,
      items: [item('oi8', 'pr6', 3, prods), item('oi9', 'pr12', 2, prods), item('oi10', 'pr4', 6, prods)] },
    { ...base, id: 'ord-6', type: 'dine_in', tableId: 't6', tableLabel: 'T6', status: 'awaiting_payment', openedAt: hoursAgo(1.5), sentAt: minsAgo(45), peopleCount: 2,
      items: [item('oi11', 'pr8', 1, prods), item('oi12', 'pr9', 2, prods, [{ label: 'Sugar', prefix: 'no', upcharge: 0 }])] },
  ]
  const gst = (pid: string) => prods.find((p) => p.id === pid)?.gstApplicable ?? true
  const orders = rawOrders.map((o) => ({ ...o, ...orderTotals(o.items, gst, { rateBps: settings.gstRateBps, pricesIncludeGst: settings.pricesIncludeGst }) }))
  return { settings, categories, products: prods, sales, heldSales: [], shifts: [shift], orders, tables }
}
