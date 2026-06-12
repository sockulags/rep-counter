import { useMemo } from 'react'
import { addDaysToKey, formatShortDate, getDailyTotals, parseDateKey } from '../domain'
import type { RepEntry } from '../types'

const weeksShown = 12

export function Heatmap({ entries, todayKey }: { entries: RepEntry[]; todayKey: string }) {
  const days = useMemo(() => {
    const mondayOffset = (parseDateKey(todayKey).getDay() + 6) % 7
    const startKey = addDaysToKey(todayKey, -(mondayOffset + (weeksShown - 1) * 7))
    return getDailyTotals(entries, startKey, todayKey)
  }, [entries, todayKey])

  const max = Math.max(1, ...days.map((day) => day.total))

  return (
    <div className="heatmap" role="img" aria-label={`Aktivitet senaste ${weeksShown} veckorna`}>
      {days.map((day) => {
        const intensity = day.total === 0 ? 0 : Math.min(4, Math.ceil((day.total / max) * 4))
        return (
          <span
            key={day.dateKey}
            className={`heatmap-cell level-${intensity}`}
            title={`${formatShortDate(day.dateKey)}: ${day.total}`}
          />
        )
      })}
    </div>
  )
}
