import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StoryCreatorComponent } from './story-creator.component';
import { StoryService } from '../services/story.service';
import { InteractiveElementService } from '../services/interactive-element.service';
import { MentionService } from '../services/mention.service';
import { LocationService } from '../services/location.service';
import { AuthService } from '../services/auth.service';

describe('StoryCreatorComponent', () => {
  let component: StoryCreatorComponent;
  let fixture: ComponentFixture<StoryCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryCreatorComponent],
      providers: [
        { provide: StoryService, useValue: {} },
        { provide: InteractiveElementService, useValue: {} },
        { provide: MentionService, useValue: {} },
        { provide: LocationService, useValue: {} },
        { provide: AuthService, useValue: { currentUser: () => ({ id: 'test-user' }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StoryCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with no media file', () => {
    expect(component.mediaFile()).toBeNull();
  });

  it('should initialize with followers privacy setting', () => {
    expect(component.privacy().privacy_setting).toBe('followers');
  });

  it('should initialize with 24 hour duration', () => {
    expect(component.duration).toBe(24);
  });

  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    expect(() => (component as any).validateFile(largeFile)).toThrowError(/File size exceeds 100MB limit/);
  });

  it('should validate file type', () => {
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    expect(() => (component as any).validateFile(invalidFile)).toThrowError(/Invalid file type/);
  });

  it('should add text overlay', () => {
    component.currentText = 'Hello World';
    component.addTextOverlay();
    expect(component.textOverlays().length).toBe(1);
    expect(component.textOverlays()[0].text).toBe('Hello World');
  });

  it('should not add empty text overlay', () => {
    component.currentText = '   ';
    component.addTextOverlay();
    expect(component.textOverlays().length).toBe(0);
  });

  it('should add poll option', () => {
    const initialLength = component.pollOptions().length;
    component.addPollOption();
    expect(component.pollOptions().length).toBe(initialLength + 1);
  });

  it('should not add more than 4 poll options', () => {
    component.pollOptions.set(['1', '2', '3', '4']);
    component.addPollOption();
    expect(component.pollOptions().length).toBe(4);
  });

  it('should update poll option', () => {
    component.updatePollOption(0, 'New Option');
    expect(component.pollOptions()[0]).toBe('New Option');
  });

  it('should remove poll option', () => {
    component.pollOptions.set(['1', '2', '3']);
    component.removePollOption(1);
    expect(component.pollOptions().length).toBe(2);
    expect(component.pollOptions()).toEqual(['1', '3']);
  });

  it('should not remove poll option if only 2 remain', () => {
    component.pollOptions.set(['1', '2']);
    component.removePollOption(0);
    expect(component.pollOptions().length).toBe(2);
  });

  it('should select filter', () => {
    const filter = { name: 'Grayscale', cssFilter: 'grayscale(100%)' };
    component.selectFilter(filter);
    expect(component.selectedFilter()).toEqual(filter);
  });

  it('should clear filter', () => {
    const filter = { name: 'Grayscale', cssFilter: 'grayscale(100%)' };
    component.selectFilter(filter);
    component.selectFilter(null);
    expect(component.selectedFilter()).toBeNull();
  });

  it('should set privacy setting', () => {
    component.setPrivacy('public');
    expect(component.privacy().privacy_setting).toBe('public');
  });

  it('should check if user is mentioned', () => {
    component.mentions.set([
      { uid: 'user1', username: 'test', display_name: 'Test', avatar: '' }
    ]);
    expect(component.isMentioned('user1')).toBe(true);
    expect(component.isMentioned('user2')).toBe(false);
  });

  it('should toggle mention', () => {
    const user = { uid: 'user1', username: 'test', display_name: 'Test', avatar: '' };
    
    // Add mention
    component.addMention(user);
    expect(component.mentions().length).toBe(1);
    
    // Remove mention
    component.addMention(user);
    expect(component.mentions().length).toBe(0);
  });
});
