import { TestBed } from '@angular/core/testing';
import { MentionHashtagService } from './mention-hashtag.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

describe('MentionHashtagService', () => {
  let service: MentionHashtagService;
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    mockSupabase = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          in: jasmine.createSpy('in').and.returnValue(Promise.resolve({ data: [], error: null })),
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
          })
        }),
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue(Promise.resolve({ data: [], error: null }))
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        })
      })
    };

    mockAuth = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'user-123' })
    };

    TestBed.configureTestingModule({
      providers: [
        MentionHashtagService,
        { provide: SupabaseService, useValue: { client: mockSupabase } },
        { provide: AuthService, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(MentionHashtagService);
  });

  describe('Property 4: Mention validation requires existing users', () => {
    it('should accept mentions of existing users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: () => Promise.resolve({
            data: [
              { uid: 'user-1' },
              { uid: 'user-2' },
              { uid: 'user-3' }
            ],
            error: null
          })
        })
      });

      await expectAsync(service.validateMentions(userIds)).toBeResolved();
    });

    it('should reject mentions of non-existent users', async () => {
      const userIds = ['user-1', 'user-2', 'non-existent-user'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: () => Promise.resolve({
            data: [
              { uid: 'user-1' },
              { uid: 'user-2' }
            ],
            error: null
          })
        })
      });

      await expectAsync(service.validateMentions(userIds))
        .toBeRejectedWithError(/Cannot mention non-existent users: non-existent-user/);
    });

    it('should reject multiple non-existent users', async () => {
      const userIds = ['user-1', 'fake-user-1', 'fake-user-2'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: () => Promise.resolve({
            data: [{ uid: 'user-1' }],
            error: null
          })
        })
      });

      await expectAsync(service.validateMentions(userIds))
        .toBeRejectedWithError(/Cannot mention non-existent users/);
    });

    it('should handle empty mention list', async () => {
      await expectAsync(service.validateMentions([])).toBeResolved();
    });

    it('should remove duplicate user IDs before validation', async () => {
      const userIds = ['user-1', 'user-1', 'user-2'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: (field: string, ids: string[]) => {
            // Verify duplicates were removed
            expect(ids.length).toBe(2);
            expect(new Set(ids).size).toBe(2);
            return Promise.resolve({
              data: [
                { uid: 'user-1' },
                { uid: 'user-2' }
              ],
              error: null
            });
          }
        })
      });

      await expectAsync(service.validateMentions(userIds)).toBeResolved();
    });

    it('should validate mentions by username', async () => {
      const usernames = ['alice', 'bob', 'charlie'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: () => Promise.resolve({
            data: [
              { uid: 'user-1', username: 'alice' },
              { uid: 'user-2', username: 'bob' },
              { uid: 'user-3', username: 'charlie' }
            ],
            error: null
          })
        })
      });

      const userIds = await service.validateMentionsByUsername(usernames);
      expect(userIds.length).toBe(3);
      expect(userIds).toContain('user-1');
      expect(userIds).toContain('user-2');
      expect(userIds).toContain('user-3');
    });

    it('should reject mentions by non-existent username', async () => {
      const usernames = ['alice', 'nonexistent'];
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          in: () => Promise.resolve({
            data: [{ uid: 'user-1', username: 'alice' }],
            error: null
          })
        })
      });

      await expectAsync(service.validateMentionsByUsername(usernames))
        .toBeRejectedWithError(/Cannot mention non-existent users: @nonexistent/);
    });
  });

  describe('Property 6: Hashtag parsing and indexing', () => {
    it('should parse hashtags from content', () => {
      const content = 'Check out this #amazing #story with #hashtags!';
      const hashtags = service.parseHashtags(content);
      
      expect(hashtags.length).toBe(3);
      expect(hashtags).toContain('amazing');
      expect(hashtags).toContain('story');
      expect(hashtags).toContain('hashtags');
    });

    it('should normalize hashtags to lowercase', () => {
      const content = 'Testing #CamelCase #UPPERCASE #lowercase';
      const hashtags = service.parseHashtags(content);
      
      expect(hashtags).toContain('camelcase');
      expect(hashtags).toContain('uppercase');
      expect(hashtags).toContain('lowercase');
    });

    it('should handle duplicate hashtags', () => {
      const content = 'Multiple #test #test #test hashtags';
      const hashtags = service.parseHashtags(content);
      
      expect(hashtags.length).toBe(1);
      expect(hashtags[0]).toBe('test');
    });

    it('should handle hashtags with numbers and underscores', () => {
      const content = 'Tags like #tag123 and #tag_name are valid';
      const hashtags = service.parseHashtags(content);
      
      expect(hashtags).toContain('tag123');
      expect(hashtags).toContain('tag_name');
    });

    it('should ignore hashtags with special characters', () => {
      const content = 'Invalid #tag-with-dash and #tag.with.dot';
      const hashtags = service.parseHashtags(content);
      
      // These should parse as 'tag' only (before the special char)
      expect(hashtags).toContain('tag');
    });

    it('should handle empty content', () => {
      const hashtags = service.parseHashtags('');
      expect(hashtags.length).toBe(0);
    });

    it('should handle content without hashtags', () => {
      const content = 'This is content without any hashtags';
      const hashtags = service.parseHashtags(content);
      expect(hashtags.length).toBe(0);
    });

    it('should index hashtags for a story', async () => {
      const storyId = 'story-123';
      const content = 'Testing #hashtag #indexing';
      
      let insertedRecords: any[] = [];
      
      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { user_id: 'user-123' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_hashtags') {
          return {
            delete: () => ({
              eq: () => Promise.resolve({ error: null })
            }),
            insert: (records: any[]) => {
              insertedRecords = records;
              return Promise.resolve({ error: null });
            }
          };
        }
        return {};
      });

      await service.indexHashtags(storyId, content);
      
      expect(insertedRecords.length).toBe(2);
      expect(insertedRecords[0].story_id).toBe(storyId);
      expect(insertedRecords[0].hashtag).toBe('hashtag');
      expect(insertedRecords[0].normalized_hashtag).toBe('hashtag');
      expect(insertedRecords[1].hashtag).toBe('indexing');
    });

    it('should replace existing hashtags when re-indexing', async () => {
      const storyId = 'story-123';
      const content = 'New #hashtags';
      
      let deleteWasCalled = false;
      
      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { user_id: 'user-123' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_hashtags') {
          return {
            delete: () => {
              deleteWasCalled = true;
              return {
                eq: () => Promise.resolve({ error: null })
              };
            },
            insert: () => Promise.resolve({ error: null })
          };
        }
        return {};
      });

      await service.indexHashtags(storyId, content);
      expect(deleteWasCalled).toBe(true);
    });

    it('should handle content with no hashtags during indexing', async () => {
      const storyId = 'story-123';
      const content = 'No hashtags here';
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { user_id: 'user-123' },
              error: null
            })
          })
        })
      });

      // Should not throw and should return early
      await expectAsync(service.indexHashtags(storyId, content)).toBeResolved();
    });
  });

  describe('Mention extraction', () => {
    it('should extract mentions from content', () => {
      const content = 'Hey @alice and @bob, check this out!';
      const mentions = service.extractMentions(content);
      
      expect(mentions.length).toBe(2);
      expect(mentions).toContain('alice');
      expect(mentions).toContain('bob');
    });

    it('should normalize mentions to lowercase', () => {
      const content = 'Mentioning @Alice and @BOB';
      const mentions = service.extractMentions(content);
      
      expect(mentions).toContain('alice');
      expect(mentions).toContain('bob');
    });

    it('should handle duplicate mentions', () => {
      const content = 'Hey @alice, @alice, and @alice again';
      const mentions = service.extractMentions(content);
      
      expect(mentions.length).toBe(1);
      expect(mentions[0]).toBe('alice');
    });

    it('should handle mentions with numbers and underscores', () => {
      const content = 'Users @user123 and @user_name';
      const mentions = service.extractMentions(content);
      
      expect(mentions).toContain('user123');
      expect(mentions).toContain('user_name');
    });

    it('should handle empty content', () => {
      const mentions = service.extractMentions('');
      expect(mentions.length).toBe(0);
    });

    it('should handle content without mentions', () => {
      const content = 'This is content without any mentions';
      const mentions = service.extractMentions(content);
      expect(mentions.length).toBe(0);
    });
  });

  describe('Search functionality', () => {
    it('should search stories by hashtag', async () => {
      const hashtag = 'test';
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              gt: () => ({
                limit: () => Promise.resolve({
                  data: [
                    { story_id: 'story-1', stories: { is_active: true, expires_at: '2025-01-01', privacy_setting: 'public' } },
                    { story_id: 'story-2', stories: { is_active: true, expires_at: '2025-01-01', privacy_setting: 'public' } }
                  ],
                  error: null
                })
              })
            })
          })
        })
      });

      const storyIds = await service.searchByHashtag(hashtag);
      expect(storyIds.length).toBe(2);
      expect(storyIds).toContain('story-1');
      expect(storyIds).toContain('story-2');
    });

    it('should normalize hashtag for search', async () => {
      let searchedTag = '';
      
      mockSupabase.from = jasmine.createSpy('from').and.returnValue({
        select: () => ({
          eq: (field: string, value: string) => {
            if (field === 'normalized_hashtag') {
              searchedTag = value;
            }
            return {
              eq: () => ({
                gt: () => ({
                  limit: () => Promise.resolve({ data: [], error: null })
                })
              })
            };
          }
        })
      });

      await service.searchByHashtag('#TestTag');
      expect(searchedTag).toBe('testtag');
    });
  });

  describe('Integration: Process story content', () => {
    it('should process mentions and hashtags together', async () => {
      const storyId = 'story-123';
      const content = 'Hey @alice, check out this #amazing #story!';
      
      mockSupabase.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              in: () => Promise.resolve({
                data: [{ uid: 'user-alice', username: 'alice' }],
                error: null
              })
            })
          };
        }
        if (table === 'stories') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({
                  data: { user_id: 'user-123' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'story_mentions') {
          return {
            insert: () => ({
              select: () => Promise.resolve({
                data: [{ id: 'mention-1', story_id: storyId, mentioned_user_id: 'user-alice' }],
                error: null
              })
            })
          };
        }
        if (table === 'story_hashtags') {
          return {
            delete: () => ({
              eq: () => Promise.resolve({ error: null })
            }),
            insert: () => Promise.resolve({ error: null })
          };
        }
        return {};
      });

      const result = await service.processStoryContent(storyId, content);
      
      expect(result.mentions.length).toBe(1);
      expect(result.hashtags.length).toBe(2);
      expect(result.hashtags).toContain('amazing');
      expect(result.hashtags).toContain('story');
    });
  });
});
