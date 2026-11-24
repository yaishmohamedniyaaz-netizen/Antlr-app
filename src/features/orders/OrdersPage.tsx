import { useState } from 'react'
import { useOrders, useSettings } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { OrderBuilder } from './OrderBuilder'
import { FilterTabs, OrderList } from './OrderList'
import { isActiveOrder } from './labels'

type Filter = 'all' | 'dine_in' | 'takeaway'

export function OrdersPage() {
  const orders = useOrders().filter(isActiveOrder)
  const settings = useSettings()
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState<string | null>(null)
  if (open) return <OrderBuilder orderId={open} onClose={() => setOpen(null)} />
  const shown = orders.filter((o) => filter === 'all' || o.type === filter).sort((a, b) => a.openedAt.localeCompare(b.openedAt))
  const count = (t: Filter) => orders.filter((o) => t === 'all' || o.type === t).length
  return (
    <>
      <PageHeader title="Orders" />
      <FilterTabs value={filter} onChange={setFilter} tabs={[
        { value: 'all', label: 'All', count: count('all') },
        { value: 'dine_in', label: 'Dine-in', count: count('dine_in') },
        { value: 'takeaway', label: 'Takeaway', count: count('takeaway') },
      ]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <OrderList orders={shown} onOpen={setOpen} showViber={settings.viberEnabled} />
      </div>
    </>
  )
}
