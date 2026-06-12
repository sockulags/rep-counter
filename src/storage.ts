import { buildInitialState } from './domain'
import type { AppState, Exercise, RepEntry } from './types'

export const STORAGE_KEY = 'repCounter:v1'

export function serializeState(state: AppState) {
  return JSON.stringify(state)
}

export function loadStateFromJson(rawValue: string | null): AppState {
  if (!rawValue) return buildInitialState()

  try {
    const parsed: unknown = JSON.parse(rawValue)

    if (isAppState(parsed)) return parsed
  } catch {
    return buildInitialState()
  }

  return buildInitialState()
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

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false
  if (value.version !== 1) return false
  if (!Array.isArray(value.exercises) || !Array.isArray(value.entries)) return false

  return value.exercises.every(isExercise) && value.entries.every(isRepEntry)
}

function isExercise(value: unknown): value is Exercise {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.isActive === 'boolean' &&
    typeof value.createdAt === 'string'
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
