export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-6 bg-surface rounded-2xl border border-clay/40 shadow-sm">
      {Icon && (
        <div className="w-16 h-16 bg-cream/70 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-clay/40">
          <Icon className="w-8 h-8 text-ink/50" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && <p className="text-sm text-ink/60 mt-1.5 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
