import { useEffect, useState } from 'react'
import { readStoredState, writeStoredState } from '../storage'
import type { AppState } from '../types'

export function useAppState() {
  const [state, setState] = useState<AppState>(() => readStoredState())

  useEffect(() => {
    writeStoredState(state)
  }, [state])

  return [state, setState] as const
}
