import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-separator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="separatorClasses"
      role="separator">
    </div>
  `
})
export class SeparatorComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() className: string = '';

  get separatorClasses(): string {
    const base = 'bg-slate-200 dark:bg-white/10';
    const orientation = this.orientation === 'horizontal' 
      ? 'h-px w-full' 
      : 'w-px h-full';
    
    return `${base} ${orientation} ${this.className}`;
  }
}
