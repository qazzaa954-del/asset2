'use client'

import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

export function useBarcode(value: string) {
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

  return canvasRef
}

