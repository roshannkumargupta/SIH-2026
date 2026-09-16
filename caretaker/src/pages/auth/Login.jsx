import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/Button'
import brainLogo from '../../assets/brain-logo.png'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    login({
      id: 'c1',
      name: 'Priya Devi',
      role: 'caregiver',
      relationship: 'Daughter',
      email,
    })
    navigate('/caregiver')
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 border-2 border-sun/30 shadow-md"><img src={brainLogo} alt="SmritiSetu Logo" className="w-full h-full object-contain" /></div>
          <h1 className="text-3xl font-bold text-cream">SmritiSetu</h1>
          <p className="text-sm text-cream/60 mt-2">Caregiver Dashboard</p>
        </div>

        <div className="bg-surface rounded-2xl border border-clay/40 p-6">
          <h2 className="text-xl font-semibold text-ink mb-5">Sign In</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="caregiver@example.com"
              className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-ink mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="any password"
              className="w-full px-3 py-3 bg-cream border border-clay/40 rounded-xl text-base text-ink focus:outline-none focus:ring-2 focus:ring-fire"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">Sign In</Button>

          <div className="mt-4 p-3 bg-sun/20 border border-sun/40 rounded-lg">
            <p className="text-xs text-ink"><strong>Demo:</strong> Any email + password works.</p>
          </div>
        </div>
      </div>
    </div>
  )
}