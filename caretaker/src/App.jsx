import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'

import Login from './pages/auth/Login'
import CaregiverDashboard from './pages/caregiver/CaregiverDashboard'
import PatientProfile from './pages/caregiver/PatientProfile'
import Alerts from './pages/caregiver/Alerts'
import Settings from './pages/caregiver/Settings'
import Onboarding from './pages/caregiver/Onboarding'
import AddPatient from './pages/caregiver/AddPatient'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/caregiver" element={<ProtectedRoute><CaregiverDashboard /></ProtectedRoute>} />
          <Route path="/caregiver/patient" element={<ProtectedRoute><PatientProfile /></ProtectedRoute>} />
          <Route path="/caregiver/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/caregiver/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/caregiver/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/caregiver/add-patient" element={<ProtectedRoute><AddPatient /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}