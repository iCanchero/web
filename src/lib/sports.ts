export const SPORT_LABELS = {
  soccer: 'Fútbol',
  tennis: 'Tenis',
  padel: 'Pádel',
} as const

export type SportKey = keyof typeof SPORT_LABELS

export function getSportLabel(sport: string | null): string | null {
  if (!sport) return null
  return Object.hasOwn(SPORT_LABELS, sport)
    ? SPORT_LABELS[sport as SportKey]
    : sport
}
