import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryViewerComponent } from './story-viewer.component';
import { StoryService } from '../services/story.service';
import { InteractiveElementService } from '../services/interactive-element.service';
import { signal } from '@angular/core';

describe('StoryViewerComponent', () => {
  let component: StoryViewerComponent;
  let fixture: ComponentFixture<StoryViewerComponent>;
  let mockStoryService: jasmine.SpyObj<StoryService>;
  let mockInteractiveService: jasmine.SpyObj<InteractiveElementService>;

  const mockStoryGroups = [
    {
      userId: 'user1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      stories: [
        {
          id: 'story1',
          user_id: 'user1',
          media_url: 'https://example.com/media.jpg',
          media_type: 'image' as const,
          content: 'Test story content',
          duration_hours: 24,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          views_count: 0,
          reactions_count: 0,
          replies_count: 0,
          is_active: true,
          privacy_setting: 'public' as const,
          is_viewed: false,
          user: {
            uid: 'user1',
            username: 'testuser',
            display_name: 'Test User',
            avatar: 'https://example.com/avatar.jpg',
            verify: false
          }
        }
      ]
    }
  ];

  beforeEach(async () => {
    mockStoryService = jasmine.createSpyObj('StoryService', [
      'viewStory',
      'addReaction',
      'sendReply'
    ]);

    mockInteractiveService = jasmine.createSpyObj('InteractiveElementService', [
      'recordResponse',
      'getElement',
      'getPollResults'
    ]);

    await TestBed.configureTestingModule({
      imports: [StoryViewerComponent],
      providers: [
        { provide: StoryService, useValue: mockStoryService },
        { provide: InteractiveElementService, useValue: mockInteractiveService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StoryViewerComponent);
    component = fixture.componentInstance;
    
    // Set required inputs
    fixture.componentRef.setInput('storyGroups', mockStoryGroups);
    fixture.componentRef.setInput('initialGroupIndex', 0);
    fixture.componentRef.setInput('initialStoryIndex', 0);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display story viewer when open', () => {
    expect(component.isOpen()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed.inset-0')).toBeTruthy();
  });

  it('should show current story content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const story = component.currentStory();
    expect(story).toBeTruthy();
    expect(story?.content).toBe('Test story content');
  });

  it('should navigate to next story on right tap', () => {
    const initialIndex = component.currentStoryIndex();
    component.nextStory();
    // Since there's only one story, it should close or move to next group
    expect(component.isOpen()).toBe(false);
  });

  it('should pause story on hold', () => {
    component.pauseStory();
    expect(component.isPaused()).toBe(true);
  });

  it('should resume story after pause', () => {
    component.pauseStory();
    component.resumeStory();
    expect(component.isPaused()).toBe(false);
  });

  it('should close viewer and emit closed event', (done) => {
    component.closed.subscribe(() => {
      expect(component.isOpen()).toBe(false);
      done();
    });
    component.close();
  });

  it('should record view when story completes', () => {
    mockStoryService.viewStory.and.returnValue(Promise.resolve());
    component.onStoryComplete();
    expect(mockStoryService.viewStory).toHaveBeenCalled();
  });

  it('should send reply when message is entered', async () => {
    mockStoryService.sendReply.and.returnValue(Promise.resolve());
    component.replyMessage.set('Test reply');
    await component.sendReply();
    expect(mockStoryService.sendReply).toHaveBeenCalledWith('story1', 'Test reply');
    expect(component.replyMessage()).toBe('');
  });

  it('should add reaction when selected', async () => {
    mockStoryService.addReaction.and.returnValue(Promise.resolve());
    await component.addReaction('LIKE');
    expect(mockStoryService.addReaction).toHaveBeenCalledWith('story1', 'LIKE');
  });

  it('should calculate progress width correctly', () => {
    component.progress.set(50);
    component.currentStoryIndex.set(0);
    
    expect(component.getProgressWidth(0)).toBe(50); // Current story
    expect(component.getProgressWidth(1)).toBe(0);  // Future story
  });

  it('should format time ago correctly', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = component.getTimeAgo(oneHourAgo.toISOString());
    expect(result).toContain('h ago');
  });

  it('should toggle mute state', () => {
    const initialMuted = component.isMuted();
    component.muteToggle();
    expect(component.isMuted()).toBe(!initialMuted);
  });

  it('should toggle options menu', () => {
    const initialShow = component.showOptions();
    component.toggleOptions();
    expect(component.showOptions()).toBe(!initialShow);
  });
});
