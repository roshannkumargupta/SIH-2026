export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-clay/40 text-ink',
    success: 'bg-tea-confirm/20 text-[#3d6842] border border-tea-confirm/30 font-semibold',
    warning: 'bg-sun/25 text-ink border border-sun/40 font-semibold',
    error: 'bg-fire/20 text-[#c25112] border border-fire/30 font-semibold',
    info: 'bg-clay/40 text-ink',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default}`}>
      {children}
    </span>
  )
}
