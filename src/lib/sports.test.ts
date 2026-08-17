import { describe, expect, it } from 'vitest'

import { getSportLabel } from './sports'

describe('getSportLabel', () => {
  it.each([
    ['soccer', 'Fútbol'],
    ['tennis', 'Tenis'],
    ['padel', 'Pádel'],
  ])('maps %s to %s', (key, label) => {
    expect(getSportLabel(key)).toBe(label)
  })

  it('preserves unknown future sport keys and null values', () => {
    expect(getSportLabel('pickleball')).toBe('pickleball')
    expect(getSportLabel(null)).toBeNull()
  })
})
