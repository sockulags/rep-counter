import { useMemo } from 'react'
import {
  addDaysToKey,
  formatShortDate,
  formatValue,
  getDailyTotals,
  getExerciseStats,
} from '../domain'
import { useCountUp } from '../hooks/useCountUp'
import type { Exercise, RepEntry } from '../types'
import { ChevronLeftIcon } from './icons'

const historyLimit = 15

type ExerciseDetailViewProps = {
  exercise: Exercise
  entries: RepEntry[]
  todayKey: string
  onBack: () => void
  onDeleteEntry: (entryId: string) => void
}

export function ExerciseDetailView({
  exercise,
  entries,
  todayKey,
  onBack,
  onDeleteEntry,
}: ExerciseDetailViewProps) {
  const stats = useMemo(() => getExerciseStats(entries, exercise.id), [entries, exercise.id])
  const animatedAllTime = useCountUp(stats.allTime)
  const dailyTotals = useMemo(
    () => getDailyTotals(entries, addDaysToKey(todayKey, -13), todayKey, exercise.id),
    [entries, todayKey, exercise.id],
  )
  const maxDailyTotal = Math.max(1, ...dailyTotals.map((item) => item.total))
  const exerciseEntries = entries
    .filter((entry) => entry.exerciseId === exercise.id)
    .slice(0, historyLimit)

  return (
    <section className="page-stack">
      <button type="button" className="back-button" onClick={onBack}>
        <ChevronLeftIcon size={16} />
        Översikt
      </button>

      <header className="page-header">
        <h1>{exercise.name}</h1>
        <p>Statistik och historik</p>
      </header>

      <div className="metric-card">
        <span>Totalt genom tiderna</span>
        <strong>{animatedAllTime}</strong>
        <span>{exercise.unit === 'seconds' ? 's' : 'reps'}</span>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span>Bästa dag</span>
          <strong>{stats.bestDay ? stats.bestDay.total : '–'}</strong>
          <small>{stats.bestDay ? formatShortDate(stats.bestDay.dateKey) : 'Ingen data'}</small>
        </div>
        <div className="stat-card">
          <span>Största set</span>
          <strong>{stats.bestSet > 0 ? formatValue(stats.bestSet, exercise.unit) : '–'}</strong>
          <small>{stats.count} registreringar</small>
        </div>
      </div>

      <section className="panel">
        <h2>Senaste 14 dagarna</h2>
        <div className="bar-list">
          {[...dailyTotals].reverse().map((item) => (
            <div key={item.dateKey} className="bar-row">
              <span>{formatShortDate(item.dateKey)}</span>
              <div className="bar-track">
                <span style={{ width: `${(item.total / maxDailyTotal) * 100}%` }} />
              </div>
              <strong>{item.total}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Senaste registreringar</h2>
        {exerciseEntries.length === 0 ? (
          <p className="muted">Ingen historik ännu.</p>
        ) : (
          <div className="entry-list">
            {exerciseEntries.map((entry) => (
              <div key={entry.id} className="entry-row">
                <div>
                  <strong>{formatValue(entry.reps, exercise.unit)}</strong>
                  <span>{new Date(entry.createdAt).toLocaleString('sv-SE')}</span>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => onDeleteEntry(entry.id)}
                  >
                    Radera
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
