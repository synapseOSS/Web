import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlingService, ErrorSeverity } from '../services/error-handling.service';

/**
 * Error Display Component
 * 
 * Displays error messages with appropriate styling and recovery actions
 * Automatically shows/hides based on error state
 * 
 * Requirements: 14.2, 14.9
 */
@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (currentError()) {
      <div 
        class="error-container"
        [class.error-info]="currentError()?.severity === 'info'"
        [class.error-warning]="currentError()?.severity === 'warning'"
        [class.error-error]="currentError()?.severity === 'error'"
        [class.error-critical]="currentError()?.severity === 'critical'"
        role="alert"
        aria-live="polite"
      >
        <div class="error-header">
          <div class="error-icon">
            @switch (currentError()?.severity) {
              @case ('info') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              }
              @default {
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              }
            }
          </div>
          <div class="error-content">
            <h3 class="error-title">{{ getErrorTitle() }}</h3>
            <p class="error-message">{{ currentError()?.userMessage }}</p>
          </div>
          <button 
            class="error-close"
            (click)="dismissError()"
            aria-label="Dismiss error"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        @if (currentError()?.recoveryActions && currentError()!.recoveryActions!.length > 0) {
          <div class="error-actions">
            <p class="error-actions-title">What you can do:</p>
            <ul class="error-actions-list">
              @for (action of currentError()?.recoveryActions; track action) {
                <li>{{ action }}</li>
              }
            </ul>
          </div>
        }
        
        @if (currentError()?.retryable) {
          <div class="error-retry">
            <button 
              class="retry-button"
              (click)="onRetry()"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Try Again
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .error-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      max-width: 28rem;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .error-info {
      background-color: #EFF6FF;
      border-left: 4px solid #3B82F6;
      color: #1E40AF;
    }

    .error-warning {
      background-color: #FFFBEB;
      border-left: 4px solid #F59E0B;
      color: #92400E;
    }

    .error-error {
      background-color: #FEF2F2;
      border-left: 4px solid #EF4444;
      color: #991B1B;
    }

    .error-critical {
      background-color: #FEF2F2;
      border-left: 4px solid #DC2626;
      color: #7F1D1D;
    }

    .error-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .error-icon {
      flex-shrink: 0;
    }

    .error-content {
      flex: 1;
    }

    .error-title {
      font-weight: 600;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }

    .error-message {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .error-close {
      flex-shrink: 0;
      padding: 0.25rem;
      border-radius: 0.25rem;
      background: transparent;
      border: none;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .error-close:hover {
      opacity: 1;
    }

    .error-actions {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid currentColor;
      opacity: 0.8;
    }

    .error-actions-title {
      font-weight: 600;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .error-actions-list {
      list-style: disc;
      padding-left: 1.25rem;
      font-size: 0.875rem;
    }

    .error-actions-list li {
      margin-bottom: 0.25rem;
    }

    .error-retry {
      margin-top: 0.75rem;
    }

    .retry-button {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      background-color: currentColor;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .retry-button:hover {
      opacity: 0.9;
    }

    @media (max-width: 640px) {
      .error-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }
    }
  `]
})
export class ErrorDisplayComponent {
  private errorHandler = inject(ErrorHandlingService);
  
  currentError = this.errorHandler.currentError;
  
  getErrorTitle = computed(() => {
    const error = this.currentError();
    if (!error) return '';
    
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return 'Information';
      case ErrorSeverity.WARNING:
        return 'Warning';
      case ErrorSeverity.ERROR:
        return 'Error';
      case ErrorSeverity.CRITICAL:
        return 'Critical Error';
      default:
        return 'Error';
    }
  });
  
  dismissError(): void {
    this.errorHandler.clearError();
  }
  
  onRetry(): void {
    // Emit retry event or handle retry logic
    // This would typically be handled by the parent component
    this.dismissError();
  }
}
