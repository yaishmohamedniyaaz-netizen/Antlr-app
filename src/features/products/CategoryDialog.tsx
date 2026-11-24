import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Category } from '@/types'
import { useActions, useCategories, useProducts } from '@/data/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSave } from '@/hooks/useSave'
import { quietly } from '@/lib/quietly'

export function CategoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const categories = useCategories()
  const products = useProducts()
  const actions = useActions()
  const [newName, setNewName] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [moveTo, setMoveTo] = useState('')
  const removing = useSave()

  const usedBy = (id: string) => products.filter((p) => p.categoryId === id).length
  const startDelete = (c: Category) => {
    if (!usedBy(c.id)) return quietly(actions.deleteCategory(c.id))
    setDeleting(c)
    setMoveTo(categories.find((x) => x.id !== c.id)?.id ?? '')
  }
  const add = () => {
    if (!newName.trim()) return
    quietly(actions.addCategory(newName.trim()))
    setNewName('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setDeleting(null) }}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{deleting ? `Delete ${deleting.name}` : 'Categories'}</DialogTitle>
          <DialogDescription>{deleting ? `${usedBy(deleting.id)} products use this category. Choose where to move them.` : 'Rename, add or delete categories.'}</DialogDescription>
        </DialogHeader>
        {deleting ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="move-to">Move products to</Label>
              <Select value={moveTo} onValueChange={setMoveTo}>
                <SelectTrigger id="move-to" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.filter((c) => c.id !== deleting.id).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {removing.error && <p role="alert" className="text-sm text-destructive">{removing.error}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => setDeleting(null)}>Back</Button>
              <Button variant="destructive" className="flex-1" disabled={!moveTo || removing.saving} onClick={async () => {
                const ok = await removing.run(async () => { await actions.deleteCategory(deleting.id, moveTo); return true })
                if (ok) setDeleting(null)
              }}>{removing.saving ? 'Saving…' : 'Move and delete'}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-md border">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-2 p-2">
                  <Input aria-label={`Name of ${c.name}`} defaultValue={c.name} onBlur={(e) => e.target.value.trim() && e.target.value.trim() !== c.name && quietly(actions.renameCategory(c.id, e.target.value.trim()))} className="border-transparent hover:border-input" />
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">{usedBy(c.id)} products</span>
                  <Button size="icon" variant="ghost" aria-label={`Delete ${c.name}`} disabled={categories.length === 1} onClick={() => startDelete(c)}><Trash2 /></Button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Input aria-label="New category name" placeholder="New category" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
              <Button onClick={add}>Add</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
