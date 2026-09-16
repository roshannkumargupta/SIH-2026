export function Card({ children, className = '', padding = 'md' }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <div className={`bg-surface rounded-2xl border border-clay/40 shadow-sm text-ink ${paddings[padding] || 'p-6'} ${className}`}>
      {children}
    </div>
  )
}
