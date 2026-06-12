import type { AppState, Exercise, RepEntry } from './types'

const starterExerciseNames = [
  'Push-ups',
  'Pull-ups',
  'Squats',
  'Sit-ups',
  'Dips',
  'Lunges',
  'Plank',
  'Burpees',
  'Calf raises',
  'Crunches',
]

export function buildInitialState(now = new Date().toISOString()): AppState {
  return {
    version: 1,
    exercises: starterExerciseNames.map((name) => ({
      id: slugify(name),
      name,
      isActive: false,
      createdAt: now,
    })),
    entries: [],
  }
}

export function getStarterExerciseNames() {
  return starterExerciseNames
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return slug || createId('exercise')
}

export function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function getDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)
}

export function getTodayTotals(entries: RepEntry[], todayKey = getDateKey(new Date())) {
  const byExercise = new Map<string, number>()
  let total = 0

  for (const entry of entries) {
    if (getDateKey(entry.createdAt) !== todayKey) continue
    total += entry.reps
    byExercise.set(entry.exerciseId, (byExercise.get(entry.exerciseId) ?? 0) + entry.reps)
  }

  return { total, byExercise }
}

export function validateReps(rawValue: string) {
  const trimmed = rawValue.trim()
  const parsed = Number(trimmed)

  if (!trimmed || Number.isNaN(parsed)) {
    return { ok: false as const, message: 'Ange ett giltigt antal.' }
  }

  if (!Number.isInteger(parsed)) {
    return { ok: false as const, message: 'Ange ett heltal.' }
  }

  if (parsed < 1) {
    return { ok: false as const, message: 'Ange minst 1 rep.' }
  }

  return { ok: true as const, reps: parsed }
}

export function addRepEntry(
  state: AppState,
  exerciseId: string,
  reps: number,
  createdAt = new Date().toISOString(),
): AppState {
  const entry: RepEntry = {
    id: createId('entry'),
    exerciseId,
    reps,
    createdAt,
  }

  return { ...state, entries: [entry, ...state.entries] }
}

export function updateRepEntry(state: AppState, entryId: string, reps: number): AppState {
  return {
    ...state,
    entries: state.entries.map((entry) =>
      entry.id === entryId ? { ...entry, reps } : entry,
    ),
  }
}

export function deleteRepEntry(state: AppState, entryId: string): AppState {
  return { ...state, entries: state.entries.filter((entry) => entry.id !== entryId) }
}

export function upsertExercise(
  state: AppState,
  name: string,
  values: Partial<Pick<Exercise, 'isActive' | 'createdAt'>> = {},
): AppState {
  const trimmed = name.trim()
  const existing = state.exercises.find(
    (exercise) => exercise.name.toLowerCase() === trimmed.toLowerCase(),
  )

  if (existing) {
    return {
      ...state,
      exercises: state.exercises.map((exercise) =>
        exercise.id === existing.id
          ? { ...exercise, isActive: values.isActive ?? exercise.isActive }
          : exercise,
      ),
    }
  }

  return {
    ...state,
    exercises: [
      {
        id: uniqueExerciseId(state.exercises, trimmed),
        name: trimmed,
        isActive: values.isActive ?? true,
        createdAt: values.createdAt ?? new Date().toISOString(),
      },
      ...state.exercises,
    ],
  }
}

export function updateExerciseName(state: AppState, exerciseId: string, name: string): AppState {
  const trimmed = name.trim()

  if (!trimmed) return state

  return {
    ...state,
    exercises: state.exercises.map((exercise) =>
      exercise.id === exerciseId ? { ...exercise, name: trimmed } : exercise,
    ),
  }
}

export function toggleExercise(state: AppState, exerciseId: string): AppState {
  return {
    ...state,
    exercises: state.exercises.map((exercise) =>
      exercise.id === exerciseId ? { ...exercise, isActive: !exercise.isActive } : exercise,
    ),
  }
}

export function deleteExercise(state: AppState, exerciseId: string): AppState {
  return {
    ...state,
    exercises: state.exercises.filter((exercise) => exercise.id !== exerciseId),
    entries: state.entries.filter((entry) => entry.exerciseId !== exerciseId),
  }
}

export function getExerciseTotals(
  entries: RepEntry[],
  startKey: string,
  endKey: string,
  exerciseId = 'all',
) {
  const totals = new Map<string, number>()

  for (const entry of entries) {
    const dateKey = getDateKey(entry.createdAt)
    if (dateKey < startKey || dateKey > endKey) continue
    if (exerciseId !== 'all' && entry.exerciseId !== exerciseId) continue
    totals.set(entry.exerciseId, (totals.get(entry.exerciseId) ?? 0) + entry.reps)
  }

  return totals
}

export function getDailyTotals(
  entries: RepEntry[],
  startKey: string,
  endKey: string,
  exerciseId = 'all',
) {
  const totals = new Map<string, number>()

  for (const entry of entries) {
    const dateKey = getDateKey(entry.createdAt)
    if (dateKey < startKey || dateKey > endKey) continue
    if (exerciseId !== 'all' && entry.exerciseId !== exerciseId) continue
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + entry.reps)
  }

  return Array.from(totals.entries())
    .map(([dateKey, total]) => ({ dateKey, total }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

export function getPeriodRange(preset: string, now = new Date()) {
  const end = new Date(now)
  const start = new Date(now)

  if (preset === '7d') start.setDate(end.getDate() - 6)
  if (preset === '30d') start.setDate(end.getDate() - 29)
  if (preset === 'month') start.setDate(1)

  return { startKey: getDateKey(start), endKey: getDateKey(end) }
}

function uniqueExerciseId(exercises: Exercise[], name: string) {
  const base = slugify(name)
  const used = new Set(exercises.map((exercise) => exercise.id))

  if (!used.has(base)) return base

  let index = 2
  while (used.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}
