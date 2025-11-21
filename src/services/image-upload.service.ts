import { Injectable } from '@angular/core';

export type ImageProvider = 'imgbb' | 'cloudinary' | 'cloudflare-r2';

export interface ProviderConfig {
  imgbb?: {
    apiKey: string;
  };
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
  };
  cloudflareR2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly STORAGE_KEY_PROVIDER = 'image_upload_provider';
  private readonly STORAGE_KEY_CONFIG = 'image_upload_config';
  
  private readonly DEFAULT_PROVIDER: ImageProvider = 'imgbb';
  private readonly DEFAULT_IMGBB_KEY = 'faa85ffbac0217ff67b5f3c4baa7fb29';

  /**
   * Get the currently selected provider
   */
  getProvider(): ImageProvider {
    const stored = localStorage.getItem(this.STORAGE_KEY_PROVIDER);
    return (stored as ImageProvider) || this.DEFAULT_PROVIDER;
  }

  /**
   * Set the image upload provider
   */
  setProvider(provider: ImageProvider): void {
    localStorage.setItem(this.STORAGE_KEY_PROVIDER, provider);
  }

  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig {
    const stored = localStorage.getItem(this.STORAGE_KEY_CONFIG);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {};
      }
    }
    return {};
  }

  /**
   * Save provider configuration
   */
  saveConfig(config: ProviderConfig): void {
    localStorage.setItem(this.STORAGE_KEY_CONFIG, JSON.stringify(config));
  }

  /**
   * Upload image using the selected provider
   */
  async uploadImage(file: File, name?: string): Promise<string | null> {
    const provider = this.getProvider();
    
    switch (provider) {
      case 'imgbb':
        return this.uploadToImgBB(file, name);
      case 'cloudinary':
        return this.uploadToCloudinary(file);
      case 'cloudflare-r2':
        return this.uploadToCloudflareR2(file, name);
      default:
        console.error('Unknown provider:', provider);
        return null;
    }
  }

  /**
   * Upload to ImgBB
   */
  private async uploadToImgBB(file: File, name?: string): Promise<string | null> {
    try {
      const config = this.getConfig();
      const apiKey = config.imgbb?.apiKey || this.DEFAULT_IMGBB_KEY;

      // Validate file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type for ImgBB');
        return null;
      }

      if (file.size > 32 * 1024 * 1024) {
        console.error('File size exceeds 32MB limit');
        return null;
      }

      const base64 = await this.fileToBase64(file);
      const formData = new FormData();
      formData.append('key', apiKey);
      formData.append('image', base64.split(',')[1]);
      
      if (name) {
        formData.append('name', name);
      }

      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('ImgBB upload failed');
        return null;
      }

      const data = await response.json();
      return data.success ? data.data.url : null;
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      return null;
    }
  }

  /**
   * Upload to Cloudinary
   */
  private async uploadToCloudinary(file: File): Promise<string | null> {
    try {
      const config = this.getConfig();
      
      if (!config.cloudinary?.cloudName || !config.cloudinary?.uploadPreset) {
        console.error('Cloudinary not configured');
        return null;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', config.cloudinary.uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        console.error('Cloudinary upload failed');
        return null;
      }

      const data = await response.json();
      return data.secure_url || data.url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  }

  /**
   * Upload to Cloudflare R2
   */
  private async uploadToCloudflareR2(file: File, name?: string): Promise<string | null> {
    try {
      const config = this.getConfig();
      
      if (!config.cloudflareR2?.accountId || !config.cloudflareR2?.accessKeyId || 
          !config.cloudflareR2?.secretAccessKey || !config.cloudflareR2?.bucketName) {
        console.error('Cloudflare R2 not configured');
        return null;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop();
      const filename = name ? `${name}-${timestamp}.${extension}` : `${timestamp}-${randomStr}.${extension}`;

      // Note: Direct browser upload to R2 requires presigned URLs or CORS configuration
      // This is a simplified example - in production, you'd typically:
      // 1. Request a presigned URL from your backend
      // 2. Upload directly to R2 using that URL
      
      console.warn('Cloudflare R2 direct upload requires backend implementation');
      console.log('File ready for upload:', filename);
      
      // For now, return null - this needs backend support
      return null;
    } catch (error) {
      console.error('Error uploading to Cloudflare R2:', error);
      return null;
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      if (onProgress) {
        onProgress(i + 1, files.length);
      }

      const url = await this.uploadImage(files[i]);
      if (url) {
        urls.push(url);
      }
    }

    return urls;
  }

  /**
   * Convert File to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Check if provider is configured
   */
  isProviderConfigured(provider: ImageProvider): boolean {
    const config = this.getConfig();
    
    switch (provider) {
      case 'imgbb':
        return true; // Always available with default key
      case 'cloudinary':
        return !!(config.cloudinary?.cloudName && config.cloudinary?.uploadPreset);
      case 'cloudflare-r2':
        return !!(config.cloudflareR2?.accountId && config.cloudflareR2?.accessKeyId && 
                 config.cloudflareR2?.secretAccessKey && config.cloudflareR2?.bucketName);
      default:
        return false;
    }
  }
}
