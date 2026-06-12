import type { AppState, Exercise, ExerciseUnit, Milestone, RepEntry } from './types'

const starterExercises: Array<{ name: string; unit: ExerciseUnit }> = [
  { name: 'Push-ups', unit: 'reps' },
  { name: 'Pull-ups', unit: 'reps' },
  { name: 'Squats', unit: 'reps' },
  { name: 'Sit-ups', unit: 'reps' },
  { name: 'Dips', unit: 'reps' },
  { name: 'Lunges', unit: 'reps' },
  { name: 'Plank', unit: 'seconds' },
  { name: 'Burpees', unit: 'reps' },
  { name: 'Calf raises', unit: 'reps' },
  { name: 'Crunches', unit: 'reps' },
]

export function buildInitialState(now = new Date().toISOString()): AppState {
  return {
    version: 2,
    exercises: starterExercises.map((starter, index) => ({
      id: slugify(starter.name),
      name: starter.name,
      isActive: false,
      createdAt: now,
      unit: starter.unit,
      sortOrder: index,
    })),
    entries: [],
    settings: { theme: 'system' },
  }
}

export function getStarterExerciseNames() {
  return starterExercises.map((starter) => starter.name)
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

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDaysToKey(dateKey: string, delta: number) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + delta)
  return getDateKey(date)
}

export function formatLongDate(value: Date) {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(value)
}

export function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(dateKey))
}

export function formatValue(value: number, unit: ExerciseUnit) {
  return unit === 'seconds' ? `${value} s` : `${value}`
}

export function getQuickValues(unit: ExerciseUnit) {
  return unit === 'seconds' ? [15, 30, 60] : [5, 10, 20]
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
  values: Partial<Pick<Exercise, 'isActive' | 'createdAt' | 'unit'>> = {},
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

  const minSortOrder = state.exercises.reduce(
    (min, exercise) => Math.min(min, exercise.sortOrder),
    0,
  )

  return {
    ...state,
    exercises: [
      {
        id: uniqueExerciseId(state.exercises, trimmed),
        name: trimmed,
        isActive: values.isActive ?? true,
        createdAt: values.createdAt ?? new Date().toISOString(),
        unit: values.unit ?? 'reps',
        sortOrder: minSortOrder - 1,
      },
      ...state.exercises,
    ],
  }
}

export function updateExercise(
  state: AppState,
  exerciseId: string,
  patch: Partial<Pick<Exercise, 'name' | 'unit' | 'dailyGoal'>>,
): AppState {
  return {
    ...state,
    exercises: state.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise

      const next = { ...exercise, ...patch }
      if (patch.name !== undefined) {
        const trimmed = patch.name.trim()
        next.name = trimmed || exercise.name
      }
      if (patch.dailyGoal !== undefined && !(patch.dailyGoal >= 1)) {
        delete next.dailyGoal
      }
      return next
    }),
  }
}

