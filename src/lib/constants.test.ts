import { describe, it, expect } from 'vitest'
import { DAY_BOUNDARY_HOUR } from './constants'

describe('constants', () => {
  it('DAY_BOUNDARY_HOUR is 4', () => {
    expect(DAY_BOUNDARY_HOUR).toBe(4)
  })

  it('DAY_BOUNDARY_HOUR is a number', () => {
    expect(typeof DAY_BOUNDARY_HOUR).toBe('number')
  })
})
