import { useState } from 'react'
import type { ThemeChoice } from '../types'
import { PageHeader } from './PageHeader'

const themeOptions: Array<{ id: ThemeChoice; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Ljust' },
  { id: 'dark', label: 'Mörkt' },
]

type SettingsViewProps = {
  theme: ThemeChoice
  onThemeChange: (theme: ThemeChoice) => void
  onResetAllData: () => void
}

export function SettingsView({ theme, onThemeChange, onResetAllData }: SettingsViewProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)

  return (
    <section className="page-stack">
      <PageHeader title="Inställningar" subtitle="Tema, lagring och PWA" />

      <section className="panel">
        <h2>Tema</h2>
        <div className="segmented" role="radiogroup" aria-label="Tema">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={theme === option.id}
              className={theme === option.id ? 'segment active' : 'segment'}
              onClick={() => onThemeChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Lagring</h2>
        <p className="muted">
          All data sparas lokalt i webbläsaren på den här enheten. Ingen inloggning,
          backend eller synk används.
        </p>
      </section>

      <section className="panel">
        <h2>Återställ</h2>
        <p className="muted">Tar bort övningar och alla registreringar från localStorage.</p>
        {confirmingReset ? (
          <div className="row-actions">
            <button type="button" className="text-button" onClick={() => setConfirmingReset(false)}>
              Avbryt
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                setConfirmingReset(false)
                onResetAllData()
              }}
            >
              Ja, radera allt
            </button>
          </div>
        ) : (
          <button type="button" className="danger-button" onClick={() => setConfirmingReset(true)}>
            Radera all data
          </button>
        )}
      </section>
    </section>
  )
}
