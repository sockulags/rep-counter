import { useMemo, useState } from 'react'
import {
  formatShortDate,
  getDailyTotals,
  getDateKey,
  getExerciseTotals,
  getMilestones,
  getPeriodRange,
  validateReps,
} from '../domain'
import type { Exercise, PeriodPreset, RepEntry } from '../types'
import { Heatmap } from './Heatmap'
import { ChevronRightIcon, TrophyIcon } from './icons'
import { PageHeader } from './PageHeader'

type OverviewViewProps = {
  entries: RepEntry[]
  exercises: Exercise[]
  todayKey: string
  onDeleteEntry: (entryId: string) => void
  onUpdateEntry: (entryId: string, reps: number) => void
  onOpenDetail: (exerciseId: string) => void
}

export function OverviewView({
  entries,
  exercises,
  todayKey,
  onDeleteEntry,
  onUpdateEntry,
  onOpenDetail,
}: OverviewViewProps) {
  const [period, setPeriod] = useState<PeriodPreset>('7d')
  const [exerciseId, setExerciseId] = useState('all')
  const [customStart, setCustomStart] = useState(todayKey)
  const [customEnd, setCustomEnd] = useState(todayKey)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editError, setEditError] = useState('')

  const customInvalid = period === 'custom' && customStart > customEnd
  const range =
    period === 'custom'
      ? customInvalid
        ? { startKey: customEnd, endKey: customStart }
        : { startKey: customStart, endKey: customEnd }
      : getPeriodRange(period)

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  )
  const filteredEntries = entries.filter((entry) => {
    const key = getDateKey(entry.createdAt)
    return (
      key >= range.startKey &&
      key <= range.endKey &&
      (exerciseId === 'all' || entry.exerciseId === exerciseId)
    )
  })
  const total = filteredEntries.reduce((sum, entry) => sum + entry.reps, 0)
  const exerciseTotals = getExerciseTotals(entries, range.startKey, range.endKey, exerciseId)
  const dailyTotals = getDailyTotals(entries, range.startKey, range.endKey, exerciseId)
  const maxDailyTotal = Math.max(1, ...dailyTotals.map((item) => item.total))
  const milestones = getMilestones(entries)
  const achievedCount = milestones.filter((milestone) => milestone.achieved).length

  function startEdit(entry: RepEntry) {
    setEditingEntryId(entry.id)
    setEditValue(String(entry.reps))
    setEditError('')
  }

  function cancelEdit() {
    setEditingEntryId(null)
    setEditValue('')
    setEditError('')
  }

  function saveEdit(entryId: string) {
    const result = validateReps(editValue)

    if (!result.ok) {
      setEditError(result.message)
      return
    }

    onUpdateEntry(entryId, result.reps)
    cancelEdit()
  }

  return (
    <section className="page-stack">
      <PageHeader title="Översikt" subtitle="Historik och korrigeringar" />

      <section className="panel">
        <h2>Aktivitet</h2>
        <Heatmap entries={entries} todayKey={todayKey} />
      </section>

      <div className="filter-grid">
        <label>
          Period
          <select value={period} onChange={(event) => setPeriod(event.target.value as PeriodPreset)}>
            <option value="today">Idag</option>
            <option value="7d">Senaste 7 dagarna</option>
            <option value="30d">Senaste 30 dagarna</option>
            <option value="month">Denna månad</option>
            <option value="custom">Intervall</option>
          </select>
        </label>
        <label>
          Övning
          <select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>
            <option value="all">Alla övningar</option>
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {period === 'custom' ? (
        <>
          <div className="filter-grid">
            <label>
              Från
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label>
              Till
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
          </div>
          {customInvalid ? (
            <p className="form-message">Startdatumet ligger efter slutdatumet — visar intervallet omvänt.</p>
          ) : null}
        </>
      ) : null}

      <div className="metric-card">
        <span>Totalt</span>
        <strong>{total}</strong>
        <span>reps</span>
      </div>

      <section className="panel">
        <h2>Per övning</h2>
        {exerciseTotals.size === 0 ? (
          <p className="muted">Ingen data i perioden.</p>
        ) : (
          <div className="stat-list">
            {Array.from(exerciseTotals.entries()).map(([id, reps]) => {
              const exercise = exerciseById.get(id)
              return exercise ? (
                <button
                  key={id}
                  type="button"
                  className="stat-row linked"
                  onClick={() => onOpenDetail(id)}
                >
                  <span>{exercise.name}</span>
                  <strong>{reps}</strong>
                  <ChevronRightIcon size={16} />
                </button>
              ) : (
                <div key={id} className="stat-row">
                  <span>Raderad övning</span>
                  <strong>{reps}</strong>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Per dag</h2>
        {dailyTotals.length === 0 ? (
          <p className="muted">Ingen data i perioden.</p>
        ) : (
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
        )}
      </section>

      <section className="panel">
        <h2>Milstolpar</h2>
        <p className="muted">
          {achievedCount} av {milestones.length} uppnådda
        </p>
        <div className="milestone-grid">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={milestone.achieved ? 'milestone achieved' : 'milestone'}
            >
              <TrophyIcon size={16} />
              <span>{milestone.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Registreringar</h2>
        {filteredEntries.length === 0 ? (
          <p className="muted">Inga registreringar matchar filtret.</p>
        ) : (
          <div className="entry-list">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="entry-row">
                <div>
                  <strong>{exerciseById.get(entry.exerciseId)?.name ?? 'Raderad övning'}</strong>
                  <span>{new Date(entry.createdAt).toLocaleString('sv-SE')}</span>
                </div>
                {editingEntryId === entry.id ? (
                  <div className="entry-edit">
                    <input
                      aria-label="Ändra reps"
                      inputMode="numeric"
                      type="number"
                      min="1"
                      value={editValue}
                      onChange={(event) => {
                        setEditValue(event.target.value)
                        if (editError) setEditError('')
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveEdit(entry.id)
                        if (event.key === 'Escape') cancelEdit()
                      }}
                    />
                    <button type="button" className="primary-button" onClick={() => saveEdit(entry.id)}>
                      Spara
                    </button>
                    <button type="button" className="text-button" onClick={cancelEdit}>
                      Avbryt
                    </button>
                    {editError ? <p className="form-message">{editError}</p> : null}
                  </div>
                ) : (
                  <>
                    <strong>{entry.reps}</strong>
                    <div className="row-actions">
                      <button type="button" onClick={() => startEdit(entry)}>
                        Ändra
                      </button>
                      <button
                        type="button"
                        className="danger-link"
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        Radera
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
