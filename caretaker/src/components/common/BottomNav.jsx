import { NavLink } from 'react-router-dom'
import { Home, User, Bell, Settings } from 'lucide-react'
import { mockAlerts } from '../../mockData'

const navItems = [
  { to: '/caregiver', label: 'Home', icon: Home, end: true },
  { to: '/caregiver/patient', label: 'Patient', icon: User },
  { to: '/caregiver/alerts', label: 'Alerts', icon: Bell },
  { to: '/caregiver/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const unread = mockAlerts.filter((a) => !a.read).length

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-clay/40 z-50 shadow-md">
      <div className="grid grid-cols-4 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center py-3 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-fire font-bold' : 'text-ink/60 hover:text-ink'
                }`
              }
            >
              <div className="relative mb-0.5">
                <Icon className="w-5 h-5" />
                {item.label === 'Alerts' && unread > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-[16px] bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {unread}
                  </span>
                )}
              </div>
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}