import { Component, inject } from '@angular/core';
import { AccessibilityService } from '../services/accessibility.service';

@Component({
  selector: 'app-live-region',
  standalone: true,
  template: `
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      class="sr-only">
      {{ a11yService.getAnnouncement()() }}
    </div>
  `
})
export class LiveRegionComponent {
  a11yService = inject(AccessibilityService);
}
