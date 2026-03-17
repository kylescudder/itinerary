export function groupItemsByDate<T extends { start_time: string | null }>(
  items: T[],
) {
  const groups = items.reduce<Record<string, T[]>>((acc, item) => {
    const date = item.start_time
      ? new Date(item.start_time).toISOString().split('T')[0]
      : 'Anytime'
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})

  Object.values(groups).forEach((group) => {
    group.sort((a, b) => {
      if (!a.start_time && !b.start_time) return 0
      if (!a.start_time) return 1
      if (!b.start_time) return -1
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
  })

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
    timeZone: 'UTC',
  })
}

export function formatTripDateRange(
  startDate?: string | null,
  endDate?: string | null,
) {
  if (!startDate && !endDate) return null
  const parseDate = (value: string) =>
    new Date(value.includes('T') ? value : `${value}T00:00:00`)
  const start = startDate ? parseDate(startDate) : null
  const end = endDate ? parseDate(endDate) : null

  const format = (date: Date, includeYear: boolean) => {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }
    if (includeYear) {
      options.year = 'numeric'
    }
    return date.toLocaleDateString('en-US', options)
  }

  if (start && end) {
    const includeYear = start.getUTCFullYear() !== end.getUTCFullYear()
    const startLabel = format(start, includeYear)
    const endLabel = format(end, includeYear)
    return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
  }

  if (start) {
    return `Starts ${format(start, true)}`
  }

  return end ? `Ends ${format(end, true)}` : null
}

export function formatTimeLabel(dateTime: string) {
  const parsed = new Date(dateTime)
  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
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
