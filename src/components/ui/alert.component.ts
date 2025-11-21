import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'ui-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div [class]="alertClasses" role="alert">
      <ng-content></ng-content>
    </div>
  `
})
export class AlertComponent {
  @Input() variant: 'default' | 'info' | 'success' | 'warning' | 'destructive' = 'default';
  @Input() className: string = '';

  get alertClasses(): string {
    const base = 'relative w-full rounded-xl p-4 border transition-all';
    
    const variants = {
      default: 'bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-900/50 dark:border-white/10 dark:text-white',
      info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-200',
      success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-200',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-500/10 dark:border-yellow-500/20 dark:text-yellow-200',
      destructive: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-200'
    };

    return `${base} ${variants[this.variant]} ${this.className}`;
  }
}

@Component({
  selector: 'ui-alert-title',
  standalone: true,
  template: `
    <h5 class="font-bold mb-1 flex items-center gap-2">
      <ng-content></ng-content>
    </h5>
  `
})
export class AlertTitleComponent {}

@Component({
  selector: 'ui-alert-description',
  standalone: true,
  template: `
    <div class="text-sm opacity-90">
      <ng-content></ng-content>
    </div>
  `
})
export class AlertDescriptionComponent {}
