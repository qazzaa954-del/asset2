'use client'

import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  }

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  // Use green colors that match the website theme (from green-600 to green-800)
  const logoColor = '#16a34a' // green-600
  const logoColorDark = '#15803d' // green-700
  const logoColorLight = 'rgba(22, 163, 74, 0.15)' // green-600 with opacity

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Image - Original logo without modifications */}
      <div className={`${sizeClasses[size]} relative mb-2`}>
        {!imageError ? (
          <Image
            src="/images/damar-langit-logo.png"
            alt="Damar Langit Logo"
            width={size === 'sm' ? 48 : size === 'md' ? 64 : 96}
            height={size === 'sm' ? 48 : size === 'md' ? 64 : 96}
            className="w-full h-full object-contain"
            priority
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback to SVG if image not found
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 25 18 Q 30 12, 38 18 Q 32 24, 25 18"
              stroke={logoColor}
              strokeWidth="2.5"
              fill="none"
              className="opacity-90"
            />
            <path
              d="M 50 18 Q 62 24, 68 36 Q 64 42, 50 48 Q 36 42, 32 36 Q 38 24, 50 18"
              stroke={logoColorDark}
              strokeWidth="3.5"
              fill={logoColorLight}
            />
            <path
              d="M 82 50 Q 76 62, 64 68 Q 58 64, 52 50 Q 58 36, 70 42 Q 78 48, 82 50"
              stroke={logoColorDark}
              strokeWidth="3.5"
              fill={logoColorLight}
            />
            <path
              d="M 50 82 Q 38 76, 32 64 Q 36 58, 50 52 Q 64 58, 68 64 Q 62 76, 50 82"
              stroke={logoColorDark}
              strokeWidth="3.5"
              fill={logoColorLight}
            />
            <path
              d="M 18 50 Q 24 38, 36 32 Q 42 36, 48 50 Q 42 64, 30 58 Q 22 52, 18 50"
              stroke={logoColorDark}
              strokeWidth="3.5"
              fill={logoColorLight}
            />
            <circle cx="50" cy="50" r="9" fill={logoColor} opacity="0.25" />
          </svg>
        )}
      </div>

      {/* Text - Keep original styling */}
      {showText && (
        <div className="text-center">
          <div className={`font-serif font-bold text-green-700 ${textSizeClasses[size]} tracking-wide`}>
            DAMAR
          </div>
          <div className={`text-green-600 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} tracking-widest mt-0.5`}>
            langit
          </div>
        </div>
      )}
    </div>
  )
}

