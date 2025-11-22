import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading Indicator Component
 * 
 * Displays loading states with optional progress indication
 * Supports different sizes and styles
 * 
 * Requirements: 14.5
 */
@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="loading-container"
      [class.loading-inline]="inline"
      [class.loading-overlay]="overlay"
      role="status"
      aria-live="polite"
      [attr.aria-label]="message || 'Loading'"
    >
      @if (overlay) {
        <div class="loading-backdrop"></div>
      }
      
      <div class="loading-content">
        @if (type === 'spinner') {
          <div 
            class="loading-spinner"
            [class.spinner-sm]="size === 'sm'"
            [class.spinner-md]="size === 'md'"
            [class.spinner-lg]="size === 'lg'"
          >
            <svg class="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        }
        
        @if (type === 'dots') {
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        }
        
        @if (type === 'bar' && progress !== undefined) {
          <div class="loading-bar-container">
            <div 
              class="loading-bar"
              [style.width.%]="progress"
            ></div>
          </div>
        }
        
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
        
        @if (progress !== undefined && type !== 'bar') {
          <p class="loading-progress">{{ progress }}%</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-inline {
      padding: 1rem;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }

    .loading-content {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .loading-spinner {
      color: #3B82F6;
    }

    .spinner-sm svg {
      width: 1.5rem;
      height: 1.5rem;
    }

    .spinner-md svg {
      width: 2.5rem;
      height: 2.5rem;
    }

    .spinner-lg svg {
      width: 4rem;
      height: 4rem;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    .loading-dots {
      display: flex;
      gap: 0.5rem;
    }

    .dot {
      width: 0.75rem;
      height: 0.75rem;
      background-color: #3B82F6;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out both;
    }

    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }

    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
      }
      40% {
        transform: scale(1);
      }
    }

    .loading-bar-container {
      width: 100%;
      max-width: 20rem;
      height: 0.5rem;
      background-color: #E5E7EB;
      border-radius: 9999px;
      overflow: hidden;
    }

    .loading-bar {
      height: 100%;
      background-color: #3B82F6;
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .loading-message {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      text-align: center;
    }

    .loading-progress {
      font-size: 0.75rem;
      color: #6B7280;
      font-weight: 600;
    }

    .loading-inline .loading-content {
      background: transparent;
      box-shadow: none;
      padding: 0;
    }
  `]
})
export class LoadingIndicatorComponent {
  @Input() type: 'spinner' | 'dots' | 'bar' = 'spinner';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message?: string;
  @Input() progress?: number;
  @Input() inline: boolean = false;
  @Input() overlay: boolean = false;
}
