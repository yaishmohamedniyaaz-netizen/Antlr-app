import { useState } from 'react'
import type { Shift } from '@/types'
import { useOpenShift, useShifts } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Money } from '@/components/Money'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatTime } from '@/lib/format'
import { formatMvr } from '@/lib/money'
import { expectedCash, payIns, payOuts } from '@/lib/shift'
import { cn } from '@/lib/utils'
import { OpenShiftDialog } from './OpenShiftDialog'
import { CloseShiftDialog } from './CloseShiftDialog'
import { CashMovementDialog } from './CashMovementDialog'

const Line = ({ label, value, strong }: { label: string; value: number; strong?: boolean }) => (
  <div className={cn('flex justify-between py-1.5 text-sm', strong ? 'border-t pt-3 font-semibold' : 'text-muted-foreground')}>
    <span>{label}</span><Money value={value} className={strong ? 'text-foreground' : ''} />
  </div>
)

export function ShiftsPage() {
  const shift = useOpenShift()
  const past = useShifts().filter((s) => s.status === 'closed')
  const [opening, setOpening] = useState(false)
  const [closing, setClosing] = useState(false)
  const [movement, setMovement] = useState<'pay_in' | 'pay_out' | null>(null)

  return (
    <>
      <PageHeader title="Shifts" actions={shift
        ? <><Button onClick={() => setMovement('pay_in')}>Pay in</Button><Button onClick={() => setMovement('pay_out')}>Pay out</Button><Button variant="primary" onClick={() => setClosing(true)}>Close shift</Button></>
        : <Button variant="primary" onClick={() => setOpening(true)}>Open shift</Button>} />
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
        {shift ? <Current shift={shift} /> : (
          <div className="rounded-md border"><EmptyState title="No open shift" body="Open a shift to start selling. You will count the cash in the drawer first." /></div>
        )}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Past shifts</h2>
          {past.length === 0 ? <p className="text-sm text-muted-foreground">No closed shifts yet.</p> : (
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="pl-4">Cashier</TableHead><TableHead>Opened</TableHead><TableHead>Closed</TableHead>
                  <TableHead className="text-right">Expected cash</TableHead><TableHead className="text-right">Counted</TableHead><TableHead className="pr-4 text-right">Variance</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {past.map((s: Shift) => (
                    <TableRow key={s.id}>
                      <TableCell className="pl-4 font-medium">{s.operator}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(s.openedAt)}</TableCell>
                      <TableCell className="text-muted-foreground">{s.closedAt ? formatDateTime(s.closedAt) : ''}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMvr(s.expectedCash ?? 0)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMvr(s.countedCash ?? 0)}</TableCell>
                      <TableCell className={cn('pr-4 text-right tabular-nums', (s.cashVariance ?? 0) !== 0 && 'text-destructive')}>{formatMvr(s.cashVariance ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
      <OpenShiftDialog open={opening} onOpenChange={setOpening} />
      {shift && <CloseShiftDialog key={shift.id + String(closing)} shift={shift} open={closing} onOpenChange={setClosing} />}
      <CashMovementDialog type={movement} onClose={() => setMovement(null)} />
    </>
  )
}

function Current({ shift }: { shift: Shift }) {
  const refunds = Object.values(shift.refundTotals).reduce((a, b) => a + b, 0)
  return (
    <section className="grid grid-cols-[minmax(0,420px)_1fr] gap-8">
      <div className="rounded-md border p-5">
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Current shift</h2>
          <p className="text-xs text-muted-foreground">{shift.operator} · since {formatTime(shift.openedAt)}</p>
        </div>
        <Line label="Opening float" value={shift.openingFloat} />
        <Line label="Cash sales" value={shift.tenderTotals.cash} />
        <Line label="Card" value={shift.tenderTotals.card} />
        <Line label="QR" value={shift.tenderTotals.qr} />
        <Line label="Bank transfer" value={shift.tenderTotals.transfer} />
        <Line label="Refunds (all)" value={refunds} />
        <Line label="Pay-ins" value={payIns(shift)} />
        <Line label="Pay-outs" value={payOuts(shift)} />
        <Line label="Expected cash in drawer" value={expectedCash(shift)} strong />
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Cash in and out</h2>
        {shift.cashMovements.length === 0 ? <p className="text-sm text-muted-foreground">No pay-ins or pay-outs in this shift.</p> : (
          <ul className="divide-y rounded-md border">
            {shift.cashMovements.map((m) => (
              <li key={m.id} className="flex items-center justify-between p-3 text-sm">
                <span><span className="font-medium">{m.type === 'pay_in' ? 'Pay in' : 'Pay out'}</span> <span className="text-muted-foreground">· {m.reason} · {formatTime(m.createdAt)}</span></span>
                <span className="tabular-nums">{m.type === 'pay_in' ? '+' : '−'}{formatMvr(m.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
