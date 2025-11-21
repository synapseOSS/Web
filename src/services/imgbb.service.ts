import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class ImgBBService {
  private readonly API_KEY = 'faa85ffbac0217ff67b5f3c4baa7fb29';
  private readonly API_URL = 'https://api.imgbb.com/1/upload';

  /**
   * Upload an image to ImgBB
   * @param file - Image file to upload (JPG, PNG, GIF, BMP, WEBP)
   * @param name - Optional name for the image
   * @param expiration - Optional expiration in seconds (60-15552000)
   * @returns Promise with the uploaded image URL
   */
  async uploadImage(file: File, name?: string, expiration?: number): Promise<string | null> {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type. Only JPG, PNG, GIF, BMP, and WEBP are supported.');
        return null;
      }

      // Validate file size (max 32MB)
      const maxSize = 32 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error('File size exceeds 32MB limit');
        return null;
      }

      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Create form data
      const formData = new FormData();
      formData.append('key', this.API_KEY);
      formData.append('image', base64.split(',')[1]); // Remove data:image/...;base64, prefix
      
      if (name) {
        formData.append('name', name);
      }
      
      if (expiration) {
        formData.append('expiration', expiration.toString());
      }

      // Upload to ImgBB
      const response = await fetch(this.API_URL, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ImgBB upload failed:', errorData);
        return null;
      }

      const data: ImgBBResponse = await response.json();
      
      if (data.success) {
        console.log('✅ Image uploaded to ImgBB:', data.data.url);
        return data.data.url; // Full size image URL
      }

      return null;
    } catch (error) {
      console.error('Error uploading to ImgBB:', error);
      return null;
    }
  }

  /**
   * Upload multiple images to ImgBB
   * @param files - Array of image files
   * @param onProgress - Optional callback for progress updates
   * @returns Promise with array of uploaded image URLs
   */
  async uploadMultipleImages(
    files: File[], 
    onProgress?: (current: number, total: number) => void
  ): Promise<string[]> {
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress(i + 1, files.length);
      }

      const url = await this.uploadImage(file);
      
      if (url) {
        urls.push(url);
      } else {
        console.error(`Failed to upload file: ${file.name}`);
      }
    }

    return urls;
  }

  /**
   * Convert File to base64 string
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
