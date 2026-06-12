import { useEffect, useState } from 'react'

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function useCountUp(target: number, durationMs = 600) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    const reduced = prefersReducedMotion()
    const start = performance.now()

    let frame = requestAnimationFrame(function tick(now: number) {
      const progress = reduced ? 1 : Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    })
    // Snaps to the final value even if rAF is throttled or suspended.
    const safety = window.setTimeout(() => setValue(target), durationMs + 100)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(safety)
    }
  }, [target, durationMs])

  return value
}
