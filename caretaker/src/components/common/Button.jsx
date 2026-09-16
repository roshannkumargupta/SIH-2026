export function Button({ children, variant = 'primary', size = 'md', onClick, type = 'button', disabled = false, className = '' }) {
  const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[44px]'
  const variants = {
    primary: 'bg-fire text-white hover:bg-fire/90 font-semibold shadow-sm',
    secondary: 'bg-cream text-ink border border-clay hover:bg-clay/30',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-ink hover:bg-clay/20',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm min-h-[38px]', md: 'px-5 py-2.5 text-sm min-h-[44px]', lg: 'px-6 py-3 text-base min-h-[48px]' }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </button>
  )
}
