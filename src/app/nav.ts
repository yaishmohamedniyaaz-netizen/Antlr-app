import type { LucideIcon } from 'lucide-react'
import { BarChart3, ClipboardList, History, LayoutGrid, Package, Settings, ShoppingBag, Store, Timer } from 'lucide-react'
import type { BusinessType } from '@/types'

export interface NavItem { path: string; label: string; icon: LucideIcon }

export function navItemsFor(t: BusinessType): NavItem[] {
  const restaurant = t === 'restaurant' || t === 'restaurant_takeaway'
  const takeaway = t === 'takeaway' || t === 'restaurant_takeaway'
  const retail = t === 'retail'
  const items: (NavItem & { show: boolean })[] = [
    { path: '/floor', label: 'Floor', icon: LayoutGrid, show: restaurant },
    { path: '/orders', label: 'Orders', icon: ClipboardList, show: restaurant || takeaway },
    { path: '/takeaway', label: 'Takeaway', icon: ShoppingBag, show: takeaway },
    { path: '/sales', label: 'Sales', icon: Store, show: retail || restaurant },
    { path: '/products', label: 'Products', icon: Package, show: true },
    { path: '/history', label: 'History', icon: History, show: true },
    { path: '/shifts', label: 'Shifts', icon: Timer, show: true },
    { path: '/reports', label: 'Reports', icon: BarChart3, show: true },
    { path: '/settings', label: 'Settings', icon: Settings, show: true },
  ]
  return items.filter((i) => i.show).map(({ show: _show, ...i }) => i)
}

export function defaultPathFor(t: BusinessType): string {
  if (t === 'retail') return '/sales'
  if (t === 'takeaway') return '/takeaway'
  return '/floor'
}
