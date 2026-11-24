import { useState } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import type { ModifierOption, ModifierPrefix, Product, ProductInput } from '@/types'
import { useCategories, useSettings } from '@/data/hooks'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatAmount, parseMvr } from '@/lib/money'
import { useSave } from '@/hooks/useSave'

interface Props {
  open: boolean
  product: Product | null
  onOpenChange: (open: boolean) => void
  onSave: (input: ProductInput) => Promise<unknown> | void
}

const amountText = (l?: number) => (l === undefined ? '' : formatAmount(l).replace(/,/g, ''))
const PREFIXES: { value: ModifierPrefix; label: string }[] = [
  { value: 'no', label: 'No' }, { value: 'extra', label: 'Extra' }, { value: 'light', label: 'Light' }, { value: 'side', label: 'Side of' },
]

export function ProductSheet({ open, product, onOpenChange, onSave }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[460px] gap-0 sm:max-w-[460px]">
        {open && <ProductForm key={product?.id ?? 'new'} product={product} onSave={onSave} />}
      </SheetContent>
    </Sheet>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function ProductForm({ product, onSave }: { product: Product | null; onSave: Props['onSave'] }) {
  const categories = useCategories()
  const settings = useSettings()
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? '')
  const [price, setPrice] = useState(amountText(product?.price))
  const [cost, setCost] = useState(amountText(product?.costPrice))
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? false)
  const [stock, setStock] = useState(String(product?.currentStock ?? 0))
  const [low, setLow] = useState(String(product?.lowStockThreshold ?? 5))
  const [gst, setGst] = useState(product?.gstApplicable ?? true)
  const [image, setImage] = useState(product?.imageUrl)
  const [mods, setMods] = useState<(Omit<ModifierOption, 'upcharge'> & { upcharge: string })[]>(
    (product?.modifiers ?? []).map((m) => ({ ...m, upcharge: amountText(m.upcharge) })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const store = useSave()

  const pickImage = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (store.saving) return
    const e: Record<string, string> = {}
    const p = parseMvr(price)
    const c = cost.trim() ? parseMvr(cost) : undefined
    const s = Number(stock)
    const l = Number(low)
    if (!name.trim()) e.name = 'Enter a name'
    if (p === null) e.price = 'Enter a valid price'
    if (c === null) e.cost = 'Enter a valid cost or leave it empty'
    if (trackStock && (!Number.isInteger(s) || s < 0)) e.stock = 'Enter a whole number'
    if (trackStock && (!Number.isInteger(l) || l < 0)) e.low = 'Enter a whole number'
    const parsedMods = mods.map((m) => ({ ...m, name: m.name.trim(), upcharge: m.upcharge.trim() ? parseMvr(m.upcharge) : 0 }))
    if (parsedMods.some((m) => !m.name || m.upcharge === null)) e.mods = 'Each option needs a name and a valid extra price'
    setErrors(e)
    if (Object.keys(e).length) return
    await store.run(async () => onSave({
      name: name.trim(), categoryId, price: p!, costPrice: c ?? undefined, barcode: barcode.trim() || undefined,
      trackStock, currentStock: trackStock ? s : 0, lowStockThreshold: trackStock ? l : 5, gstApplicable: gst,
      isHidden: product?.isHidden ?? false, imageUrl: image,
      modifiers: parsedMods.length ? parsedMods.map((m) => ({ ...m, upcharge: m.upcharge as number })) : undefined,
    }))
  }

  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{product ? 'Edit product' : 'New product'}</SheetTitle>
        <SheetDescription className="sr-only">Product details</SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <label className="flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted">
            {image ? <img src={image} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5" />}
            <input type="file" accept="image/*" className="sr-only" aria-label="Product photo" onChange={(e) => pickImage(e.target.files?.[0])} />
          </label>
          <div className="text-sm text-muted-foreground">
            Photo (optional)
            {image && <Button variant="link" size="sm" className="block h-auto p-0" onClick={() => setImage(undefined)}>Remove photo</Button>}
          </div>
        </div>
        <Field id="p-name" label="Name" error={errors.name}><Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field id="p-cat" label="Category">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="p-cat" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="p-price" label="Price (MVR)" error={errors.price}><Input id="p-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12.00" /></Field>
          <Field id="p-cost" label="Cost (MVR, optional)" error={errors.cost}><Input id="p-cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} /></Field>
        </div>
        <Field id="p-code" label="Barcode (optional)"><Input id="p-code" value={barcode} onChange={(e) => setBarcode(e.target.value)} /></Field>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="p-gst">GST applies</Label>
          <Switch id="p-gst" checked={gst} onCheckedChange={setGst} />
        </div>
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="p-track">Track stock</Label>
            <Switch id="p-track" checked={trackStock} onCheckedChange={setTrackStock} />
          </div>
          {trackStock && (
            <div className="grid grid-cols-2 gap-3">
              <Field id="p-stock" label="In stock" error={errors.stock}><Input id="p-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
              <Field id="p-low" label="Warn when below" error={errors.low}><Input id="p-low" inputMode="numeric" value={low} onChange={(e) => setLow(e.target.value)} /></Field>
            </div>
          )}
        </div>
        {settings.modifiersEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Options</span>
              <Button size="sm" variant="ghost" onClick={() => setMods((m) => [...m, { id: crypto.randomUUID(), name: '', prefix: 'extra', upcharge: '' }])}><Plus /> Add option</Button>
            </div>
            {mods.map((m, i) => (
              <div key={m.id} className="grid grid-cols-[96px_1fr_88px_36px] gap-2">
                <Select value={m.prefix} onValueChange={(v) => setMods((all) => all.map((x, j) => (j === i ? { ...x, prefix: v as ModifierPrefix } : x)))}>
                  <SelectTrigger aria-label="Option type" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{PREFIXES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input aria-label="Option name" placeholder="Cheese" value={m.name} onChange={(e) => setMods((all) => all.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <Input aria-label="Extra price" placeholder="0.00" inputMode="decimal" value={m.upcharge} onChange={(e) => setMods((all) => all.map((x, j) => (j === i ? { ...x, upcharge: e.target.value } : x)))} />
                <Button size="icon" variant="ghost" aria-label="Remove option" onClick={() => setMods((all) => all.filter((_, j) => j !== i))}><Trash2 /></Button>
              </div>
            ))}
            {errors.mods && <p role="alert" className="text-sm text-destructive">{errors.mods}</p>}
          </div>
        )}
      </div>
      <SheetFooter className="border-t">
        {store.error && <p role="alert" className="text-sm text-destructive">{store.error}</p>}
        <Button variant="primary" size="lg" disabled={store.saving} onClick={save}>{store.saving ? 'Saving…' : 'Save product'}</Button>
      </SheetFooter>
    </>
  )
}
