import { useMemo, useState } from 'react'
import type { PaymentMethod } from '@/types'
import { useSales } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/Money'
import { FilterTabs } from '@/features/orders/OrderList'
import { tenderLabel } from '@/features/checkout/payment'
import { downloadText, toCsv } from '@/lib/csv'
import { formatAmount, formatMvr } from '@/lib/money'
import { salesSummary, type SalesSummary } from './summary'

type Range = 'today' | '7d' | '30d'
const DAYS: Record<Range, number> = { today: 1, '7d': 7, '30d': 30 }

function bounds(r: Range): [Date, Date] {
  const end = new Date(); end.setHours(24, 0, 0, 0)
  return [new Date(end.getTime() - DAYS[r] * 86_400_000), end]
}

const plain = (l: number) => formatAmount(l).replace(/,/g, '')

function summaryCsv(s: SalesSummary) {
  return toCsv([
    ['Measure', 'Value'], ['Revenue', plain(s.revenue)], ['Refunds', plain(s.refunds)], ['Sales', String(s.count)],
    ['Average sale', plain(s.average)], ['Items sold', String(s.itemsSold)],
    ...(Object.entries(s.byTender) as [PaymentMethod, number][]).map(([m, v]) => [`Paid by ${tenderLabel(m)}`, plain(v)]),
    [], ['Product', 'Quantity', 'Revenue'], ...s.topProducts.map((p) => [p.name, String(p.qty), plain(p.revenue)]),
  ])
}

export function ReportsPage() {
  const sales = useSales()
  const [range, setRange] = useState<Range>('today')
  const s = useMemo(() => salesSummary(sales, ...bounds(range)), [sales, range])
  const tenders = (Object.entries(s.byTender) as [PaymentMethod, number][]).sort((a, b) => b[1] - a[1])
  const maxTender = Math.max(1, ...tenders.map(([, v]) => v))
  const hours = s.byHour.slice(6, 24)
  const maxHour = Math.max(1, ...hours.map((h) => h.revenue))

  return (
    <>
      <PageHeader title="Reports" actions={<Button onClick={() => downloadText(`antlr-report-${range}.csv`, summaryCsv(s))}>Export CSV</Button>} />
      <FilterTabs value={range} onChange={setRange} tabs={[{ value: 'today', label: 'Today' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }]} />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            ['Revenue', <Money key="r" value={s.revenue} />],
            ['Sales', s.count],
            ['Average sale', <Money key="a" value={s.average} />],
            ['Items sold', s.itemsSold],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-md bg-muted/60 p-4">
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
        {s.refunds > 0 && <p className="text-sm text-muted-foreground">Revenue is after {formatMvr(s.refunds)} in refunds.</p>}

        <div className="grid grid-cols-[1fr_360px] gap-6">
          <section className="rounded-md border p-5">
            <h2 className="text-sm font-semibold">Revenue by hour</h2>
            <svg viewBox={`0 0 ${hours.length * 32} 180`} className="mt-4 h-48 w-full" role="img" aria-label="Revenue by hour of the day">
              {hours.map((h, i) => {
                const bh = Math.round((h.revenue / maxHour) * 140)
                return (
                  <g key={h.hour}>
                    <title>{`${h.hour}:00 · ${formatMvr(h.revenue)}`}</title>
                    <rect x={i * 32 + 6} y={150 - bh} width={20} height={Math.max(bh, h.revenue ? 2 : 0)} rx={2} className="fill-foreground/80" />
                    <line x1={i * 32} x2={i * 32 + 32} y1={150.5} y2={150.5} className="stroke-border" />
                    {i % 2 === 0 && <text x={i * 32 + 16} y={170} textAnchor="middle" className="fill-muted-foreground text-[10px]">{h.hour}</text>}
                  </g>
                )
              })}
            </svg>
          </section>
          <section className="rounded-md border p-5">
            <h2 className="text-sm font-semibold">Paid by</h2>
            <ul className="mt-4 space-y-3">
              {tenders.map(([m, v]) => (
                <li key={m} className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>{tenderLabel(m)}</span><Money value={v} /></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-foreground/80" style={{ width: `${Math.max(0, (v / maxTender) * 100)}%` }} /></div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-md border">
          <h2 className="border-b px-5 py-3 text-sm font-semibold">Top products</h2>
          {s.topProducts.length === 0 ? <p className="px-5 py-6 text-sm text-muted-foreground">No sales in this period.</p> : (
            <ol className="divide-y">
              {s.topProducts.map((p, i) => (
                <li key={p.productId} className="grid grid-cols-[32px_1fr_80px_120px] items-center px-5 py-2.5 text-sm">
                  <span className="text-muted-foreground tabular-nums">{i + 1}</span>
                  <span>{p.name}</span>
                  <span className="text-right text-muted-foreground tabular-nums">{p.qty} sold</span>
                  <Money value={p.revenue} className="text-right" />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}
