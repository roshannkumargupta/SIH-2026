export function StatCard({ label, value, icon: Icon, color = 'sun' }) {
  const colorMap = {
    sun: 'text-sun bg-sun/15 border-sun/30',
    fire: 'text-fire bg-fire/15 border-fire/30',
    tea: 'text-tea-confirm bg-tea-confirm/15 border-tea-confirm/30',
    'tea-confirm': 'text-tea-confirm bg-tea-confirm/15 border-tea-confirm/30',
    clay: 'text-ink/70 bg-clay/20 border-clay/40',
  }

  const iconClasses = colorMap[color] || colorMap.sun

  return (
    <div className="bg-surface rounded-2xl border border-clay/40 p-5 md:p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-xs uppercase tracking-wider text-ink/60 font-semibold mb-1">{label}</p>
        <p className="text-2xl md:text-3xl font-bold text-ink">{value}</p>
      </div>
      {Icon && (
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconClasses}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  )
}
