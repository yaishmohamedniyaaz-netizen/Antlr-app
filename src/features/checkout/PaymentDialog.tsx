import { useState } from 'react'
import { ArrowLeft, Banknote, CreditCard, Landmark, QrCode, type LucideIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Numpad } from '@/components/Numpad'
import { Money } from '@/components/Money'
import { useSettings } from '@/data/hooks'
import { formatAmount, formatMvr, parseMvr } from '@/lib/money'
import type { Laari, PaymentInput, PaymentMethod } from '@/types'
import { changeDue, quickCashAmounts, tenderLabel } from './payment'
import { errorMessage } from '@/hooks/useSave'

const ICONS: Record<PaymentMethod, LucideIcon> = { qr: QrCode, card: CreditCard, transfer: Landmark, cash: Banknote }

interface Props {
  total: Laari
  open: boolean
  onOpenChange: (open: boolean) => void
  /** May return a Promise; the dialog shows "Saving…" until it settles and shows its error if it fails. */
  onComplete: (payments: PaymentInput[]) => Promise<unknown> | void
}

export function PaymentDialog({ total, open, onOpenChange, onComplete }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        {open && <PaymentFlow total={total} onComplete={onComplete} />}
      </DialogContent>
    </Dialog>
  )
}

function PaymentFlow({ total, onComplete }: { total: Laari; onComplete: Props['onComplete'] }) {
  const settings = useSettings()
  const [paid, setPaid] = useState<PaymentInput[]>([])
  const [split, setSplit] = useState(false)
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [typed, setTyped] = useState('')
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const remaining = total - paid.reduce((s, p) => s + p.amount, 0)
  const tenders = settings.tenderOrder.filter((t) => settings.enabledTenders.includes(t))

  const choose = (m: PaymentMethod) => {
    setMethod(m)
    setTyped(split && m !== 'cash' ? formatAmount(remaining).replace(/,/g, '') : '')
    setReference('')
    setError('')
  }

  const typedAmount = parseMvr(typed)
  // the amount this step will put toward the bill
  const applied = method === 'cash' ? Math.min(typedAmount ?? 0, remaining) : split ? (typedAmount ?? 0) : remaining
  const finishes = applied === remaining

  const submit = async () => {
    if (!method || saving) return
    let p: PaymentInput
    if (method === 'cash') {
      if (typedAmount === null || typedAmount === 0) return setError('Enter the amount received')
      if (!split && changeDue(remaining, typedAmount) === null) return setError('Amount received is less than the total')
      p = { method, amount: applied, amountReceived: typedAmount }
    } else {
      if (split && (typedAmount === null || typedAmount === 0)) return setError('Enter an amount')
      if (applied > remaining) return setError('Amount is more than what is left to pay')
      p = { method, amount: applied, ...(reference.trim() ? { reference: reference.trim() } : {}) }
    }
    const next = [...paid, p]
    if (finishes) {
      setSaving(true)
      try { await onComplete(next) } catch (e) { setError(errorMessage(e)) } finally { setSaving(false) }
    } else {
      setPaid(next)
      setMethod(null)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {method && (
            <button type="button" aria-label="Back" onClick={() => setMethod(null)} className="-ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted">
              <ArrowLeft className="size-4" />
            </button>
          )}
          {method ? tenderLabel(method) : 'Payment'}
        </DialogTitle>
        <DialogDescription className="sr-only">Take payment for this sale</DialogDescription>
      </DialogHeader>

      <div className="flex items-baseline justify-between border-y py-3">
        <span className="text-sm text-muted-foreground">{paid.length ? 'Left to pay' : 'Total'}</span>
        <Money value={remaining} className="text-2xl font-semibold" />
      </div>

      {paid.length > 0 && (
        <ul className="space-y-1 text-sm">
          {paid.map((p, i) => (
            <li key={i} className="flex justify-between text-muted-foreground">
              <span>{tenderLabel(p.method)}</span>
              <Money value={p.amount} />
            </li>
          ))}
        </ul>
      )}

      {!method && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {tenders.map((t) => {
              const Icon = ICONS[t]
              return (
                <button key={t} type="button" onClick={() => choose(t)} className="flex h-16 items-center gap-3 rounded-md border px-4 text-left text-sm font-medium hover:bg-muted">
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  {tenderLabel(t)}
                </button>
              )
            })}
          </div>
          {!split && paid.length === 0 && (
            <Button variant="ghost" className="w-full" onClick={() => setSplit(true)}>Split payment</Button>
          )}
          {split && paid.length === 0 && <p className="text-center text-sm text-muted-foreground">Choose how the first part is paid.</p>}
        </div>
      )}

      {method === 'cash' && (
        <div className="grid grid-cols-[1fr_180px] gap-4">
          <div className="space-y-3">
            <div className="flex h-12 items-center justify-between rounded-md border px-3">
              <span className="text-sm text-muted-foreground">Received</span>
              <span className="text-xl font-semibold tabular-nums">{typed || '0'}</span>
            </div>
            <Numpad value={typed} onChange={(v) => { setTyped(v); setError('') }} />
          </div>
          <div className="flex flex-col gap-2">
            {quickCashAmounts(remaining).map((a) => (
              <Button key={a} variant="default" size="xl" className="justify-between font-normal" onClick={() => { setTyped(formatAmount(a).replace(/,/g, '')); setError('') }}>
                {formatMvr(a)}
              </Button>
            ))}
            {typedAmount !== null && changeDue(remaining, typedAmount) !== null && (
              <div className="mt-auto rounded-md bg-muted p-3">
                <div className="text-xs text-muted-foreground">Change</div>
                <Money value={changeDue(remaining, typedAmount)!} className="text-lg font-semibold" />
              </div>
            )}
          </div>
        </div>
      )}

      {method && method !== 'cash' && (
        <div className="space-y-3">
          {method === 'qr' && (
            settings.staticQrUrl
              ? <img src={settings.staticQrUrl} alt="Payment QR code" className="mx-auto size-48 rounded-md border object-contain" />
              : <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No QR image set. Add one in Settings, or show the bank details below.</p>
          )}
          {(method === 'transfer' || (method === 'qr' && !settings.staticQrUrl)) && (
            <dl className="grid grid-cols-[120px_1fr] gap-y-1 rounded-md border p-3 text-sm">
              <dt className="text-muted-foreground">Bank</dt><dd>{settings.bankName}</dd>
              <dt className="text-muted-foreground">Account</dt><dd className="tabular-nums">{settings.bankAccountNumber}</dd>
              <dt className="text-muted-foreground">Name</dt><dd>{settings.bankAccountName}</dd>
            </dl>
          )}
          {split && (
            <div className="space-y-2">
              <div className="flex h-12 items-center justify-between rounded-md border px-3">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-xl font-semibold tabular-nums">{typed || '0'}</span>
              </div>
              <Numpad value={typed} onChange={(v) => { setTyped(v); setError('') }} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Reference (optional)</Label>
            <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === 'card' ? 'Last 4 digits or approval code' : 'Transaction ID'} />
          </div>
        </div>
      )}

      {method && (
        <div className="space-y-2">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button variant="primary" size="xl" className="w-full" disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : split && !finishes ? 'Add payment' : 'Complete'}
          </Button>
        </div>
      )}
    </>
  )
}
