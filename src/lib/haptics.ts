/**
 * The one channel where the app can put actual weight into a hand.
 *
 * A single short tick at the moment an anchor is met — the same moment the
 * beat and the ring play. Not a buzz and not a pattern: the physical
 * equivalent of the beat, and just as brief.
 *
 * Only some platforms carry it. Android does; iOS Safari has no Vibration
 * API at all. Where it is absent the moment is simply visual, which is the
 * same moment. Nothing depends on this.
 */

/** Short enough to read as a tick rather than a buzz. */
const TICK_MS = 12

export function groundTouch(): void {
  if (typeof navigator === 'undefined') return
  if (typeof navigator.vibrate !== 'function') return

  // Those who asked for less stimulation get less stimulation.
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  }

  try {
    navigator.vibrate(TICK_MS)
  } catch {
    // A device that declines to buzz is not a condition worth surfacing.
  }
}
