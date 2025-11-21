import { Injectable } from '@angular/core';

export type ImageProvider = 'imgbb' | 'cloudinary' | 'cloudflare-r2';
export type FileType = 'photo' | 'video' | 'other';

export interface ProviderConfig {
  imgbb?: {
    apiKey: string;
  };
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
    apiKey?: string;
    apiSecret?: string;
  };
  cloudflareR2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
}

export interface FileTypeProviders {
  photo: ImageProvider;
  video: ImageProvider;
  other: ImageProvider;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly STORAGE_KEY_PROVIDERS = 'file_type_providers';
  private readonly STORAGE_KEY_CONFIG = 'image_upload_config';
  
  private readonly DEFAULT_IMGBB_KEY = 'faa85ffbac0217ff67b5f3c4baa7fb29';
  
  // Default providers for each file type
  private readonly DEFAULT_PROVIDERS: FileTypeProviders = {
    photo: 'imgbb',
    video: 'imgbb',
    other: 'imgbb'
  };
  
  // Default Cloudinary credentials
  private readonly DEFAULT_CLOUDINARY = {
    cloudName: 'djw3fgbls',
    apiKey: '577882927131931',
    apiSecret: 'M_w_0uQKjnLRUe-u34driUBqUQU',
    uploadPreset: 'synapse'
  };

  // Default Cloudflare R2 credentials
  private readonly DEFAULT_R2 = {
    accountId: '76bea77fbdac3cdf71e6cf580f270ea6',
    accessKeyId: '1a7483b896a499683eef773b81a69500',
    secretAccessKey: '4a7971790a79ca0a64fc757e92376c3d0a4e09295c27c0bff9d11c7042a0fa2c',
    bucketName: 'synapse',
    endpoint: 'https://76bea77fbdac3cdf71e6cf580f270ea6.r2.cloudflarestorage.com'
  };

  /**
   * Get file type from file
   */
  private getFileType(file: File): FileType {
    if (file.type.startsWith('image/')) return 'photo';
    if (file.type.startsWith('video/')) return 'video';
    return 'other';
  }

  /**
   * Get providers for each file type
   */
  getProviders(): FileTypeProviders {
    const stored = localStorage.getItem(this.STORAGE_KEY_PROVIDERS);
    if (stored) {
      try {
        return { ...this.DEFAULT_PROVIDERS, ...JSON.parse(stored) };
      } catch {
        return this.DEFAULT_PROVIDERS;
      }
    }
    return this.DEFAULT_PROVIDERS;
  }

  /**
   * Set provider for a specific file type
   */
  setProviderForType(fileType: FileType, provider: ImageProvider): void {
    const providers = this.getProviders();
    providers[fileType] = provider;
    localStorage.setItem(this.STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
  }

  /**
   * Get provider for a specific file type
   */
  getProviderForType(fileType: FileType): ImageProvider {
    const providers = this.getProviders();
    return providers[fileType];
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
   * Upload file using the provider configured for its type
   */
  async uploadImage(file: File, name?: string): Promise<string | null> {
    const fileType = this.getFileType(file);
    const provider = this.getProviderForType(fileType);
    
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
      
      // Use custom config if available, otherwise use defaults
      const cloudName = config.cloudinary?.cloudName || this.DEFAULT_CLOUDINARY.cloudName;
      const uploadPreset = config.cloudinary?.uploadPreset || this.DEFAULT_CLOUDINARY.uploadPreset;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload failed:', errorData);
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
      
      // Use custom config if available, otherwise use defaults
      const accountId = config.cloudflareR2?.accountId || this.DEFAULT_R2.accountId;
      const accessKeyId = config.cloudflareR2?.accessKeyId || this.DEFAULT_R2.accessKeyId;
      const secretAccessKey = config.cloudflareR2?.secretAccessKey || this.DEFAULT_R2.secretAccessKey;
      const bucketName = config.cloudflareR2?.bucketName || this.DEFAULT_R2.bucketName;
      const endpoint = this.DEFAULT_R2.endpoint;

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
    switch (provider) {
      case 'imgbb':
        return true; // Always available with default key
      case 'cloudinary':
        return true; // Always available with default credentials
      case 'cloudflare-r2':
        return true; // Always available with default credentials
      default:
        return false;
    }
  }

  /**
   * Check if user has custom configuration for a provider
   */
  hasCustomConfig(provider: ImageProvider): boolean {
    const config = this.getConfig();
    
    switch (provider) {
      case 'imgbb':
        return !!(config.imgbb?.apiKey);
      case 'cloudinary':
        return !!(config.cloudinary?.cloudName && config.cloudinary?.uploadPreset);
      case 'cloudflare-r2':
        return !!(config.cloudflareR2?.accountId);
      default:
        return false;
    }
  }
}
