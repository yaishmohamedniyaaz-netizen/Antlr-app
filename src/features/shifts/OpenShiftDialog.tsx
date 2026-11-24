import { useState } from 'react'
import { errorMessage } from '@/hooks/useSave'
import { useActions } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Numpad } from '@/components/Numpad'
import { parseMvr } from '@/lib/money'

export function OpenShiftDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const actions = useActions()
  const [name, setName] = useState('')
  const [float, setFloat] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const start = async () => {
    if (saving) return
    const amount = float ? parseMvr(float) : 0
    if (!name.trim()) return setError('Enter the cashier name')
    if (amount === null) return setError('Enter a valid amount')
    setSaving(true)
    try { await actions.openShift(name.trim(), amount) } catch (e) { setSaving(false); return setError(errorMessage(e)) }
    setSaving(false)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Open shift</DialogTitle>
          <DialogDescription>Count the cash in the drawer before you start.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="shift-name">Cashier name</Label>
          <Input id="shift-name" value={name} onChange={(e) => { setName(e.target.value); setError('') }} autoFocus />
        </div>
        <div className="flex h-12 items-center justify-between rounded-md border px-3">
          <span className="text-sm text-muted-foreground">Cash in drawer (MVR)</span>
          <span className="text-xl font-semibold tabular-nums">{float || '0'}</span>
        </div>
        <Numpad value={float} onChange={(v) => { setFloat(v); setError('') }} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button variant="primary" size="lg" disabled={saving} onClick={start}>{saving ? 'Saving…' : 'Start shift'}</Button>
      </DialogContent>
    </Dialog>
  )
}
