import { useCallback, useState } from 'react'

export const errorMessage = (e: unknown) => (e instanceof Error && e.message ? e.message : "Couldn't save. Try again.")

/** Tracks one save: `saving` while it runs, `error` if it failed. `run` resolves to the result, or undefined on failure. */
export function useSave() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const run = useCallback(async <T,>(work: () => Promise<T>): Promise<T | undefined> => {
    setSaving(true)
    setError('')
    try {
      return await work()
    } catch (e) {
      setError(errorMessage(e))
      return undefined
    } finally {
      setSaving(false)
    }
  }, [])
  return { run, saving, error, setError }
}
