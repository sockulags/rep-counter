import { useRef, useState, type ChangeEvent } from 'react'
import { migrateState } from '../storage'
import type { AppState, ThemeChoice } from '../types'
import { PageHeader } from './PageHeader'

const themeOptions: Array<{ id: ThemeChoice; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Ljust' },
  { id: 'dark', label: 'Mörkt' },
]

type SettingsViewProps = {
  theme: ThemeChoice
  onThemeChange: (theme: ThemeChoice) => void
  onExportData: () => void
  onImportData: (state: AppState) => void
  onResetAllData: () => void
}

export function SettingsView({
  theme,
  onThemeChange,
  onExportData,
  onImportData,
  onResetAllData,
}: SettingsViewProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<AppState | null>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setImportError('')
    setPendingImport(null)

    const reader = new FileReader()
    reader.onload = () => {
      let parsed: unknown
      try {
        parsed = JSON.parse(String(reader.result))
      } catch {
        setImportError('Filen kunde inte läsas som JSON.')
        return
      }

      const migrated = migrateState(parsed)
      if (!migrated) {
        setImportError('Filen innehåller ingen giltig Rep Counter-data.')
        return
      }

      setPendingImport(migrated)
    }
    reader.onerror = () => setImportError('Filen kunde inte läsas.')
    reader.readAsText(file)
  }

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
        <h2>Export och import</h2>
        <p className="muted">
          Spara en säkerhetskopia av dina övningar och registreringar som JSON, eller läs
          in en tidigare export.
        </p>
        <div className="row-actions">
          <button type="button" className="primary-button" onClick={onExportData}>
            Exportera data
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Importera data
          </button>
        </div>
        <input
          ref={fileInputRef}
          aria-label="Importfil"
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
        {pendingImport ? (
          <>
            <p className="muted">
              Importen ersätter alla övningar och registreringar på den här enheten.
            </p>
            <div className="row-actions">
              <button type="button" className="text-button" onClick={() => setPendingImport(null)}>
                Avbryt
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={() => {
                  setPendingImport(null)
                  onImportData(pendingImport)
                }}
              >
                Ja, ersätt allt
              </button>
            </div>
          </>
        ) : null}
        {importError ? (
          <p className="form-message" role="alert">
            {importError}
          </p>
        ) : null}
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
