import { Badge } from '../common/Badge'
import { CheckCircle } from 'lucide-react'

export function TaskRow({ log }) {
  const statusVariant = { completed: 'success', pending: 'warning', missed: 'error' }
  return (
    <div className="flex items-center justify-between p-5 bg-surface hover:bg-cream/30 rounded-2xl border border-clay/40 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-tea-confirm/20 border border-tea-confirm/30 rounded-xl flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-tea-confirm" />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm md:text-base">{log.title}</p>
          <p className="text-xs text-ink/60 mt-0.5">
            {log.completedAt ? `Completed at ${log.completedAt}` : log.time ? `Scheduled for ${log.time}` : 'Pending completion'}
          </p>
        </div>
      </div>
      <Badge variant={statusVariant[log.status] || 'default'}>
        {log.status.toUpperCase()}
      </Badge>
    </div>
  )
}
