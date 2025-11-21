import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [type]="type"
      [disabled]="disabled"
      [class]="buttonClasses"
      (click)="handleClick($event)">
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled: boolean = false;
  @Input() className: string = '';
  @Output() clicked = new EventEmitter<Event>();

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all gpu-accelerated disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      default: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl glow-indigo',
      secondary: 'glass-strong text-slate-900 dark:text-white hover:glass border border-slate-200 dark:border-white/10',
      outline: 'border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800',
      ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-lg'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]} ${this.className}`;
  }

  handleClick(event: Event) {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}
