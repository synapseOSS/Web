import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface LocationMetadata {
  id?: string;
  story_id?: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
  place_id?: string;
  created_at?: string;
}

export interface LocationSearchResult {
  story_id: string;
  location: LocationMetadata;
  story: {
    id: string;
    user_id: string;
    media_url: string;
    media_type: string;
    thumbnail_url?: string;
    content?: string;
    created_at: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);

  /**
   * Store location metadata for a story
   * Validates and stores location data with the story
   */
  async storeLocationMetadata(storyId: string, location: LocationMetadata): Promise<LocationMetadata> {
    try {
      // Validate location data
      this.validateLocationMetadata(location);

      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .insert({
          story_id: storyId,
          element_type: 'location',
          element_data: {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            city: location.city,
            country: location.country,
            place_id: location.place_id
          }
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        story_id: data.story_id,
        name: data.element_data.name,
        latitude: data.element_data.latitude,
        longitude: data.element_data.longitude,
        address: data.element_data.address,
        city: data.element_data.city,
        country: data.element_data.country,
        place_id: data.element_data.place_id,
        created_at: data.created_at
      };
    } catch (err) {
      console.error('Error storing location metadata:', err);
      throw err;
    }
  }

  /**
   * Retrieve location metadata for a story
   * Returns the location data associated with a story
   */
  async getLocationMetadata(storyId: string): Promise<LocationMetadata | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .select('*')
        .eq('story_id', storyId)
        .eq('element_type', 'location')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No location found
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        id: data.id,
        story_id: data.story_id,
        name: data.element_data.name,
        latitude: data.element_data.latitude,
        longitude: data.element_data.longitude,
        address: data.element_data.address,
        city: data.element_data.city,
        country: data.element_data.country,
        place_id: data.element_data.place_id,
        created_at: data.created_at
      };
    } catch (err) {
      console.error('Error retrieving location metadata:', err);
      throw err;
    }
  }

  /**
   * Search for stories by location
   * Returns all public stories tagged with the specified location
   * Validates: Requirements 9.3
   */
  async searchByLocation(locationQuery: string): Promise<LocationSearchResult[]> {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return [];

      // Search for stories with location elements matching the query
      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .select(`
          id,
          story_id,
          element_data,
          created_at,
          stories:story_id (
            id,
            user_id,
            media_url,
            media_type,
            thumbnail_url,
            content,
            created_at,
            is_active,
            expires_at,
            privacy_setting
          )
        `)
        .eq('element_type', 'location')
        .ilike('element_data->>name', `%${locationQuery}%`);

      if (error) throw error;

      if (!data) return [];

      // Filter for public stories that are still active and not expired
      const results: LocationSearchResult[] = [];
      
      for (const item of data) {
        const story = (item as any).stories;
        
        // Only include public, active, non-expired stories
        if (
          story &&
          story.privacy_setting === 'public' &&
          story.is_active === true &&
          new Date(story.expires_at) > new Date()
        ) {
          // Check if user can view the story (respects privacy)
          const canView = await this.canViewStory(story.id, userId);
          
          if (canView) {
            results.push({
              story_id: item.story_id,
              location: {
                id: item.id,
                story_id: item.story_id,
                name: item.element_data.name,
                latitude: item.element_data.latitude,
                longitude: item.element_data.longitude,
                address: item.element_data.address,
                city: item.element_data.city,
                country: item.element_data.country,
                place_id: item.element_data.place_id,
                created_at: item.created_at
              },
              story: {
                id: story.id,
                user_id: story.user_id,
                media_url: story.media_url,
                media_type: story.media_type,
                thumbnail_url: story.thumbnail_url,
                content: story.content,
                created_at: story.created_at
              }
            });
          }
        }
      }

      return results;
    } catch (err) {
      console.error('Error searching by location:', err);
      return [];
    }
  }

  /**
   * Search for stories by coordinates (within a radius)
   * Returns stories within the specified radius (in kilometers) of the given coordinates
   */
  async searchByCoordinates(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<LocationSearchResult[]> {
    try {
      const userId = this.auth.currentUser()?.id;
      if (!userId) return [];

      // Get all location elements
      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .select(`
          id,
          story_id,
          element_data,
          created_at,
          stories:story_id (
            id,
            user_id,
            media_url,
            media_type,
            thumbnail_url,
            content,
            created_at,
            is_active,
            expires_at,
            privacy_setting
          )
        `)
        .eq('element_type', 'location');

      if (error) throw error;
      if (!data) return [];

      // Filter by distance and privacy
      const results: LocationSearchResult[] = [];

      for (const item of data) {
        const story = (item as any).stories;
        
        if (!story) continue;

        // Calculate distance
        const distance = this.calculateDistance(
          latitude,
          longitude,
          item.element_data.latitude,
          item.element_data.longitude
        );

        // Check if within radius and meets privacy requirements
        if (
          distance <= radiusKm &&
          story.privacy_setting === 'public' &&
          story.is_active === true &&
          new Date(story.expires_at) > new Date()
        ) {
          const canView = await this.canViewStory(story.id, userId);
          
          if (canView) {
            results.push({
              story_id: item.story_id,
              location: {
                id: item.id,
                story_id: item.story_id,
                name: item.element_data.name,
                latitude: item.element_data.latitude,
                longitude: item.element_data.longitude,
                address: item.element_data.address,
                city: item.element_data.city,
                country: item.element_data.country,
                place_id: item.element_data.place_id,
                created_at: item.created_at
              },
              story: {
                id: story.id,
                user_id: story.user_id,
                media_url: story.media_url,
                media_type: story.media_type,
                thumbnail_url: story.thumbnail_url,
                content: story.content,
                created_at: story.created_at
              }
            });
          }
        }
      }

      return results;
    } catch (err) {
      console.error('Error searching by coordinates:', err);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate location metadata
   * Ensures all required fields are present and valid
   */
  private validateLocationMetadata(location: LocationMetadata): void {
    if (!location.name || typeof location.name !== 'string' || location.name.trim() === '') {
      throw new Error('Location name is required');
    }

    if (typeof location.latitude !== 'number' || isNaN(location.latitude)) {
      throw new Error('Valid latitude is required');
    }

    if (typeof location.longitude !== 'number' || isNaN(location.longitude)) {
      throw new Error('Valid longitude is required');
    }

    if (location.latitude < -90 || location.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (location.longitude < -180 || location.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }
  }

  /**
   * Check if user can view a story (respects privacy settings)
   */
  private async canViewStory(storyId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('can_view_story', {
          story_uuid: storyId,
          viewer_uuid: userId
        });

      if (error) {
        // If RPC doesn't exist, fall back to basic check
        return true;
      }
      
      return data as boolean;
    } catch (err) {
      // If RPC fails, allow viewing (fail open for public stories)
      return true;
    }
  }

  /**
   * Delete location metadata for a story
   */
  async deleteLocationMetadata(storyId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('story_interactive_elements')
        .delete()
        .eq('story_id', storyId)
        .eq('element_type', 'location');

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting location metadata:', err);
      throw err;
    }
  }

  /**
   * Update location metadata for a story
   */
  async updateLocationMetadata(storyId: string, location: LocationMetadata): Promise<LocationMetadata> {
    try {
      // Validate location data
      this.validateLocationMetadata(location);

      const { data, error } = await this.supabase
        .from('story_interactive_elements')
        .update({
          element_data: {
            name: location.name,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
            city: location.city,
            country: location.country,
            place_id: location.place_id
          }
        })
        .eq('story_id', storyId)
        .eq('element_type', 'location')
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        story_id: data.story_id,
        name: data.element_data.name,
        latitude: data.element_data.latitude,
        longitude: data.element_data.longitude,
        address: data.element_data.address,
        city: data.element_data.city,
        country: data.element_data.country,
        place_id: data.element_data.place_id,
        created_at: data.created_at
      };
    } catch (err) {
      console.error('Error updating location metadata:', err);
      throw err;
    }
  }
}
