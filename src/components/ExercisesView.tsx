import { useState } from 'react'
import { formatValue, sortExercises } from '../domain'
import type { Exercise, ExerciseUnit, RepEntry } from '../types'
import { ArrowDownIcon, ArrowUpIcon } from './icons'
import { PageHeader } from './PageHeader'

type ExercisesViewProps = {
  exercises: Exercise[]
  entries: RepEntry[]
  onAdd: (name: string) => void
  onDelete: (exercise: Exercise) => void
  onMove: (exerciseId: string, direction: -1 | 1) => void
  onToggle: (exerciseId: string) => void
  onUpdate: (
    exerciseId: string,
    patch: { name: string; unit: ExerciseUnit; dailyGoal?: number },
  ) => void
}

export function ExercisesView({
  exercises,
  entries,
  onAdd,
  onDelete,
  onMove,
  onToggle,
  onUpdate,
}: ExercisesViewProps) {
  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const ordered = sortExercises(exercises)
  const filteredExercises = ordered.filter((exercise) =>
    exercise.name.toLowerCase().includes(query.toLowerCase()),
  )
  const isFiltering = query.trim().length > 0

  function addExercise() {
    if (!name.trim()) return
    onAdd(name)
    setName('')
  }

  return (
    <section className="page-stack">
      <PageHeader title="Övningar" subtitle="Välj vad som syns på Idag" />

      <div className="add-exercise">
        <input
          aria-label="Ny övning"
          placeholder="Ny övning"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') addExercise()
          }}
        />
        <button type="button" className="primary-button" onClick={addExercise}>
          Lägg till
        </button>
      </div>

      <label className="search-field">
        Sök
        <input placeholder="Sök övning" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>

      <div className="exercise-list">
        {filteredExercises.map((exercise, index) => {
          const count = entries.filter((entry) => entry.exerciseId === exercise.id).length

          return (
            <article key={exercise.id} className="exercise-row">
              <div>
                <strong>{exercise.name}</strong>
                <span>
                  {count > 0 ? `${count} registreringar` : 'Ingen historik'}
                  {exercise.dailyGoal !== undefined
                    ? ` · Mål ${formatValue(exercise.dailyGoal, exercise.unit)}/dag`
                    : ''}
                  {exercise.unit === 'seconds' ? ' · Sekunder' : ''}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={exercise.isActive}
                aria-label={`${exercise.isActive ? 'Inaktivera' : 'Aktivera'} ${exercise.name}`}
                className={exercise.isActive ? 'switch active' : 'switch'}
                onClick={() => onToggle(exercise.id)}
              >
                <span />
              </button>

              {editingId === exercise.id ? (
                <ExerciseEditor
                  exercise={exercise}
                  onCancel={() => setEditingId(null)}
                  onSave={(patch) => {
                    onUpdate(exercise.id, patch)
                    setEditingId(null)
                  }}
                />
              ) : (
                <div className="row-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Flytta upp ${exercise.name}`}
                    disabled={isFiltering || index === 0}
                    onClick={() => onMove(exercise.id, -1)}
                  >
                    <ArrowUpIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Flytta ner ${exercise.name}`}
                    disabled={isFiltering || index === filteredExercises.length - 1}
                    onClick={() => onMove(exercise.id, 1)}
                  >
                    <ArrowDownIcon size={16} />
                  </button>
                  <button type="button" onClick={() => setEditingId(exercise.id)}>
                    Redigera
                  </button>
                  <button type="button" className="danger-link" onClick={() => onDelete(exercise)}>
                    Radera
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function ExerciseEditor({
  exercise,
  onSave,
  onCancel,
}: {
  exercise: Exercise
  onSave: (patch: { name: string; unit: ExerciseUnit; dailyGoal?: number }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(exercise.name)
  const [unit, setUnit] = useState<ExerciseUnit>(exercise.unit)
  const [goal, setGoal] = useState(exercise.dailyGoal !== undefined ? String(exercise.dailyGoal) : '')
  const [error, setError] = useState('')

  function save() {
    if (!name.trim()) {
      setError('Ange ett namn.')
      return
    }

    const trimmedGoal = goal.trim()
    let dailyGoal: number | undefined

    if (trimmedGoal) {
      const parsed = Number(trimmedGoal)
      if (!Number.isInteger(parsed) || parsed < 1) {
        setError('Målet måste vara ett heltal, minst 1.')
        return
      }
      dailyGoal = parsed
    }

    onSave({ name: name.trim(), unit, dailyGoal })
  }

  return (
    <div className="exercise-editor">
      <label>
        Namn
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (error) setError('')
          }}
        />
      </label>
      <div className="filter-grid">
        <label>
          Dagligt mål
          <input
            inputMode="numeric"
            type="number"
            min="1"
            placeholder="Inget mål"
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value)
              if (error) setError('')
            }}
          />
        </label>
        <label>
          Enhet
          <select value={unit} onChange={(event) => setUnit(event.target.value as ExerciseUnit)}>
            <option value="reps">Reps</option>
            <option value="seconds">Sekunder</option>
          </select>
        </label>
      </div>
      {error ? <p className="form-message">{error}</p> : null}
      <div className="row-actions">
        <button type="button" className="text-button" onClick={onCancel}>
          Avbryt
        </button>
        <button type="button" className="primary-button" onClick={save}>
          Spara
        </button>
      </div>
    </div>
  )
}
