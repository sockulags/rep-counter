export type ExerciseUnit = 'reps' | 'seconds'

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
  unit: ExerciseUnit
  sortOrder: number
  dailyGoal?: number
}

export type ThemeChoice = 'system' | 'light' | 'dark'

export type AppSettings = {
  theme: ThemeChoice
}

export type AppState = {
  version: 2
  exercises: Exercise[]
  entries: RepEntry[]
  settings: AppSettings
}

export type PeriodPreset = 'today' | '7d' | '30d' | 'month' | 'custom'

export type ViewId = 'today' | 'overview' | 'exercises' | 'settings'

export type Milestone = {
  id: string
  label: string
  achieved: boolean
}
