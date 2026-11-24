import type { ReactNode } from 'react'

export function PageHeader({ title, actions, children }: { title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b px-6">
      <h1 className="text-base font-semibold">{title}</h1>
      {children}
      <div className="ml-auto flex items-center gap-2">{actions}</div>
    </header>
  )
}
