import React, { useState } from 'react'
import { exportDataAsCSV, exportDataAsJSON, deleteAllData } from '../lib/analytics'
import { resetAllProgress } from '../lib/progress'
import { resetGamification } from '../lib/gamification'
import { useTheme } from '../context/ThemeContext'
import { useReflectiveMode } from '../lib/reflectiveMode'

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function Settings(): JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const [reflectiveMode, setReflectiveMode] = useReflectiveMode()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleExportCSV = async (): Promise<void> => {
    const csv = await exportDataAsCSV()
    downloadFile('brain-games-sessions.csv', csv, 'text/csv')
  }

  const handleExportJSON = async (): Promise<void> => {
    const json = await exportDataAsJSON()
    downloadFile('brain-games-sessions.json', json, 'application/json')
  }

  const handleDeleteAll = async (): Promise<void> => {
    await deleteAllData()
    resetAllProgress()
    resetGamification()
    setConfirmingDelete(false)
    setStatus('All local data has been deleted.')
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>

      {status && <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm p-3 rounded">{status}</div>}

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Dark mode</span>
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-medium"
          >
            {theme === 'dark' ? 'On' : 'Off'}
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Pacing</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Reflective Mode</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recommended for elderly or memory-impaired users — removes hard timers, slows down auto-difficulty changes, and never
              penalizes slower reaction times.
            </p>
          </div>
          <button
            onClick={() => setReflectiveMode(!reflectiveMode)}
            role="switch"
            aria-checked={reflectiveMode}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
              reflectiveMode ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                reflectiveMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Export Data</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Download every session your browser has recorded. Nothing leaves your device unless you choose to share the file.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            Download CSV
          </button>
          <button onClick={handleExportJSON} className="px-4 py-2 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-sm font-medium hover:bg-indigo-200">
            Download JSON
          </button>
        </div>
        <p className="text-xs text-slate-400">PDF export is planned — the underlying session data is already structured to support it.</p>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Privacy</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This app is local-first: all performance data is stored in your browser (IndexedDB/localStorage) under a randomly
          generated anonymous ID. No account, email, or personally identifying information is collected, and nothing is sent
          to a server.
        </p>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Delete All Data</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Permanently erase all sessions, progress, streaks, and badges stored in this browser. This cannot be undone.
        </p>
        {!confirmingDelete ? (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="px-4 py-2 rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 text-sm font-medium hover:bg-red-100"
          >
            Delete all my data
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-red-600 dark:text-red-400">Are you sure? This is permanent.</span>
            <button onClick={handleDeleteAll} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700">
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
