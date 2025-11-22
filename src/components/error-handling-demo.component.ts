import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorHandlingService } from '../services/error-handling.service';
import { StoryErrorWrapperService } from '../services/story-error-wrapper.service';
import { ErrorDisplayComponent } from './error-display.component';
import { LoadingIndicatorComponent } from './loading-indicator.component';
import { SuccessNotificationComponent } from './success-notification.component';

/**
 * Error Handling Demo Component
 * 
 * Demonstrates the usage of error handling, loading states, and success notifications
 * This component shows best practices for integrating error handling into UI components
 * 
 * Requirements: 14.1-14.10
 */
@Component({
  selector: 'app-error-handling-demo',
  standalone: true,
  imports: [
    CommonModule,
    ErrorDisplayComponent,
    LoadingIndicatorComponent,
    SuccessNotificationComponent
  ],
  template: `
    <div class="demo-container">
      <h1 class="demo-title">Error Handling Demo</h1>
      
      <!-- Global error display -->
      <app-error-display />
      
      <!-- Global success notifications -->
      <app-success-notification />
      
      <!-- Demo actions -->
      <div class="demo-actions">
        <h2 class="section-title">Test Error Handling</h2>
        
        <div class="action-grid">
          <button 
            class="action-button"
            (click)="testValidationError()"
            [disabled]="isAnyLoading()"
          >
            Test Validation Error
          </button>
          
          <button 
            class="action-button"
            (click)="testNetworkError()"
            [disabled]="isAnyLoading()"
          >
            Test Network Error
          </button>
          
          <button 
            class="action-button"
            (click)="testRetryLogic()"
            [disabled]="isAnyLoading()"
          >
            Test Retry Logic
          </button>
          
          <button 
            class="action-button"
            (click)="testSuccessNotification()"
            [disabled]="isAnyLoading()"
          >
            Test Success Notification
          </button>
        </div>
      </div>
      
      <!-- Loading states -->
      <div class="demo-loading">
        <h2 class="section-title">Loading States</h2>
        
        @if (storyWrapper.isLoading('create-story')) {
          <app-loading-indicator
            type="spinner"
            size="md"
            message="Creating story..."
            [progress]="storyWrapper.getProgress('create-story')"
            [inline]="true"
          />
        }
        
        @if (storyWrapper.isLoading('fetch-stories')) {
          <app-loading-indicator
            type="dots"
            message="Loading stories..."
            [inline]="true"
          />
        }
        
        @if (storyWrapper.isLoading('upload-media')) {
          <app-loading-indicator
            type="bar"
            message="Uploading media..."
            [progress]="storyWrapper.getProgress('upload-media')"
            [inline]="true"
          />
        }
      </div>
      
      <!-- Error history -->
      <div class="demo-history">
        <h2 class="section-title">Error History</h2>
        
        @if (errorHistory().length === 0) {
          <p class="empty-state">No errors yet</p>
        } @else {
          <div class="history-list">
            @for (error of errorHistory(); track error.timestamp) {
              <div class="history-item">
                <div class="history-header">
                  <span class="history-category">{{ error.category }}</span>
                  <span class="history-severity" [class]="'severity-' + error.severity">
                    {{ error.severity }}
                  </span>
                  <span class="history-time">
                    {{ formatTime(error.timestamp) }}
                  </span>
                </div>
                <p class="history-message">{{ error.userMessage }}</p>
                @if (error.code) {
                  <p class="history-code">Code: {{ error.code }}</p>
                }
              </div>
            }
          </div>
        }
      </div>
      
      <!-- Integration example -->
      <div class="demo-integration">
        <h2 class="section-title">Integration Example</h2>
        <pre class="code-block">{{ integrationExample }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .demo-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: #111827;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #374151;
    }

    .demo-actions {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: #F9FAFB;
      border-radius: 0.5rem;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-button {
      padding: 0.75rem 1.5rem;
      background-color: #3B82F6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .action-button:hover:not(:disabled) {
      background-color: #2563EB;
    }

    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .demo-loading {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: #F9FAFB;
      border-radius: 0.5rem;
      min-height: 150px;
    }

    .demo-history {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background-color: #F9FAFB;
      border-radius: 0.5rem;
    }

    .empty-state {
      text-align: center;
      color: #6B7280;
      padding: 2rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .history-item {
      padding: 1rem;
      background-color: white;
      border-radius: 0.375rem;
      border: 1px solid #E5E7EB;
    }

    .history-header {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .history-category {
      padding: 0.25rem 0.5rem;
      background-color: #DBEAFE;
      color: #1E40AF;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .history-severity {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .severity-info {
      background-color: #DBEAFE;
      color: #1E40AF;
    }

    .severity-warning {
      background-color: #FEF3C7;
      color: #92400E;
    }

    .severity-error {
      background-color: #FEE2E2;
      color: #991B1B;
    }

    .severity-critical {
      background-color: #FEE2E2;
      color: #7F1D1D;
    }

    .history-time {
      padding: 0.25rem 0.5rem;
      background-color: #F3F4F6;
      color: #6B7280;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .history-message {
      font-size: 0.875rem;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .history-code {
      font-size: 0.75rem;
      color: #6B7280;
      font-family: monospace;
    }

    .demo-integration {
      padding: 1.5rem;
      background-color: #F9FAFB;
      border-radius: 0.5rem;
    }

    .code-block {
      padding: 1rem;
      background-color: #1F2937;
      color: #F9FAFB;
      border-radius: 0.375rem;
      overflow-x: auto;
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `]
})
export class ErrorHandlingDemoComponent {
  errorHandler = inject(ErrorHandlingService);
  storyWrapper = inject(StoryErrorWrapperService);
  
