import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Numpad } from '@/components/Numpad'
import { Money } from '@/components/Money'
import { parseMvr, percentOf } from '@/lib/money'
import type { Laari } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  baseAmount: Laari
  current?: Laari
  onApply: (discount: Laari) => void
  title?: string
}

export function DiscountDialog({ open, onOpenChange, baseAmount, current = 0, onApply, title = 'Discount' }: Props) {
  const [mode, setMode] = useState<'fixed' | 'percent'>('fixed')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')

  const value = mode === 'fixed' ? parseMvr(typed) : typed ? Number(typed) : null
  const discount = value === null || Number.isNaN(value) ? null : mode === 'fixed' ? value : percentOf(baseAmount, value)

  const apply = () => {
    if (discount === null || discount === 0) return setError('Enter a discount')
    if (mode === 'percent' && (value ?? 0) > 100) return setError('Percent must be 100 or less')
    if (discount > baseAmount) return setError('Discount is more than the amount')
    onApply(discount)
    onOpenChange(false)
    setTyped('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>On <Money value={baseAmount} /></DialogDescription>
        </DialogHeader>
        <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => { if (v) { setMode(v as typeof mode); setTyped(''); setError('') } }} className="w-full">
          <ToggleGroupItem value="fixed" className="flex-1">Amount (MVR)</ToggleGroupItem>
          <ToggleGroupItem value="percent" className="flex-1">Percent</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex h-12 items-center justify-between rounded-md border px-3">
          <span className="text-xl font-semibold tabular-nums">{typed || '0'}{mode === 'percent' ? '%' : ''}</span>
          {discount !== null && mode === 'percent' && <Money value={discount} className="text-sm text-muted-foreground" />}
        </div>
        <Numpad value={typed} onChange={(v) => { setTyped(v); setError('') }} maxDecimals={2} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          {current > 0 && <Button variant="ghost" onClick={() => { onApply(0); onOpenChange(false) }}>Remove discount</Button>}
          <Button variant="primary" size="lg" className="flex-1" onClick={apply}>Apply discount</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
