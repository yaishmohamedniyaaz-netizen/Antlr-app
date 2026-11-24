import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useOpenShift, useSettings } from '@/data/hooks'
import { navItemsFor } from './nav'
import { AntlrMark } from '@/brand/AntlrMark'
import { AntlrLogo } from '@/brand/AntlrLogo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { SetupWizard } from '@/features/settings/SetupWizard'

export function AppLayout() {
  const settings = useSettings()
  const shift = useOpenShift()
  const [open, setOpen] = useState(false)
  const items = navItemsFor(settings.businessType)

  return (
    <div className="flex h-full">
      <aside className={cn('flex shrink-0 flex-col border-r bg-background', open ? 'w-[200px]' : 'w-16')}>
        <div className={cn('flex h-14 items-center border-b', open ? 'px-4' : 'justify-center')}>
          {open ? <AntlrLogo height={14} /> : <AntlrMark size={24} className="text-primary" />}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main">
          {items.map(({ path, label, icon: Icon }) => {
            const link = (
              <NavLink
                to={path}
                aria-label={open ? undefined : label}
                className={({ isActive }) =>
                  cn(
                    'flex h-10 items-center gap-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
                    open ? 'px-3' : 'justify-center',
                    isActive && 'bg-muted text-foreground',
                  )
                }
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                {open && label}
              </NavLink>
            )
            return open ? <div key={path}>{link}</div> : (
              <Tooltip key={path}>
                <TooltipTrigger asChild><div>{link}</div></TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse menu' : 'Expand menu'}
          className={cn('m-2 flex h-10 items-center gap-3 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground', open ? 'px-3' : 'justify-center')}
        >
          {open ? <PanelLeftClose className="size-[18px]" strokeWidth={1.75} /> : <PanelLeftOpen className="size-[18px]" strokeWidth={1.75} />}
          {open && 'Collapse'}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center gap-4 border-b bg-muted/40 px-6 text-xs">
          <span className="font-semibold">{settings.shopName}</span>
          <span className="text-muted-foreground">
            {shift ? `Shift: ${shift.operator} · since ${formatTime(shift.openedAt)}` : 'No open shift'}
          </span>
          <span className="ml-auto text-muted-foreground">Demo data</span>
        </div>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
      {!settings.guidedSetupDone && <SetupWizard />}
    </div>
  )
}
