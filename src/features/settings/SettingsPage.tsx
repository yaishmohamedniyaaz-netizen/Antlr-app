import { useState } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { PaymentMethod, ShopSettings } from '@/types'
import { useActions, useDemoNetwork, useSettings, useTables } from '@/data/hooks'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { tenderLabel } from '@/features/checkout/payment'
import { cn } from '@/lib/utils'
import { BUSINESS_TYPES } from './businessTypes'
import { errorMessage, useSave } from '@/hooks/useSave'
import { quietly } from '@/lib/quietly'

type Section = 'shop' | 'tax' | 'receipt' | 'payments' | 'business' | 'tables' | 'data'
const SECTIONS: { id: Section; label: string }[] = [
  { id: 'shop', label: 'Shop' }, { id: 'tax', label: 'Tax' }, { id: 'receipt', label: 'Receipt' }, { id: 'payments', label: 'Payments' },
  { id: 'business', label: 'Business' }, { id: 'tables', label: 'Tables' }, { id: 'data', label: 'Data' },
]

export function SettingsPage() {
  const [section, setSection] = useState<Section>('shop')
  const settings = useSettings()
  const visible = SECTIONS.filter((s) => s.id !== 'tables' || settings.businessType === 'restaurant' || settings.businessType === 'restaurant_takeaway')
  return (
    <>
      <PageHeader title="Settings" />
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Settings sections" className="w-52 shrink-0 space-y-1 border-r p-3">
          {visible.map((s) => (
            <button key={s.id} type="button" onClick={() => setSection(s.id)} aria-current={section === s.id ? 'page' : undefined}
              className={cn('flex h-9 w-full items-center rounded-md px-3 text-sm', section === s.id ? 'bg-muted font-medium' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground')}>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="min-h-0 flex-1 overflow-y-auto p-8">
          <div className="max-w-xl">
            {section === 'shop' && <ShopSection key="shop" />}
            {section === 'tax' && <TaxSection key="tax" />}
            {section === 'receipt' && <ReceiptSection key="receipt" />}
            {section === 'payments' && <PaymentsSection key="payments" />}
            {section === 'business' && <BusinessSection key="business" />}
            {section === 'tables' && <TablesSection key="tables" />}
            {section === 'data' && <DataSection key="data" />}
          </div>
        </div>
      </div>
    </>
  )
}

/** Local copy of settings for one section, saved with one button. */
function useDraft() {
  const settings = useSettings()
  const actions = useActions()
  const [draft, setDraft] = useState<ShopSettings>(settings)
  const [saved, setSaved] = useState(false)
  const store = useSave()
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => { setDraft((d) => ({ ...d, [k]: v })); setSaved(false) }
  const save = async (patch: Partial<ShopSettings>) => {
    const ok = await store.run(async () => { await actions.updateSettings(patch); return true })
    setSaved(!!ok)
  }
  return { draft, set, save, saved, saving: store.saving, saveError: store.error }
}

function Title({ title, desc }: { title: string; desc?: string }) {
  return <div className="mb-6"><h2 className="text-base font-semibold">{title}</h2>{desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}</div>
}
function TextField({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return <div className="space-y-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
}
function Toggle({ id, label, desc, checked, onChange }: { id: string; label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <Label htmlFor={id} className="block"><span className="block text-sm">{label}</span>{desc && <span className="block text-xs font-normal text-muted-foreground">{desc}</span>}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
function SaveRow({ label, onSave, saved, error, saving }: { label: string; onSave: () => void; saved: boolean; error?: string; saving?: boolean }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <Button variant="primary" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : label}</Button>
      {saved && !error && <span className="text-sm text-muted-foreground">Saved</span>}
      {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
    </div>
  )
}

function ShopSection() {
  const { draft, set, save, saved, saving, saveError } = useDraft()
  return (
    <>
      <Title title="Shop" desc="Shown at the top of receipts." />
      <div className="space-y-4">
        <TextField id="s-name" label="Shop name" value={draft.shopName} onChange={(v) => set('shopName', v)} />
        <TextField id="s-address" label="Address" value={draft.address} onChange={(v) => set('address', v)} />
        <TextField id="s-phone" label="Phone" value={draft.phone} onChange={(v) => set('phone', v)} />
        <TextField id="s-tin" label="TIN (MIRA taxpayer number)" value={draft.tin} onChange={(v) => set('tin', v)} />
      </div>
      <SaveRow label="Save shop details" saved={saved} saving={saving} error={saveError} onSave={() => save({ shopName: draft.shopName.trim(), address: draft.address, phone: draft.phone, tin: draft.tin })} />
    </>
  )
}

function TaxSection() {
  const { draft, set, save, saved, saving, saveError } = useDraft()
  const [rate, setRate] = useState(String(draft.gstRateBps / 100))
  const [error, setError] = useState('')
  const onSave = () => {
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(rate.trim())) return setError('Enter a rate between 0 and 99.99')
    setError('')
    save({ gstRateBps: Math.round(Number(rate) * 100), pricesIncludeGst: draft.pricesIncludeGst })
  }
  return (
    <>
      <Title title="Tax" desc="Check the current GST rate with MIRA." />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="t-rate">GST rate (%)</Label>
          <Input id="t-rate" inputMode="decimal" className="w-32" value={rate} onChange={(e) => { setRate(e.target.value); setError('') }} />
        </div>
        <Toggle id="t-incl" label="Prices include GST" desc="On: the shelf price is what the customer pays. Off: GST is added at the till." checked={draft.pricesIncludeGst} onChange={(v) => set('pricesIncludeGst', v)} />
      </div>
      <SaveRow label="Save tax settings" saved={saved} saving={saving} error={error || saveError} onSave={onSave} />
    </>
  )
}

function ReceiptSection() {
  const { draft, set, save, saved, saving, saveError } = useDraft()
  return (
    <>
      <Title title="Receipt" />
      <div className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="r-head">Message at the top</Label><Textarea id="r-head" rows={2} value={draft.receiptHeader} onChange={(e) => set('receiptHeader', e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="r-foot">Message at the bottom</Label><Textarea id="r-foot" rows={2} value={draft.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} /></div>
        <Toggle id="r-logo" label="Show the Antlr mark at the bottom" checked={draft.showLogoOnReceipt} onChange={(v) => set('showLogoOnReceipt', v)} />
        <Toggle id="r-auto" label="Print the receipt after every sale" checked={draft.autoPrintReceipt} onChange={(v) => set('autoPrintReceipt', v)} />
      </div>
      <SaveRow label="Save receipt settings" saved={saved} saving={saving} error={saveError} onSave={() => save({ receiptHeader: draft.receiptHeader, receiptFooter: draft.receiptFooter, showLogoOnReceipt: draft.showLogoOnReceipt, autoPrintReceipt: draft.autoPrintReceipt })} />
    </>
  )
}

function PaymentsSection() {
  const { draft, set, save, saved, saving, saveError } = useDraft()
  const [error, setError] = useState('')
  const move = (m: PaymentMethod, dir: -1 | 1) => {
    const order = [...draft.tenderOrder]
    const i = order.indexOf(m)
    const j = i + dir
    if (j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    set('tenderOrder', order)
  }
  const toggle = (m: PaymentMethod, on: boolean) => set('enabledTenders', on ? [...draft.enabledTenders, m] : draft.enabledTenders.filter((x) => x !== m))
  const pickQr = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => set('staticQrUrl', String(r.result))
    r.readAsDataURL(file)
  }
  const onSave = () => {
    if (!draft.enabledTenders.length) return setError('Turn on at least one way to pay')
    setError('')
    save({ enabledTenders: draft.enabledTenders, tenderOrder: draft.tenderOrder, bankName: draft.bankName, bankAccountNumber: draft.bankAccountNumber, bankAccountName: draft.bankAccountName, staticQrUrl: draft.staticQrUrl })
  }
  return (
    <>
      <Title title="Payments" desc="Which ways to pay show at the till, and in what order." />
      <ul className="divide-y rounded-md border">
        {draft.tenderOrder.map((m, i) => (
          <li key={m} className="flex items-center gap-2 p-2 pl-3">
            <span className="flex-1 text-sm">{tenderLabel(m)}</span>
            <Button size="icon" variant="ghost" aria-label={`Move ${tenderLabel(m)} up`} disabled={i === 0} onClick={() => move(m, -1)}><ArrowUp /></Button>
            <Button size="icon" variant="ghost" aria-label={`Move ${tenderLabel(m)} down`} disabled={i === draft.tenderOrder.length - 1} onClick={() => move(m, 1)}><ArrowDown /></Button>
            <Switch aria-label={`${tenderLabel(m)} on`} checked={draft.enabledTenders.includes(m)} onCheckedChange={(v) => toggle(m, v)} />
          </li>
        ))}
      </ul>
      <h3 className="mt-8 mb-3 text-sm font-semibold">Bank details for transfers</h3>
      <div className="space-y-4">
        <TextField id="b-name" label="Bank" value={draft.bankName} onChange={(v) => set('bankName', v)} />
        <TextField id="b-acc" label="Account number" value={draft.bankAccountNumber} onChange={(v) => set('bankAccountNumber', v)} />
        <TextField id="b-holder" label="Account name" value={draft.bankAccountName} onChange={(v) => set('bankAccountName', v)} />
        <div className="space-y-1.5">
          <Label>QR code image</Label>
          <div className="flex items-center gap-3">
            {draft.staticQrUrl ? <img src={draft.staticQrUrl} alt="Payment QR code" className="size-20 rounded-md border object-contain" /> : <div className="flex size-20 items-center justify-center rounded-md border text-xs text-muted-foreground">None</div>}
            <label className="cursor-pointer text-sm underline underline-offset-4">
              Upload image<input type="file" accept="image/*" className="sr-only" onChange={(e) => pickQr(e.target.files?.[0])} />
            </label>
            {draft.staticQrUrl && <Button variant="ghost" size="sm" onClick={() => set('staticQrUrl', undefined)}>Remove</Button>}
          </div>
        </div>
      </div>
      <SaveRow label="Save payment settings" saved={saved} saving={saving} error={error || saveError} onSave={onSave} />
    </>
  )
}

function BusinessSection() {
  const { draft, set, save, saved, saving, saveError } = useDraft()
  const actions = useActions()
  const food = draft.businessType !== 'retail'
  return (
    <>
      <Title title="Business" desc="Decides which screens show in the menu." />
      <div role="radiogroup" aria-label="Business type" className="space-y-2">
        {BUSINESS_TYPES.map((b) => (
          <button key={b.value} type="button" role="radio" aria-checked={draft.businessType === b.value} onClick={() => set('businessType', b.value)}
            className={cn('flex w-full items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50', draft.businessType === b.value && 'border-foreground')}>
            <b.icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
            <span><span className="block text-sm font-medium">{b.label}</span><span className="block text-xs text-muted-foreground">{b.desc}</span></span>
          </button>
        ))}
      </div>
      {food && (
        <div className="mt-4 space-y-2">
          <Toggle id="b-mods" label="Options on dishes" desc='Like "no onions" or "extra cheese"' checked={draft.modifiersEnabled} onChange={(v) => set('modifiersEnabled', v)} />
          <Toggle id="b-viber" label="Orders by Viber" checked={draft.viberEnabled} onChange={(v) => set('viberEnabled', v)} />
        </div>
      )}
      <SaveRow label="Save business settings" saved={saved} saving={saving} error={saveError} onSave={() => save({ businessType: draft.businessType, modifiersEnabled: draft.modifiersEnabled, viberEnabled: draft.viberEnabled })} />
      <Button variant="link" className="mt-6 px-0" onClick={() => quietly(actions.updateSettings({ guidedSetupDone: false }))}>Run the setup steps again</Button>
    </>
  )
}

function TablesSection() {
  const tables = useTables()
  const actions = useActions()
  const [label, setLabel] = useState('')
  const [errorFor, setErrorFor] = useState<string | null>(null)
  const [errorText, setErrorText] = useState('')
  const remove = async (id: string) => {
    try { await actions.deleteTable(id); setErrorFor(null) } catch (e) { setErrorFor(id); setErrorText(errorMessage(e)) }
  }
  const add = () => {
    const name = label.trim() || `T${tables.length + 1}`
    quietly(actions.addTable(name, 4))
    setLabel('')
  }
  return (
    <>
      <Title title="Tables" desc="Changes are saved as you type." />
      <ul className="divide-y rounded-md border">
        {tables.map((t) => (
          <li key={t.id} className="p-2 pl-3">
            <div className="flex items-center gap-2">
              <Input aria-label={`Name of ${t.label}`} defaultValue={t.label} className="w-28" onBlur={(e) => e.target.value.trim() && quietly(actions.updateTable(t.id, { label: e.target.value.trim() }))} />
              <Input aria-label={`Seats at ${t.label}`} type="number" min={1} defaultValue={t.seats} className="w-20" onBlur={(e) => Number(e.target.value) > 0 && quietly(actions.updateTable(t.id, { seats: Number(e.target.value) }))} />
              <span className="flex-1 text-xs text-muted-foreground">seats</span>
              <Button size="icon" variant="ghost" aria-label={`Delete ${t.label}`} onClick={() => remove(t.id)}><Trash2 /></Button>
            </div>
            {errorFor === t.id && <p role="alert" className="mt-1 text-sm text-destructive">{errorText}</p>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input aria-label="New table name" placeholder={`T${tables.length + 1}`} value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} className="w-40" />
        <Button onClick={add}>Add table</Button>
      </div>
    </>
  )
}

function DataSection() {
  const actions = useActions()
  const [net, setNet] = useDemoNetwork()
  return (
    <>
      <Title title="Data" desc="This app runs on demo data kept in memory. It resets when the page reloads." />
      <div className="mb-6">
        <Toggle id="d-fail" label="Make every save fail" desc="Demo only. Use it to see the error messages the app shows when the connection fails." checked={net.fail} onChange={(v) => setNet({ fail: v })} />
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild><Button>Reset demo data</Button></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset demo data?</AlertDialogTitle>
            <AlertDialogDescription>All sales, orders, shifts and product changes go back to the starting demo data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => quietly(actions.resetDemoData())}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
