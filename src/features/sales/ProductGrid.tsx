import { useNavigate } from 'react-router'
import type { Category, Product } from '@/types'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { formatMvr } from '@/lib/money'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/EmptyState'

export function CategoryTabs({ categories, active, onChange }: { categories: Category[]; active: string; onChange: (id: string) => void }) {
  const tabs = [{ id: 'all', name: 'All' }, ...categories]
  return (
    <div role="tablist" aria-label="Categories" className="flex gap-5 overflow-x-auto border-b [scrollbar-width:none]">
      {tabs.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={active === c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            '-mb-px h-10 shrink-0 border-b-2 text-sm',
            active === c.id ? 'border-foreground font-medium text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}

export function ProductGrid({ products, onAdd, onHide }: { products: Product[]; onAdd: (p: Product) => void; onHide: (p: Product) => void }) {
  const navigate = useNavigate()
  if (!products.length) return <EmptyState title="No products found" body="Try another name or barcode, or pick a different category." />
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] content-start gap-2">
      {products.map((p) => {
        const out = p.trackStock && p.currentStock <= 0
        const low = p.trackStock && !out && p.currentStock <= p.lowStockThreshold
        return (
          <ContextMenu key={p.id}>
            <ContextMenuTrigger asChild>
              <button
                type="button"
                disabled={out}
                onClick={() => onAdd(p)}
                aria-label={`${p.name}, ${formatMvr(p.price)}${out ? ', out of stock' : ''}`}
                className={cn(
                  'flex min-h-[76px] flex-col justify-between gap-2 rounded-md border bg-background p-3 text-left hover:border-foreground/30 active:bg-muted',
                  out && 'cursor-not-allowed bg-muted/60',
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className={cn('line-clamp-2 text-sm font-medium', out && 'text-muted-foreground')}>{p.name}</span>
                  {p.imageUrl && <img src={p.imageUrl} alt="" className="size-9 shrink-0 rounded object-cover" />}
                </span>
                <span className="flex items-center justify-between text-sm">
                  <span className={cn('tabular-nums', out ? 'text-muted-foreground' : 'text-muted-foreground')}>{formatMvr(p.price)}</span>
                  {out && <span className="text-xs text-destructive">Out of stock</span>}
                  {low && <span className="text-xs text-warning">{p.currentStock} left</span>}
                </span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => navigate(`/products?edit=${p.id}`)}>Edit product</ContextMenuItem>
              <ContextMenuItem onSelect={() => onHide(p)}>Hide from grid</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      })}
    </div>
  )
}
