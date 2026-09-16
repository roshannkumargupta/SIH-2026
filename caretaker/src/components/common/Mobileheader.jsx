import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import brainLogo from '../../assets/brain-logo.png'

export function MobileHeader({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-surface border-b border-clay/40 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm border border-sun/30">
            <img src={brainLogo} alt="SmritiSetu Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-ink truncate">{title || 'SmritiSetu'}</h1>
            <p className="text-[11px] text-ink/60 truncate">{user?.name || 'Caregiver'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-fire/10 text-ink/70 hover:text-fire rounded-lg flex-shrink-0 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
