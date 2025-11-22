import { Injectable, signal } from '@angular/core';

export interface AccessibilitySettings {
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  keyboardNavigationEnabled: boolean;
  announceStoryChanges: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  // Accessibility settings
  private settings = signal<AccessibilitySettings>({
    reduceMotion: false,
    highContrast: false,
    screenReaderMode: false,
    keyboardNavigationEnabled: true,
    announceStoryChanges: true
  });

  // Live region for screen reader announcements
  private liveRegion: HTMLElement | null = null;

  constructor() {
    this.initializeAccessibility();
  }

  private initializeAccessibility() {
    if (typeof window === 'undefined') return;

    // Detect user preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    this.settings.update(s => ({
      ...s,
      reduceMotion: prefersReducedMotion,
      highContrast: prefersHighContrast
    }));

    // Create live region for announcements
    this.createLiveRegion();

    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.settings.update(s => ({ ...s, reduceMotion: e.matches }));
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.settings.update(s => ({ ...s, highContrast: e.matches }));
    });
  }

  private createLiveRegion() {
    if (typeof document === 'undefined') return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce a message to screen readers
   * @param message The message to announce
   * @param priority 'polite' (default) or 'assertive'
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion || !this.settings().announceStoryChanges) return;

    // Update aria-live attribute
    this.liveRegion.setAttribute('aria-live', priority);

    // Clear and set new message
    this.liveRegion.textContent = '';
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Get current accessibility settings
   */
  getSettings() {
    return this.settings();
  }

  /**
   * Update accessibility settings
   */
  updateSettings(updates: Partial<AccessibilitySettings>) {
    this.settings.update(s => ({ ...s, ...updates }));
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion(): boolean {
    return this.settings().reduceMotion;
  }

  /**
   * Check if high contrast is preferred
   */
  prefersHighContrast(): boolean {
    return this.settings().highContrast;
  }

  /**
   * Check if screen reader mode is enabled
   */
  isScreenReaderMode(): boolean {
    return this.settings().screenReaderMode;
  }

  /**
   * Generate accessible label for story
   */
  generateStoryLabel(story: {
    user?: { display_name?: string; username?: string };
    content?: string;
    media_type?: string;
    created_at?: string;
    interactive_elements?: any[];
  }): string {
    const username = story.user?.display_name || story.user?.username || 'User';
    const mediaType = story.media_type === 'video' ? 'video' : 'image';
    const timeAgo = this.formatTimeAgo(story.created_at);

    let label = `Story from ${username}, ${mediaType}, posted ${timeAgo}`;

    if (story.content) {
      label += `. Content: ${story.content}`;
    }

    if (story.interactive_elements && story.interactive_elements.length > 0) {
      const elementTypes = story.interactive_elements
        .map(el => el.element_type)
        .join(', ');
      label += `. Contains interactive elements: ${elementTypes}`;
    }

    return label;
  }

  /**
   * Format time ago for accessibility
   */
  private formatTimeAgo(dateString?: string): string {
    if (!dateString) return 'recently';

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  /**
   * Check color contrast ratio
   * @param foreground Foreground color in hex
   * @param background Background color in hex
   * @returns Contrast ratio
   */
  checkContrastRatio(foreground: string, background: string): number {
    const getLuminance = (hex: string): number => {
      // Remove # if present
      hex = hex.replace('#', '');

      // Convert to RGB
      const r = parseInt(hex.substr(0, 2), 16) / 255;
      const g = parseInt(hex.substr(2, 2), 16) / 255;
      const b = parseInt(hex.substr(4, 2), 16) / 255;

      // Calculate relative luminance
      const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

      return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if contrast ratio meets WCAG AA standards
   * @param ratio Contrast ratio
   * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
   */
  meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  }

  /**
   * Check if contrast ratio meets WCAG AAA standards
   * @param ratio Contrast ratio
   * @param isLargeText Whether the text is large (18pt+ or 14pt+ bold)
   */
  meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  /**
   * Get keyboard shortcut help text
   */
  getKeyboardShortcuts(): { key: string; description: string }[] {
    return [
      { key: 'Arrow Left', description: 'Previous story' },
      { key: 'Arrow Right', description: 'Next story' },
      { key: 'Space', description: 'Pause/Resume story' },
      { key: 'Escape', description: 'Close story viewer' },
      { key: 'R', description: 'Focus reply input' },
      { key: 'M', description: 'Toggle mute' },
      { key: 'Tab', description: 'Navigate interactive elements' },
      { key: 'Enter', description: 'Activate focused element' }
    ];
  }

  /**
   * Cleanup on service destruction
   */
  ngOnDestroy() {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
  }
}
