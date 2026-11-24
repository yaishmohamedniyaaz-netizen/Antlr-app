import { MARK_PATH, MARK_VIEWBOX, SMALL_PATH, SMALL_VIEWBOX, TINY_PATH, TINY_VIEWBOX } from './logoPaths'

/**
 * The Antlr antler mark, always 3 points per side.
 * Small sizes use bolder versions drawn on a pixel grid so the bars stay sharp:
 * 18 px and below → 16-pixel version, 24 px and below → 12-unit version.
 */
export function AntlrMark({ size = 24, className }: { size?: number; className?: string }) {
  const [vb, d] = size <= 18 ? [TINY_VIEWBOX, TINY_PATH] : size <= 24 ? [SMALL_VIEWBOX, SMALL_PATH] : [MARK_VIEWBOX, MARK_PATH]
  const [, , w, h] = vb.split(' ').map(Number)
  return (
    <svg role="img" aria-label="Antlr" viewBox={vb} height={size} width={(size * w) / h} className={className}>
      <path fill="currentColor" d={d} />
    </svg>
  )
}
