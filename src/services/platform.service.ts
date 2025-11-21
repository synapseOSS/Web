import { Injectable, signal } from '@angular/core';

export interface PlatformInfo {
  title: string;
  desc: string;
  icon: string;
  status: 'active' | 'coming-soon';
  action: string;
  osIds: string[]; // To match against detected OS
}

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  
  platforms: PlatformInfo[] = [
    {
      title: 'Web / PWA',
      desc: 'Zero-install access. Supports offline mode, push notifications, and local encryption.',
      icon: 'globe',
      status: 'active',
      action: 'Launch App',
      osIds: ['web']
    },
    {
      title: 'Android',
      desc: 'Native performance with Material You integration. Optimized for foldables and tablets.',
      icon: 'android',
      status: 'active',
      action: 'Play Store',
      osIds: ['android']
    },
    {
      title: 'iOS',
      desc: 'Built with SwiftUI. Seamless Handoff support and native widget integration.',
      icon: 'apple',
      status: 'coming-soon',
      action: 'App Store',
      osIds: ['ios', 'macos'] // iOS usually relevant for macOS users too via Catalyst/universal
    },
    {
      title: 'Windows',
      desc: 'Desktop-class productivity. Multi-window support and system tray integration.',
      icon: 'windows',
      status: 'coming-soon',
      action: 'Download',
      osIds: ['windows']
    },
    {
      title: 'macOS',
      desc: 'Universal binary for Apple Silicon. Deep integration with the Apple ecosystem.',
      icon: 'monitor',
      status: 'coming-soon',
      action: 'Download',
      osIds: ['macos']
    },
    {
      title: 'Linux',
      desc: 'CLI and GUI clients available. Fully scriptable and customizable for power users.',
      icon: 'terminal',
      status: 'coming-soon',
      action: 'Download',
      osIds: ['linux']
    }
  ];

  detectOS(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ipod')) return 'ios';
    if (userAgent.includes('win')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'unknown';
  }

  getRecommendedPlatforms(): PlatformInfo[] {
    const currentOS = this.detectOS();
    
    // Always return Web
    const web = this.platforms.find(p => p.osIds.includes('web'))!;
    
    // Find the platform matching the OS
    const native = this.platforms.find(p => p.osIds.includes(currentOS) && !p.osIds.includes('web'));

    if (native) {
      // Return Web + Native (e.g., Web + Android)
      return [web, native];
    }

    // Default fallback if OS unknown or no specific app (return Web + Android as generic mobile example or just Web)
    // Let's return Web and the most popular native option (Android) as a fallback suggestion
    const android = this.platforms.find(p => p.osIds.includes('android'))!;
    return [web, android];
  }

  getAllPlatforms(): PlatformInfo[] {
    return this.platforms;
  }
}
