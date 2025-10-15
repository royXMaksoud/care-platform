import { cn } from '@/lib/utils'

export function Badge({ variant = 'secondary', className = '', children }) {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium'
  const variants = {
    secondary: 'border-transparent bg-[hsl(var(--secondary))] text-foreground',
    outline: 'bg-transparent border-[hsl(var(--border))] text-foreground',
    primary: 'border-transparent bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
  }
  return <span className={cn(base, variants[variant], className)}>{children}</span>
}
