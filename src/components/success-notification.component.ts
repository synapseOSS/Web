import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * Success Notification Component
 * 
 * Displays success messages with auto-dismiss
 * Shows multiple notifications in a stack
 * 
 * Requirements: 14.6
 */
@Component({
  selector: 'app-success-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (notification of notifications(); track notification.timestamp) {
        <div 
          class="notification"
          role="status"
          aria-live="polite"
        >
          <div class="notification-icon">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="notification-content">
            <p class="notification-message">{{ notification.message }}</p>
            @if (notification.action) {
              <p class="notification-action">{{ notification.action }}</p>
            }
          </div>
          <button 
            class="notification-close"
            (click)="dismiss(notification)"
            aria-label="Dismiss notification"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 9999;
      max-width: 24rem;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background-color: #ECFDF5;
      border-left: 4px solid #10B981;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .notification-icon {
      flex-shrink: 0;
      color: #10B981;
    }

    .notification-content {
      flex: 1;
    }

    .notification-message {
      font-size: 0.875rem;
      font-weight: 500;
      color: #065F46;
    }

    .notification-action {
      font-size: 0.75rem;
      color: #047857;
      margin-top: 0.25rem;
    }

    .notification-close {
      flex-shrink: 0;
      padding: 0.25rem;
      border-radius: 0.25rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #065F46;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .notification-close:hover {
      opacity: 1;
    }

    @media (max-width: 640px) {
      .notification-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `]
})
export class SuccessNotificationComponent {
  private errorHandler = inject(ErrorHandlingService);
  
  notifications = this.errorHandler.successNotifications;
  
  dismiss(notification: any): void {
    this.errorHandler.dismissSuccess(notification);
  }
}
