import { Injectable, inject } from '@angular/core';
import { ImageUploadService } from './image-upload.service';

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * @deprecated Use ImageUploadService instead for multi-provider support
 */
@Injectable({
  providedIn: 'root'
})
export class ImgBBService {
  private imageUploadService = inject(ImageUploadService);

  /**
   * @deprecated Use ImageUploadService.uploadImage() instead
   * Upload an image using the configured provider
   */
  async uploadImage(file: File, name?: string, expiration?: number): Promise<string | null> {
    return this.imageUploadService.uploadImage(file, name);
  }

  /**
   * @deprecated Use ImageUploadService.uploadMultipleImages() instead
   */
  async uploadMultipleImages(
    files: File[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    return this.imageUploadService.uploadMultipleImages(files, onProgress);
  }

  /**
   * Get image info from ImgBB URL
   */
  getImageInfo(url: string): { id: string; extension: string } | null {
    try {
      // ImgBB URLs format: https://i.ibb.co/[id]/[filename].[ext]
      const match = url.match(/ibb\.co\/([^\/]+)\//);
      if (match) {
        const id = match[1];
        const ext = url.split('.').pop() || 'jpg';
        return { id, extension: ext };
      }
      return null;
    } catch {
      return null;
    }
  }
}
