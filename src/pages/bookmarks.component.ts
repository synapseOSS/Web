import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { PostCardComponent } from '../components/post-card.component';
import { SocialService, Post } from '../services/social.service';
import { SupabaseService } from '../services/supabase.service';
import { AuthService } from '../services/auth.service';

interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  posts_count: number;
  created_at: string;
}

@Component({
  selector: 'app-bookmarks',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, PostCardComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-white/10">
      <!-- Header -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-bold text-slate-900 dark:text-white">Bookmarks</h1>
            <button 
              (click)="showCreateCollection.set(true)"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full transition-all flex items-center gap-2">
              <app-icon name="plus" [size]="16"></app-icon>
              New Collection
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              (click)="activeTab.set('all')"
              [class.bg-indigo-600]="activeTab() === 'all'"
              [class.text-white]="activeTab() === 'all'"
              [class.bg-slate-100]="activeTab() !== 'all'"
              [class.dark:bg-slate-800]="activeTab() !== 'all'"
              [class.text-slate-600]="activeTab() !== 'all'"
              [class.dark:text-slate-400]="activeTab() !== 'all'"
              class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap">
              All Bookmarks
            </button>
            @for (collection of collections(); track collection.id) {
              <button
                (click)="activeTab.set(collection.id)"
                [class.bg-indigo-600]="activeTab() === collection.id"
                [class.text-white]="activeTab() === collection.id"
                [class.bg-slate-100]="activeTab() !== collection.id"
                [class.dark:bg-slate-800]="activeTab() !== collection.id"
                [class.text-slate-600]="activeTab() !== collection.id"
                [class.dark:text-slate-400]="activeTab() !== collection.id"
                class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2">
                <span>{{ collection.icon }}</span>
                <span>{{ collection.name }}</span>
                <span class="text-xs opacity-75">({{ collection.posts_count }})</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="pb-20">
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        } @else if (bookmarkedPosts().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 px-4">
            <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <app-icon name="bookmark" [size]="40" class="text-slate-400"></app-icon>
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No bookmarks yet</h3>
            <p class="text-slate-500 text-center max-w-sm">
              Save posts to read later by tapping the bookmark icon
            </p>
          </div>
        } @else {
          @for (post of bookmarkedPosts(); track post.id) {
            <app-post-card [post]="post"></app-post-card>
          }
        }
      </div>

      <!-- Create Collection Modal -->
      @if (showCreateCollection()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="showCreateCollection.set(false)">
          <div class="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-white/10" (click)="$event.stopPropagation()">
            <div class="p-6">
              <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-4">Create Collection</h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                  <input 
                    [(ngModel)]="newCollectionName"
                    type="text" 
                    placeholder="e.g., Tech Articles"
                    maxlength="50"
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none">
                </div>

                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description (Optional)</label>
                  <textarea 
                    [(ngModel)]="newCollectionDescription"
                    placeholder="What's this collection about?"
                    rows="3"
                    maxlength="200"
                    class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"></textarea>
                </div>

                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Icon</label>
                  <div class="grid grid-cols-8 gap-2">
                    @for (icon of collectionIcons; track icon) {
                      <button
                        (click)="newCollectionIcon = icon"
                        [class.ring-2]="newCollectionIcon === icon"
                        [class.ring-indigo-500]="newCollectionIcon === icon"
                        class="aspect-square flex items-center justify-center text-2xl bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        {{ icon }}
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Color</label>
                  <div class="grid grid-cols-8 gap-2">
                    @for (color of collectionColors; track color.value) {
                      <button
                        (click)="newCollectionColor = color.value"
                        [class.ring-2]="newCollectionColor === color.value"
                        [class.ring-offset-2]="newCollectionColor === color.value"
                        [class.ring-white]="newCollectionColor === color.value"
                        [class.dark:ring-slate-900]="newCollectionColor === color.value"
                        [style.background-color]="color.value"
                        class="aspect-square rounded-lg transition-all"></button>
                    }
                  </div>
                </div>
              </div>

              <div class="flex gap-3 mt-6">
                <button 
                  (click)="showCreateCollection.set(false)"
                  class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                  Cancel
                </button>
                <button 
                  (click)="createCollection()"
                  [disabled]="!newCollectionName.trim()"
                  class="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class BookmarksComponent implements OnInit {
  private supabase = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private socialService = inject(SocialService);

  activeTab = signal<string>('all');
  collections = signal<Collection[]>([]);
  bookmarkedPosts = signal<Post[]>([]);
  loading = signal(false);

  showCreateCollection = signal(false);
  newCollectionName = '';
  newCollectionDescription = '';
  newCollectionIcon = '📚';
  newCollectionColor = '#6366f1';

  collectionIcons = ['📚', '💼', '🎨', '🎮', '🎵', '📱', '💡', '🔥', '⭐', '❤️', '🚀', '🌟', '📸', '🎬', '📝', '🏆'];
  collectionColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Cyan', value: '#06b6d4' }
  ];

  ngOnInit() {
    this.fetchCollections();
    this.fetchBookmarks();
  }

  async fetchCollections() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    try {
      const { data, error } = await this.supabase
        .from('bookmark_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      this.collections.set(data || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  }

  async fetchBookmarks() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      let query = this.supabase
        .from('favorites')
        .select(`
          post_id,
          posts:post_id (
            *,
            users:author_uid (
              uid,
              username,
              display_name,
              avatar,
              verify
            )
          )
        `)
        .eq('user_id', userId);

      if (this.activeTab() !== 'all') {
        query = query.eq('collection_id', this.activeTab());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const posts = (data || []).map((item: any) => ({
        id: item.posts.id,
        author_uid: item.posts.author_uid,
        user: item.posts.users,
        post_text: item.posts.post_text || '',
        media: item.posts.media_items || [],
        likes_count: item.posts.likes_count || 0,
        comments_count: item.posts.comments_count || 0,
        views_count: item.posts.views_count || 0,
        created_at: item.posts.created_at,
        is_bookmarked: true,
        post_type: item.posts.post_type || 'TEXT'
      }));

      this.bookmarkedPosts.set(posts);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      this.loading.set(false);
    }
  }

  async createCollection() {
    const userId = this.auth.currentUser()?.id;
    if (!userId || !this.newCollectionName.trim()) return;

    try {
      const { error } = await this.supabase
        .from('bookmark_collections')
        .insert({
          user_id: userId,
          name: this.newCollectionName.trim(),
          description: this.newCollectionDescription.trim() || null,
          icon: this.newCollectionIcon,
          color: this.newCollectionColor
        });

      if (error) throw error;

      await this.fetchCollections();
      this.showCreateCollection.set(false);
      this.resetCollectionForm();
    } catch (err) {
      console.error('Error creating collection:', err);
    }
  }

  resetCollectionForm() {
    this.newCollectionName = '';
    this.newCollectionDescription = '';
    this.newCollectionIcon = '📚';
    this.newCollectionColor = '#6366f1';
  }
}
