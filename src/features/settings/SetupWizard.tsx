import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Minus, Plus } from 'lucide-react'
import type { BusinessType } from '@/types'
import { BUSINESS_TYPES, hasTables, hasTakeaway, stepsFor, type Step } from './businessTypes'
import { useActions, useSettings, useTables } from '@/data/hooks'
import { defaultPathFor } from '@/app/nav'
import { AntlrMark } from '@/brand/AntlrMark'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useSave } from '@/hooks/useSave'

export function SetupWizard() {
  const settings = useSettings()
  const tables = useTables()
  const actions = useActions()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('welcome')
  const [type, setType] = useState<BusinessType>(settings.businessType)
  const [tableCount, setTableCount] = useState(tables.length || 6)
  const [mods, setMods] = useState(settings.modifiersEnabled)
  const [viber, setViber] = useState(settings.viberEnabled)
  const store = useSave()

  const steps = stepsFor(type)
  const i = steps.indexOf(step)
  const next = () => setStep(steps[i + 1])
  const back = () => setStep(steps[i - 1])
  const finish = async () => {
    const ok = await store.run(async () => {
      if (hasTables(type)) await actions.setTableCount(tableCount)
      await actions.updateSettings({ businessType: type, modifiersEnabled: type !== 'retail' && mods, viberEnabled: hasTakeaway(type) && viber, guidedSetupDone: true })
      return true
    })
    if (ok) navigate(defaultPathFor(type), { replace: true })
  }
  const typeInfo = BUSINESS_TYPES.find((b) => b.value === type)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="w-full max-w-[520px] rounded-lg border bg-background p-8">
        <div className="mb-6 flex items-center justify-between">
          <AntlrMark size={22} className="text-primary" />
          {step !== 'welcome' && <span className="text-xs text-muted-foreground">Step {i} of {steps.length - 1}</span>}
        </div>

        {step === 'welcome' && (
          <>
            <h2 id="setup-title" className="text-xl font-semibold">Set up {settings.shopName}</h2>
            <p className="mt-2 text-sm text-muted-foreground">A few questions so Antlr shows the right screens for your business. You can change all of this later in Settings.</p>
            <Button variant="primary" size="lg" className="mt-8 w-full" onClick={next}>Get started</Button>
          </>
        )}

        {step === 'type' && (
          <>
            <h2 id="setup-title" className="text-xl font-semibold">What kind of business is this?</h2>
            <div role="radiogroup" aria-label="Business type" className="mt-5 space-y-2">
              {BUSINESS_TYPES.map((b) => (
                <button key={b.value} type="button" role="radio" aria-checked={type === b.value} onClick={() => setType(b.value)}
                  className={cn('flex w-full items-center gap-3 rounded-md border p-3 text-left hover:bg-muted/50', type === b.value && 'border-foreground')}>
                  <b.icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
                  <span>
                    <span className="block text-sm font-medium">{b.label}</span>
                    <span className="block text-xs text-muted-foreground">{b.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'tables' && (
          <>
            <h2 id="setup-title" className="text-xl font-semibold">How many tables?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Tables are named T1, T2 and so on. You can rename them in Settings.</p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button size="icon" className="size-12" aria-label="Fewer tables" onClick={() => setTableCount((n) => Math.max(1, n - 1))}><Minus /></Button>
              <span className="w-16 text-center text-3xl font-semibold tabular-nums">{tableCount}</span>
              <Button size="icon" className="size-12" aria-label="More tables" onClick={() => setTableCount((n) => Math.min(99, n + 1))}><Plus /></Button>
            </div>
          </>
        )}

        {step === 'options' && (
          <>
            <h2 id="setup-title" className="text-xl font-semibold">Dish options</h2>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                <Label htmlFor="w-mods" className="block">
                  <span className="block text-sm font-medium">Options on dishes</span>
                  <span className="block text-xs font-normal text-muted-foreground">Like "no onions" or "extra cheese"</span>
                </Label>
                <Switch id="w-mods" checked={mods} onCheckedChange={setMods} />
              </div>
              {hasTakeaway(type) && (
                <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <Label htmlFor="w-viber" className="block">
                    <span className="block text-sm font-medium">Orders by Viber</span>
                    <span className="block text-xs font-normal text-muted-foreground">Mark orders that came by Viber and message customers</span>
                  </Label>
                  <Switch id="w-viber" checked={viber} onCheckedChange={setViber} />
                </div>
              )}
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2 id="setup-title" className="text-xl font-semibold">Check and finish</h2>
            <dl className="mt-5 divide-y rounded-md border text-sm">
              <div className="flex justify-between p-3"><dt className="text-muted-foreground">Business</dt><dd>{typeInfo.label}</dd></div>
              {hasTables(type) && <div className="flex justify-between p-3"><dt className="text-muted-foreground">Tables</dt><dd>{tableCount}</dd></div>}
              {type !== 'retail' && <div className="flex justify-between p-3"><dt className="text-muted-foreground">Options on dishes</dt><dd>{mods ? 'On' : 'Off'}</dd></div>}
              {hasTakeaway(type) && <div className="flex justify-between p-3"><dt className="text-muted-foreground">Orders by Viber</dt><dd>{viber ? 'On' : 'Off'}</dd></div>}
            </dl>
          </>
        )}

        {store.error && <p role="alert" className="mt-4 text-sm text-destructive">{store.error}</p>}
        {step !== 'welcome' && (
          <div className="mt-8 flex gap-2">
            <Button size="lg" onClick={back}>Back</Button>
            {step === 'confirm'
              ? <Button variant="primary" size="lg" className="flex-1" disabled={store.saving} onClick={finish}>{store.saving ? 'Saving…' : 'Finish setup'}</Button>
              : <Button variant="primary" size="lg" className="flex-1" onClick={next}>Next</Button>}
          </div>
        )}
      </div>
    </div>
  )
}
