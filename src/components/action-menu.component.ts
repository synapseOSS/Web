import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  color?: string;
  danger?: boolean;
  show?: boolean;
}

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative inline-block">
      <!-- Trigger Button -->
      <button
        (click)="toggleMenu()"
        class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
        <app-icon name="more-horizontal" [size]="18"></app-icon>
      </button>

      <!-- Dropdown Menu -->
      @if (isOpen()) {
        <div class="fixed inset-0 z-40" (click)="closeMenu()"></div>
        <div class="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          @for (item of visibleItems(); track item.id) {
            <button
              (click)="selectItem(item.id)"
              class="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              [class.text-red-600]="item.danger"
              [class.dark:text-red-400]="item.danger"
              [class.text-slate-700]="!item.danger"
              [class.dark:text-slate-300]="!item.danger">
              <app-icon [name]="item.icon" [size]="16" [class]="item.color || ''"></app-icon>
              <span>{{ item.label }}</span>
            </button>
          }
        </div>
      }
    </div>
  `
})
export class ActionMenuComponent {
  items = input.required<MenuItem[]>();
  itemSelected = output<string>();
  
  isOpen = signal(false);

  visibleItems = signal<MenuItem[]>([]);

  ngOnInit() {
    this.updateVisibleItems();
  }

  ngOnChanges() {
    this.updateVisibleItems();
  }

  updateVisibleItems() {
    this.visibleItems.set(
      this.items().filter(item => item.show !== false)
    );
  }

  toggleMenu() {
    this.isOpen.update(v => !v);
  }

  closeMenu() {
    this.isOpen.set(false);
  }

  selectItem(id: string) {
    this.itemSelected.emit(id);
    this.closeMenu();
  }
}
