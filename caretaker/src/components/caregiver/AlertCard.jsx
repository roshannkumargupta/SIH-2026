import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

export function AlertCard({ alert }) {
  const config = {
    critical: { icon: AlertCircle, bg: 'bg-fire/10', border: 'border-l-fire', iconColor: 'text-fire' },
    warning: { icon: AlertTriangle, bg: 'bg-sun/15', border: 'border-l-sun', iconColor: 'text-ink' },
    info: { icon: Info, bg: 'bg-cream/70', border: 'border-l-clay', iconColor: 'text-ink/70' },
  }
  const c = config[alert.severity] || config.info
  const Icon = c.icon
  return (
    <div className={`p-5 rounded-2xl border border-clay/40 border-l-4 ${c.border} ${c.bg} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex gap-3.5 items-start">
        <Icon className={`w-5 h-5 ${c.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm text-ink font-semibold leading-snug">{alert.message}</p>
          <p className="text-xs text-ink/60 mt-1.5">{new Date(alert.createdAt).toLocaleString('en-IN')}</p>
        </div>
        {!alert.read && <div className="w-2.5 h-2.5 bg-fire rounded-full mt-1.5 flex-shrink-0 shadow-sm" title="Unread" />}
      </div>
    </div>
  )
}
