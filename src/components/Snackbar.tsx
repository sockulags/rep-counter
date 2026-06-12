export function Snackbar({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <div className="snackbar" role="status">
      <span>{text}</span>
      <button type="button" onClick={onUndo}>
        Ångra
      </button>
    </div>
  )
}
