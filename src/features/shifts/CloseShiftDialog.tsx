import { useState } from 'react'
import { errorMessage } from '@/hooks/useSave'
import type { Shift } from '@/types'
import { useActions } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Numpad } from '@/components/Numpad'
import { Money } from '@/components/Money'
import { formatMvr, parseMvr } from '@/lib/money'
import { expectedCash } from '@/lib/shift'
import { cn } from '@/lib/utils'

export function CloseShiftDialog({ shift, open, onOpenChange }: { shift: Shift; open: boolean; onOpenChange: (o: boolean) => void }) {
  const actions = useActions()
  const [counted, setCounted] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const expected = expectedCash(shift)
  const value = parseMvr(counted)
  const variance = value === null ? null : value - expected
  const close = async () => {
    if (saving) return
    if (value === null) return setError('Count the cash and enter the amount')
    setSaving(true)
    try { await actions.closeShift(value) } catch (e) { setSaving(false); return setError(errorMessage(e)) }
    setSaving(false)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Close shift</DialogTitle>
          <DialogDescription>Count all the cash in the drawer.</DialogDescription>
        </DialogHeader>
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Expected cash</span>
          <Money value={expected} className="font-medium" />
        </div>
        <div className="flex h-12 items-center justify-between rounded-md border px-3">
          <span className="text-sm text-muted-foreground">Counted (MVR)</span>
          <span className="text-xl font-semibold tabular-nums">{counted || '0'}</span>
        </div>
        <Numpad value={counted} onChange={(v) => { setCounted(v); setError('') }} />
        {variance !== null && (
          <p className={cn('text-sm font-medium', variance === 0 ? 'text-success' : 'text-destructive')}>
            {variance === 0 ? 'Cash matches' : `Variance ${formatMvr(variance)}`}
          </p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="primary" size="lg" disabled={saving} onClick={close}>{saving ? 'Saving…' : 'Close shift'}</Button>
      </DialogContent>
    </Dialog>
  )
}
