import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const base =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

const variants = {
  default: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90',
  outline: 'border border-[hsl(var(--border))] bg-transparent text-foreground hover:bg-[hsl(var(--accent))]',
  ghost: 'bg-transparent hover:bg-[hsl(var(--accent))]',
}

const sizes = { sm: 'h-8 px-3', md: 'h-9 px-4', lg: 'h-10 px-5' }

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'md', asChild = false, ...props },
  ref
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  )
})
