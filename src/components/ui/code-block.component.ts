import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon.component';

@Component({
  selector: 'ui-code-block',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="relative group">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-20 blur-lg group-hover:opacity-30 transition-opacity rounded-xl"></div>
      <div class="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
          <span class="text-xs font-mono text-slate-400">{{ language }}</span>
          <button 
            (click)="copyCode()"
            class="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <app-icon [name]="copied() ? 'check' : 'copy'" [size]="14"></app-icon>
          </button>
        </div>
        <!-- Code -->
        <div class="p-4 overflow-x-auto">
          <pre class="text-sm font-mono text-slate-300"><code>{{ code }}</code></pre>
        </div>
      </div>
    </div>
  `
})
export class CodeBlockComponent {
  @Input() code: string = '';
  @Input() language: string = 'bash';
  copied = signal(false);

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
}
