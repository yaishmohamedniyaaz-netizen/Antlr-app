import type { Laari } from '@/lib/money'

export type { Laari }

export type BusinessType = 'retail' | 'restaurant' | 'takeaway' | 'restaurant_takeaway'
export type PaymentMethod = 'qr' | 'card' | 'transfer' | 'cash'
export type TenderTotals = Record<PaymentMethod, Laari>

export interface Category {
  id: string
  name: string
  sortOrder: number
}

export type ModifierPrefix = 'no' | 'extra' | 'light' | 'side'

export interface ModifierOption {
  id: string
  name: string
  prefix: ModifierPrefix
  upcharge: Laari
}

export interface Product {
  id: string
  name: string
  categoryId: string
  price: Laari
  costPrice?: Laari
  imageUrl?: string
  barcode?: string
  trackStock: boolean
  currentStock: number
  lowStockThreshold: number
  gstApplicable: boolean
  isHidden: boolean
  modifiers?: ModifierOption[]
  createdAt: string
  updatedAt: string
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>

export interface PaymentInput {
  method: PaymentMethod
  amount: Laari
  reference?: string
  amountReceived?: Laari
}

export interface Payment extends PaymentInput {
  id: string
  changeGiven?: Laari
  createdAt: string
}

/** What the cart hands over when a sale is completed or held. */
export interface SaleDraft {
  lines: { productId: string; quantity: number; lineDiscount: Laari }[]
  cartDiscount: Laari
}

export interface SaleItem {
  id: string
  productId: string
  productName: string
  unitPrice: Laari
  quantity: number
  lineDiscount: Laari
  /** unitPrice × quantity − lineDiscount */
  lineTotal: Laari
  gstAmount: Laari
  /** What the customer actually paid for this line, after the cart discount (and GST if added on top). */
  paidTotal: Laari
  refundedQty: number
}

export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded'

export interface RefundLine {
  saleItemId: string
  quantity: number
  amount: Laari
}

export interface Refund {
  id: string
  lines: RefundLine[]
  amount: Laari
  method: PaymentMethod
  reason?: string
  operator: string
  createdAt: string
}

export interface Sale {
  id: string
  saleNumber: string
  shiftId: string
  operator: string
  items: SaleItem[]
  /** Sum of line totals (after line discounts). */
  subtotal: Laari
  /** Line discounts + cart discount. */
  discountTotal: Laari
  gstAmount: Laari
  total: Laari
  payments: Payment[]
  status: SaleStatus
  refunds: Refund[]
  orderId?: string
  notes?: string
  createdAt: string
}

export interface HeldSale extends SaleDraft {
  id: string
  label: string
  total: Laari
  createdAt: string
}

export interface CashMovement {
  id: string
  type: 'pay_in' | 'pay_out'
  amount: Laari
  reason: string
  createdAt: string
}

export interface Shift {
  id: string
  operator: string
  openingFloat: Laari
  openedAt: string
  closedAt?: string
  status: 'open' | 'closed'
  tenderTotals: TenderTotals
  refundTotals: TenderTotals
  cashMovements: CashMovement[]
  expectedCash?: Laari
  countedCash?: Laari
  cashVariance?: Laari
}

export type OrderType = 'dine_in' | 'takeaway'
export type OrderStatus = 'open' | 'sent' | 'served' | 'awaiting_payment' | 'paid' | 'voided'
export type OrderItemStatus = 'active' | 'void' | 'comp'
export type TakeawaySource = 'walkin' | 'phone' | 'viber'

export interface OrderItemModifier {
  label: string
  prefix?: ModifierPrefix
  upcharge: Laari
}

export interface OrderItem {
  id: string
  productId: string
  name: string
  unitPrice: Laari
  qty: number
  note?: string
  modifiers: OrderItemModifier[]
  status: OrderItemStatus
  voidCompReason?: string
}

export type OrderItemInput = Omit<OrderItem, 'id' | 'status' | 'voidCompReason'> & Partial<Pick<OrderItem, 'id' | 'status' | 'voidCompReason'>>

export interface Order {
  id: string
  type: OrderType
  tableId?: string
  tableLabel?: string
  customerName?: string
  customerNumber?: string
  source?: TakeawaySource
  status: OrderStatus
  items: OrderItem[]
  subtotal: Laari
  gstAmount: Laari
  total: Laari
  peopleCount?: number
  notes?: string
  shiftId: string
  operator: string
  openedAt: string
  sentAt?: string
  closedAt?: string
}

export interface NewOrderInput {
  type: OrderType
  tableId?: string
  customerName?: string
  customerNumber?: string
  source?: TakeawaySource
  peopleCount?: number
}

export type TableStatus = 'free' | 'order_open' | 'sent' | 'served' | 'awaiting_payment'

export interface Table {
  id: string
  label: string
  seats: number
  status: TableStatus
  currentOrderId?: string
  statusChangedAt: string
}

export interface ShopSettings {
  shopName: string
  address: string
  phone: string
  tin: string
  gstRateBps: number
  pricesIncludeGst: boolean
  receiptHeader: string
  receiptFooter: string
  showLogoOnReceipt: boolean
  autoPrintReceipt: boolean
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  staticQrUrl?: string
  enabledTenders: PaymentMethod[]
  tenderOrder: PaymentMethod[]
  businessType: BusinessType
  modifiersEnabled: boolean
  viberEnabled: boolean
  guidedSetupDone: boolean
}

export interface AppState {
  settings: ShopSettings
  categories: Category[]
  products: Product[]
  sales: Sale[]
  heldSales: HeldSale[]
  shifts: Shift[]
  orders: Order[]
  tables: Table[]
}
