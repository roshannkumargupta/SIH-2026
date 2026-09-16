import { Badge } from '../common/Badge'
import { Pill } from 'lucide-react'

export function MedicineRow({ log }) {
  const statusVariant = { taken: 'success', pending: 'warning', missed: 'error' }
  const timeDisplay = log.scheduledTime || log.time || 'Scheduled'
  return (
    <div className="flex items-center justify-between p-5 bg-surface hover:bg-cream/30 rounded-2xl border border-clay/40 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-fire/15 border border-fire/25 rounded-xl flex items-center justify-center flex-shrink-0">
          <Pill className="w-5 h-5 text-fire" />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm md:text-base">{log.medicineName}</p>
          <p className="text-xs text-ink/60 mt-0.5">
            Scheduled: {timeDisplay} {log.takenAt && `• Taken at ${log.takenAt}`}
          </p>
        </div>
      </div>
      <Badge variant={statusVariant[log.status] || 'default'}>
        {log.status.toUpperCase()}
      </Badge>
    </div>
  )
}
