import { TestBed } from '@angular/core/testing';
import { ArchiveService, ArchivedStory } from './archive.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import fc from 'fast-check';

describe('ArchiveService', () => {
  let service: ArchiveService;
  let mockSupabase: any;
  let mockAuth: any;

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue({
              then: jasmine.createSpy('then')
            }),
            single: jasmine.createSpy('single').and.returnValue({
              then: jasmine.createSpy('then')
            })
          })
        }),
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue({
              then: jasmine.createSpy('then')
            })
          })
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              then: jasmine.createSpy('then')
            }),
            then: jasmine.createSpy('then')
          }),
          lt: jasmine.createSpy('lt').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              then: jasmine.createSpy('then')
            })
          })
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            then: jasmine.createSpy('then')
          })
        })
      }),
      storage: {
        from: jasmine.createSpy('from').and.returnValue({
          remove: jasmine.createSpy('remove').and.returnValue({
            then: jasmine.createSpy('then')
          })
        })
      },
      rpc: jasmine.createSpy('rpc').and.returnValue({
        then: jasmine.createSpy('then')
      })
    };

    // Mock Auth service
    mockAuth = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({
        id: 'test-user-id'
      })
    };

    TestBed.configureTestingModule({
      providers: [
        ArchiveService,
        { provide: SupabaseService, useValue: { client: mockSupabase } },
        { provide: AuthService, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(ArchiveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Feature: story-feature, Property 43: Expiration timestamp calculation
  describe('Property 43: Expiration timestamp calculation', () => {
    it('expiration timestamp is exactly duration hours after creation', () => {
      fc.assert(
        fc.property(
          fc.record({
            durationHours: fc.integer({ min: 1, max: 168 }),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') })
          }),
          ({ durationHours, createdAt }) => {
            const expiresAt = service.calculateExpirationTimestamp(createdAt, durationHours);

            const expectedExpiration = new Date(createdAt);
            expectedExpiration.setHours(expectedExpiration.getHours() + durationHours);

            // Should be exactly equal (no processing delay in pure calculation)
            expect(expiresAt.getTime()).toBe(expectedExpiration.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 44: Expired story marking
  describe('Property 44: Expired story marking', () => {
    it('stories past expiration timestamp are marked as expired', () => {
      fc.assert(
        fc.property(
          fc.record({
            expiresAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
          }),
          ({ expiresAt }) => {
            const isExpired = service.isStoryExpired(expiresAt);

            // Any date in the past should be marked as expired
            const now = new Date();
            if (expiresAt < now) {
              expect(isExpired).toBe(true);
            } else {
              expect(isExpired).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 45: Expiration triggers archival
  describe('Property 45: Expiration triggers archival', () => {
    it('expired stories are moved to archive', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            archivedCount: fc.integer({ min: 0, max: 100 })
          }),
          async ({ archivedCount }) => {
            // Mock the RPC call to return archived count
            mockSupabase.rpc.and.returnValue(
              Promise.resolve({ data: archivedCount, error: null })
            );

            const result = await service.archiveExpiredStories();

            expect(result).toBe(archivedCount);
            expect(mockSupabase.rpc).toHaveBeenCalledWith('archive_expired_stories');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 46: Archive ordering by date
  describe('Property 46: Archive ordering by date', () => {
    it('archived stories are ordered by creation date descending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('test-user-id'),
              original_story_id: fc.uuid(),
              media_url: fc.webUrl(),
              created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
              archived_at: fc.date().map(d => d.toISOString()),
              views_count: fc.integer({ min: 0, max: 1000 }),
              reactions_count: fc.integer({ min: 0, max: 100 })
            }),
            { minLength: 2, maxLength: 20 }
          ),
          async (stories) => {
            // Sort stories by created_at descending (most recent first)
            const sortedStories = [...stories].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            // Mock the database response
            mockSupabase.from.and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  order: jasmine.createSpy('order').and.returnValue(
                    Promise.resolve({ data: sortedStories, error: null })
                  )
                })
              })
            });

            const result = await service.fetchArchivedStories();

            // Verify ordering
            for (let i = 0; i < result.length - 1; i++) {
              const current = new Date(result[i].created_at);
              const next = new Date(result[i + 1].created_at);
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 47: Archive download includes metadata
  describe('Property 47: Archive download includes metadata', () => {
    it('downloaded archive includes all metadata fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            user_id: fc.constant('test-user-id'),
            original_story_id: fc.uuid(),
            media_url: fc.webUrl(),
            thumbnail_url: fc.option(fc.webUrl()),
            content: fc.option(fc.string({ maxLength: 500 })),
            created_at: fc.date().map(d => d.toISOString()),
            archived_at: fc.date().map(d => d.toISOString()),
            views_count: fc.integer({ min: 0, max: 1000 }),
            reactions_count: fc.integer({ min: 0, max: 100 })
          }),
          async (story) => {
            // Mock the database response
            mockSupabase.from.and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: [story], error: null })
                )
              })
            });

            const result = await service.downloadArchivedStory(story.id);

            // Verify all metadata is included
            expect(result.story).toEqual(story);
            expect(result.metadata.views_count).toBe(story.views_count);
            expect(result.metadata.reactions_count).toBe(story.reactions_count);
            expect(result.metadata.created_at).toBe(story.created_at);
            expect(result.metadata.archived_at).toBe(story.archived_at);
            expect(result.metadata.content).toBe(story.content);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 48: Permanent deletion removes all data
  describe('Property 48: Permanent deletion removes all data', () => {
    it('permanent deletion removes database record and storage media', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            user_id: fc.constant('test-user-id'),
            original_story_id: fc.uuid(),
            media_url: fc.constant('https://example.supabase.co/storage/v1/object/public/story-media/test-user-id/story_123.jpg'),
            thumbnail_url: fc.option(fc.constant('https://example.supabase.co/storage/v1/object/public/story-thumbnails/test-user-id/thumb_123.jpg')),
            content: fc.option(fc.string()),
            created_at: fc.date().map(d => d.toISOString()),
            archived_at: fc.date().map(d => d.toISOString()),
            views_count: fc.integer({ min: 0, max: 1000 }),
            reactions_count: fc.integer({ min: 0, max: 100 })
          }),
          async (story) => {
            // Mock the fetch response
            const selectSpy = jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: [story], error: null })
              )
            });

            // Mock the delete response
            const deleteSpy = jasmine.createSpy('delete').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ error: null })
              )
            });

            // Mock storage remove
            const removeSpy = jasmine.createSpy('remove').and.returnValue(
              Promise.resolve({ error: null })
            );

            mockSupabase.from.and.callFake((table: string) => {
              if (table === 'story_archive') {
                return {
                  select: selectSpy,
                  delete: deleteSpy
                };
              }
              return {
                select: jasmine.createSpy('select'),
                delete: jasmine.createSpy('delete')
              };
            });

            mockSupabase.storage.from.and.returnValue({
              remove: removeSpy
            });

            await service.permanentlyDeleteArchivedStory(story.id);

            // Verify storage deletion was called
            expect(mockSupabase.storage.from).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();

            // Verify database deletion was called
            expect(deleteSpy).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 49: Custom duration validation
  describe('Property 49: Custom duration validation', () => {
    it('accepts durations between 1 and 168 hours, rejects others', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 300 }),
          (durationHours) => {
            const isValid = service.validateCustomDuration(durationHours);

            if (durationHours >= 1 && durationHours <= 168) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 37: Archive restoration conditions
  describe('Property 37: Archive restoration conditions', () => {
    it('restoration succeeds only if story has not expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            user_id: fc.constant('test-user-id'),
            original_story_id: fc.uuid(),
            media_url: fc.webUrl(),
            created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
            archived_at: fc.date().map(d => d.toISOString()),
            views_count: fc.integer({ min: 0, max: 1000 }),
            reactions_count: fc.integer({ min: 0, max: 100 })
          }),
          async (story) => {
            // Calculate if story would be expired
            const createdAt = new Date(story.created_at);
            const expiresAt = service.calculateExpirationTimestamp(createdAt, 24);
            const isExpired = service.isStoryExpired(expiresAt);

            // Mock the fetch response
            mockSupabase.from.and.callFake((table: string) => {
              if (table === 'story_archive') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue(
                      Promise.resolve({ data: [story], error: null })
                    )
                  }),
                  delete: jasmine.createSpy('delete').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue(
                      Promise.resolve({ error: null })
                    )
                  })
                };
              } else if (table === 'stories') {
                return {
                  insert: jasmine.createSpy('insert').and.returnValue({
                    select: jasmine.createSpy('select').and.returnValue({
                      single: jasmine.createSpy('single').and.returnValue(
                        Promise.resolve({ data: { ...story, is_active: true }, error: null })
                      )
                    })
                  })
                };
              }
              return {};
            });

            const result = await service.restoreArchivedStory(story.id);

            // Verify restoration result matches expiration status
            if (isExpired) {
              expect(result).toBe(false);
            } else {
              expect(result).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
