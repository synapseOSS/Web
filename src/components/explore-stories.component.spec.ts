import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExploreStoriesComponent } from './explore-stories.component';
import { DiscoveryService } from '../services/discovery.service';
import { signal } from '@angular/core';

describe('ExploreStoriesComponent', () => {
  let component: ExploreStoriesComponent;
  let fixture: ComponentFixture<ExploreStoriesComponent>;
  let mockDiscoveryService: jasmine.SpyObj<DiscoveryService>;

  const mockExploreStories = [
    {
      id: 'story1',
      user_id: 'user1',
      media_url: 'https://example.com/media1.jpg',
      media_type: 'image' as const,
      thumbnail_url: 'https://example.com/thumb1.jpg',
      content: 'Explore story 1',
      duration_hours: 24,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      views_count: 100,
      reactions_count: 10,
      replies_count: 5,
      is_active: true,
      privacy_setting: 'public' as const,
      user: {
        uid: 'user1',
        username: 'explorer1',
        display_name: 'Explorer One',
        avatar: 'https://example.com/avatar1.jpg',
        verify: true
      }
    },
    {
      id: 'story2',
      user_id: 'user2',
      media_url: 'https://example.com/media2.mp4',
      media_type: 'video' as const,
      thumbnail_url: 'https://example.com/thumb2.jpg',
      content: 'Explore story 2',
      duration_hours: 24,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      views_count: 250,
      reactions_count: 25,
      replies_count: 8,
      is_active: true,
      privacy_setting: 'public' as const,
      user: {
        uid: 'user2',
        username: 'explorer2',
        display_name: 'Explorer Two',
        avatar: 'https://example.com/avatar2.jpg',
        verify: false
      }
    }
  ];

  beforeEach(async () => {
    mockDiscoveryService = jasmine.createSpyObj('DiscoveryService', [
      'fetchExploreFeed',
      'searchByHashtag',
      'searchByLocation',
      'filterByContentType',
      'recordExploreView',
      'setDiscoveryOptOut',
      'getDiscoveryOptOut'
    ]);

    // Setup default return values
    mockDiscoveryService.fetchExploreFeed.and.returnValue(Promise.resolve(mockExploreStories));
    mockDiscoveryService.searchByHashtag.and.returnValue(Promise.resolve(mockExploreStories));
    mockDiscoveryService.searchByLocation.and.returnValue(Promise.resolve(mockExploreStories));
    mockDiscoveryService.filterByContentType.and.returnValue(mockExploreStories);
    mockDiscoveryService.recordExploreView.and.returnValue(Promise.resolve());
    mockDiscoveryService.setDiscoveryOptOut.and.returnValue(Promise.resolve());
    mockDiscoveryService.getDiscoveryOptOut.and.returnValue(Promise.resolve(false));

    await TestBed.configureTestingModule({
      imports: [ExploreStoriesComponent],
      providers: [
        { provide: DiscoveryService, useValue: mockDiscoveryService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExploreStoriesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load initial stories on init', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    expect(mockDiscoveryService.fetchExploreFeed).toHaveBeenCalled();
    expect(component.displayedStories().length).toBe(2);
  });

  it('should load discovery settings on init', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    expect(mockDiscoveryService.getDiscoveryOptOut).toHaveBeenCalled();
  });

  it('should filter by content type', async () => {
    await component.ngOnInit();
    fixture.detectChanges();

    await component.selectContentType('image');

    expect(mockDiscoveryService.fetchExploreFeed).toHaveBeenCalledWith(
      jasmine.objectContaining({ contentType: 'image' }),
      jasmine.any(Number)
    );
  });

  it('should search by hashtag', async () => {
    component.searchQuery = 'test';
    component.searchType.set('hashtag');

    await component.performSearch();

    expect(mockDiscoveryService.searchByHashtag).toHaveBeenCalledWith('test', jasmine.any(Number));
  });

  it('should search by location', async () => {
    component.searchQuery = 'New York';
    component.searchType.set('location');

    await component.performSearch();

    expect(mockDiscoveryService.searchByLocation).toHaveBeenCalledWith('New York', jasmine.any(Number));
  });

  it('should clear search and reload explore feed', async () => {
    component.searchQuery = 'test';
    await component.clearSearch();

    expect(component.searchQuery).toBe('');
    expect(mockDiscoveryService.fetchExploreFeed).toHaveBeenCalled();
  });

  it('should toggle discovery opt-out', async () => {
    component.discoveryOptOut.set(false);

    await component.toggleDiscoveryOptOut();

    expect(mockDiscoveryService.setDiscoveryOptOut).toHaveBeenCalledWith(true);
    expect(component.discoveryOptOut()).toBe(true);
  });

  it('should open story viewer when story is clicked', () => {
    component.displayedStories.set(mockExploreStories);
    
    component.openStory(mockExploreStories[0]);

    expect(component.selectedStory()).toBe(mockExploreStories[0]);
    expect(component.selectedStoryIndex()).toBe(0);
  });

  it('should close story viewer', () => {
    component.selectedStory.set(mockExploreStories[0]);
    
    component.closeStory();

    expect(component.selectedStory()).toBeNull();
  });

  it('should record explore view', async () => {
    await component.onStoryViewed({
      storyId: 'story1',
      duration: 5,
      completed: true
    });

    expect(mockDiscoveryService.recordExploreView).toHaveBeenCalledWith('story1', 5, true);
  });

  it('should format counts correctly', () => {
    expect(component.formatCount(500)).toBe('500');
    expect(component.formatCount(1500)).toBe('1.5K');
    expect(component.formatCount(1500000)).toBe('1.5M');
  });

  it('should load more stories when requested', async () => {
    component.displayedStories.set(mockExploreStories);
    
    await component.loadMore();

    expect(mockDiscoveryService.fetchExploreFeed).toHaveBeenCalled();
  });

  it('should handle empty search results', async () => {
    mockDiscoveryService.searchByHashtag.and.returnValue(Promise.resolve([]));
    
    component.searchQuery = 'nonexistent';
    component.searchType.set('hashtag');
    await component.performSearch();

    expect(component.displayedStories().length).toBe(0);
  });

  it('should apply content type filter to search results', async () => {
    component.searchQuery = 'test';
    component.searchType.set('hashtag');
    component.selectedContentType.set('image');

    await component.performSearch();

    expect(mockDiscoveryService.searchByHashtag).toHaveBeenCalled();
    expect(mockDiscoveryService.filterByContentType).toHaveBeenCalledWith(
      jasmine.any(Array),
      'image'
    );
  });
});
