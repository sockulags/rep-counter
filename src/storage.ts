import { buildInitialState } from './domain'
import type { AppState, Exercise, RepEntry, ThemeChoice } from './types'

export const STORAGE_KEY = 'repCounter:v1'

export function serializeState(state: AppState) {
  return JSON.stringify(state)
}

export function loadStateFromJson(rawValue: string | null): AppState {
  if (!rawValue) return buildInitialState()

  try {
    const parsed: unknown = JSON.parse(rawValue)
    const migrated = migrateState(parsed)

    if (migrated) return migrated
  } catch {
    return buildInitialState()
  }

  return buildInitialState()
}

export function migrateState(value: unknown): AppState | null {
  if (isAppState(value)) return value
  if (isV1State(value)) {
    return {
      version: 2,
      exercises: value.exercises.map((exercise, index) => ({
        ...exercise,
        unit: 'reps',
        sortOrder: index,
      })),
      entries: value.entries,
      settings: { theme: 'system' },
    }
  }

  return null
}

export function readStoredState(storage = localStorage) {
  return loadStateFromJson(storage.getItem(STORAGE_KEY))
}

export function writeStoredState(state: AppState, storage = localStorage) {
  storage.setItem(STORAGE_KEY, serializeState(state))
}

export function clearStoredState(storage = localStorage) {
  storage.removeItem(STORAGE_KEY)
}

type V1Exercise = Omit<Exercise, 'unit' | 'sortOrder' | 'dailyGoal'>

type V1State = {
  version: 1
  exercises: V1Exercise[]
  entries: RepEntry[]
}

const themeChoices: ThemeChoice[] = ['system', 'light', 'dark']

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false
  if (value.version !== 2) return false
  if (!Array.isArray(value.exercises) || !Array.isArray(value.entries)) return false
  if (!isSettings(value.settings)) return false

  return value.exercises.every(isExercise) && value.entries.every(isRepEntry)
}

function isV1State(value: unknown): value is V1State {
  if (!isRecord(value)) return false
  if (value.version !== 1) return false
  if (!Array.isArray(value.exercises) || !Array.isArray(value.entries)) return false

  return value.exercises.every(isV1Exercise) && value.entries.every(isRepEntry)
}

function isSettings(value: unknown): value is AppState['settings'] {
  return isRecord(value) && themeChoices.includes(value.theme as ThemeChoice)
}

function isV1Exercise(value: unknown): value is V1Exercise {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.isActive === 'boolean' &&
    typeof value.createdAt === 'string'
  )
}

function isExercise(value: unknown): value is Exercise {
  if (!isV1Exercise(value)) return false

  const record = value as Record<string, unknown>
  return (
    (record.unit === 'reps' || record.unit === 'seconds') &&
    typeof record.sortOrder === 'number' &&
    (record.dailyGoal === undefined ||
      (typeof record.dailyGoal === 'number' && record.dailyGoal >= 1))
  )
}

function isRepEntry(value: unknown): value is RepEntry {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.exerciseId === 'string' &&
    typeof value.reps === 'number' &&
    Number.isInteger(value.reps) &&
    value.reps > 0 &&
    typeof value.createdAt === 'string'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
