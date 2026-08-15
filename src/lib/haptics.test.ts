import { describe, it, expect, vi, afterEach } from 'vitest'
import { groundTouch } from './haptics'

function withVibrate(impl: (pattern: unknown) => boolean) {
  const fn = vi.fn(impl)
  Object.defineProperty(navigator, 'vibrate', { value: fn, configurable: true })
  return fn
}

function withReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
    configurable: true,
  })
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'vibrate')
  Reflect.deleteProperty(window, 'matchMedia')
})

describe('groundTouch', () => {
  it('sends a single short tick, not a pattern', () => {
    withReducedMotion(false)
    const vibrate = withVibrate(() => true)

    groundTouch()

    expect(vibrate).toHaveBeenCalledTimes(1)
    const [pattern] = vibrate.mock.calls[0]
    expect(typeof pattern).toBe('number')
    expect(pattern).toBeLessThanOrEqual(20)
  })

  it('stays quiet where the platform has no Vibration API', () => {
    withReducedMotion(false)
    // iOS Safari: navigator.vibrate simply does not exist.
    expect(() => groundTouch()).not.toThrow()
  })

  it('stays quiet for those who asked for less stimulation', () => {
    withReducedMotion(true)
    const vibrate = withVibrate(() => true)

    groundTouch()

    expect(vibrate).not.toHaveBeenCalled()
  })

  it('swallows a device that declines to buzz', () => {
    withReducedMotion(false)
    withVibrate(() => {
      throw new Error('vibration blocked')
    })

    expect(() => groundTouch()).not.toThrow()
  })
})
