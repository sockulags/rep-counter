import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addRepEntry,
  deleteExercise,
  deleteRepEntry,
  formatLongDate,
  getDailyTotals,
  getDateKey,
  getExerciseTotals,
  getPeriodRange,
  getTodayTotals,
  toggleExercise,
  updateExerciseName,
  updateRepEntry,
  upsertExercise,
  validateReps,
} from './domain'
import { clearStoredState, readStoredState, writeStoredState } from './storage'
import type { AppState, Exercise, PeriodPreset, RepEntry, ViewId } from './types'

const quickReps = [5, 10, 20]

const navItems: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'today', label: 'Idag', icon: '●' },
  { id: 'overview', label: 'Översikt', icon: '▦' },
  { id: 'exercises', label: 'Övningar', icon: '+' },
  { id: 'settings', label: 'Inställningar', icon: '⚙' },
]

type Snackbar = {
  entryId: string
  text: string
} | null

function App() {
  const [state, setState] = useState<AppState>(() => readStoredState())
  const [view, setView] = useState<ViewId>('today')
  const [today, setToday] = useState(() => new Date())
  const [activeIndex, setActiveIndex] = useState(0)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [snackbar, setSnackbar] = useState<Snackbar>(null)
  const submitLock = useRef(false)

  useEffect(() => {
    writeStoredState(state)
  }, [state])

  useEffect(() => {
    const refreshDate = () => setToday(new Date())
    window.addEventListener('focus', refreshDate)
    const timer = window.setInterval(refreshDate, 60_000)

    return () => {
      window.removeEventListener('focus', refreshDate)
      window.clearInterval(timer)
    }
  }, [])

  const activeExercises = useMemo(
    () => state.exercises.filter((exercise) => exercise.isActive),
    [state.exercises],
  )
  const todayKey = getDateKey(today)
  const todayTotals = useMemo(
    () => getTodayTotals(state.entries, todayKey),
    [state.entries, todayKey],
  )
  const displayIndex = activeExercises.length > 0 ? activeIndex % activeExercises.length : 0
  const selectedExercise = activeExercises[displayIndex]

  function persist(nextState: AppState) {
    setState(nextState)
  }

  function logReps(exercise: Exercise, reps: number) {
    if (submitLock.current) return
    submitLock.current = true
    window.setTimeout(() => {
      submitLock.current = false
    }, 350)

    const nextState = addRepEntry(state, exercise.id, reps)
    const entry = nextState.entries[0]
    persist(nextState)
    setInputs((current) => ({ ...current, [exercise.id]: '' }))
    setMessage('')
    setSnackbar(entry ? { entryId: entry.id, text: `+${reps} ${exercise.name}` } : null)
  }

  function submitManualReps(exercise: Exercise) {
    const result = validateReps(inputs[exercise.id] ?? '')

    if (!result.ok) {
      setMessage(result.message)
      return
    }

    logReps(exercise, result.reps)
  }

  function undoLatest() {
    if (!snackbar) return
    persist(deleteRepEntry(state, snackbar.entryId))
    setSnackbar(null)
  }

  function activateByName(name: string) {
    persist(upsertExercise(state, name, { isActive: true }))
    setView('today')
  }

  function resetAllData() {
    if (!window.confirm('Radera all data och börja om?')) return
    clearStoredState()
    setState(readStoredState())
    setSnackbar(null)
    setInputs({})
    setView('today')
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {view === 'today' ? (
          <TodayView
            activeExercises={activeExercises}
            activeIndex={displayIndex}
            dateLabel={formatLongDate(today)}
            inputs={inputs}
            message={message}
            selectedExercise={selectedExercise}
            setActiveIndex={setActiveIndex}
            setInputs={setInputs}
            todayTotal={todayTotals.total}
            totalsByExercise={todayTotals.byExercise}
            onActivateByName={activateByName}
            onLogQuick={logReps}
            onSubmitManual={submitManualReps}
          />
        ) : null}

        {view === 'overview' ? (
          <OverviewView
            entries={state.entries}
            exercises={state.exercises}
            onDeleteEntry={(entryId) => persist(deleteRepEntry(state, entryId))}
            onUpdateEntry={(entryId, reps) => persist(updateRepEntry(state, entryId, reps))}
          />
        ) : null}

        {view === 'exercises' ? (
          <ExercisesView
            exercises={state.exercises}
            entries={state.entries}
            onAdd={(name) => persist(upsertExercise(state, name, { isActive: true }))}
            onDelete={(exerciseId) => persist(deleteExercise(state, exerciseId))}
            onRename={(exerciseId, name) => persist(updateExerciseName(state, exerciseId, name))}
            onToggle={(exerciseId) => persist(toggleExercise(state, exerciseId))}
          />
        ) : null}

        {view === 'settings' ? <SettingsView onResetAllData={resetAllData} /> : null}
      </main>

      {snackbar ? (
        <div className="snackbar" role="status">
          <span>{snackbar.text}</span>
          <button type="button" onClick={undoLatest}>
            Ångra
          </button>
        </div>
      ) : null}

      <nav className="bottom-nav" aria-label="Huvudnavigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'nav-item active' : 'nav-item'}
            onClick={() => setView(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

type TodayViewProps = {
  activeExercises: Exercise[]
  activeIndex: number
  dateLabel: string
  inputs: Record<string, string>
  message: string
  selectedExercise?: Exercise
  setActiveIndex: (index: number) => void
  setInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>
  todayTotal: number
  totalsByExercise: Map<string, number>
  onActivateByName: (name: string) => void
  onLogQuick: (exercise: Exercise, reps: number) => void
  onSubmitManual: (exercise: Exercise) => void
}

function TodayView({
  activeExercises,
  activeIndex,
  dateLabel,
  inputs,
  message,
  selectedExercise,
  setActiveIndex,
  setInputs,
  todayTotal,
  totalsByExercise,
  onActivateByName,
  onLogQuick,
  onSubmitManual,
}: TodayViewProps) {
  const touchStart = useRef<number | null>(null)

  function move(direction: -1 | 1) {
    if (activeExercises.length < 2) return
    const nextIndex =
      (activeIndex + direction + activeExercises.length) % activeExercises.length
    setActiveIndex(nextIndex)
  }

  return (
    <section className="today-view">
      <header className="topbar">
        <p className="date-label">{dateLabel}</p>
        <h1>Reps idag</h1>
      </header>

      <div className="today-total">
        <span>Totalt idag</span>
        <strong>{todayTotal}</strong>
      </div>

      {!selectedExercise ? (
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
        <div
          className="exercise-carousel"
          onTouchStart={(event) => {
            touchStart.current = event.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return
            const delta = event.changedTouches[0].clientX - touchStart.current
            if (Math.abs(delta) > 36) move(delta > 0 ? -1 : 1)
            touchStart.current = null
          }}
        >
          <button
            type="button"
            className="ghost-arrow"
            aria-label="Föregående övning"
            onClick={() => move(-1)}
            disabled={activeExercises.length < 2}
          >
            ‹
          </button>

          <article className="exercise-card">
            <p className="eyebrow">
              {activeIndex + 1} av {activeExercises.length}
            </p>
            <h2>{selectedExercise.name}</h2>
            <div className="exercise-total">{totalsByExercise.get(selectedExercise.id) ?? 0}</div>
            <div className="dots" aria-hidden="true">
              {activeExercises.map((exercise, index) => (
                <span
                  key={exercise.id}
                  className={index === activeIndex ? 'dot active' : 'dot'}
                />
              ))}
            </div>

            <div className="quick-actions" aria-label="Snabbknappar">
              {quickReps.map((reps) => (
                <button
                  key={reps}
                  type="button"
                  onClick={() => onLogQuick(selectedExercise, reps)}
                >
                  +{reps}
                </button>
              ))}
            </div>

            <div className="manual-entry">
              <input
                aria-label={`Antal reps för ${selectedExercise.name}`}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Antal"
                type="number"
                min="1"
                value={inputs[selectedExercise.id] ?? ''}
                onChange={(event) =>
                  setInputs((current) => ({
                    ...current,
                    [selectedExercise.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onSubmitManual(selectedExercise)
                }}
              />
              <button type="button" onClick={() => onSubmitManual(selectedExercise)}>
                Lägg till
              </button>
            </div>
            {message ? <p className="form-message">{message}</p> : null}
          </article>

          <button
            type="button"
            className="ghost-arrow"
            aria-label="Nästa övning"
            onClick={() => move(1)}
            disabled={activeExercises.length < 2}
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}

type OverviewViewProps = {
  entries: RepEntry[]
  exercises: Exercise[]
  onDeleteEntry: (entryId: string) => void
  onUpdateEntry: (entryId: string, reps: number) => void
}

function OverviewView({ entries, exercises, onDeleteEntry, onUpdateEntry }: OverviewViewProps) {
  const [period, setPeriod] = useState<PeriodPreset>('7d')
  const [exerciseId, setExerciseId] = useState('all')
  const [customStart, setCustomStart] = useState(getDateKey(new Date()))
  const [customEnd, setCustomEnd] = useState(getDateKey(new Date()))
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const range =
    period === 'custom' ? { startKey: customStart, endKey: customEnd } : getPeriodRange(period)
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

  function saveEdit(entryId: string) {
    const result = validateReps(editValue)
    if (!result.ok) return
    onUpdateEntry(entryId, result.reps)
    setEditingEntryId(null)
    setEditValue('')
  }

  return (
    <section className="page-stack">
      <PageHeader title="Översikt" subtitle="Historik och korrigeringar" />

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
      ) : null}

      <div className="metric-card">
        <span>Totalt</span>
        <strong>{total}</strong>
        <span>reps</span>
      </div>

      <section className="panel">
        <h2>Per övning</h2>
        {Array.from(exerciseTotals.entries()).length === 0 ? (
          <p className="muted">Ingen data i perioden.</p>
        ) : (
          <div className="stat-list">
            {Array.from(exerciseTotals.entries()).map(([id, reps]) => (
              <div key={id} className="stat-row">
                <span>{exerciseById.get(id)?.name ?? 'Raderad övning'}</span>
                <strong>{reps}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Per dag</h2>
        {dailyTotals.length === 0 ? (
          <p className="muted">Ingen data i perioden.</p>
        ) : (
          <div className="bar-list">
            {dailyTotals.map((item) => (
              <div key={item.dateKey} className="bar-row">
                <span>{item.dateKey}</span>
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
                      onChange={(event) => setEditValue(event.target.value)}
                    />
                    <button type="button" onClick={() => saveEdit(entry.id)}>
                      Spara
                    </button>
                  </div>
                ) : (
                  <strong>{entry.reps}</strong>
                )}
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntryId(entry.id)
                      setEditValue(String(entry.reps))
                    }}
                  >
                    Ändra
                  </button>
                  <button type="button" className="danger-link" onClick={() => onDeleteEntry(entry.id)}>
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

type ExercisesViewProps = {
  exercises: Exercise[]
  entries: RepEntry[]
  onAdd: (name: string) => void
  onDelete: (exerciseId: string) => void
  onRename: (exerciseId: string, name: string) => void
  onToggle: (exerciseId: string) => void
}

function ExercisesView({ exercises, entries, onAdd, onDelete, onRename, onToggle }: ExercisesViewProps) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  )

  function addExercise() {
    if (!name.trim()) return
    onAdd(name)
    setName('')
  }

  function confirmDelete(exercise: Exercise) {
    const hasHistory = entries.some((entry) => entry.exerciseId === exercise.id)
    const message = hasHistory
      ? `Radera ${exercise.name} och all historik för övningen?`
      : `Radera ${exercise.name}?`

    if (window.confirm(message)) onDelete(exercise.id)
  }

  return (
    <section className="page-stack">
      <PageHeader title="Övningar" subtitle="Välj vad som syns på Idag" />

      <div className="add-exercise">
        <input
          aria-label="Ny övning"
          placeholder="Ny övning"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addExercise()
          }}
        />
        <button type="button" onClick={addExercise}>
          Lägg till
        </button>
      </div>

      <label className="search-field">
        Sök
        <input placeholder="Sök övning" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="exercise-list">
        {filteredExercises.map((exercise) => {
          const count = entries.filter((entry) => entry.exerciseId === exercise.id).length

          return (
            <article key={exercise.id} className="exercise-row">
              <div>
                <strong>{exercise.name}</strong>
                <span>{count > 0 ? `${count} registreringar` : 'Ingen historik'}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={exercise.isActive}
                aria-label={`${exercise.isActive ? 'Inaktivera' : 'Aktivera'} ${exercise.name}`}
                className={exercise.isActive ? 'switch active' : 'switch'}
                onClick={() => onToggle(exercise.id)}
              >
                <span />
              </button>
              <div className="row-actions">
                <button
                  type="button"
                  onClick={() => {
                    const nextName = window.prompt('Nytt namn', exercise.name)
                    if (nextName) onRename(exercise.id, nextName)
                  }}
                >
                  Byt namn
                </button>
                <button type="button" className="danger-link" onClick={() => confirmDelete(exercise)}>
                  Radera
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function SettingsView({ onResetAllData }: { onResetAllData: () => void }) {
  return (
    <section className="page-stack">
      <PageHeader title="Inställningar" subtitle="Lokal data och PWA" />
      <section className="panel">
        <h2>Lagring</h2>
        <p className="muted">
          All data sparas lokalt i webbläsaren på den här enheten. Ingen inloggning,
          backend eller synk används.
        </p>
      </section>
      <section className="panel">
        <h2>Återställ</h2>
        <p className="muted">Tar bort övningar och alla registreringar från localStorage.</p>
        <button type="button" className="danger-button" onClick={onResetAllData}>
          Radera all data
        </button>
      </section>
    </section>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}

export default App
