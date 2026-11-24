import { useSyncExternalStore } from 'react'
import type { AppState } from '@/types'
import { actions, getState, subscribe, type Actions } from './store'
import { getDemoNetwork, overNetwork, setDemoNetwork, subscribeDemoNetwork } from './network'

/** Read any part of the app data. Re-renders when that part changes. */
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getState()))
}

export const useSettings = () => useAppState((s) => s.settings)
export const useCategories = () => useAppState((s) => s.categories)
export const useProducts = () => useAppState((s) => s.products)
export const useSales = () => useAppState((s) => s.sales)
export const useHeldSales = () => useAppState((s) => s.heldSales)
export const useShifts = () => useAppState((s) => s.shifts)
export const useOpenShift = () => useAppState((s) => s.shifts.find((x) => x.status === 'open') ?? null)
export const useOrders = () => useAppState((s) => s.orders)
export const useTables = () => useAppState((s) => s.tables)

export type AsyncActions = { [K in keyof Actions]: (...args: Parameters<Actions[K]>) => Promise<ReturnType<Actions[K]>> }

const asyncActions = Object.fromEntries(
  Object.entries(actions).map(([name, fn]) => [name, overNetwork(fn as (...a: unknown[]) => unknown)]),
) as AsyncActions

/** All actions that change data. Each returns a Promise: wait for it, and show an error if it rejects. */
export const useActions = (): AsyncActions => asyncActions

/** Demo-only switch to make saves fail (Settings > Data). */
export function useDemoNetwork() {
  const net = useSyncExternalStore(subscribeDemoNetwork, getDemoNetwork)
  return [net, setDemoNetwork] as const
}
