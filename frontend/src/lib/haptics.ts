/**
 * Haptic feedback utility for tablet interactions.
 * Uses the Vibration API where available.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50, 100, 50],
  selection: 5,
};

class HapticEngine {
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /**
   * Trigger haptic feedback
   */
  trigger(style: HapticStyle = 'light'): void {
    if (!this.isSupported) return;

    try {
      const pattern = HAPTIC_PATTERNS[style];
      navigator.vibrate(pattern);
    } catch {
      // Silently fail if vibration not allowed
    }
  }

  /**
   * Light tap feedback - for selections, toggles
   */
  light(): void {
    this.trigger('light');
  }

  /**
   * Medium feedback - for button presses
   */
  medium(): void {
    this.trigger('medium');
  }

  /**
   * Heavy feedback - for important actions
   */
  heavy(): void {
    this.trigger('heavy');
  }

  /**
   * Success feedback - for completed actions
   */
  success(): void {
    this.trigger('success');
  }

  /**
   * Warning feedback - for alerts
   */
  warning(): void {
    this.trigger('warning');
  }

  /**
   * Error feedback - for failures
   */
  error(): void {
    this.trigger('error');
  }

  /**
   * Selection feedback - for quick selections
   */
  selection(): void {
    this.trigger('selection');
  }
}

export const haptics = new HapticEngine();

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
  return haptics;
}
