
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  pwaService = inject(PwaService);

  ngOnInit() {
    // PWA is automatically initialized via the service
  }

  async installPwa() {
    const installed = await this.pwaService.install();
    if (installed) {
      console.log('✅ App installed successfully');
    }
  }

  dismissInstall() {
    this.pwaService.isInstallable.set(false);
  }

  async updatePwa() {
    await this.pwaService.update();
  }
}
