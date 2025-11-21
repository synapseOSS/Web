import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' = 'default';
  @Input() className: string = '';

  get badgeClasses(): string {
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all';
    
    const variants = {
      default: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
      secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
      destructive: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
      outline: 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
    };

    return `${base} ${variants[this.variant]} ${this.className}`;
  }
}
