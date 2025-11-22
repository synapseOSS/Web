import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../components/icon.component';
import { PostCardComponent } from '../components/post-card.component';
import { SocialService, Post, User } from '../services/social.service';
import { SearchService } from '../services/search.service';
import { HashtagService } from '../services/hashtag.service';

interface TrendingHashtag {
  tag: string;
  count: number;
  growth: number;
}

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  posts_count: number;
  icon: string;
}

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent, PostCardComponent],
  template: `
    <div class="min-h-screen bg-white dark:bg-slate-950 border-x border-slate-200 dark:border-white/10">
      <!-- Header with Search -->
      <div class="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-white/10">
        <div class="px-4 py-3">
          <h1 class="text-xl font-bold text-slate-900 dark:text-white mb-3">Explore</h1>
          
          <!-- Search Bar -->
          <div class="relative">
            <app-icon name="search" [size]="20" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
            <input 
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              type="text" 
              placeholder="Search posts, people, hashtags..."
              class="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
            @if (searchQuery) {
              <button 
                (click)="clearSearch()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            }
          </div>

          <!-- Category Tabs -->
          <div class="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            @for (category of categories; track category.id) {
              <button
                (click)="activeCategory.set(category.id)"
                [class.bg-indigo-600]="activeCategory() === category.id"
                [class.text-white]="activeCategory() === category.id"
                [class.bg-slate-100]="activeCategory() !== category.id"
                [class.dark:bg-slate-800]="activeCategory() !== category.id"
                [class.text-slate-600]="activeCategory() !== category.id"
                [class.dark:text-slate-400]="activeCategory() !== category.id"
                class="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2">
                <app-icon [name]="category.icon" [size]="16"></app-icon>
                <span>{{ category.name }}</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="pb-20">
        @if (searchQuery) {
          <!-- Search Results -->
          <div class="p-4">
            <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Search Results</h2>
            
            @if (searchLoading()) {
              <div class="flex items-center justify-center py-10">
                <div class="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
              </div>
            } @else if (searchResults().length === 0) {
              <div class="text-center py-10">
                <app-icon name="search" [size]="48" class="mx-auto mb-4 text-slate-300 dark:text-slate-700"></app-icon>
                <p class="text-slate-500">No results found for "{{ searchQuery }}"</p>
              </div>
            } @else {
              @for (post of searchResults(); track post.id) {
                <app-post-card [post]="post"></app-post-card>
              }
            }
          </div>
        } @else {
          @switch (activeCategory()) {
            @case ('trending') {
              <!-- Trending Section -->
              <div class="p-4 space-y-6">
                <!-- Trending Hashtags -->
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Trending Hashtags</h2>
                  <div class="grid grid-cols-1 gap-3">
                    @for (hashtag of trendingHashtags(); track hashtag.tag) {
                      <div class="p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-white/10 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer group">
                        <div class="flex items-center justify-between">
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">#{{ hashtag.tag }}</span>
                              @if (hashtag.growth > 0) {
                                <span class="px-2 py-0.5 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                                  <app-icon name="trending-up" [size]="12"></app-icon>
                                  {{ hashtag.growth }}%
                                </span>
                              }
                            </div>
                            <p class="text-sm text-slate-500">{{ hashtag.count }} posts</p>
                          </div>
                          <app-icon name="chevron-right" [size]="20" class="text-slate-400 group-hover:text-indigo-500 transition-colors"></app-icon>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Trending Topics -->
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Trending Topics</h2>
                  <div class="grid grid-cols-2 gap-3">
                    @for (topic of trendingTopics(); track topic.id) {
                      <div class="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:shadow-lg transition-all cursor-pointer">
                        <div class="text-3xl mb-2">{{ topic.icon }}</div>
                        <h3 class="font-bold text-slate-900 dark:text-white mb-1">{{ topic.title }}</h3>
                        <p class="text-xs text-slate-500 mb-2">{{ topic.category }}</p>
                        <p class="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{{ topic.posts_count }} posts</p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Trending Posts -->
                <div>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Trending Posts</h2>
                  @for (post of trendingPosts(); track post.id) {
                    <app-post-card [post]="post"></app-post-card>
                  }
                </div>
              </div>
            }

            @case ('people') {
              <!-- Suggested People -->
              <div class="p-4">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Suggested for You</h2>
                <div class="space-y-3">
                  @for (user of suggestedUsers(); track user.uid) {
                    <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all">
                      <div class="flex items-center gap-3">
                        <img [src]="user.avatar" class="w-12 h-12 rounded-full object-cover">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-1">
                            <h3 class="font-bold text-slate-900 dark:text-white truncate">{{ user.display_name }}</h3>
                            @if (user.verify) {
                              <app-icon name="check-circle" [size]="16" class="text-indigo-500 flex-shrink-0"></app-icon>
                            }
                          </div>
                          <p class="text-sm text-slate-500 truncate">@{{ user.username }}</p>
                          <p class="text-xs text-slate-400 mt-1">{{ user.followers_count }} followers</p>
                        </div>
                        <button 
                          (click)="followUser(user.uid)"
                          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-full transition-all flex-shrink-0">
                          Follow
                        </button>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @case ('photos') {
              <!-- Photo Grid -->
              <div class="p-4">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Popular Photos</h2>
                <div class="grid grid-cols-3 gap-1">
                  @for (post of photoPosts(); track post.id) {
                    @if (post.media && post.media.length > 0) {
                      <div class="aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        <img [src]="post.media[0].url" class="w-full h-full object-cover">
                      </div>
                    }
                  }
                </div>
              </div>
            }

            @case ('videos') {
              <!-- Video Feed -->
              <div>
                <div class="p-4">
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Popular Videos</h2>
                </div>
                @for (post of videoPosts(); track post.id) {
                  <app-post-card [post]="post"></app-post-card>
                }
              </div>
            }
          }
        }
      </div>
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
export class ExploreComponent implements OnInit {
  private socialService = inject(SocialService);
  private searchService = inject(SearchService);
  private hashtagService = inject(HashtagService);

  searchQuery = '';
  activeCategory = signal<string>('trending');
  searchLoading = signal(false);
  searchResults = signal<Post[]>([]);

  categories = [
    { id: 'trending', name: 'Trending', icon: 'trending-up' },
    { id: 'people', name: 'People', icon: 'users' },
    { id: 'photos', name: 'Photos', icon: 'image' },
    { id: 'videos', name: 'Videos', icon: 'video' }
  ];

  trendingHashtags = signal<TrendingHashtag[]>([
    { tag: 'Web3', count: 12500, growth: 45 },
    { tag: 'AI', count: 9800, growth: 32 },
    { tag: 'Decentralized', count: 7200, growth: 28 },
    { tag: 'Privacy', count: 5600, growth: 15 },
    { tag: 'OpenSource', count: 4300, growth: 12 }
  ]);

  trendingTopics = signal<TrendingTopic[]>([
    { id: '1', title: 'Technology', category: 'Tech', posts_count: 15000, icon: '💻' },
    { id: '2', title: 'Design', category: 'Creative', posts_count: 8500, icon: '🎨' },
    { id: '3', title: 'Gaming', category: 'Entertainment', posts_count: 12000, icon: '🎮' },
    { id: '4', title: 'Music', category: 'Arts', posts_count: 6700, icon: '🎵' }
  ]);

  trendingPosts = signal<Post[]>([]);
  suggestedUsers = signal<User[]>([]);
  photoPosts = signal<Post[]>([]);
  videoPosts = signal<Post[]>([]);

  ngOnInit() {
    this.loadTrendingContent();
  }

  async loadTrendingContent() {
    // Load trending posts (sorted by engagement)
    const allPosts = this.socialService.getPosts();

    // Sort by engagement score (likes + comments * 2)
    const trending = [...allPosts].sort((a, b) => {
      const scoreA = a.likes_count + (a.comments_count * 2);
      const scoreB = b.likes_count + (b.comments_count * 2);
      return scoreB - scoreA;
    }).slice(0, 10);

    this.trendingPosts.set(trending);

    // Load suggested users
    this.suggestedUsers.set(this.socialService.getSuggestedUsers());

    // Filter photo and video posts
    this.photoPosts.set(allPosts.filter(p => p.post_type === 'IMAGE').slice(0, 12));
    this.videoPosts.set(allPosts.filter(p => p.post_type === 'VIDEO').slice(0, 10));

    // Fetch trending hashtags from service
    const hashtags = await this.hashtagService.getTrendingHashtags();
    this.trendingHashtags.set(hashtags.map(h => ({
      tag: h.tag,
      count: h.usage_count,
      growth: 0
    })));
  }

  async onSearch() {
    if (!this.searchQuery.trim()) {
      this.searchResults.set([]);
      return;
    }

    this.searchLoading.set(true);
    try {
      const results = await this.searchService.searchPosts(this.searchQuery);
      this.searchResults.set(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      this.searchLoading.set(false);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
  }

  async followUser(userId: string) {
    await this.socialService.followUser(userId);
    await this.loadTrendingContent();
  }
}
