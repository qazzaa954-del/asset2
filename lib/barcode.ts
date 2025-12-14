import JsBarcode from 'jsbarcode'

export function generateBarcode(value: string): string {
  // Create a canvas element
  const canvas = document.createElement('canvas')
  
  // Generate barcode
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
  })

  // Return base64 data URL
  return canvas.toDataURL('image/png')
}

export function downloadBarcode(value: string, filename: string) {
  const dataUrl = generateBarcode(value)
  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}

