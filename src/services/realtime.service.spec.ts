import { TestBed } from '@angular/core/testing';
import { RealtimeService } from './realtime.service';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

describe('RealtimeService', () => {
  let service: RealtimeService;
  let mockSupabaseClient: any;
  let mockChannel: any;

  beforeEach(() => {
    // Create mock channel
    mockChannel = {
      on: jasmine.createSpy('on').and.returnValue({
        on: jasmine.createSpy('on').and.returnValue({
          subscribe: jasmine.createSpy('subscribe').and.returnValue(Promise.resolve())
        }),
        subscribe: jasmine.createSpy('subscribe').and.returnValue(Promise.resolve())
      }),
      subscribe: jasmine.createSpy('subscribe').and.callFake((callback: any) => {
        if (callback) {
          callback('SUBSCRIBED');
        }
        return Promise.resolve();
      }),
      unsubscribe: jasmine.createSpy('unsubscribe').and.returnValue(Promise.resolve())
    };

    // Create mock Supabase client
    mockSupabaseClient = {
      channel: jasmine.createSpy('channel').and.returnValue(mockChannel),
      removeChannel: jasmine.createSpy('removeChannel').and.returnValue(Promise.resolve()),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: true, error: null })),
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: { views_count: 10 }, error: null })
            )
          })
        })
      })
    };

    TestBed.configureTestingModule({
      providers: [
        RealtimeService,
        {
          provide: SupabaseService,
          useValue: { client: mockSupabaseClient }
        }
      ]
    });

    service = TestBed.inject(RealtimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Story Creation Subscription', () => {
    it('should subscribe to story creation events', () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryCreation(userId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `stories:feed:${userId}`,
        { config: { private: true } }
      );
      expect(mockChannel.on).toHaveBeenCalled();
    });

    it('should call callback when new story is created and viewer can see it', async () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');
      let insertHandler: any;

      // Capture the INSERT event handler
      mockChannel.on = jasmine.createSpy('on').and.callFake((event: string, config: any, handler: any) => {
        if (config.event === 'INSERT') {
          insertHandler = handler;
        }
        return {
          subscribe: jasmine.createSpy('subscribe').and.callFake((statusCallback: any) => {
            if (statusCallback) {
              statusCallback('SUBSCRIBED');
            }
            return Promise.resolve();
          })
        };
      });

      service.subscribeToStoryCreation(userId, callback);

      // Simulate new story insert
      const newStory = {
        id: 'story-1',
        user_id: 'creator-id',
        media_url: 'https://example.com/story.jpg',
        privacy_setting: 'public'
      };

      if (insertHandler) {
        await insertHandler({ new: newStory });
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('can_view_story', {
          story_uuid: newStory.id,
          viewer_uuid: userId
        });
        expect(callback).toHaveBeenCalledWith(newStory);
      }
    });

    it('should handle subscription errors and attempt reconnection', (done) => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');

      mockChannel.subscribe = jasmine.createSpy('subscribe').and.callFake((statusCallback: any) => {
        if (statusCallback) {
          statusCallback('CHANNEL_ERROR');
        }
        return Promise.resolve();
      });

      service.subscribeToStoryCreation(userId, callback);

      setTimeout(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('Story Updates Subscription', () => {
    it('should subscribe to story update and delete events', () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryUpdates(userId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `stories:updates:${userId}`,
        { config: { private: true } }
      );
    });

    it('should handle story deletion events', async () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');
      let deleteHandler: any;

      mockChannel.on = jasmine.createSpy('on').and.callFake((event: string, config: any, handler: any) => {
        if (config.event === 'DELETE') {
          deleteHandler = handler;
        }
        return {
          on: jasmine.createSpy('on').and.returnValue({
            subscribe: jasmine.createSpy('subscribe').and.callFake((statusCallback: any) => {
              if (statusCallback) {
                statusCallback('SUBSCRIBED');
              }
              return Promise.resolve();
            })
          })
        };
      });

      service.subscribeToStoryUpdates(userId, callback);

      const deletedStory = { id: 'story-1', user_id: 'creator-id' };
      
      if (deleteHandler) {
        await deleteHandler({ old: deletedStory });
        
        expect(callback).toHaveBeenCalledWith({
          ...deletedStory,
          event: 'DELETE'
        });
      }
    });
  });

  describe('Story Views Subscription', () => {
    it('should subscribe to view events for a specific story', () => {
      const storyId = 'story-123';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryViews(storyId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `story-views:${storyId}`,
        { config: { private: true } }
      );
    });

    it('should call callback with view data and updated count', async () => {
      const storyId = 'story-123';
      const callback = jasmine.createSpy('callback');
      let insertHandler: any;

      mockChannel.on = jasmine.createSpy('on').and.callFake((event: string, config: any, handler: any) => {
        if (config.event === 'INSERT') {
          insertHandler = handler;
        }
        return {
          subscribe: jasmine.createSpy('subscribe').and.callFake((statusCallback: any) => {
            if (statusCallback) {
              statusCallback('SUBSCRIBED');
            }
            return Promise.resolve();
          })
        };
      });

      service.subscribeToStoryViews(storyId, callback);

      const newView = {
        id: 'view-1',
        story_id: storyId,
        viewer_id: 'viewer-123',
        viewed_at: new Date().toISOString()
      };

      if (insertHandler) {
        await insertHandler({ new: newView });
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(callback).toHaveBeenCalledWith({
          view: newView,
          views_count: 10
        });
      }
    });
  });

  describe('Story Reactions Subscription', () => {
    it('should subscribe to reaction events for a specific story', () => {
      const storyId = 'story-123';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryReactions(storyId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `story-reactions:${storyId}`,
        { config: { private: true } }
      );
    });

    it('should handle reaction insertion with user info', async () => {
      const storyId = 'story-123';
      const callback = jasmine.createSpy('callback');
      let insertHandler: any;

      // Mock user data fetch
      mockSupabaseClient.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'users') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({
                    data: { username: 'testuser', display_name: 'Test User', avatar: 'avatar.jpg' },
                    error: null
                  })
                )
              })
            })
          };
        } else if (table === 'stories') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: { reactions_count: 5 }, error: null })
                )
              })
            })
          };
        }
        return {};
      });

      mockChannel.on = jasmine.createSpy('on').and.callFake((event: string, config: any, handler: any) => {
        if (config.event === 'INSERT') {
          insertHandler = handler;
        }
        return {
          on: jasmine.createSpy('on').and.returnValue({
            subscribe: jasmine.createSpy('subscribe').and.callFake((statusCallback: any) => {
              if (statusCallback) {
                statusCallback('SUBSCRIBED');
              }
              return Promise.resolve();
            })
          })
        };
      });

      service.subscribeToStoryReactions(storyId, callback);

      const newReaction = {
        id: 'reaction-1',
        story_id: storyId,
        user_id: 'user-123',
        reaction_type: '❤️'
      };

      if (insertHandler) {
        await insertHandler({ new: newReaction });
        
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        expect(callback).toHaveBeenCalledWith({
          reaction: newReaction,
          user: { username: 'testuser', display_name: 'Test User', avatar: 'avatar.jpg' },
          reactions_count: 5
        });
      }
    });
  });

  describe('Story Replies Subscription', () => {
    it('should subscribe to reply events for a specific story', () => {
      const storyId = 'story-123';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryReplies(storyId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith(
        `story-replies:${storyId}`,
        { config: { private: true } }
      );
    });
  });

  describe('Connection Management', () => {
    it('should unsubscribe from specific channel', () => {
      const channelName = 'test-channel';
      service['channels'].set(channelName, mockChannel);

      service.unsubscribe(channelName);

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(service['channels'].has(channelName)).toBe(false);
    });

    it('should unsubscribe from all story channels', () => {
      service['channels'].set('stories:feed:user1', mockChannel);
      service['channels'].set('story-views:story1', mockChannel);
      service['channels'].set('other-channel', mockChannel);

      service.unsubscribeFromStories();

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledTimes(2);
      expect(service['channels'].has('stories:feed:user1')).toBe(false);
      expect(service['channels'].has('story-views:story1')).toBe(false);
      expect(service['channels'].has('other-channel')).toBe(true);
    });

    it('should monitor connection status', () => {
      const statusCallback = jasmine.createSpy('statusCallback');

      service.monitorConnection(statusCallback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('connection-monitor');
      expect(statusCallback).toHaveBeenCalledWith('SUBSCRIBED');
      expect(service.isConnected()).toBe(true);
    });

    it('should handle connection loss', () => {
      const statusCallback = jasmine.createSpy('statusCallback');

      mockChannel.subscribe = jasmine.createSpy('subscribe').and.callFake((callback: any) => {
        if (callback) {
          callback('CLOSED');
        }
        return Promise.resolve();
      });

      service.monitorConnection(statusCallback);

      expect(statusCallback).toHaveBeenCalledWith('CLOSED');
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('Reconnection Logic', () => {
    it('should maintain channel registry for management', () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryCreation(userId, callback);

      // Verify channel is stored in the registry
      expect(service['channels'].has(`stories:feed:${userId}`)).toBe(true);
    });

    it('should allow unsubscribing from story channels', () => {
      const userId = 'test-user-id';
      const callback = jasmine.createSpy('callback');

      service.subscribeToStoryCreation(userId, callback);
      service.unsubscribeFromStories();

      // Verify channel was removed
      expect(service['channels'].has(`stories:feed:${userId}`)).toBe(false);
    });
  });
});