export function updateExerciseName(state: AppState, exerciseId: string, name: string): AppState {
  return updateExercise(state, exerciseId, { name })
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

export function sortExercises(exercises: Exercise[]) {
  return [...exercises].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function moveExercise(state: AppState, exerciseId: string, direction: -1 | 1): AppState {
  const ordered = sortExercises(state.exercises)
  const index = ordered.findIndex((exercise) => exercise.id === exerciseId)
  const targetIndex = index + direction

  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return state

  const next = [...ordered]
  ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]

  const orderById = new Map(next.map((exercise, position) => [exercise.id, position]))

  return {
    ...state,
    exercises: state.exercises.map((exercise) => ({
      ...exercise,
      sortOrder: orderById.get(exercise.id) ?? exercise.sortOrder,
    })),
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

const maxFilledDays = 400

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

  const result: Array<{ dateKey: string; total: number }> = []
  let cursor = startKey
  let guard = 0

  while (cursor <= endKey && guard < maxFilledDays) {
    result.push({ dateKey: cursor, total: totals.get(cursor) ?? 0 })
    cursor = addDaysToKey(cursor, 1)
    guard += 1
  }

  // Ranges longer than the fill guard fall back to data-only rows.
  if (cursor <= endKey) {
    for (const [dateKey, total] of totals) {
      if (dateKey >= cursor) result.push({ dateKey, total })
    }
    result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }

  return result
}

export function getPeriodRange(preset: string, now = new Date()) {
  const end = new Date(now)
  const start = new Date(now)

  if (preset === '7d') start.setDate(end.getDate() - 6)
  if (preset === '30d') start.setDate(end.getDate() - 29)
  if (preset === 'month') start.setDate(1)

  return { startKey: getDateKey(start), endKey: getDateKey(end) }
}

export function getCurrentStreak(entries: RepEntry[], todayKey = getDateKey(new Date())) {
  const days = new Set(entries.map((entry) => getDateKey(entry.createdAt)))
  let cursor = days.has(todayKey) ? todayKey : addDaysToKey(todayKey, -1)
  let streak = 0

  while (days.has(cursor)) {
    streak += 1
    cursor = addDaysToKey(cursor, -1)
  }

  return streak
}

export function getLongestStreak(entries: RepEntry[]) {
  const days = Array.from(new Set(entries.map((entry) => getDateKey(entry.createdAt)))).sort()
  let longest = 0
  let current = 0
  let previous: string | null = null

  for (const day of days) {
    current = previous !== null && addDaysToKey(previous, 1) === day ? current + 1 : 1
    longest = Math.max(longest, current)
    previous = day
  }

  return longest
}

export function getExerciseStats(entries: RepEntry[], exerciseId: string) {
  const byDay = new Map<string, number>()
  let allTime = 0
  let bestSet = 0
  let count = 0

  for (const entry of entries) {
    if (entry.exerciseId !== exerciseId) continue
    allTime += entry.reps
    bestSet = Math.max(bestSet, entry.reps)
    count += 1
    const dateKey = getDateKey(entry.createdAt)
    byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + entry.reps)
  }

  let bestDay: { dateKey: string; total: number } | null = null
  for (const [dateKey, total] of byDay) {
    if (!bestDay || total > bestDay.total) bestDay = { dateKey, total }
  }

  return { allTime, bestSet, bestDay, count }
}

export function getLastEntryValue(entries: RepEntry[], exerciseId: string) {
  // Entries are stored newest first.
  const latest = entries.find((entry) => entry.exerciseId === exerciseId)
  return latest ? latest.reps : null
}

export function getMilestones(entries: RepEntry[]): Milestone[] {
  let totalAll = 0
  const byDay = new Map<string, number>()

  for (const entry of entries) {
    totalAll += entry.reps
    const dateKey = getDateKey(entry.createdAt)
    byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + entry.reps)
  }

  let bestDayTotal = 0
  for (const total of byDay.values()) {
    bestDayTotal = Math.max(bestDayTotal, total)
  }

  const longestStreak = getLongestStreak(entries)

  return [
    { id: 'total-100', label: '100 reps totalt', achieved: totalAll >= 100 },
    { id: 'total-1000', label: '1 000 reps totalt', achieved: totalAll >= 1000 },
    { id: 'total-10000', label: '10 000 reps totalt', achieved: totalAll >= 10000 },
    { id: 'streak-3', label: '3 dagar i rad', achieved: longestStreak >= 3 },
    { id: 'streak-7', label: '7 dagar i rad', achieved: longestStreak >= 7 },
    { id: 'streak-30', label: '30 dagar i rad', achieved: longestStreak >= 30 },
    { id: 'day-100', label: '100 på en dag', achieved: bestDayTotal >= 100 },
    { id: 'day-300', label: '300 på en dag', achieved: bestDayTotal >= 300 },
  ]
}

function uniqueExerciseId(exercises: Exercise[], name: string) {
  const base = slugify(name)
  const used = new Set(exercises.map((exercise) => exercise.id))

  if (!used.has(base)) return base

  let index = 2
  while (used.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}
