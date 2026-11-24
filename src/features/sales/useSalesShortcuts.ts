import { useEffect, useRef } from 'react'

interface Handlers { focusSearch: () => void; pay: () => void; hold: () => void; discount: () => void }

/** / focuses search, F2 pays, F4 holds, F8 opens discount. Esc is handled by the dialogs. */
export function useSalesShortcuts(handlers: Handlers) {
  const ref = useRef(handlers)
  useEffect(() => { ref.current = handlers })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')
      if (document.querySelector('[role="dialog"]')) return
      if (e.key === '/' && !typing) { e.preventDefault(); ref.current.focusSearch() }
      else if (e.key === 'F2') { e.preventDefault(); ref.current.pay() }
      else if (e.key === 'F4') { e.preventDefault(); ref.current.hold() }
      else if (e.key === 'F8') { e.preventDefault(); ref.current.discount() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
