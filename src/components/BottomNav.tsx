import type { ViewId } from '../types'
import { ExercisesIcon, OverviewIcon, SettingsIcon, TodayIcon } from './icons'

const navItems: Array<{ id: ViewId; label: string; icon: typeof TodayIcon }> = [
  { id: 'today', label: 'Idag', icon: TodayIcon },
  { id: 'overview', label: 'Översikt', icon: OverviewIcon },
  { id: 'exercises', label: 'Övningar', icon: ExercisesIcon },
  { id: 'settings', label: 'Inställningar', icon: SettingsIcon },
]

export function BottomNav({
  view,
  onNavigate,
}: {
  view: ViewId
  onNavigate: (view: ViewId) => void
}) {
  return (
    <nav className="bottom-nav" aria-label="Huvudnavigation">
      {navItems.map((item) => {
        const ItemIcon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            className={view === item.id ? 'nav-item active' : 'nav-item'}
            aria-current={view === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <ItemIcon />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
