export type RepEntry = {
  id: string
  exerciseId: string
  reps: number
  createdAt: string
}

export type Exercise = {
  id: string
  name: string
  isActive: boolean
  createdAt: string
}

export type AppState = {
  version: 1
  exercises: Exercise[]
  entries: RepEntry[]
}

export type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom'

export type ViewId = 'today' | 'overview' | 'exercises' | 'settings'
