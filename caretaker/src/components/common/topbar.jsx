import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { mockAlerts } from '../../mockData'

export function TopBar({ title }) {
  const { user } = useAuth()
  const unread = mockAlerts.filter((a) => !a.read).length
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  return (
    <header className="h-16 bg-surface border-b border-clay/40 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-ink">
          {title ? title : `${greeting}, ${user?.name || 'Caregiver'}`}
        </h2>
        <p className="text-xs text-ink/60">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/caregiver/alerts"
          className="relative p-2.5 hover:bg-cream/60 rounded-xl text-ink/70 hover:text-ink transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Alerts"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {unread}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2.5 pl-3 border-l border-clay/40">
          <div className="w-9 h-9 bg-fire text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
            {user?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2) || 'CG'}
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-ink leading-tight">{user?.name || 'Caregiver'}</p>
            <p className="text-[11px] text-ink/60 leading-tight">{user?.relationship || 'Family'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
