import { describe, expect, it } from 'vitest'
import { loadStateFromJson, serializeState } from './storage'
import type { AppState } from './types'

describe('storage parsing', () => {
  it('falls back to initial state for missing or corrupt data', () => {
    expect(loadStateFromJson(null).entries).toEqual([])
    expect(loadStateFromJson('{bad json').entries).toEqual([])
  })

  it('accepts valid versioned state', () => {
    const state: AppState = {
      version: 1,
      exercises: [
        {
          id: 'pushups',
          name: 'Push-ups',
          isActive: true,
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

    expect(loadStateFromJson(serializeState(state))).toEqual(state)
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
