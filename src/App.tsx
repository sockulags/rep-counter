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
import { clearStoredState, serializeState } from './storage'
import type { AppState, Exercise, ThemeChoice, ViewId } from './types'

const snackbarDurationMs = 4500
const viewIds: ViewId[] = ['today', 'overview', 'exercises', 'settings']
const themeColors: Record<'light' | 'dark', string> = {
  light: '#f6f7f5',
  dark: '#101311',
}

type ViewLocation = {
  view: ViewId
  detailExerciseId: string | null
}

function readViewLocation(): ViewLocation {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('view')
  const view = viewIds.includes(requested as ViewId) ? (requested as ViewId) : 'today'
  const exercise = params.get('exercise')
  return { view, detailExerciseId: view === 'overview' ? exercise : null }
}

function viewLocationToUrl({ view, detailExerciseId }: ViewLocation): string {
  const params = new URLSearchParams()
  if (view !== 'today') params.set('view', view)
  if (detailExerciseId) params.set('exercise', detailExerciseId)
  const query = params.toString()
  return `${window.location.pathname}${query ? `?${query}` : ''}`
}

function pushViewLocation(next: ViewLocation) {
  window.history.pushState(next, '', viewLocationToUrl(next))
}

function replaceViewLocation(next: ViewLocation) {
  window.history.replaceState(next, '', viewLocationToUrl(next))
}

type SnackbarState = {
  text: string
  undoState: AppState
} | null

function App() {
  const [state, setState] = useAppState()
  const [view, setView] = useState<ViewId>(() => readViewLocation().view)
  const [detailExerciseId, setDetailExerciseId] = useState<string | null>(
    () => readViewLocation().detailExerciseId,
  )
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

  useEffect(() => {
    // Attach a state object to the entry the app loaded on, so back navigation
    // that lands here can restore the correct view via popstate.
    replaceViewLocation({ view, detailExerciseId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const next = (event.state as ViewLocation | null) ?? readViewLocation()
      setView(next.view)
      setDetailExerciseId(next.detailExerciseId ?? null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
    if (nextView === view && detailExerciseId === null) return
    setDetailExerciseId(null)
    setView(nextView)
    pushViewLocation({ view: nextView, detailExerciseId: null })
  }

  function openDetail(exerciseId: string) {
    setDetailExerciseId(exerciseId)
    pushViewLocation({ view: 'overview', detailExerciseId: exerciseId })
  }

  function closeDetail() {
    // Step back through browser history so the detail entry is popped and the
    // Android hardware back button stays in sync with the in-app back control.
    window.history.back()
  }

  function exportData() {
    const blob = new Blob([serializeState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `rep-counter-${todayKey}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function resetAllData() {
    clearStoredState()
    setSnackbar(null)
    setState(buildInitialState())
    setDetailExerciseId(null)
    setView('today')
    replaceViewLocation({ view: 'today', detailExerciseId: null })
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
            onBack={closeDetail}
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
            onOpenDetail={openDetail}
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
            onExportData={exportData}
            onImportData={(nextState) => persistWithUndo(nextState, 'Data importerad')}
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
