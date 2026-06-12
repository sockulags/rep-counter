import { getLastEntryValue } from '../domain'
import type { Exercise, RepEntry } from '../types'
import { ExerciseCard } from './ExerciseCard'
import { FlameIcon } from './icons'
import { RestTimer } from './RestTimer'

type TodayViewProps = {
  activeExercises: Exercise[]
  entries: RepEntry[]
  dateLabel: string
  todayKey: string
  todayTotal: number
  totalsByExercise: Map<string, number>
  streak: number
  onActivateByName: (name: string) => void
  onLog: (exercise: Exercise, value: number, dateKey: string) => void
}

export function TodayView({
  activeExercises,
  entries,
  dateLabel,
  todayKey,
  todayTotal,
  totalsByExercise,
  streak,
  onActivateByName,
  onLog,
}: TodayViewProps) {
  return (
    <section className="today-view">
      <header className="topbar">
        <p className="date-label">{dateLabel}</p>
        <div className="topbar-row">
          <h1>Idag</h1>
          {streak > 0 ? (
            <span className="streak-chip" title="Dagar i rad med loggning">
              <FlameIcon size={16} />
              {streak} {streak === 1 ? 'dag' : 'dagar'}
            </span>
          ) : null}
        </div>
      </header>

      <div className="today-total">
        <span>Totalt idag</span>
        <strong>{todayTotal}</strong>
      </div>

      {activeExercises.length === 0 ? (
        <div className="empty-state">
          <h2>Inga aktiva övningar</h2>
          <p>Välj en vanlig övning eller skapa en egen för att börja logga.</p>
          <div className="suggestion-row">
            {['Push-ups', 'Pull-ups', 'Squats'].map((name) => (
              <button key={name} type="button" onClick={() => onActivateByName(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <RestTimer />
          <div className="exercise-card-list">
            {activeExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                todayTotal={totalsByExercise.get(exercise.id) ?? 0}
                lastValue={getLastEntryValue(entries, exercise.id)}
                todayKey={todayKey}
                onLog={onLog}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
