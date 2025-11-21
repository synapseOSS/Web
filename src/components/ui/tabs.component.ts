import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <ng-content></ng-content>
    </div>
  `
})
export class TabsComponent {
  @Input() defaultValue: string = '';
  @Output() valueChange = new EventEmitter<string>();
}

@Component({
  selector: 'ui-tabs-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inline-flex items-center gap-1 p-1 rounded-lg glass-subtle border border-slate-200 dark:border-white/10">
      <ng-content></ng-content>
    </div>
  `
})
export class TabsListComponent {}

@Component({
  selector: 'ui-tabs-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      [class]="triggerClasses"
      (click)="handleClick()">
      <ng-content></ng-content>
    </button>
  `
})
export class TabsTriggerComponent {
  @Input() value: string = '';
  @Input() active: boolean = false;
  @Output() clicked = new EventEmitter<string>();

  get triggerClasses(): string {
    const base = 'px-4 py-2 rounded-md text-sm font-medium transition-all';
    const active = 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm';
    const inactive = 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white';
    
    return `${base} ${this.active ? active : inactive}`;
  }

  handleClick() {
    this.clicked.emit(this.value);
  }
}

@Component({
  selector: 'ui-tabs-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="active" class="mt-4 animate-fade-in">
      <ng-content></ng-content>
    </div>
  `
})
export class TabsContentComponent {
  @Input() value: string = '';
  @Input() active: boolean = false;
}
