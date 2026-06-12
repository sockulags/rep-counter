import { useEffect, useMemo, useRef, useState } from 'react'
import { BottomNav } from './components/BottomNav'
import { ExerciseDetailView } from './components/ExerciseDetailView'
import { ExercisesView } from './components/ExercisesView'
import { OverviewView } from './components/OverviewView'
import { SettingsView } from './components/SettingsView'
import { Snackbar } from './components/Snackbar'
import { TodayView } from './components/TodayView'
import {
  addRepEntry,
  buildInitialState,
  deleteExercise,
  deleteRepEntry,
  formatLongDate,
  formatValue,
  getCurrentStreak,
  getDateKey,
  getTodayTotals,
  moveExercise,
  sortExercises,
  toggleExercise,
  updateExercise,
  updateRepEntry,
  upsertExercise,
} from './domain'
import { useAppState } from './hooks/useAppState'
import { useToday } from './hooks/useToday'
import { clearStoredState } from './storage'
import type { AppState, Exercise, ThemeChoice, ViewId } from './types'

const snackbarDurationMs = 4500
const viewIds: ViewId[] = ['today', 'overview', 'exercises', 'settings']
const themeColors: Record<'light' | 'dark', string> = {
  light: '#f6f7f5',
  dark: '#101311',
}

function getInitialView(): ViewId {
  const requested = new URLSearchParams(window.location.search).get('view')
  return viewIds.includes(requested as ViewId) ? (requested as ViewId) : 'today'
}

type SnackbarState = {
  text: string
  undoState: AppState
} | null

function App() {
  const [state, setState] = useAppState()
  const [view, setView] = useState<ViewId>(getInitialView)
  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>(null)
  const today = useToday()
  const submitLock = useRef(false)

  const theme = state.settings.theme

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (!snackbar) return
    const timer = window.setTimeout(() => setSnackbar(null), snackbarDurationMs)
    return () => window.clearTimeout(timer)
  }, [snackbar])

  const activeExercises = useMemo(
    () => sortExercises(state.exercises.filter((exercise) => exercise.isActive)),
    [state.exercises],
  )
  const todayKey = getDateKey(today)
  const todayTotals = useMemo(
    () => getTodayTotals(state.entries, todayKey),
    [state.entries, todayKey],
  )
  const streak = useMemo(
    () => getCurrentStreak(state.entries, todayKey),
    [state.entries, todayKey],
  )
  const detailExercise = detailExerciseId
    ? state.exercises.find((exercise) => exercise.id === detailExerciseId)
    : undefined

  function persist(nextState: AppState) {
    setSnackbar(null)
    setState(nextState)
  }

  function persistWithUndo(nextState: AppState, text: string) {
    setSnackbar({ text, undoState: state })
    setState(nextState)
  }

  function undo() {
    if (!snackbar) return
    setState(snackbar.undoState)
    setSnackbar(null)
  }

  function logValue(exercise: Exercise, value: number, dateKey: string) {
    if (submitLock.current) return
    submitLock.current = true
    window.setTimeout(() => {
      submitLock.current = false
    }, 350)

    const createdAt =
      dateKey === todayKey
        ? new Date().toISOString()
        : new Date(`${dateKey}T12:00:00`).toISOString()

    navigator.vibrate?.(10)
    persistWithUndo(
      addRepEntry(state, exercise.id, value, createdAt),
      `+${formatValue(value, exercise.unit)} ${exercise.name}`,
    )
  }

  function navigate(nextView: ViewId) {
    setDetailExerciseId(null)
    setView(nextView)
  }

  function resetAllData() {
    clearStoredState()
    setSnackbar(null)
    setState(buildInitialState())
    setDetailExerciseId(null)
    setView('today')
  }

  return (
    <div className="app-shell">
      <main className="screen">
        {view === 'today' ? (
          <TodayView
            activeExercises={activeExercises}
            entries={state.entries}
            dateLabel={formatLongDate(today)}
            todayKey={todayKey}
            todayTotal={todayTotals.total}
            totalsByExercise={todayTotals.byExercise}
            streak={streak}
            onActivateByName={(name) => persist(upsertExercise(state, name, { isActive: true }))}
            onLog={logValue}
          />
        ) : null}

        {view === 'overview' && detailExercise ? (
          <ExerciseDetailView
            exercise={detailExercise}
            entries={state.entries}
            todayKey={todayKey}
            onBack={() => setDetailExerciseId(null)}
            onDeleteEntry={(entryId) =>
              persistWithUndo(deleteRepEntry(state, entryId), 'Registrering raderad')
            }
          />
        ) : null}

        {view === 'overview' && !detailExercise ? (
          <OverviewView
            entries={state.entries}
            exercises={state.exercises}
            todayKey={todayKey}
            onDeleteEntry={(entryId) =>
              persistWithUndo(deleteRepEntry(state, entryId), 'Registrering raderad')
            }
            onUpdateEntry={(entryId, reps) => persist(updateRepEntry(state, entryId, reps))}
            onOpenDetail={setDetailExerciseId}
          />
        ) : null}

        {view === 'exercises' ? (
          <ExercisesView
            exercises={state.exercises}
            entries={state.entries}
            onAdd={(name) => persist(upsertExercise(state, name, { isActive: true }))}
            onDelete={(exercise) =>
              persistWithUndo(deleteExercise(state, exercise.id), `${exercise.name} raderad`)
            }
            onMove={(exerciseId, direction) => persist(moveExercise(state, exerciseId, direction))}
            onToggle={(exerciseId) => persist(toggleExercise(state, exerciseId))}
            onUpdate={(exerciseId, patch) => persist(updateExercise(state, exerciseId, patch))}
          />
        ) : null}

        {view === 'settings' ? (
          <SettingsView
            theme={theme}
            onThemeChange={(nextTheme: ThemeChoice) =>
              persist({ ...state, settings: { ...state.settings, theme: nextTheme } })
            }
            onResetAllData={resetAllData}
          />
        ) : null}
      </main>

      {snackbar ? <Snackbar text={snackbar.text} onUndo={undo} /> : null}

      <BottomNav view={view} onNavigate={navigate} />
    </div>
  )
}

function applyTheme(theme: ThemeChoice) {
  const root = document.documentElement

  if (theme === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = theme
  }

  const resolved =
    theme === 'system'
      ? typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => {
      const media = meta.getAttribute('media')
      meta.content =
        theme === 'system' && media
          ? media.includes('dark')
            ? themeColors.dark
            : themeColors.light
          : themeColors[resolved]
    })
}

export default App
