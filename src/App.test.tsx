import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

describe('Rep Counter app', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/')
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

  it('pushes a history entry per view and reverts on browser back', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Inga aktiva övningar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Inställningar' }))
    expect(screen.getByRole('button', { name: 'Exportera data' })).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('view')).toBe('settings')

    // Simulate the Android hardware back button stepping to the previous entry.
    fireEvent(
      window,
      new PopStateEvent('popstate', { state: { view: 'today', detailExerciseId: null } }),
    )

    expect(screen.getByText('Inga aktiva övningar')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Exportera data' })).not.toBeInTheDocument()
  })

  it('opens directly on the view named in the URL on reload', () => {
    window.history.replaceState(null, '', '/?view=settings')
    render(<App />)

    expect(screen.getByRole('button', { name: 'Exportera data' })).toBeInTheDocument()
    expect(screen.queryByText('Inga aktiva övningar')).not.toBeInTheDocument()
  })

  it('steps back out of an exercise detail before leaving the overview', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    await user.click(screen.getByRole('button', { name: '+10' }))
    await user.click(screen.getByRole('button', { name: 'Översikt' }))

    await user.click(screen.getByRole('button', { name: /Push-ups/ }))
    expect(screen.getByRole('heading', { name: 'Push-ups' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Översikt' })).not.toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('exercise')).not.toBeNull()

    // Popping the detail entry should restore the overview, not exit the app.
    fireEvent(
      window,
      new PopStateEvent('popstate', { state: { view: 'overview', detailExerciseId: null } }),
    )

    expect(screen.queryByRole('heading', { name: 'Push-ups' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Översikt' })).toBeInTheDocument()
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

  it('exports data and restores it through import', async () => {
    const user = userEvent.setup()
    const blobs: Blob[] = []
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:rep-counter-export'
    })
    URL.revokeObjectURL = vi.fn()
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    try {
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'Push-ups' }))
      await user.click(screen.getByRole('button', { name: '+10' }))
      await user.click(screen.getByRole('button', { name: 'Inställningar' }))
      await user.click(screen.getByRole('button', { name: 'Exportera data' }))

      expect(anchorClick).toHaveBeenCalledTimes(1)
      expect(blobs).toHaveLength(1)
      const exported = await blobs[0].text()

      await user.click(screen.getByRole('button', { name: 'Radera all data' }))
      await user.click(screen.getByRole('button', { name: 'Ja, radera allt' }))
      expect(screen.getByText('Inga aktiva övningar')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Inställningar' }))
      const file = new File([exported], 'rep-counter.json', { type: 'application/json' })
      fireEvent.change(screen.getByLabelText('Importfil'), { target: { files: [file] } })

      await user.click(await screen.findByRole('button', { name: 'Ja, ersätt allt' }))
      expect(screen.getByText('Data importerad')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Idag' }))
      expect(screen.getByRole('heading', { name: 'Push-ups' })).toBeInTheDocument()
      expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(2)
    } finally {
      URL.createObjectURL = originalCreateObjectURL
      URL.revokeObjectURL = originalRevokeObjectURL
      anchorClick.mockRestore()
    }
  })

  it('rejects an import file that fails validation', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Push-ups' }))
    await user.click(screen.getByRole('button', { name: '+10' }))
    await user.click(screen.getByRole('button', { name: 'Inställningar' }))

    const fileInput = screen.getByLabelText('Importfil')
    const invalidShape = new File(['{"version":99}'], 'broken.json', {
      type: 'application/json',
    })
    fireEvent.change(fileInput, { target: { files: [invalidShape] } })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Filen innehåller ingen giltig Rep Counter-data.',
    )
    expect(screen.queryByRole('button', { name: 'Ja, ersätt allt' })).not.toBeInTheDocument()

    const notJson = new File(['{not json'], 'broken.txt', { type: 'application/json' })
    fireEvent.change(fileInput, { target: { files: [notJson] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('Filen kunde inte läsas som JSON.')

    await user.click(screen.getByRole('button', { name: 'Idag' }))
    expect(screen.getAllByText('10').length).toBeGreaterThanOrEqual(2)
  })
})
