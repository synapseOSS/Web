import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AccessibilityService {
  private announcement = signal('');

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    this.announcement.set(message);
    setTimeout(() => this.announcement.set(''), 100);
  }

  getAnnouncement() {
    return this.announcement.asReadonly();
  }
}
