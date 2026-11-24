import type { Sale } from '@/types'
import { useSettings } from '@/data/hooks'
import { formatAmount } from '@/lib/money'
import { formatDateTime } from '@/lib/format'
import { formatRate } from '@/lib/tax'
import { tenderLabel } from './payment'
import { AntlrMark } from '@/brand/AntlrMark'

const Row = ({ l, r, strong }: { l: string; r: string; strong?: boolean }) => (
  <div className={`flex justify-between gap-3 ${strong ? 'font-bold' : ''}`}><span>{l}</span><span className="tabular-nums">{r}</span></div>
)
const Rule = () => <div className="my-2 border-t border-dashed border-black" />

/** 80 mm thermal receipt. Black only. */
export function Receipt({ sale }: { sale: Sale }) {
  const s = useSettings()
  const refunded = sale.refunds.reduce((a, r) => a + r.amount, 0)
  return (
    <div className="receipt w-[72mm] bg-white font-mono text-[12px] leading-snug text-black">
      <div className="text-center">
        <div className="text-[14px] font-bold uppercase">{s.shopName}</div>
        <div>{s.address}</div>
        <div>{s.phone}</div>
        <div>TIN {s.tin}</div>
        {s.receiptHeader && <div className="mt-1">{s.receiptHeader}</div>}
      </div>
      <Rule />
      <div>{sale.saleNumber}</div>
      <div>{formatDateTime(sale.createdAt)} · {sale.operator}</div>
      <Rule />
      {sale.items.map((i) => (
        <div key={i.id} className="mb-1">
          <div>{i.productName}</div>
          <Row l={`  ${i.quantity} x ${formatAmount(i.unitPrice)}`} r={formatAmount(i.unitPrice * i.quantity)} />
          {i.lineDiscount > 0 && <Row l="  Discount" r={`-${formatAmount(i.lineDiscount)}`} />}
        </div>
      ))}
      <Rule />
      <Row l="Subtotal" r={formatAmount(sale.subtotal)} />
      {sale.discountTotal - sale.items.reduce((a, i) => a + i.lineDiscount, 0) > 0 && (
        <Row l="Discount" r={`-${formatAmount(sale.discountTotal - sale.items.reduce((a, i) => a + i.lineDiscount, 0))}`} />
      )}
      {!s.pricesIncludeGst && <Row l={`GST ${formatRate(s.gstRateBps)}`} r={formatAmount(sale.gstAmount)} />}
      <Row l="TOTAL (MVR)" r={formatAmount(sale.total)} strong />
      {s.pricesIncludeGst && <Row l={`Includes GST ${formatRate(s.gstRateBps)}`} r={formatAmount(sale.gstAmount)} />}
      <Rule />
      {sale.payments.map((p) => (
        <div key={p.id}>
          <Row l={tenderLabel(p.method)} r={formatAmount(p.amountReceived ?? p.amount)} />
          {p.changeGiven !== undefined && p.changeGiven > 0 && <Row l="Change" r={formatAmount(p.changeGiven)} />}
        </div>
      ))}
      {refunded > 0 && <Row l="Refunded" r={`-${formatAmount(refunded)}`} />}
      <Rule />
      {s.receiptFooter && <div className="text-center">{s.receiptFooter}</div>}
      {s.showLogoOnReceipt && (
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px]"><AntlrMark size={10} /> Antlr</div>
      )}
    </div>
  )
}
