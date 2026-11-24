import type { HeldSale } from '@/types'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/Money'
import { EmptyState } from '@/components/EmptyState'
import { formatTime } from '@/lib/format'

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  held: HeldSale[]
  cartHasItems: boolean
  onResume: (h: HeldSale) => void
  onDelete: (h: HeldSale) => void
}

export function HeldSalesSheet({ open, onOpenChange, held, cartHasItems, onResume, onDelete }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:max-w-[380px]">
        <SheetHeader>
          <SheetTitle>Held sales</SheetTitle>
          <SheetDescription>{cartHasItems ? 'Finish or hold the current sale before you resume another.' : 'Resume a sale to keep selling it.'}</SheetDescription>
        </SheetHeader>
        {held.length === 0 ? <EmptyState title="No held sales" /> : (
          <ul className="divide-y border-y px-4">
            {held.map((h) => (
              <li key={h.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{h.label}</div>
                  <div className="text-xs text-muted-foreground">{formatTime(h.createdAt)} · {h.lines.reduce((s, l) => s + l.quantity, 0)} items · <Money value={h.total} /></div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDelete(h)}>Delete</Button>
                <Button size="sm" disabled={cartHasItems} onClick={() => onResume(h)}>Resume</Button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}
