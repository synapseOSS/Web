import { Directive, HostListener, output } from '@angular/core';

@Directive({
  selector: '[keyboardNav]',
  standalone: true
})
export class KeyboardNavDirective {
  next = output<void>();
  previous = output<void>();
  close = output<void>();
  pause = output<void>();

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.next.emit();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.previous.emit();
        break;
      case 'Escape':
        event.preventDefault();
        this.close.emit();
        break;
      case ' ':
        event.preventDefault();
        this.pause.emit();
        break;
    }
  }
}
