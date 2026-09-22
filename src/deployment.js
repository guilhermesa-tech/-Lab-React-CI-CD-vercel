export const getTimestamp = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null

  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : null
}

export const getDurationMilliseconds = (start, end) => {
  const startTimestamp = getTimestamp(start)
  const endTimestamp = getTimestamp(end)
  if (startTimestamp === null || endTimestamp === null) return null

  return Math.max(0, endTimestamp - startTimestamp)
}

export const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds)) return 'indisponivel'

  const seconds = Math.max(0, Math.round(milliseconds / 1000))
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}