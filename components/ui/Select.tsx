import { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, className, placeholder, ...props }: SelectProps & { placeholder?: string }) {
  const hasValue = props.value !== undefined && props.value !== ''
  const displayOptions = placeholder && !hasValue 
    ? [{ value: '', label: placeholder }, ...options]
    : options

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-sm cursor-pointer appearance-none bg-white',
          error && 'border-red-500 focus:ring-red-500',
          !hasValue && placeholder && 'text-gray-500',
          className
        )}
        {...props}
      >
        {displayOptions.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.value === '' && placeholder ? false : undefined}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

