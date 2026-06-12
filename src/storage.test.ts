import { describe, expect, it } from 'vitest'
import { loadStateFromJson, serializeState } from './storage'
import type { AppState } from './types'

describe('storage parsing', () => {
  it('falls back to initial state for missing or corrupt data', () => {
    expect(loadStateFromJson(null).entries).toEqual([])
    expect(loadStateFromJson('{bad json').entries).toEqual([])
  })

  it('accepts valid v2 state unchanged', () => {
    const state: AppState = {
      version: 2,
      exercises: [
        {
          id: 'pushups',
          name: 'Push-ups',
          isActive: true,
          createdAt: '2026-06-12T10:00:00.000+02:00',
          unit: 'reps',
          sortOrder: 0,
          dailyGoal: 50,
        },
      ],
      entries: [
        {
          id: 'entry-1',
          exerciseId: 'pushups',
          reps: 10,
          createdAt: '2026-06-12T10:00:00.000+02:00',
        },
      ],
      settings: { theme: 'dark' },
    }

    expect(loadStateFromJson(serializeState(state))).toEqual(state)
  })

  it('migrates v1 state to v2 without losing history', () => {
    const v1 = {
      version: 1,
      exercises: [
        {
          id: 'pushups',
          name: 'Push-ups',
          isActive: true,
          createdAt: '2026-06-12T10:00:00.000+02:00',
        },
        {
          id: 'plank',
          name: 'Plank',
          isActive: false,
          createdAt: '2026-06-12T10:00:00.000+02:00',
        },
      ],
      entries: [
        {
          id: 'entry-1',
          exerciseId: 'pushups',
          reps: 10,
          createdAt: '2026-06-12T10:00:00.000+02:00',
        },
      ],
    }

    const migrated = loadStateFromJson(JSON.stringify(v1))

    expect(migrated.version).toBe(2)
    expect(migrated.entries).toEqual(v1.entries)
    expect(migrated.exercises).toHaveLength(2)
    expect(migrated.exercises[0]).toMatchObject({
      id: 'pushups',
      unit: 'reps',
      sortOrder: 0,
    })
    expect(migrated.exercises[1]).toMatchObject({ id: 'plank', sortOrder: 1 })
    expect(migrated.settings).toEqual({ theme: 'system' })
  })

  it('rejects malformed state without throwing', () => {
    const loaded = loadStateFromJson(
      JSON.stringify({
        version: 1,
        exercises: [{ id: 'bad', name: 123, isActive: true, createdAt: 'now' }],
        entries: [],
      }),
    )

    expect(loaded.entries).toEqual([])
    expect(loaded.exercises.every((exercise) => typeof exercise.name === 'string')).toBe(
      true,
    )
  })
})
