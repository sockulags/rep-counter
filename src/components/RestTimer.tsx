import { useEffect, useState } from 'react'
import { TimerIcon } from './icons'

const presets = [60, 90, 120]

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`
}

export function RestTimer() {
  const [duration, setDuration] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (duration === null) return

    const endsAt = Date.now() + duration * 1000
    const timer = window.setInterval(() => {
      const secondsLeft = Math.ceil((endsAt - Date.now()) / 1000)

      if (secondsLeft <= 0) {
        navigator.vibrate?.([120, 80, 120])
        setDuration(null)
        setRemaining(null)
        setFinished(true)
        return
      }

      setRemaining(secondsLeft)
    }, 250)

    return () => window.clearInterval(timer)
  }, [duration])

  useEffect(() => {
    if (!finished) return
    const timer = window.setTimeout(() => setFinished(false), 4000)
    return () => window.clearTimeout(timer)
  }, [finished])

  function start(seconds: number) {
    setFinished(false)
    setRemaining(null)
    setDuration(seconds)
  }

  function cancel() {
    setDuration(null)
    setRemaining(null)
  }

  if (duration !== null) {
    return (
      <div className="rest-timer running" role="timer">
        <TimerIcon size={16} />
        <strong>{formatSeconds(remaining ?? duration)}</strong>
        <span className="muted">vila</span>
        <button type="button" className="text-button" onClick={cancel}>
          Avbryt
        </button>
      </div>
    )
  }

  return (
    <div className="rest-timer">
      <TimerIcon size={16} />
      <span className="muted">Vila</span>
      {presets.map((seconds) => (
        <button key={seconds} type="button" className="chip" onClick={() => start(seconds)}>
          {formatSeconds(seconds)}
        </button>
      ))}
      {finished ? <span className="rest-done">Vilan är klar</span> : null}
    </div>
  )
}
