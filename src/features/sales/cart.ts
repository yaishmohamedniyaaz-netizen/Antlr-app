import type { Laari, Product, SaleDraft, ShopSettings } from '@/types'
import { computeTotals, type Totals } from '@/lib/tax'

export interface CartLine { product: Product; quantity: number; lineDiscount: Laari }
export interface CartState { lines: CartLine[]; cartDiscount: Laari }

export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'setQty'; productId: string; quantity: number }
  | { type: 'remove'; productId: string }
  | { type: 'setLineDiscount'; productId: string; amount: Laari }
  | { type: 'setCartDiscount'; amount: Laari }
  | { type: 'clear' }
  | { type: 'load'; draft: SaleDraft; products: Product[] }

export const emptyCart: CartState = { lines: [], cartDiscount: 0 }

const cap = (l: CartLine): CartLine => ({ ...l, lineDiscount: Math.min(Math.max(l.lineDiscount, 0), l.product.price * l.quantity) })

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const found = state.lines.find((l) => l.product.id === action.product.id)
      const lines = found
        ? state.lines.map((l) => (l === found ? { ...l, quantity: l.quantity + 1 } : l))
        : [...state.lines, { product: action.product, quantity: 1, lineDiscount: 0 }]
      return { ...state, lines }
    }
    case 'setQty':
      if (action.quantity <= 0) return cartReducer(state, { type: 'remove', productId: action.productId })
      return { ...state, lines: state.lines.map((l) => (l.product.id === action.productId ? cap({ ...l, quantity: action.quantity }) : l)) }
    case 'remove': {
      const lines = state.lines.filter((l) => l.product.id !== action.productId)
      return { lines, cartDiscount: lines.length ? state.cartDiscount : 0 }
    }
    case 'setLineDiscount':
      return { ...state, lines: state.lines.map((l) => (l.product.id === action.productId ? cap({ ...l, lineDiscount: action.amount }) : l)) }
    case 'setCartDiscount':
      return { ...state, cartDiscount: Math.max(0, action.amount) }
    case 'clear':
      return emptyCart
    case 'load':
      return {
        cartDiscount: action.draft.cartDiscount,
        lines: action.draft.lines.flatMap((d) => {
          const product = action.products.find((p) => p.id === d.productId)
          return product ? [{ product, quantity: d.quantity, lineDiscount: d.lineDiscount }] : []
        }),
      }
  }
}

export const lineAmount = (l: CartLine) => l.product.price * l.quantity - l.lineDiscount

export function cartTotals(state: CartState, settings: Pick<ShopSettings, 'gstRateBps' | 'pricesIncludeGst'>): Totals {
  return computeTotals(state.lines.map((l) => ({ amount: lineAmount(l), gstApplies: l.product.gstApplicable })), {
    rateBps: settings.gstRateBps, pricesIncludeGst: settings.pricesIncludeGst, cartDiscount: state.cartDiscount,
  })
}

export const toSaleDraft = (state: CartState): SaleDraft => ({
  lines: state.lines.map((l) => ({ productId: l.product.id, quantity: l.quantity, lineDiscount: l.lineDiscount })),
  cartDiscount: state.cartDiscount,
})
