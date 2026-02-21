import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  // eslint-disable-next-line no-undef
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

// eslint-disable-next-line no-undef
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-950 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400',
            error
              ? 'border-red-500 dark:border-red-400 focus-visible:ring-red-500 dark:focus-visible:ring-red-400'
              : 'border-neutral-200 dark:border-neutral-800 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
