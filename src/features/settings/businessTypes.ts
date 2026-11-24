import { Coffee, ShoppingBag, Store, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { BusinessType } from '@/types'

export type Step = 'welcome' | 'type' | 'tables' | 'options' | 'confirm'

export const BUSINESS_TYPES: { value: BusinessType; label: string; desc: string; icon: LucideIcon }[] = [
  { value: 'retail', label: 'Retail shop', desc: 'Sell products over the counter', icon: Store },
  { value: 'restaurant', label: 'Restaurant (dine-in)', desc: 'Tables and kitchen orders', icon: UtensilsCrossed },
  { value: 'takeaway', label: 'Takeaway', desc: 'Pick-up orders only', icon: ShoppingBag },
  { value: 'restaurant_takeaway', label: 'Restaurant and takeaway', desc: 'Tables and pick-up orders', icon: Coffee },
]

export const hasTables = (t: BusinessType) => t === 'restaurant' || t === 'restaurant_takeaway'
export const hasTakeaway = (t: BusinessType) => t === 'takeaway' || t === 'restaurant_takeaway'

export function stepsFor(t: BusinessType): Step[] {
  return ['welcome', 'type', ...(hasTables(t) ? ['tables' as const] : []), ...(t !== 'retail' ? ['options' as const] : []), 'confirm']
}

