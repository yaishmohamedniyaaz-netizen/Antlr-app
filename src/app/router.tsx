import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { AppLayout } from './AppLayout'
import { Home } from './Home'

/** Loads a screen only when it is first opened. */
function page(load: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(load)
  return <Suspense fallback={null}><Page /></Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'floor', element: page(() => import('@/features/orders/FloorPage').then((m) => ({ default: m.FloorPage }))) },
      { path: 'orders', element: page(() => import('@/features/orders/OrdersPage').then((m) => ({ default: m.OrdersPage }))) },
      { path: 'takeaway', element: page(() => import('@/features/orders/TakeawayPage').then((m) => ({ default: m.TakeawayPage }))) },
      { path: 'sales', element: page(() => import('@/features/sales/SalesPage').then((m) => ({ default: m.SalesPage }))) },
      { path: 'products', element: page(() => import('@/features/products/ProductsPage').then((m) => ({ default: m.ProductsPage }))) },
      { path: 'history', element: page(() => import('@/features/history/HistoryPage').then((m) => ({ default: m.HistoryPage }))) },
      { path: 'shifts', element: page(() => import('@/features/shifts/ShiftsPage').then((m) => ({ default: m.ShiftsPage }))) },
      { path: 'reports', element: page(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage }))) },
      { path: 'settings', element: page(() => import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))) },
      { path: '*', element: <Home /> },
    ],
  },
])
