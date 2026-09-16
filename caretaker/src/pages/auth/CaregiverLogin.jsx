import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import brainLogo from '../../assets/brain-logo.png'

export default function CaregiverLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('caretaker@example.com')
  const [password, setPassword] = useState('demo123')

  const handleSubmit = (e) => {
    e.preventDefault()
    login({
      id: 'c1',
      role: 'caregiver',
      name: 'Priya Devi',
      relationship: 'Daughter',
      email: 'caretaker@example.com',
    })
    navigate('/caregiver')
  }

  return (
    <div className="auth-theme min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-surface border border-clay rounded-2xl p-8 shadow-lg">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-cream/60 hover:text-cream transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Logo & Header */}
        <div className="w-12 h-12 rounded-xl overflow-hidden mb-4 shadow-sm border-2 border-sun/30">
          <img src={brainLogo} alt="SmritiSetu Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-2xl font-bold text-cream">Caregiver Login</h2>
        <p className="text-sm text-cream/60 mt-1 mb-6">
          Sign in to manage your patient
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cream/80 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-ink border border-clay rounded-lg px-4 py-3 text-cream focus:ring-2 focus:ring-fire outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cream/80 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-ink border border-clay rounded-lg px-4 py-3 text-cream focus:ring-2 focus:ring-fire outline-none transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-fire text-cream font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              Sign In
            </button>
          </div>

          <p className="text-xs text-cream/40 text-center mt-3">
            Demo credentials pre-filled
          </p>
        </form>
      </div>
    </div>
  )
}
