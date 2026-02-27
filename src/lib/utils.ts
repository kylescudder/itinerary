export function groupItemsByDate<T extends { start_time: string | null }>(items: T[]) {
  const groups = items.reduce<Record<string, T[]>>((acc, item) => {
    const date = item.start_time
      ? new Date(item.start_time).toISOString().split('T')[0]
      : 'Anytime'
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === 'Anytime') return 1
      if (b === 'Anytime') return -1
      return a.localeCompare(b)
    })
    .map((date) => ({ date, items: groups[date] }))
}

export function formatDateLabel(date: string) {
  if (date === 'Anytime') return 'Anytime'
  const parsed = new Date(date)
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeLabel(dateTime: string) {
  const parsed = new Date(dateTime)
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let output = ''
  for (let i = 0; i < 6; i += 1) {
    output += chars[Math.floor(Math.random() * chars.length)]
  }
  return output
}
