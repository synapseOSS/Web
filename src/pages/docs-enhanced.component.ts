import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { FormsModule } from '@angular/forms';
import { 
  CardComponent, CardHeaderComponent, CardTitleComponent, 
  CardDescriptionComponent, CardContentComponent, CardFooterComponent 
} from '../components/ui/card.component';
import { AlertComponent, AlertTitleComponent, AlertDescriptionComponent } from '../components/ui/alert.component';
import { BadgeComponent } from '../components/ui/badge.component';
import { CodeBlockComponent } from '../components/ui/code-block.component';
import { ButtonComponent } from '../components/ui/button.component';
import { SeparatorComponent } from '../components/ui/separator.component';
import { 
  TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent 
} from '../components/ui/tabs.component';

@Component({
  selector: 'app-docs-enhanced',
  standalone: true,
  imports: [
    CommonModule, RouterModule, IconComponent, FormsModule,
    CardComponent, CardHeaderComponent, CardTitleComponent, CardDescriptionComponent,
    CardContentComponent, CardFooterComponent, AlertComponent, AlertTitleComponent,
    AlertDescriptionComponent, BadgeComponent, CodeBlockComponent, ButtonComponent,
    SeparatorComponent, TabsComponent, TabsListComponent, TabsTriggerComponent, TabsContentComponent
  ],
  template: `
    <div class="min-h-screen pt-20 bg-slate-50 dark:bg-slate-950">
      <div class="container mx-auto px-6 py-12 max-w-7xl">
        
        <!-- Hero Section -->
        <div class="mb-16 text-center">
          <ui-badge variant="default" className="mb-4">Documentation</ui-badge>
          <h1 class="text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Build with Synapse
          </h1>
          <p class="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to integrate, deploy, and scale your social platform
          </p>
        </div>

        <!-- Quick Start Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-16">
          <ui-card variant="outline" className="hover:border-indigo-500 dark:hover:border-indigo-500 cursor-pointer">
            <ui-card-header>
              <div class="w-12 h-12 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <app-icon name="zap" [size]="24"></app-icon>
              </div>
              <ui-card-title>Quick Start</ui-card-title>
              <ui-card-description>
                Get up and running in under 5 minutes
              </ui-card-description>
            </ui-card-header>
          </ui-card>

          <ui-card variant="outline" className="hover:border-cyan-500 dark:hover:border-cyan-500 cursor-pointer">
            <ui-card-header>
              <div class="w-12 h-12 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
                <app-icon name="book" [size]="24"></app-icon>
              </div>
              <ui-card-title>API Reference</ui-card-title>
              <ui-card-description>
                Complete API documentation and examples
              </ui-card-description>
            </ui-card-header>
          </ui-card>

          <ui-card variant="outline" className="hover:border-purple-500 dark:hover:border-purple-500 cursor-pointer">
            <ui-card-header>
              <div class="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <app-icon name="users" [size]="24"></app-icon>
              </div>
              <ui-card-title>Community</ui-card-title>
              <ui-card-description>
                Join our community and get help
              </ui-card-description>
            </ui-card-header>
          </ui-card>
        </div>

        <!-- Installation Section -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Installation</h2>
          
          <ui-tabs [defaultValue]="activeTab()" (valueChange)="setActiveTab($event)">
            <ui-tabs-list>
              <ui-tabs-trigger value="docker" [active]="activeTab() === 'docker'" (clicked)="setActiveTab($event)">
                Docker
              </ui-tabs-trigger>
              <ui-tabs-trigger value="npm" [active]="activeTab() === 'npm'" (clicked)="setActiveTab($event)">
                NPM
              </ui-tabs-trigger>
              <ui-tabs-trigger value="manual" [active]="activeTab() === 'manual'" (clicked)="setActiveTab($event)">
                Manual
              </ui-tabs-trigger>
            </ui-tabs-list>

            <ui-tabs-content value="docker" [active]="activeTab() === 'docker'">
              <ui-code-block 
                language="bash"
                [code]="dockerCode">
              </ui-code-block>
            </ui-tabs-content>

            <ui-tabs-content value="npm" [active]="activeTab() === 'npm'">
              <ui-code-block 
                language="bash"
                [code]="npmCode">
              </ui-code-block>
            </ui-tabs-content>

            <ui-tabs-content value="manual" [active]="activeTab() === 'manual'">
              <ui-code-block 
                language="bash"
                [code]="manualCode">
              </ui-code-block>
            </ui-tabs-content>
          </ui-tabs>
        </div>

        <!-- Features Grid -->
        <div class="mb-16">
          <h2 class="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Core Features</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <ui-card>
              <ui-card-header>
                <ui-card-title>Real-time Messaging</ui-card-title>
                <ui-card-description>
                  WebSocket-based instant messaging with typing indicators
                </ui-card-description>
              </ui-card-header>
              <ui-card-content>
                <div class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>End-to-end encryption</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>Group chats up to 256 members</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>File sharing & media support</span>
                  </div>
                </div>
              </ui-card-content>
            </ui-card>

            <ui-card>
              <ui-card-header>
                <ui-card-title>Decentralized Storage</ui-card-title>
                <ui-card-description>
                  Content-addressable storage with IPFS integration
                </ui-card-description>
              </ui-card-header>
              <ui-card-content>
                <div class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>35GB+ free storage per user</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>Automatic CDN distribution</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <app-icon name="check" [size]="16" class="text-green-600"></app-icon>
                    <span>Offline-first architecture</span>
                  </div>
                </div>
              </ui-card-content>
            </ui-card>
          </div>
        </div>

        <!-- Alerts Section -->
        <div class="space-y-4 mb-16">
          <ui-alert variant="info">
            <ui-alert-title>
              <app-icon name="info" [size]="18"></app-icon>
              Beta Release
            </ui-alert-title>
            <ui-alert-description>
              Synapse is currently in beta. Some features may change before the stable release.
            </ui-alert-description>
          </ui-alert>

          <ui-alert variant="warning">
            <ui-alert-title>
              <app-icon name="alert-triangle" [size]="18"></app-icon>
              Breaking Changes
            </ui-alert-title>
            <ui-alert-description>
              Version 2.0 introduces breaking changes. Please review the migration guide before upgrading.
            </ui-alert-description>
          </ui-alert>
        </div>

        <!-- CTA Section -->
        <div class="text-center">
          <ui-separator className="mb-12"></ui-separator>
          
          <h2 class="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Ready to get started?
          </h2>
          <p class="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of developers building the future of social networking
          </p>
          
          <div class="flex items-center justify-center gap-4">
            <ui-button variant="default" size="lg">
              <app-icon name="download" [size]="20"></app-icon>
              Download Now
            </ui-button>
            <ui-button variant="outline" size="lg">
              <app-icon name="github" [size]="20"></app-icon>
              View on GitHub
            </ui-button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class DocsEnhancedComponent {
  activeTab = signal('docker');
  
  dockerCode = `docker run -d \\
  --name synapse-node \\
  -p 3000:3000 \\
  -v synapse_data:/app/data \\
  synapseoss/core:latest`;

  npmCode = `npm install -g @synapse/cli
synapse init my-project
cd my-project
synapse dev`;

  manualCode = `git clone https://github.com/SynapseOSS/core.git
cd synapse-core
npm install
npm run build
npm start`;

  setActiveTab(value: string) {
    this.activeTab.set(value);
  }
}
