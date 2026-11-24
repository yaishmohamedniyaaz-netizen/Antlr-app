import { AntlrMark } from './AntlrMark'
import { WORD_PATH, WORD_VIEWBOX } from './logoPaths'

/** Mark + "Antlr" word. `height` is the cap height of the word; the mark is 1.3× that. */
export function AntlrLogo({ height = 16, className }: { height?: number; className?: string }) {
  const [, , w, h] = WORD_VIEWBOX.split(' ').map(Number)
  const raw = Math.round(height * 1.3)
  // small marks snap to the sizes they were drawn for, so the bars stay sharp
  const markSize = raw <= 20 ? 16 : raw <= 28 ? 24 : raw
  return (
    <span className={`inline-flex items-center ${className ?? ''}`} style={{ gap: Math.round(markSize * 0.28) }}>
      <AntlrMark size={markSize} className="text-primary" />
      <svg aria-hidden viewBox={WORD_VIEWBOX} height={height} width={(height * w) / h}>
        <path fill="currentColor" d={WORD_PATH} />
      </svg>
    </span>
  )
}
