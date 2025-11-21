import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'rounded-xl border transition-all ' + variant + ' ' + className">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() variant: 'default' | 'ghost' | 'outline' = 'default';
  @Input() className: string = '';

  get variantClasses() {
    const variants = {
      default: 'glass-strong shadow-lg hover-lift',
      ghost: 'bg-transparent border-transparent',
      outline: 'glass-subtle border-slate-200 dark:border-white/10'
    };
    return variants[this.variant];
  }
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  template: `
    <div class="p-6 pb-4">
      <ng-content></ng-content>
    </div>
  `
})
export class CardHeaderComponent {}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  template: `
    <h3 class="text-xl font-bold text-slate-900 dark:text-white">
      <ng-content></ng-content>
    </h3>
  `
})
export class CardTitleComponent {}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  template: `
    <p class="text-sm text-slate-600 dark:text-slate-400 mt-2">
      <ng-content></ng-content>
    </p>
  `
})
export class CardDescriptionComponent {}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  template: `
    <div class="p-6 pt-0">
      <ng-content></ng-content>
    </div>
  `
})
export class CardContentComponent {}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  template: `
    <div class="p-6 pt-0 flex items-center gap-4">
      <ng-content></ng-content>
    </div>
  `
})
export class CardFooterComponent {}
