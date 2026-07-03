import { useState } from 'react'
import { formatValue, getQuickValues, validateReps } from '../domain'
import type { Exercise } from '../types'
import { CheckIcon } from './icons'

type ExerciseCardProps = {
  exercise: Exercise
  todayTotal: number
  lastValue: number | null
  todayKey: string
  onLog: (exercise: Exercise, value: number, dateKey: string) => void
}

export function ExerciseCard({
  exercise,
  todayTotal,
  lastValue,
  todayKey,
  onLog,
}: ExerciseCardProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showDate, setShowDate] = useState(false)
  const [dateKey, setDateKey] = useState(todayKey)
  const [pulseCount, setPulseCount] = useState(0)
  const [previousTotal, setPreviousTotal] = useState(todayTotal)

  if (todayTotal !== previousTotal) {
    setPreviousTotal(todayTotal)
    if (todayTotal > previousTotal) setPulseCount(pulseCount + 1)
  }

  const goal = exercise.dailyGoal
  const goalMet = goal !== undefined && todayTotal >= goal
  const logDateKey = showDate ? dateKey : todayKey
  const errorId = `${exercise.id}-input-error`

  function log(value: number) {
    setError('')
    onLog(exercise, value, logDateKey)
  }

  function submitManual() {
    const result = validateReps(input)

    if (!result.ok) {
      setError(result.message)
      return
    }

    setInput('')
    log(result.reps)
  }

  return (
    <article className={goalMet ? 'exercise-card goal-met' : 'exercise-card'}>
      <div className="exercise-card-head">
        <div>
          <h2>{exercise.name}</h2>
          {goal !== undefined ? (
            <p className="goal-label">
              {goalMet ? (
                <>
                  <CheckIcon size={14} /> Mål nått
                </>
              ) : (
                `Mål ${formatValue(goal, exercise.unit)}`
              )}
            </p>
          ) : null}
        </div>
        <span className="exercise-card-total" key={pulseCount}>
          <strong className={pulseCount > 0 ? 'pulse' : undefined}>{todayTotal}</strong>
          {exercise.unit === 'seconds' ? <small>s</small> : null}
        </span>
      </div>

      {goal !== undefined ? (
        <div
          className="goal-track"
          role="progressbar"
          aria-label={`Dagligt mål för ${exercise.name}`}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={Math.min(todayTotal, goal)}
        >
          <span style={{ width: `${Math.min(100, (todayTotal / goal) * 100)}%` }} />
        </div>
      ) : null}

      <div className="quick-actions">
        {getQuickValues(exercise.unit).map((value) => (
          <button key={value} type="button" className="quick-button" onClick={() => log(value)}>
            +{value}
          </button>
        ))}
        {lastValue !== null ? (
          <button type="button" className="quick-button repeat" onClick={() => log(lastValue)}>
            +{lastValue} igen
          </button>
        ) : null}
      </div>

      <div className="manual-entry">
        <input
          aria-label={`Antal för ${exercise.name}`}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={exercise.unit === 'seconds' ? 'Sekunder' : 'Antal'}
          type="number"
          min="1"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={input}
          onChange={(event) => {
            setInput(event.target.value)
            if (error) setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitManual()
          }}
        />
        <button type="button" className="primary-button" onClick={submitManual}>
          Lägg till
        </button>
      </div>

      <div className="card-footer">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setShowDate((value) => !value)
            setDateKey(todayKey)
          }}
        >
          {showDate ? 'Logga idag' : 'Annat datum'}
        </button>
        {showDate ? (
          <input
            aria-label={`Datum för ${exercise.name}`}
            className="date-input"
            type="date"
            max={todayKey}
            value={dateKey}
            onChange={(event) => setDateKey(event.target.value || todayKey)}
          />
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="form-message" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  )
}
