import { describe, expect, it } from 'vitest'
import {
  addRepEntry,
  buildInitialState,
  deleteRepEntry,
  getCurrentStreak,
  getDailyTotals,
  getDateKey,
  getExerciseStats,
  getExerciseTotals,
  getLongestStreak,
  getMilestones,
  getTodayTotals,
  moveExercise,
  sortExercises,
  updateRepEntry,
  validateReps,
} from './domain'
import type { AppState, RepEntry } from './types'

const entries: RepEntry[] = [
  {
    id: 'a',
    exerciseId: 'pushups',
    reps: 10,
    createdAt: '2026-06-12T08:00:00.000+02:00',
  },
  {
    id: 'b',
    exerciseId: 'pushups',
    reps: 15,
    createdAt: '2026-06-12T12:00:00.000+02:00',
  },
  {
    id: 'c',
    exerciseId: 'squats',
    reps: 20,
    createdAt: '2026-06-12T16:00:00.000+02:00',
  },
  {
    id: 'old',
    exerciseId: 'pushups',
    reps: 99,
    createdAt: '2026-06-11T21:00:00.000+02:00',
  },
]

describe('rep counter domain', () => {
  it('builds inactive starter exercises without entries', () => {
    const state = buildInitialState('2026-06-12T10:00:00.000+02:00')

    expect(state.exercises.length).toBeGreaterThan(6)
    expect(state.exercises.every((exercise) => !exercise.isActive)).toBe(true)
    expect(state.entries).toEqual([])
  })

  it('uses a local date key for day boundaries', () => {
    expect(getDateKey('2026-06-12T23:59:59.000+02:00')).toBe('2026-06-12')
    expect(getDateKey('2026-06-13T00:00:00.000+02:00')).toBe('2026-06-13')
  })

  it('sums today per exercise and overall without overwriting history', () => {
    const totals = getTodayTotals(entries, '2026-06-12')

    expect(totals.total).toBe(45)
    expect(totals.byExercise.get('pushups')).toBe(25)
    expect(totals.byExercise.get('squats')).toBe(20)
  })

  it('validates reps as positive whole numbers', () => {
    expect(validateReps('10')).toEqual({ ok: true, reps: 10 })
    expect(validateReps('0')).toEqual({ ok: false, message: 'Ange minst 1 rep.' })
    expect(validateReps('-3')).toEqual({ ok: false, message: 'Ange minst 1 rep.' })
    expect(validateReps('2.5')).toEqual({
      ok: false,
      message: 'Ange ett heltal.',
    })
    expect(validateReps('abc')).toEqual({
      ok: false,
      message: 'Ange ett giltigt antal.',
    })
  })

  it('adds, updates, and deletes entries immutably', () => {
    const state: AppState = {
      version: 2,
      exercises: [],
      entries: [],
      settings: { theme: 'system' },
    }
    const added = addRepEntry(state, 'pushups', 12, '2026-06-12T10:00:00.000+02:00')
    const entryId = added.entries[0]?.id

    expect(added).not.toBe(state)
    expect(added.entries[0]).toMatchObject({ exerciseId: 'pushups', reps: 12 })

    const updated = updateRepEntry(added, entryId, 8)
    expect(updated.entries[0]?.reps).toBe(8)
    expect(added.entries[0]?.reps).toBe(12)

    const deleted = deleteRepEntry(updated, entryId)
    expect(deleted.entries).toEqual([])
  })

  it('builds period totals by exercise and by day', () => {
    const exerciseTotals = getExerciseTotals(entries, '2026-06-11', '2026-06-12')
    const dailyTotals = getDailyTotals(entries, '2026-06-11', '2026-06-12')

    expect(exerciseTotals.get('pushups')).toBe(124)
    expect(exerciseTotals.get('squats')).toBe(20)
    expect(dailyTotals).toEqual([
      { dateKey: '2026-06-11', total: 99 },
      { dateKey: '2026-06-12', total: 45 },
    ])
  })

  it('fills empty days with zero totals', () => {
    const dailyTotals = getDailyTotals(entries, '2026-06-10', '2026-06-13')

    expect(dailyTotals).toEqual([
      { dateKey: '2026-06-10', total: 0 },
      { dateKey: '2026-06-11', total: 99 },
      { dateKey: '2026-06-12', total: 45 },
      { dateKey: '2026-06-13', total: 0 },
    ])
  })

  it('computes current and longest streaks', () => {
    expect(getCurrentStreak(entries, '2026-06-12')).toBe(2)
    expect(getCurrentStreak(entries, '2026-06-13')).toBe(2)
    expect(getCurrentStreak(entries, '2026-06-15')).toBe(0)
    expect(getLongestStreak(entries)).toBe(2)
    expect(getLongestStreak([])).toBe(0)
  })

  it('computes per-exercise stats and records', () => {
    const stats = getExerciseStats(entries, 'pushups')

    expect(stats.allTime).toBe(124)
    expect(stats.bestSet).toBe(99)
    expect(stats.bestDay).toEqual({ dateKey: '2026-06-11', total: 99 })
    expect(stats.count).toBe(3)
  })

  it('marks milestones as achieved from history', () => {
    const milestones = getMilestones(entries)
    const byId = new Map(milestones.map((milestone) => [milestone.id, milestone.achieved]))

    expect(byId.get('total-100')).toBe(true)
    expect(byId.get('total-1000')).toBe(false)
    expect(byId.get('day-100')).toBe(false)
  })

  it('reorders exercises with moveExercise', () => {
    const state = buildInitialState('2026-06-12T10:00:00.000+02:00')
    const ordered = sortExercises(state.exercises)
    const second = ordered[1]

    const moved = moveExercise(state, second.id, -1)
    expect(sortExercises(moved.exercises)[0].id).toBe(second.id)

    const unchanged = moveExercise(state, ordered[0].id, -1)
    expect(unchanged).toBe(state)
  })
})
