
import { Injectable } from '@angular/core';
import { 
  ref,
  push,
  get
} from 'firebase/database';
import { db } from '../firebase.config';

export type Platform = 'All' | 'Android' | 'iOS' | 'Web' | 'Windows' | 'Linux';

export interface ChangelogEntry {
  id?: string;
  version: string;
  date: string;
  platform: Platform;
  changes: {
    type: 'new' | 'fix' | 'improved';
    text: string;
  }[];
  createdAt: number; // For sorting
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  /**
   * Fetches changelogs from Realtime Database.
   */
  async getChangelogs(): Promise<ChangelogEntry[]> {
    try {
      const dbRef = ref(db, 'changelogs');
      
      // Fetch all data directly without server-side sorting to avoid "Index not defined" errors.
      // We will sort the data in the client instead.
      const snapshot = await get(dbRef);

      if (!snapshot.exists()) {
        return [];
      }

      const entries: ChangelogEntry[] = [];
      snapshot.forEach((childSnapshot) => {
        entries.push({
          id: childSnapshot.key as string,
          ...childSnapshot.val()
        });
      });

      // Client-side sort: Newest (highest createdAt) first
      return entries.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error fetching changelogs:", error);
      throw error;
    }
  }

  /**
   * Adds a new changelog entry to Realtime Database.
   */
  async addChangelog(entry: Omit<ChangelogEntry, 'id'>) {
    const dbRef = ref(db, 'changelogs');
    return push(dbRef, entry);
  }

  /**
   * Submits an access request for users with custom domains.
   */
  async requestAccess(email: string) {
    const dbRef = ref(db, 'access_requests');
    return push(dbRef, {
      email,
      requestedAt: Date.now(),
      status: 'pending',
      userAgent: navigator.userAgent
    });
  }
}
