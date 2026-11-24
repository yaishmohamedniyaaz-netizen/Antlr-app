import { useState } from 'react'
import { errorMessage } from '@/hooks/useSave'
import { useActions } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Numpad } from '@/components/Numpad'
import { parseMvr } from '@/lib/money'

export function CashMovementDialog({ type, onClose }: { type: 'pay_in' | 'pay_out' | null; onClose: () => void }) {
  const actions = useActions()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (saving) return
    const v = parseMvr(amount)
    if (!v) return setError('Enter an amount')
    if (!reason.trim()) return setError('Enter a reason')
    setSaving(true)
    try { await actions.addCashMovement(type!, v, reason.trim()) } catch (e) { setSaving(false); return setError(errorMessage(e)) }
    setSaving(false)
    setAmount(''); setReason(''); onClose()
  }
  return (
    <Dialog open={type !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{type === 'pay_in' ? 'Pay in' : 'Pay out'}</DialogTitle>
          <DialogDescription>{type === 'pay_in' ? 'Cash put into the drawer.' : 'Cash taken out of the drawer.'}</DialogDescription>
        </DialogHeader>
        <div className="flex h-12 items-center justify-between rounded-md border px-3">
          <span className="text-sm text-muted-foreground">Amount (MVR)</span>
          <span className="text-xl font-semibold tabular-nums">{amount || '0'}</span>
        </div>
        <Numpad value={amount} onChange={(v) => { setAmount(v); setError('') }} />
        <div className="space-y-1.5">
          <Label htmlFor="cm-reason">Reason</Label>
          <Input id="cm-reason" value={reason} onChange={(e) => { setReason(e.target.value); setError('') }} placeholder={type === 'pay_in' ? 'Change from bank' : 'Bought ice'} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="primary" size="lg" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogContent>
    </Dialog>
  )
}
