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

  it('edits a logged entry from the overview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    await user.click(screen.getByRole('button', { name: '+10' }))
    await user.click(screen.getByRole('button', { name: 'Översikt' }))

    await user.click(screen.getByRole('button', { name: 'Ändra' }))
    const editInput = screen.getByRole('spinbutton', { name: 'Ändra reps' })
    await user.clear(editInput)
    await user.type(editInput, '15')
    await user.click(screen.getByRole('button', { name: 'Spara' }))

    expect(screen.queryByRole('spinbutton', { name: 'Ändra reps' })).not.toBeInTheDocument()
    expect(screen.getAllByText('15').length).toBeGreaterThanOrEqual(2)
  })

  it('deletes a logged entry from the overview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    await user.click(screen.getByRole('button', { name: '+10' }))
    await user.click(screen.getByRole('button', { name: 'Översikt' }))

    await user.click(screen.getByRole('button', { name: 'Radera' }))

    expect(screen.getByText('Registrering raderad')).toBeInTheDocument()
    expect(screen.getByText('Inga registreringar matchar filtret.')).toBeInTheDocument()
  })

  it('shows a validation error for invalid manual input', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    const input = screen.getByRole('spinbutton', { name: 'Antal för Push-ups' })
    await user.type(input, '0')
    await user.click(screen.getByRole('button', { name: 'Lägg till' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Ange minst 1 rep.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Ange minst 1 rep.')

    await user.type(input, '1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('applies the selected theme to the document', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Inställningar' }))
    await user.click(screen.getByRole('radio', { name: 'Mörkt' }))
    expect(document.documentElement.dataset.theme).toBe('dark')

    await user.click(screen.getByRole('radio', { name: 'Ljust' }))
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('clears all data after reset confirmation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    await user.click(screen.getByRole('button', { name: '+10' }))

    await user.click(screen.getByRole('button', { name: 'Inställningar' }))
    expect(screen.queryByRole('button', { name: 'Ja, radera allt' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Radera all data' }))
    await user.click(screen.getByRole('button', { name: 'Ja, radera allt' }))

    expect(screen.getByText('Inga aktiva övningar')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1)
  })
})