  errorHistory = this.errorHandler.getErrorHistory;
  
  integrationExample = `
// In your component:
import { ErrorHandlingService } from './services/error-handling.service';
import { StoryErrorWrapperService } from './services/story-error-wrapper.service';

export class MyComponent {
  storyWrapper = inject(StoryErrorWrapperService);
  errorHandler = inject(ErrorHandlingService);
  
  async createStory(options: StoryCreationOptions) {
    // Automatic error handling, loading states, and success notifications
    const story = await this.storyWrapper.createStory(options);
    
    if (story) {
      // Success! Story was created
      console.log('Story created:', story.id);
    } else {
      // Error occurred, already handled and displayed to user
      console.log('Story creation failed');
    }
  }
  
  // Check loading state
  get isCreating() {
    return this.storyWrapper.isLoading('create-story');
  }
  
  // Get current error
  get currentError() {
    return this.errorHandler.currentError();
  }
}

// In your template:
<app-error-display />
<app-success-notification />

@if (isCreating) {
  <app-loading-indicator 
    message="Creating story..." 
    [progress]="storyWrapper.getProgress('create-story')"
  />
}
  `.trim();
  
  async testValidationError() {
    try {
      throw new Error('Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, MOV, WebM');
    } catch (error) {
      this.errorHandler.handleError(error, 'Validation test');
    }
  }
  
  async testNetworkError() {
    try {
      throw new Error('network error: Failed to fetch');
    } catch (error) {
      this.errorHandler.handleError(error, 'Network test');
    }
  }
  
  async testRetryLogic() {
    let attempts = 0;
    
    await this.errorHandler.executeWithRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'Success!';
      },
      {
        maxRetries: 3,
        delayMs: 500,
        operation: 'retry-test',
        errorContext: 'Testing retry logic'
      }
    );
    
    this.errorHandler.showSuccess(`Operation succeeded after ${attempts} attempts`);
  }
  
  testSuccessNotification() {
    this.errorHandler.showSuccess('Story created successfully!', 'View story');
  }
  
  isAnyLoading(): boolean {
    return this.storyWrapper.isLoading('create-story') ||
           this.storyWrapper.isLoading('fetch-stories') ||
           this.storyWrapper.isLoading('upload-media');
  }
  
  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }
}
