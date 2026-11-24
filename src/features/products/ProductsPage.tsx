import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'
import type { Product, ProductInput } from '@/types'
import { useActions, useCategories, useProducts } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatMvr } from '@/lib/money'
import { downloadText } from '@/lib/csv'
import { cn } from '@/lib/utils'
import { ProductSheet } from './ProductSheet'
import { useSave } from '@/hooks/useSave'
import { quietly } from '@/lib/quietly'
import { CategoryDialog } from './CategoryDialog'
import { parseProductCsv, productCsvTemplate } from './csv'

export function ProductsPage() {
  const products = useProducts()
  const categories = useCategories()
  const actions = useActions()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [importResult, setImportResult] = useState<ReturnType<typeof parseProductCsv> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const importing = useSave()

  const editId = params.get('edit')
  const editing = products.find((p) => p.id === editId) ?? null
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => (category === 'all' || p.categoryId === category) && (!q || p.name.toLowerCase().includes(q) || p.barcode?.includes(q)))
  }, [products, query, category])

  const allShownSelected = shown.length > 0 && shown.every((p) => selected.includes(p.id))
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const closeSheet = () => { setAdding(false); if (editId) setParams({}) }
  const save = async (input: ProductInput) => {
    if (editing) await actions.updateProduct(editing.id, input)
    else await actions.addProduct(input)
    closeSheet()
  }
  const bulk = (work: Promise<unknown>) => { quietly(work); setSelected([]) }
  const readFile = (file?: File) => {
    if (!file) return
    file.text().then((t) => setImportResult(parseProductCsv(t, categories)))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button>More</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setShowCategories(true)}>Manage categories</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => fileRef.current?.click()}>Import from CSV</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => downloadText('antlr-products-template.csv', productCsvTemplate())}>Download CSV template</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="primary" onClick={() => setAdding(true)}>Add product</Button>
          </>
        }
      >
        <span className="text-sm text-muted-foreground">{products.length} products</span>
      </PageHeader>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="sr-only" aria-label="CSV file" onChange={(e) => readFile(e.target.files?.[0])} />

      <div className="flex shrink-0 items-center gap-2 border-b px-6 py-3">
        <div className="flex h-9 w-72 items-center gap-2 rounded-md border px-3">
          <Search className="size-4 text-muted-foreground" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or barcode" className="h-full flex-1 bg-transparent text-sm outline-none" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Category" className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selected.length} selected</span>
            <Button size="sm" onClick={() => bulk(actions.updateProducts(selected, { isHidden: true }))}>Hide</Button>
            <Button size="sm" onClick={() => bulk(actions.updateProducts(selected, { isHidden: false }))}>Show</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 ? <EmptyState title="No products found" body="Try another search or category." /> : (
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-12 pl-6">
                  <Checkbox aria-label="Select all" checked={allShownSelected} onCheckedChange={(c) => setSelected(c ? shown.map((p) => p.id) : [])} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>GST</TableHead>
                <TableHead className="pr-6">In grid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((p) => <Row key={p.id} p={p} cat={catName(p.categoryId)} checked={selected.includes(p.id)} onToggle={() => toggle(p.id)} onOpen={() => setParams({ edit: p.id })} />)}
            </TableBody>
          </Table>
        )}
      </div>

      <ProductSheet open={adding || editing !== null} product={editing} onOpenChange={(o) => { if (!o) closeSheet() }} onSave={save} />
      <CategoryDialog open={showCategories} onOpenChange={setShowCategories} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} products?</AlertDialogTitle>
            <AlertDialogDescription>Past sales keep their records. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => bulk(actions.deleteProducts(selected))}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={importResult !== null} onOpenChange={(o) => { if (!o) setImportResult(null) }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Import products</DialogTitle>
            <DialogDescription>
              {importResult?.rows.length ?? 0} ready to import{importResult?.errors.length ? `, ${importResult.errors.length} lines have problems and will be skipped` : ''}.
            </DialogDescription>
          </DialogHeader>
          {importResult && importResult.errors.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-3 text-sm">
              {importResult.errors.map((e) => <li key={e.line}><span className="text-muted-foreground">Line {e.line}:</span> {e.message}</li>)}
            </ul>
          )}
          {importing.error && <p role="alert" className="text-sm text-destructive">{importing.error}</p>}
          <Button variant="primary" disabled={!importResult?.rows.length || importing.saving} onClick={async () => {
            const rows = importResult?.rows ?? []
            const ok = await importing.run(async () => { for (const r of rows) await actions.addProduct(r); return true })
            if (ok) setImportResult(null)
          }}>
            {importing.saving ? 'Saving…' : `Import ${importResult?.rows.length ?? 0} products`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({ p, cat, checked, onToggle, onOpen }: { p: Product; cat: string; checked: boolean; onToggle: () => void; onOpen: () => void }) {
  const low = p.trackStock && p.currentStock <= p.lowStockThreshold
  return (
    <TableRow data-state={checked ? 'selected' : undefined} className="cursor-pointer" onClick={onOpen}>
      <TableCell className="pl-6" onClick={(e) => e.stopPropagation()}>
        <Checkbox aria-label={`Select ${p.name}`} checked={checked} onCheckedChange={onToggle} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {p.imageUrl ? <img src={p.imageUrl} alt="" className="size-8 rounded object-cover" /> : <div className="size-8 rounded bg-muted" />}
          <div>
            <div className="font-medium">{p.name}</div>
            {p.barcode && <div className="text-xs text-muted-foreground tabular-nums">{p.barcode}</div>}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{cat}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMvr(p.price)}</TableCell>
      <TableCell className={cn('text-right tabular-nums', low && (p.currentStock <= 0 ? 'text-destructive' : 'text-warning'))}>{p.trackStock ? p.currentStock : '—'}</TableCell>
      <TableCell className="text-muted-foreground">{p.gstApplicable ? 'Yes' : 'No'}</TableCell>
      <TableCell className="pr-6 text-muted-foreground">{p.isHidden ? 'Hidden' : 'Shown'}</TableCell>
    </TableRow>
  )
}
