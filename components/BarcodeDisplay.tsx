'use client'

import { useRef, useEffect } from 'react'
import JsBarcode from 'jsbarcode'

interface BarcodeDisplayProps {
  value: string
  className?: string
}

export function BarcodeDisplay({ value, className }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
        })
      } catch (error) {
        console.error('Error generating barcode:', error)
      }
    }
  }, [value])

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}

