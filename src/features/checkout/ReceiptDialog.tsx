import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Sale } from '@/types'
import { Receipt } from './Receipt'

export function ReceiptDialog({ sale, open, onOpenChange }: { sale: Sale | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription className="sr-only">Receipt for this sale</DialogDescription>
        </DialogHeader>
        {sale && (
          <div className="print-area max-h-[60vh] overflow-y-auto rounded-md border bg-white p-4">
            <div className="mx-auto w-fit"><Receipt sale={sale} /></div>
          </div>
        )}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => onOpenChange(false)}>Done</Button>
          <Button variant="primary" className="flex-1" onClick={() => window.print()}>Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
