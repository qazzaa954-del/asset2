import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format rupiah dengan titik sebagai pemisah ribuan (tanpa Rp)
export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d]/g, '')) : amount
  if (isNaN(num)) return '0'
  return num.toLocaleString('id-ID')
}

// Parse rupiah format (dengan titik) ke number
export function parseRupiah(value: string): number {
  // Hapus semua karakter non-digit kecuali koma untuk desimal
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function generateAssetCode(
  initialCode: string,
  sequenceNumber: number
): string {
  return `${initialCode}-${String(sequenceNumber).padStart(4, '0')}`
}

export function calculateDepreciation(
  acquisitionPrice: number,
  acquisitionYear: number,
  estimatedLifespan: number
): number {
  const currentYear = new Date().getFullYear()
  const yearsUsed = Math.max(0, currentYear - acquisitionYear)

  if (yearsUsed >= estimatedLifespan) {
    return 0
  }

  const annualDepreciation = acquisitionPrice / estimatedLifespan
  const bookValue = acquisitionPrice - annualDepreciation * yearsUsed

  return Math.max(0, bookValue)
}

