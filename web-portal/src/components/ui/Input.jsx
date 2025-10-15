import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-md border border-[hsl(var(--border))] bg-background px-3 text-sm',
        'placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]',
        className
      )}
      {...props}
    />
  )
})
