import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import brainLogo from '../../assets/brain-logo.png'

export default function PatientLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('Savitri Devi')

  const handleSubmit = (e) => {
    e.preventDefault()
    login({
      id: 'p1',
      role: 'patient',
      name: name.trim() || 'Savitri Devi',
      preferredLanguage: 'Hindi',
    })
    navigate('/patient')
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
        <div className="w-14 h-14 rounded-2xl overflow-hidden mb-4 shadow-sm border-2 border-sun/30">
          <img src={brainLogo} alt="SmritiSetu Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-cream">Welcome</h2>
        <p className="text-base text-cream/60 mt-1 mb-6">
          Please enter your name
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="sr-only">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-ink border border-clay rounded-xl px-4 py-4 text-cream text-lg focus:ring-2 focus:ring-sun outline-none transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-sun text-ink font-bold text-lg rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              Enter
            </button>
          </div>

          <p className="text-xs text-cream/40 text-center mt-3">
            Your family can help you with this
          </p>
        </form>
      </div>
    </div>
  )
}
