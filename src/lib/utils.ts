export function fmtUSD(n: number): string {
  return 'USD ' + Math.round(n).toLocaleString('es-AR')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function calcFinalPrice(total: number, descuentoPct: number): number {
  return total * (1 - descuentoPct / 100)
}
