import { useState } from 'react'
import type { OrderItemModifier, Product } from '@/types'
import { prefixWord } from './labels'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { formatMvr } from '@/lib/money'


export function ModifierDialog({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (mods: OrderItemModifier[]) => void }) {
  const [picked, setPicked] = useState<string[]>([])
  return (
    <Dialog open={product !== null} onOpenChange={(o) => { if (!o) { onClose(); setPicked([]) } }}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>Choose any options.</DialogDescription>
        </DialogHeader>
        <div className="divide-y rounded-md border">
          {product?.modifiers?.map((m) => {
            const label = `${prefixWord[m.prefix]} ${m.name}`
            return (
              <label key={m.id} className="flex h-12 cursor-pointer items-center gap-3 px-3 text-sm">
                <Checkbox aria-label={label} checked={picked.includes(m.id)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, m.id] : p.filter((x) => x !== m.id)))} />
                <span className="flex-1">{label}</span>
                {m.upcharge > 0 && <span className="text-muted-foreground tabular-nums">+{formatMvr(m.upcharge)}</span>}
              </label>
            )
          })}
        </div>
        <Button variant="primary" size="lg" onClick={() => {
          const mods = (product?.modifiers ?? []).filter((m) => picked.includes(m.id)).map((m) => ({ label: m.name, prefix: m.prefix, upcharge: m.upcharge }))
          onAdd(mods)
          setPicked([])
        }}>Add to order</Button>
      </DialogContent>
    </Dialog>
  )
}
