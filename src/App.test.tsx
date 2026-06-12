import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('Rep Counter app', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('activates an exercise and logs reps from today', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Inga aktiva övningar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Övningar' }))
    await user.click(screen.getByRole('switch', { name: 'Aktivera Push-ups' }))
    await user.click(screen.getByRole('button', { name: 'Idag' }))

    expect(screen.getByRole('heading', { name: 'Push-ups' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '+10' }))

    expect(screen.getByText('Totalt idag')).toBeInTheDocument()
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('+10 Push-ups')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ångra' }))
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2)
  })
})
