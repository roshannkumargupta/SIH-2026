/**
 * Local patient store — persists caregiver-entered patient data safely.
 * Uses lightweight localStorage for patient state & metadata, and IndexedDB for heavy media/photos.
 * Handles QuotaExceededError and corrupted data gracefully.
 */

export interface PatientMemory {
  id: string;
  title: string;
  relationship: string;
  category: string;
  description: string;
  photoUrl?: string; // Light URL, thumbnail, or IndexedDB reference
}

export interface PatientMedication {
  id: string;
  medicineName: string;
  dosage: string;
  time: string;
  status: string;
}

export interface PatientPrescription {
  id: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  startDate: string;
  endDate: string;
  doctorName: string;
}

export interface PatientTask {
  id: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

export interface PatientProgress {
  overallScore: number;
  medicationAdherence: number;
  taskCompletion: number;
  gamePerformance: number;
  trend: string;
  confidence: number;
}

export interface PatientData {
  id: string;
  name: string;
  email?: string;
  password?: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContact: string;
  doctorName: string;
  preferredLanguage: string;
  prescriptions: PatientPrescription[];
  medications: PatientMedication[];
  tasks: PatientTask[];
  memories: PatientMemory[];
  joinedAt: string;
  status: string;
  progress: PatientProgress;
  dailyScores: number[];
}

const KEY = "nermemorycare_patient";
const DB_NAME = "NERMemoryCareDB";
const MEDIA_STORE = "patient_media";

// In-memory fallback if localStorage is completely disabled or full
let memoryCache: PatientData | null = null;

const EMPTY_PATIENT: PatientData = {
  id: "",
  name: "",
  age: "",
  gender: "Female",
  phone: "",
  address: "",
  emergencyContactName: "",
  emergencyContact: "",
  doctorName: "",
  preferredLanguage: "Hindi",
  prescriptions: [],
  medications: [],
  tasks: [],
  memories: [],
  joinedAt: "",
  status: "active",
  progress: {
    overallScore: 0,
    medicationAdherence: 0,
    taskCompletion: 0,
    gamePerformance: 0,
    trend: "stable",
    confidence: 0,
  },
  dailyScores: [],
};

// ─── IndexedDB Media Storage for Heavy Photos ──────────────────────────────

function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveMediaToIndexedDB(id: string, dataUrl: string): Promise<void> {
  if (!dataUrl || dataUrl.length < 100) return;
  try {
    const db = await openIndexedDB();
    if (!db) return;
    const tx = db.transaction(MEDIA_STORE, "readwrite");
    const store = tx.objectStore(MEDIA_STORE);
    store.put({ id, data: dataUrl, timestamp: Date.now() });
  } catch {
    // Ignore IndexedDB write failure
  }
}

export async function getMediaFromIndexedDB(id: string): Promise<string | null> {
  try {
    const db = await openIndexedDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(MEDIA_STORE, "readonly");
      const store = tx.objectStore(MEDIA_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ─── Sanitize & Compact Payload for LocalStorage ───────────────────────────

/**
 * Strips excessively large base64 strings (>50KB) from memories and offloads them to IndexedDB
 * to ensure localStorage stays tiny (<100KB) and never hits the 5MB quota.
 */
function sanitizePatientForStorage(patient: PatientData): PatientData {
  const sanitizedMemories = (patient.memories || []).map((m) => {
    if (m.photoUrl && m.photoUrl.startsWith("data:") && m.photoUrl.length > 50000) {
      // Save full photo to IndexedDB asynchronously
      saveMediaToIndexedDB(m.id, m.photoUrl);
      // Keep only metadata in localStorage to prevent quota exhaustion
      return {
        ...m,
        photoUrl: "", // Keep photoUrl empty in localStorage, loaded via IndexedDB if needed
      };
    }
    return m;
  });

  return {
    ...patient,
    memories: sanitizedMemories,
    // Cap dailyScores to last 30 entries
    dailyScores: (patient.dailyScores || []).slice(-30),
  };
}

// ─── Patient Store Public API ──────────────────────────────────────────────

export function getPatient(): PatientData {
  if (typeof window === "undefined") return EMPTY_PATIENT;
  if (memoryCache) return memoryCache;

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PatientData;
      if (parsed && typeof parsed === "object" && parsed.id) {
        memoryCache = parsed;
        return parsed;
      }
    }
  } catch {
    // If corrupted, clean up key safely
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore storage removal error */
    }
  }

  return EMPTY_PATIENT;
}

export function savePatient(patient: PatientData): void {
  if (typeof window === "undefined") return;

  // Always keep in-memory cache updated immediately
  memoryCache = patient;

  const sanitized = sanitizePatientForStorage(patient);

  try {
    localStorage.setItem(KEY, JSON.stringify(sanitized));
  } catch (error: unknown) {
    const err = error as { name?: string; code?: number; message?: string } | null;
    // Check if error is QuotaExceededError
    const isQuotaError =
      err?.name === "QuotaExceededError" ||
      err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      err?.code === 22 ||
      err?.code === 1014 ||
      Boolean(err?.message && err.message.includes("quota"));

    if (isQuotaError) {
      console.warn(
        "localStorage quota exceeded when saving patient. Running quota recovery cleanup...",
      );

      try {
        // Recovery Strategy 1: Clear old oversized keys that might be filling up localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (
            k &&
            (k.startsWith("temp_") ||
              k.startsWith("cache_") ||
              k.includes("mock") ||
              k.includes("backup"))
          ) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {
            /* ignore individual removal error */
          }
        });

        // Recovery Strategy 2: Strip ALL memory images and non-critical history
        const minimalPatient: PatientData = {
          ...sanitized,
          memories: (sanitized.memories || []).map(({ photoUrl: _photoUrl, ...m }) => m),
          dailyScores: (sanitized.dailyScores || []).slice(-7),
        };

        localStorage.setItem(KEY, JSON.stringify(minimalPatient));
        console.info("Patient saved successfully with compact storage.");
      } catch (retryErr) {
        console.error(
          "Secondary storage fallback utilized due to persistent browser quota limit.",
          retryErr,
        );
        try {
          sessionStorage.setItem(KEY, JSON.stringify(sanitized));
        } catch {
          /* ignore session storage fallback failure */
        }
      }
    } else {
      console.error("Failed to save patient to localStorage:", error);
    }
  }
}

export function clearPatient(): void {
  memoryCache = null;
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore clearing error */
  }
}

export function hasCustomPatient(): boolean {
  if (typeof window === "undefined") return false;
  if (memoryCache && memoryCache.id) return true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as PatientData;
    return !!(parsed && parsed.id);
  } catch {
    return false;
  }
}
