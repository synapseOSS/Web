import { Injectable, signal } from '@angular/core';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  STORAGE = 'storage',
  DATABASE = 'database',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Structured error information
 */
export interface AppError {
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  recoveryActions?: string[];
}

/**
 * Loading state for operations
 */
export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number;
}

/**
 * Success notification
 */
export interface SuccessNotification {
  message: string;
  action?: string;
  timestamp: Date;
}

/**
 * Error Handling Service
 * Provides centralized error handling, user feedback, and recovery strategies
 * 
 * Requirements:
 * - 1.10: Error handling and rollback
 * - 14.1-14.10: Comprehensive error handling and recovery
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  // Current error state
  currentError = signal<AppError | null>(null);
  
  // Loading states for different operations
  loadingStates = signal<Map<string, LoadingState>>(new Map());
  
  // Success notifications
  successNotifications = signal<SuccessNotification[]>([]);
  
  // Error history for debugging
  private errorHistory: AppError[] = [];
  private readonly MAX_HISTORY = 50;

  /**
   * Handle an error and convert it to a structured AppError
   */
  handleError(error: any, context?: string): AppError {
    const appError = this.categorizeError(error, context);
    
    // Store in history
    this.errorHistory.push(appError);
    if (this.errorHistory.length > this.MAX_HISTORY) {
      this.errorHistory.shift();
    }
    
    // Set as current error
    this.currentError.set(appError);
    
    // Log for debugging
    this.logError(appError);
    
    return appError;
  }

  /**
   * Categorize an error and create structured AppError
   */
  private categorizeError(error: any, context?: string): AppError {
    const timestamp = new Date();
    
    // Handle Supabase/PostgreSQL errors
    if (error?.code) {
      return this.handleSupabaseError(error, context, timestamp);
    }
    
    // Handle storage errors
    if (error?.message?.includes('storage') || error?.message?.includes('upload')) {
      return {
        category: ErrorCategory.STORAGE,
        severity: ErrorSeverity.ERROR,
        message: error.message || 'Storage operation failed',
        userMessage: 'Failed to upload media. Please check your file size and try again.',
        code: error.code,
        details: { context, originalError: error },
        timestamp,
        retryable: true,
        recoveryActions: [
          'Check your internet connection',
          'Ensure file size is under 100MB',
          'Try again in a few moments'
        ]
      };
    }
    
    // Handle network errors
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.WARNING,
        message: error.message || 'Network error',
        userMessage: 'Connection issue. Please check your internet connection.',
        timestamp,
        retryable: true,
        recoveryActions: [
          'Check your internet connection',
          'Try again in a few moments'
        ]
      };
    }
    
    // Handle validation errors
    if (error?.message?.includes('Invalid') || error?.message?.includes('validation')) {
      return {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.WARNING,
        message: error.message,
        userMessage: error.message,
        timestamp,
        retryable: false,
        recoveryActions: ['Please check your input and try again']
      };
    }
    
    // Default unknown error
    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      message: error?.message || 'An unexpected error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      details: { context, originalError: error },
      timestamp,
      retryable: true,
      recoveryActions: ['Try again', 'Contact support if the problem persists']
    };
  }

  /**
   * Handle Supabase-specific errors
   */
  private handleSupabaseError(error: any, context?: string, timestamp: Date = new Date()): AppError {
    const code = error.code;
    
    // PostgreSQL error codes
    switch (code) {
      case 'PGRST116': // Not found
        return {
          category: ErrorCategory.NOT_FOUND,
          severity: ErrorSeverity.WARNING,
          message: 'Resource not found',
          userMessage: 'Story not found. It may have expired or been deleted.',
          code,
          timestamp,
          retryable: false,
          recoveryActions: ['Return to feed', 'Refresh the page']
        };
      
      case '23505': // Unique violation
        return {
          category: ErrorCategory.CONFLICT,
          severity: ErrorSeverity.WARNING,
          message: 'Duplicate entry',
          userMessage: 'This action has already been performed.',
          code,
          timestamp,
          retryable: false
        };
      
      case '23503': // Foreign key violation
        return {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.ERROR,
          message: 'Referenced resource does not exist',
          userMessage: 'Invalid reference. Please refresh and try again.',
          code,
          timestamp,
          retryable: false,
          recoveryActions: ['Refresh the page', 'Try again']
        };
      
      case '42501': // Insufficient privilege
      case 'PGRST301': // Authorization error
        return {
          category: ErrorCategory.AUTHORIZATION,
          severity: ErrorSeverity.ERROR,
          message: 'Permission denied',
          userMessage: 'You do not have permission to perform this action.',
          code,
          timestamp,
          retryable: false,
          recoveryActions: ['Check your permissions', 'Contact the content owner']
        };
      
      case '23514': // Check constraint violation
        return {
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.WARNING,
          message: 'Validation constraint violated',
          userMessage: 'Invalid data. Please check your input.',
          code,
          timestamp,
          retryable: false,
          recoveryActions: ['Review your input', 'Try again with valid data']
        };
      
      default:
        return {
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.ERROR,
          message: error.message || 'Database error',
          userMessage: 'A database error occurred. Please try again.',
          code,
          details: { context, originalError: error },
          timestamp,
          retryable: true,
          recoveryActions: ['Try again', 'Refresh the page']
        };
    }
  }

  /**
   * Log error for debugging
   */
  private logError(error: AppError): void {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                     error.severity === ErrorSeverity.ERROR ? 'error' :
                     error.severity === ErrorSeverity.WARNING ? 'warn' : 'info';
    
    console[logLevel]('[ErrorHandling]', {
      category: error.category,
      severity: error.severity,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      details: error.details
    });
  }

  /**
   * Clear current error
   */
  clearError(): void {
    this.currentError.set(null);
  }

  /**
   * Get error history
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * Set loading state for an operation
   */
  setLoading(operation: string, isLoading: boolean, progress?: number): void {
    const states = new Map(this.loadingStates());
    
    if (isLoading) {
      states.set(operation, { isLoading, operation, progress });
    } else {
      states.delete(operation);
    }
    
    this.loadingStates.set(states);
  }

  /**
   * Check if an operation is loading
   */
  isLoading(operation: string): boolean {
    return this.loadingStates().get(operation)?.isLoading || false;
  }

  /**
   * Get loading progress for an operation
   */
  getProgress(operation: string): number | undefined {
    return this.loadingStates().get(operation)?.progress;
  }

  /**
   * Show success notification
   */
  showSuccess(message: string, action?: string): void {
    const notification: SuccessNotification = {
      message,
      action,
      timestamp: new Date()
    };
    
    const notifications = [...this.successNotifications(), notification];
    this.successNotifications.set(notifications);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismissSuccess(notification);
    }, 5000);
  }

  /**
   * Dismiss a success notification
   */
  dismissSuccess(notification: SuccessNotification): void {
    const notifications = this.successNotifications().filter(n => n !== notification);
    this.successNotifications.set(notifications);
  }

  /**
   * Clear all success notifications
   */
  clearSuccessNotifications(): void {
    this.successNotifications.set([]);
  }

  /**
   * Execute an operation with automatic error handling and loading state
   */
  async executeWithHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorContext?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: AppError) => void;
    }
  ): Promise<T | null> {
    this.setLoading(operation, true);
    this.clearError();
    
    try {
      const result = await fn();
      
      if (options?.successMessage) {
        this.showSuccess(options.successMessage);
      }
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      const appError = this.handleError(error, options?.errorContext || operation);
      
      if (options?.onError) {
        options.onError(appError);
      }
      
      return null;
    } finally {
      this.setLoading(operation, false);
    }
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      exponentialBackoff?: boolean;
      operation?: string;
      errorContext?: string;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      exponentialBackoff = true,
      operation = 'operation',
      errorContext
    } = options;
    
    let lastError: any;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (operation) {
          this.setLoading(operation, true, (attempt / maxRetries) * 100);
        }
        
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on non-retryable errors
        const appError = this.categorizeError(error, errorContext);
        if (!appError.retryable) {
          throw error;
        }
        
        // Don't delay on last attempt
        if (attempt < maxRetries - 1) {
          const delay = exponentialBackoff 
            ? delayMs * Math.pow(2, attempt)
            : delayMs;
          
          await this.delay(delay);
        }
      } finally {
        if (operation && attempt === maxRetries - 1) {
          this.setLoading(operation, false);
        }
      }
    }
    
    // All retries failed
    throw lastError;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: any): string {
    if (error && typeof error === 'object' && 'userMessage' in error) {
      return error.userMessage;
    }
    
    const appError = this.categorizeError(error);
    return appError.userMessage;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: any): boolean {
    const appError = this.categorizeError(error);
    return appError.retryable;
  }

  /**
   * Get recovery actions for an error
   */
  getRecoveryActions(error: any): string[] {
    const appError = this.categorizeError(error);
    return appError.recoveryActions || [];
  }
}
