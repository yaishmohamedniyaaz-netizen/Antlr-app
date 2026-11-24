import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search } from 'lucide-react'
import type { PaymentMethod, Sale, SaleStatus } from '@/types'
import { useSales } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Money } from '@/components/Money'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ReceiptDialog } from '@/features/checkout/ReceiptDialog'
import { tenderLabel } from '@/features/checkout/payment'
import { FilterTabs } from '@/features/orders/OrderList'
import { downloadText } from '@/lib/csv'
import { formatDate, formatDateTime, formatTime } from '@/lib/format'
import { formatMvr } from '@/lib/money'
import { cn } from '@/lib/utils'
import { RefundDialog } from './RefundDialog'
import { salesToCsv } from './historyCsv'
import { saleStatusLabel } from './labels'

type Range = 'today' | '7d' | '30d' | 'custom'

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function rangeBounds(range: Range, from: string, to: string): [Date, Date] {
  const now = new Date()
  const end = new Date(startOfDay(now).getTime() + 86_400_000)
  if (range === 'today') return [startOfDay(now), end]
  if (range === '7d') return [new Date(end.getTime() - 7 * 86_400_000), end]
  if (range === '30d') return [new Date(end.getTime() - 30 * 86_400_000), end]
  const f = from ? new Date(`${from}T00:00:00`) : new Date(0)
  const t = to ? new Date(new Date(`${to}T00:00:00`).getTime() + 86_400_000) : end
  return [f, t]
}

