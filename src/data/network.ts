/**
 * Pretends the demo data is behind a network, so screens are built to wait for saves and to handle failures.
 * Settings > Data has a switch that makes every save fail, to check the error messages.
 */
export const SAVE_FAILED_MESSAGE = "Couldn't save. Check the connection and try again."

let demo = { delayMs: import.meta.env.MODE === 'test' ? 0 : 250, fail: false }
const listeners = new Set<() => void>()

export const getDemoNetwork = () => demo
export function setDemoNetwork(patch: Partial<typeof demo>) {
  demo = { ...demo, ...patch }
  listeners.forEach((l) => l())
}
export function subscribeDemoNetwork(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Wraps a synchronous demo action so it answers like a server would: later, and sometimes with an error. */
export function overNetwork<A extends unknown[], R>(fn: (...args: A) => R) {
  return (...args: A): Promise<R> =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        if (demo.fail) return reject(new Error(SAVE_FAILED_MESSAGE))
        try { resolve(fn(...args)) } catch (e) { reject(e) }
      }, demo.delayMs)
    })
}
