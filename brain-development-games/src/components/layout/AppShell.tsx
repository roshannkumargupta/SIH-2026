import React, { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, Gamepad2, LayoutDashboard, LineChart, Trophy, Sparkles, Settings as SettingsIcon, Moon, Sun, Brain, Coffee, X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { trackSessionStart, resetSessionTracking, getElapsedSinceStart, shouldSuggestBreak, getBreakMessage } from '../../lib/sessionFatigue'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/games', label: 'All Games', icon: Gamepad2 },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/daily-challenge', label: 'Daily', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
]

// Mobile bottom nav keeps only the most-used destinations to avoid crowding.
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((i) => ['/', '/games', '/dashboard', '/achievements', '/settings'].includes(i.to))

export default function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  // Session fatigue / break reminders (suggestion-only, never auto-pauses).
  const [consecutiveLevels, setConsecutiveLevels] = useState(0)
  const [breakBanner, setBreakBanner] = useState<string | null>(null)

  useEffect(() => {
    trackSessionStart()

    const onLevelCompleted = (): void => setConsecutiveLevels((n) => n + 1)
    window.addEventListener('progress-updated', onLevelCompleted)

    const interval = window.setInterval(() => {
      setConsecutiveLevels((currentLevels) => {
        if (!breakBanner && shouldSuggestBreak(getElapsedSinceStart(), currentLevels)) {
          setBreakBanner(getBreakMessage())
        }
        return currentLevels
      })
    }, 30_000)

    return () => {
      window.removeEventListener('progress-updated', onLevelCompleted)
      window.clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dismissBreakBanner = (tookBreak: boolean): void => {
    setBreakBanner(null)
    resetSessionTracking()
    setConsecutiveLevels(0)
    if (tookBreak) {
      // No-op beyond resetting the clock — this is a suggestion, never a
      // forced pause. Resetting just means we won't nag again immediately.
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 border-r border-slate-200/70 dark:border-slate-800/70 glass-surface">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Brain size={19} />
          </div>
          <span className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm leading-tight tracking-tight">
            Brain Development<br />Games
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleTheme}
          className="mx-3 mb-5 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden glass-surface border-b border-slate-200/70 dark:border-slate-800/70 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Brain size={16} />
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-slate-100 text-sm">Brain Development Games</span>
          </div>
          <button onClick={toggleTheme} aria-label="Toggle dark mode" className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 container mx-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          {breakBanner && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3">
              <Coffee size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200 flex-1 min-w-[200px]">{breakBanner}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => dismissBreakBanner(true)}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Take a break
                </button>
                <button
                  onClick={() => dismissBreakBanner(false)}
                  aria-label="Dismiss"
                  className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 glass-surface border-t border-slate-200/70 dark:border-slate-800/70 flex justify-around py-1.5 z-10"
          aria-label="Primary"
        >
          {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-white bg-gradient-to-br from-indigo-600 to-violet-600' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