export function HistoryPage() {
  const sales = useSales()
  const [range, setRange] = useState<Range>('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<'all' | SaleStatus>('all')
  const [tender, setTender] = useState<'all' | PaymentMethod>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [refunding, setRefunding] = useState<Sale | null>(null)
  const [reprint, setReprint] = useState<Sale | null>(null)

  const shown = useMemo(() => {
    const [f, t] = rangeBounds(range, from, to)
    const q = query.trim().toLowerCase()
    return sales.filter((s) => {
      const d = new Date(s.createdAt)
      return d >= f && d < t
        && (status === 'all' || s.status === status)
        && (tender === 'all' || s.payments.some((p) => p.method === tender))
        && (!q || s.saleNumber.toLowerCase().includes(q))
    })
  }, [sales, range, from, to, status, tender, query])

  const net = shown.reduce((a, s) => a + s.total - s.refunds.reduce((r, x) => r + x.amount, 0), 0)

  return (
    <>
      <PageHeader title="History" actions={<Button onClick={() => downloadText('antlr-sales.csv', salesToCsv(shown))} disabled={!shown.length}>Export CSV</Button>}>
        <span className="text-sm text-muted-foreground">{shown.length} sales · {formatMvr(net)} after refunds</span>
      </PageHeader>
      <FilterTabs value={range} onChange={setRange} tabs={[
        { value: 'today', label: 'Today' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: 'custom', label: 'Pick dates' },
      ]} />
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-6 py-3">
        <div className="flex h-9 w-60 items-center gap-2 rounded-md border px-3">
          <Search className="size-4 text-muted-foreground" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Sale number" className="h-full flex-1 bg-transparent text-sm outline-none" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger aria-label="Status" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {(Object.keys(saleStatusLabel) as SaleStatus[]).map((s) => <SelectItem key={s} value={s}>{saleStatusLabel[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tender} onValueChange={(v) => setTender(v as typeof tender)}>
          <SelectTrigger aria-label="Paid by" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any payment</SelectItem>
            {(['cash', 'card', 'qr', 'transfer'] as PaymentMethod[]).map((m) => <SelectItem key={m} value={m}>{tenderLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        {range === 'custom' && (
          <div className="flex items-center gap-2 text-sm">
            <Input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
            <span className="text-muted-foreground">to</span>
            <Input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 ? <EmptyState title="No sales in this period" body="Try a longer date range or clear the filters." /> : (
          <div role="list">
            <div className="grid grid-cols-[28px_150px_1fr_80px_150px_120px_110px] gap-4 border-b px-6 py-2 text-xs font-medium text-muted-foreground">
              <span /><span>Time</span><span>Sale number</span><span className="text-right">Items</span><span>Paid by</span><span>Status</span><span className="text-right">Total</span>
            </div>
            {shown.map((s) => {
              const open = openId === s.id
              const items = s.items.reduce((a, i) => a + i.quantity, 0)
              const sameDay = formatDate(s.createdAt) === formatDate(new Date().toISOString())
              return (
                <div role="listitem" key={s.id}>
                  <button type="button" aria-expanded={open} aria-label={`${s.saleNumber}, ${formatMvr(s.total)}`} onClick={() => setOpenId(open ? null : s.id)}
                    className={cn('grid w-full grid-cols-[28px_150px_1fr_80px_150px_120px_110px] items-center gap-4 border-b px-6 py-3 text-left text-sm hover:bg-muted/50', open && 'bg-muted/50')}>
                    {open ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                    <span className="text-muted-foreground tabular-nums">{sameDay ? formatTime(s.createdAt) : formatDateTime(s.createdAt)}</span>
                    <span className="font-medium tabular-nums">{s.saleNumber}</span>
                    <span className="text-right tabular-nums">{items}</span>
                    <span className="text-muted-foreground">{s.payments.map((p) => tenderLabel(p.method)).join(' + ')}</span>
                    <span className={cn(s.status !== 'completed' && 'text-warning')}>{saleStatusLabel[s.status]}</span>
                    <Money value={s.total} className="text-right font-medium" />
                  </button>
                  {open && <SaleDetails sale={s} onRefund={() => setRefunding(s)} onReprint={() => setReprint(s)} />}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <RefundDialog sale={refunding} open={refunding !== null} onOpenChange={(o) => { if (!o) setRefunding(null) }} />
      <ReceiptDialog sale={reprint} open={reprint !== null} onOpenChange={(o) => { if (!o) setReprint(null) }} />
    </>
  )
}

function SaleDetails({ sale, onRefund, onReprint }: { sale: Sale; onRefund: () => void; onReprint: () => void }) {
  const canRefund = sale.items.some((i) => i.refundedQty < i.quantity)
  return (
    <section aria-label={`Sale ${sale.saleNumber}`} className="grid grid-cols-[1fr_280px] gap-8 border-b bg-muted/30 px-6 py-4 pl-[68px] text-sm">
      <div className="space-y-1">
        {sale.items.map((i) => (
          <div key={i.id} className="flex justify-between gap-4">
            <span>{i.quantity} × {i.productName}{i.refundedQty > 0 && <span className="text-muted-foreground"> · {i.refundedQty} refunded</span>}</span>
            <Money value={i.lineTotal} />
          </div>
        ))}
        {sale.refunds.map((r) => (
          <div key={r.id} className="flex justify-between gap-4 text-muted-foreground">
            <span>Refund by {tenderLabel(r.method)} · {formatDateTime(r.createdAt)}{r.reason ? ` · ${r.reason}` : ''}</span>
            <span className="tabular-nums">−{formatMvr(r.amount)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {sale.discountTotal > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="tabular-nums">−{formatMvr(sale.discountTotal)}</span></div>}
        <div className="flex justify-between text-muted-foreground"><span>GST</span><Money value={sale.gstAmount} /></div>
        {sale.payments.map((p) => (
          <div key={p.id} className="flex justify-between text-muted-foreground"><span>{tenderLabel(p.method)}{p.reference ? ` · ${p.reference}` : ''}</span><Money value={p.amount} /></div>
        ))}
        <div className="text-xs text-muted-foreground">By {sale.operator}</div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={onReprint}>Reprint receipt</Button>
          {canRefund && <Button size="sm" onClick={onRefund}>Refund</Button>}
        </div>
      </div>
    </section>
  )
}
