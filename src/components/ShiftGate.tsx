import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useOpenShift } from '@/data/hooks'
import { Button } from '@/components/ui/button'

/** Shows children only while a shift is open. Otherwise asks the cashier to open one. */
export function ShiftGate({ children, message = 'Open a shift to start selling' }: { children: ReactNode; message?: string }) {
  const shift = useOpenShift()
  if (shift) return <>{children}</>
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/50 px-4 py-3">
      <span className="text-sm">{message}</span>
      <Button asChild size="sm" variant="primary"><Link to="/shifts">Open shift</Link></Button>
    </div>
  )
}
