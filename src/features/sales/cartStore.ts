import { useSyncExternalStore } from 'react'
import { type CartAction, type CartState, cartReducer, emptyCart } from './cart'

/** The till's current sale. Kept outside the Sales screen so it is not lost when the cashier opens another screen. */
let cart: CartState = emptyCart
const listeners = new Set<() => void>()

export function dispatchCart(action: CartAction) {
  cart = cartReducer(cart, action)
  listeners.forEach((l) => l())
}

export function useCart(): [CartState, (a: CartAction) => void] {
  const state = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l) }, () => cart)
  return [state, dispatchCart]
}
