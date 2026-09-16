import { patientData as mockPatientData } from '../mockData/patientData'

const KEY = 'nermemorycare_patient'
let memoryCache = null

function sanitizePatient(patient) {
  if (!patient || typeof patient !== 'object') return patient
  const cleanMemories = (patient.memories || []).map((m) => {
    // If photoUrl is huge data URL, strip it to prevent quota exceed
    if (m.photoUrl && typeof m.photoUrl === 'string' && m.photoUrl.length > 50000) {
      return { ...m, photoUrl: '' }
    }
    return m
  })
  return {
    ...patient,
    memories: cleanMemories,
    dailyScores: (patient.dailyScores || []).slice(-30),
  }
}

export function getPatient() {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        memoryCache = parsed
        return parsed
      }
    }
  } catch {
    try {
      localStorage.removeItem(KEY)
    } catch {}
  }
  return mockPatientData
}

export function savePatient(patient) {
  memoryCache = patient
  const sanitized = sanitizePatient(patient)
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitized))
  } catch (error) {
    const isQuota =
      error?.name === 'QuotaExceededError' ||
      error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error?.code === 22 ||
      (error?.message && error.message.includes('quota'))

    if (isQuota) {
      try {
        const minimal = {
          ...sanitized,
          memories: (sanitized.memories || []).map((m) => ({ ...m, photoUrl: undefined })),
          dailyScores: (sanitized.dailyScores || []).slice(-7),
        }
        localStorage.setItem(KEY, JSON.stringify(minimal))
      } catch (e) {
        try {
          sessionStorage.setItem(KEY, JSON.stringify(sanitized))
        } catch {}
      }
    }
  }
}

export function clearPatient() {
  memoryCache = null
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(KEY)
  } catch {}
}

export function hasCustomPatient() {
  if (memoryCache && memoryCache.id !== mockPatientData.id) return true
  try {
    return !!localStorage.getItem(KEY)
  } catch {
    return false
  }
}
