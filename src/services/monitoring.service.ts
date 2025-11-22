import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  context?: any;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class MonitoringService {
  private authService = inject(AuthService);
  private errorLogs: ErrorLog[] = [];
  private performanceMetrics: PerformanceMetric[] = [];

  logError(error: Error, context?: any) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      userId: this.authService.currentUser()?.id,
      context
    };

    this.errorLogs.push(errorLog);
    console.error('[Monitoring]', errorLog);

    // In production, send to error tracking service (e.g., Sentry)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: context });
    }
  }

  trackPerformance(name: string, startTime: number) {
    const duration = performance.now() - startTime;
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date()
    };

    this.performanceMetrics.push(metric);
    
    if (duration > 1000) {
      console.warn(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }
  }

  trackStorageUsage(bytes: number) {
    const mb = bytes / (1024 * 1024);
    console.log(`[Storage] Current usage: ${mb.toFixed(2)}MB`);
    
    if (mb > 900) {
      console.warn('[Storage] Approaching quota limit');
    }
  }

  trackRealtimeConnection(status: 'connected' | 'disconnected' | 'error') {
    console.log(`[Realtime] Connection status: ${status}`);
  }

  getErrorLogs() {
    return [...this.errorLogs];
  }

  getPerformanceMetrics() {
    return [...this.performanceMetrics];
  }

  clearLogs() {
    this.errorLogs = [];
    this.performanceMetrics = [];
  }
}
