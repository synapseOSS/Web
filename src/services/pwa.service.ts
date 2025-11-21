import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  
  isInstallable = signal(false);
  isInstalled = signal(false);
  isOnline = signal(navigator.onLine);
  updateAvailable = signal(false);

  constructor() {
    this.init();
  }

  private init() {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled.set(true);
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable.set(true);
    });

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.deferredPrompt = null;
    });

    // Monitor online/offline status
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable.set(true);
              }
            });
          }
        });
      });
    }
  }

  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      this.deferredPrompt = null;
      this.isInstallable.set(false);
      return true;
    }
    
    return false;
  }

  async update() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
      window.location.reload();
    }
  }

  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return await Notification.requestPermission();
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          'YOUR_VAPID_PUBLIC_KEY'
        ) as BufferSource
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
