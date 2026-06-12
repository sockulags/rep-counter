import { useEffect, useState } from 'react'

export function useToday() {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const refreshDate = () => setToday(new Date())
    window.addEventListener('focus', refreshDate)
    const timer = window.setInterval(refreshDate, 60_000)

    return () => {
      window.removeEventListener('focus', refreshDate)
      window.clearInterval(timer)
    }
  }, [])

  return today
}
