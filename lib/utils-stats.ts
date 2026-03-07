export function formatCost(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000_000) {
    return (n / 1_000_000_000).toFixed(2) + "B"
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(0) + "M"
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(0) + "K"
  }
  return String(n)
}

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  if (h === 0) return `${min}m`
  if (min === 0) return `${h}h`
  return `${h}h ${min}m`
}

export function formatDelta(d: number): string {
  const sign = d >= 0 ? "+" : ""
  return `${sign}${d.toFixed(1)}%`
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
