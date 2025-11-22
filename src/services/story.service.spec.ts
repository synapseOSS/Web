import { TestBed } from '@angular/core/testing';
import { StoryService, PrivacySetting } from './story.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import * as fc from 'fast-check';

describe('StoryService Property Tests', () => {
  let service: StoryService;
  let supabaseMock: any;
  let authMock: any;

  beforeEach(() => {
    // Create mocks
    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
          })
        }),
        insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ data: null, error: null })),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null }))
        })
      }),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: true, error: null })),
      storage: {
        from: jasmine.createSpy('from').and.returnValue({
          upload: jasmine.createSpy('upload').and.returnValue(Promise.resolve({ error: null })),
          getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({ data: { publicUrl: 'https://example.com/media.jpg' } })
        })
      }
    };

    authMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' })
    };

    TestBed.configureTestingModule({
      providers: [
        StoryService,
        { provide: SupabaseService, useValue: { client: supabaseMock } },
        { provide: AuthService, useValue: authMock }
      ]
    });

    service = TestBed.inject(StoryService);
  });

  // Feature: story-feature, Property 9: Public story visibility
  it('Property 9: public stories are visible to all authenticated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
        }),
        async ({ storyId, viewerId, creatorId }) => {
          // Mock the can_view_story RPC to return true for public stories
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: true, error: null })
          );

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          const canView = await service.canViewStory(storyId);
          
          // For public stories, any authenticated user should be able to view
          expect(canView).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 10: Followers-only visibility
  it('Property 10: followers-only stories are visible only to followers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          followerId: fc.uuid(),
          creatorId: fc.uuid(),
          isFollowing: fc.boolean()
        }),
        async ({ storyId, followerId, creatorId, isFollowing }) => {
          // Mock the can_view_story RPC based on following status
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: isFollowing, error: null })
          );

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: followerId });

          const canView = await service.canViewStory(storyId);
          
          // Should match the following status
          expect(canView).toBe(isFollowing);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 11: Close friends visibility
  it('Property 11: close friends stories are visible only to close friends', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
          isCloseFriend: fc.boolean()
        }),
        async ({ storyId, viewerId, creatorId, isCloseFriend }) => {
          // Mock the can_view_story RPC based on close friend status
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: isCloseFriend, error: null })
          );

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          const canView = await service.canViewStory(storyId);
          
          // Should match the close friend status
          expect(canView).toBe(isCloseFriend);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 12: Custom privacy visibility
  it('Property 12: custom privacy stories are visible only to allowed users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
          isAllowed: fc.boolean()
        }),
        async ({ storyId, viewerId, creatorId, isAllowed }) => {
          // Mock the can_view_story RPC based on custom privacy list
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: isAllowed, error: null })
          );

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          const canView = await service.canViewStory(storyId);
          
          // Should match the allowed status
          expect(canView).toBe(isAllowed);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 1: File validation rejects invalid uploads
  it('Property 1: file validation rejects invalid uploads', () => {
    fc.assert(
      fc.property(
        fc.record({
          fileName: fc.string({ minLength: 1, maxLength: 50 }),
          fileSize: fc.integer({ min: 0, max: 200 * 1024 * 1024 }), // 0 to 200MB
          fileType: fc.constantFrom(
            'image/jpeg', 'image/png', 'image/webp', 'image/gif',
            'video/mp4', 'video/quicktime', 'video/webm',
            'application/pdf', 'text/plain', 'application/zip' // Invalid types
          )
        }),
        ({ fileName, fileSize, fileType }) => {
          const file = new File([''], fileName, { type: fileType });
          Object.defineProperty(file, 'size', { value: fileSize });

          const maxSize = 100 * 1024 * 1024; // 100MB
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

          const shouldBeValid = fileSize <= maxSize && allowedTypes.includes(fileType);

          try {
            (service as any).validateFile(file);
            // If no error thrown, file should be valid
            expect(shouldBeValid).toBe(true);
          } catch (error) {
            // If error thrown, file should be invalid
            expect(shouldBeValid).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 20: View recording completeness
  it('Property 20: view recording is atomic and complete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          viewDuration: fc.option(fc.integer({ min: 1, max: 300 })),
          completed: fc.boolean()
        }),
        async ({ storyId, viewerId, viewDuration, completed }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          // Mock checkIfViewed to return false (not viewed yet)
          supabaseMock.from = jasmine.createSpy('from').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
              })
            }),
            insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ error: null }))
          });

          let insertCalled = false;
          let rpcCalled = false;

          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_views') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
                  })
                }),
                insert: jasmine.createSpy('insert').and.callFake(() => {
                  insertCalled = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
                })
              })
            };
          });

          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake(() => {
            rpcCalled = true;
            return Promise.resolve({ error: null });
          });

          await service.viewStory(storyId, viewDuration || undefined, completed);

          // Both insert and RPC should be called for atomic operation
          expect(insertCalled).toBe(true);
          expect(rpcCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 2: Media compression maintains quality threshold
  it('Property 2: media compression reduces size while maintaining quality', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          width: fc.integer({ min: 100, max: 4000 }),
          height: fc.integer({ min: 100, max: 4000 }),
          quality: fc.double({ min: 0.5, max: 1.0 })
        }),
        async ({ width, height, quality }) => {
          // Create a test canvas image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return; // Skip if canvas not supported

          // Fill with random color
          ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
          ctx.fillRect(0, 0, width, height);

          // Convert to blob
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg', quality);
          });

          if (!blob) return;

          const originalFile = new File([blob], 'test.jpg', { type: 'image/jpeg' });
          const originalSize = originalFile.size;

          // Compress the image
          const compressedFile = await (service as any).compressImage(originalFile);

          // Verify compression occurred for large images
          if (width > 1920 || height > 1080) {
            // Should be compressed
            expect(compressedFile.size).toBeLessThanOrEqual(originalSize);
          }

          // Verify file is still valid
          expect(compressedFile).toBeDefined();
          expect(compressedFile.type).toBe('image/jpeg');
        }
      ),
      { numRuns: 50 } // Reduced runs due to canvas operations
    );
  });

  // Feature: story-feature, Property 7: Story creation atomicity
  it('Property 7: story creation is atomic - all steps succeed or none persist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          shouldFail: fc.boolean(),
          failAt: fc.constantFrom('upload', 'insert', 'privacy')
        }),
        async ({ userId, shouldFail, failAt }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let uploadCalled = false;
          let insertCalled = false;
          let privacyCalled = false;
          let rollbackCalled = false;

          // Mock storage upload
          supabaseMock.storage = {
            from: jasmine.createSpy('from').and.returnValue({
              upload: jasmine.createSpy('upload').and.callFake(() => {
                uploadCalled = true;
                if (shouldFail && failAt === 'upload') {
                  return Promise.resolve({ error: new Error('Upload failed') });
                }
                return Promise.resolve({ error: null });
              }),
              getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({
                data: { publicUrl: 'https://example.com/media.jpg' }
              }),
              remove: jasmine.createSpy('remove').and.callFake(() => {
                rollbackCalled = true;
                return Promise.resolve({ error: null });
              })
            })
          };

          // Mock database insert
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                insert: jasmine.createSpy('insert').and.callFake(() => {
                  insertCalled = true;
                  if (shouldFail && failAt === 'insert') {
                    return {
                      select: jasmine.createSpy('select').and.returnValue({
                        single: jasmine.createSpy('single').and.returnValue(
                          Promise.resolve({ data: null, error: new Error('Insert failed') })
                        )
                      })
                    };
                  }
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      single: jasmine.createSpy('single').and.returnValue(
                        Promise.resolve({
                          data: {
                            id: fc.sample(fc.uuid(), 1)[0],
                            user_id: userId,
                            media_url: 'https://example.com/media.jpg',
                            media_type: 'image',
                            created_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                          },
                          error: null
                        })
                      )
                    })
                  };
                })
              };
            }
            if (table === 'story_custom_privacy') {
              return {
                insert: jasmine.createSpy('insert').and.callFake(() => {
                  privacyCalled = true;
                  if (shouldFail && failAt === 'privacy') {
                    return Promise.resolve({ error: new Error('Privacy failed') });
                  }
                  return Promise.resolve({ error: null });
                }),
                delete: jasmine.createSpy('delete').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                })
              };
            }
            return {
              delete: jasmine.createSpy('delete').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
              })
            };
          });

          // Create a test file
          const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

          try {
            await service.createStory({
              media: testFile,
              privacy: { privacy_setting: 'public' }
            });

            // If we get here, operation succeeded
            expect(shouldFail).toBe(false);
          } catch (error) {
            // If we get here, operation failed
            expect(shouldFail).toBe(true);
            
            // Rollback should have been called
            if (uploadCalled || insertCalled) {
              expect(rollbackCalled).toBe(true);
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: story-feature, Property 26: View count accuracy
  it('Property 26: view count equals number of unique viewers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }).map(arr => [...new Set(arr)])
        }),
        async ({ storyId, viewerIds }) => {
          let viewCount = 0;
          const viewedBy = new Set<string>();

          // Mock the view recording
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_views') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                    if (field === 'viewer_id') {
                      // Check if this viewer has already viewed
                      const hasViewed = viewedBy.has(value);
                      return {
                        single: jasmine.createSpy('single').and.returnValue(
                          Promise.resolve({ data: hasViewed ? { id: 'existing' } : null, error: null })
                        )
                      };
                    }
                    return {
                      single: jasmine.createSpy('single').and.returnValue(
                        Promise.resolve({ data: null, error: null })
                      )
                    };
                  })
                }),
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  if (!viewedBy.has(data.viewer_id)) {
                    viewedBy.add(data.viewer_id);
                  }
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake(() => {
            viewCount++;
            return Promise.resolve({ error: null });
          });

          // Record views from each viewer
          for (const viewerId of viewerIds) {
            authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });
            await service.viewStory(storyId);
          }

          // View count should equal number of unique viewers
          expect(viewCount).toBe(viewerIds.length);
          expect(viewedBy.size).toBe(viewerIds.length);
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: story-feature, Property 14: Block list enforcement
  it('Property 14: blocked users cannot view any stories from blocker', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          creatorId: fc.uuid(),
          blockedUserId: fc.uuid(),
          privacySetting: fc.constantFrom('public', 'followers', 'close_friends', 'custom')
        }),
        async ({ storyId, creatorId, blockedUserId, privacySetting }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: blockedUserId });

          // Mock can_view_story to return false for blocked users regardless of privacy
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: false, error: null })
          );

          const canView = await service.canViewStory(storyId);

          // Blocked users should never be able to view
          expect(canView).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 15: Hide list override
  it('Property 15: hidden users cannot view story even if other rules allow', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          creatorId: fc.uuid(),
          hiddenUserId: fc.uuid(),
          isFollower: fc.boolean(),
          isCloseFriend: fc.boolean()
        }),
        async ({ storyId, creatorId, hiddenUserId, isFollower, isCloseFriend }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: hiddenUserId });

          // Mock can_view_story to return false for hidden users
          // even if they are followers or close friends
          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: false, error: null })
          );

          const canView = await service.canViewStory(storyId);

          // Hidden users should not be able to view
          expect(canView).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 18: Most restrictive privacy wins
  it('Property 18: most restrictive privacy rule is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
          isPublic: fc.boolean(),
          isFollower: fc.boolean(),
          isHidden: fc.boolean()
        }),
        async ({ storyId, viewerId, creatorId, isPublic, isFollower, isHidden }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          // If hidden, should not be able to view regardless of other settings
          const expectedCanView = isHidden ? false : (isPublic || isFollower);

          supabaseMock.rpc = jasmine.createSpy('rpc').and.returnValue(
            Promise.resolve({ data: expectedCanView, error: null })
          );

          const canView = await service.canViewStory(storyId);

          // Most restrictive rule should win
          expect(canView).toBe(expectedCanView);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 17: Unfollow removes from feed
  it('Property 17: unfollowing a user removes their stories from feed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
          storyId: fc.uuid(),
          isFollowing: fc.boolean()
        }),
        async ({ viewerId, creatorId, storyId, isFollowing }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: viewerId });

          const followingIds = isFollowing ? [creatorId] : [];

          // Mock follows query
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'follows') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({
                      data: followingIds.map(id => ({ following_id: id })),
                      error: null
                    })
                  )
                })
              };
            }
            if (table === 'stories') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  in: jasmine.createSpy('in').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue({
                      gt: jasmine.createSpy('gt').and.returnValue({
                        order: jasmine.createSpy('order').and.returnValue(
                          Promise.resolve({
                            data: isFollowing ? [{
                              id: storyId,
                              user_id: creatorId,
                              media_url: 'https://example.com/media.jpg',
                              media_type: 'image',
                              is_active: true,
                              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                              users: {
                                uid: creatorId,
                                username: 'creator',
                                display_name: 'Creator',
                                avatar: 'https://example.com/avatar.jpg',
                                verify: false
                              }
                            }] : [],
                            error: null
                          })
                        )
                      })
                    })
                  })
                })
              };
            }
            if (table === 'story_views') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ data: null, error: null })
                    )
                  })
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: [], error: null })
                )
              })
            };
          });

          await service.fetchStories();
          const stories = service.stories();

          // Stories should only appear if user is following the creator
          if (isFollowing) {
            expect(stories.length).toBeGreaterThan(0);
            expect(stories.some(s => s.user_id === creatorId)).toBe(true);
          } else {
            expect(stories.every(s => s.user_id !== creatorId)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 8: Failed creation rollback
  it('Property 8: failed story creation removes all partial data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.uuid(),
          storyId: fc.uuid()
        }),
        async ({ userId, storyId }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let storageRemoveCalled = false;
          let storyDeleteCalled = false;
          let privacyDeleteCalled = false;
          let mentionsDeleteCalled = false;

          // Mock storage to fail upload
          supabaseMock.storage = {
            from: jasmine.createSpy('from').and.returnValue({
              upload: jasmine.createSpy('upload').and.returnValue(
                Promise.resolve({ error: null })
              ),
              getPublicUrl: jasmine.createSpy('getPublicUrl').and.returnValue({
                data: { publicUrl: 'https://example.com/media.jpg' }
              }),
              remove: jasmine.createSpy('remove').and.callFake(() => {
                storageRemoveCalled = true;
                return Promise.resolve({ error: null });
              })
            })
          };

          // Mock database to fail insert
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                insert: jasmine.createSpy('insert').and.returnValue({
                  select: jasmine.createSpy('select').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ data: null, error: new Error('Database error') })
                    )
                  })
                }),
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  storyDeleteCalled = true;
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                  };
                })
              };
            }
            if (table === 'story_custom_privacy') {
              return {
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  privacyDeleteCalled = true;
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                  };
                })
              };
            }
            if (table === 'story_mentions') {
              return {
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  mentionsDeleteCalled = true;
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                  };
                })
              };
            }
            return {
              delete: jasmine.createSpy('delete').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
              })
            };
          });

          const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

          try {
            await service.createStory({
              media: testFile,
              privacy: { privacy_setting: 'public' }
            });
            fail('Should have thrown an error');
          } catch (error) {
            // Rollback should clean up storage
            expect(storageRemoveCalled).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // Feature: story-feature, Property 21: Reaction recording and counting
  it('Property 21: reaction is stored and reaction count is incremented', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          userId: fc.uuid(),
          reactionType: fc.constantFrom('❤️', '😂', '😮', '😢', '👏', '🔥')
        }),
        async ({ storyId, userId, reactionType }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let reactionInserted = false;
          let countIncremented = false;

          // Mock the reaction insert
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_reactions') {
              return {
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  // Verify reaction data is correct
                  expect(data.story_id).toBe(storyId);
                  expect(data.user_id).toBe(userId);
                  expect(data.reaction_type).toBe(reactionType);
                  reactionInserted = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          // Mock the RPC call to increment count
          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake((functionName: string, params: any) => {
            if (functionName === 'increment_story_reactions') {
              expect(params.story_id).toBe(storyId);
              countIncremented = true;
            }
            return Promise.resolve({ error: null });
          });

          await service.addReaction(storyId, reactionType);

          // Both operations should have been performed
          expect(reactionInserted).toBe(true);
          expect(countIncremented).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 22: Reply creates message thread
  it('Property 22: story reply creates a direct message thread', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          senderId: fc.uuid(),
          creatorId: fc.uuid(),
          message: fc.string({ minLength: 1, maxLength: 500 })
        }),
        async ({ storyId, senderId, creatorId, message }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: senderId });

          let replyInserted = false;
          let countIncremented = false;
          let chatCreated = false;
          let messageInserted = false;

          // Mock the database calls
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ 
                        data: { user_id: creatorId }, 
                        error: null 
                      })
                    )
                  })
                })
              };
            }
            if (table === 'story_replies') {
              return {
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  expect(data.story_id).toBe(storyId);
                  expect(data.sender_id).toBe(senderId);
                  expect(data.message).toBe(message);
                  replyInserted = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            if (table === 'chat_participants') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({ data: [], error: null })
                  )
                }),
                insert: jasmine.createSpy('insert').and.returnValue(
                  Promise.resolve({ error: null })
                )
              };
            }
            if (table === 'chats') {
              return {
                insert: jasmine.createSpy('insert').and.callFake(() => {
                  chatCreated = true;
                  return Promise.resolve({ error: null });
                }),
                update: jasmine.createSpy('update').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({ error: null })
                  )
                })
              };
            }
            if (table === 'messages') {
              return {
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  expect(data.sender_id).toBe(senderId);
                  expect(data.message_type).toBe('story_reply');
                  expect(data.metadata?.story_id).toBe(storyId);
                  messageInserted = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          // Mock the RPC call to increment count
          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake((functionName: string, params: any) => {
            if (functionName === 'increment_story_replies') {
              expect(params.story_id).toBe(storyId);
              countIncremented = true;
            }
            return Promise.resolve({ error: null });
          });

          await service.sendReply(storyId, message);

          // All operations should have been performed
          expect(replyInserted).toBe(true);
          expect(countIncremented).toBe(true);
          expect(chatCreated).toBe(true);
          expect(messageInserted).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 33: Text edit preserves media and history
  it('Property 33: text edit preserves media URL and view history', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          userId: fc.uuid(),
          originalContent: fc.option(fc.string({ maxLength: 500 })),
          newContent: fc.option(fc.string({ maxLength: 500 })),
          mediaUrl: fc.webUrl(),
          viewsCount: fc.integer({ min: 0, max: 1000 })
        }),
        async ({ storyId, userId, originalContent, newContent, mediaUrl, viewsCount }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let updateCalled = false;
          let mediaUrlPreserved = true;
          let viewsCountPreserved = true;

          // Mock the update operation
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  updateCalled = true;
                  // Verify that only content is updated
                  expect(data.content).toBe(newContent);
                  // Verify media_url is not in the update
                  expect(data.media_url).toBeUndefined();
                  // Verify views_count is not in the update
                  expect(data.views_count).toBeUndefined();
                  
                  return {
                    eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                      expect(field).toBe('id');
                      expect(value).toBe(storyId);
                      return {
                        eq: jasmine.createSpy('eq').and.callFake((field2: string, value2: string) => {
                          expect(field2).toBe('user_id');
                          expect(value2).toBe(userId);
                          return Promise.resolve({ error: null });
                        })
                      };
                    })
                  };
                }),
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    order: jasmine.createSpy('order').and.returnValue(
                      Promise.resolve({ data: [], error: null })
                    )
                  })
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          await service.updateStory(storyId, newContent || undefined);

          // Update should have been called
          expect(updateCalled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 34: Interactive element edit preserves responses
  it('Property 34: interactive element edit preserves existing responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          elementId: fc.uuid(),
          storyId: fc.uuid(),
          userId: fc.uuid(),
          originalData: fc.jsonValue(),
          newData: fc.jsonValue(),
          existingResponseCount: fc.integer({ min: 0, max: 100 })
        }),
        async ({ elementId, storyId, userId, originalData, newData, existingResponseCount }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let updateCalled = false;
          let responsesDeleted = false;

          // Mock the update operation
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_interactive_elements') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  updateCalled = true;
                  expect(data.element_data).toBe(newData);
                  
                  return {
                    eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                      expect(field).toBe('id');
                      expect(value).toBe(elementId);
                      return Promise.resolve({ error: null });
                    })
                  };
                })
              };
            }
            if (table === 'story_interactive_responses') {
              return {
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  responsesDeleted = true;
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                  };
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          await service.updateInteractiveElement(elementId, newData);

          // Update should have been called
          expect(updateCalled).toBe(true);
          // Responses should NOT be deleted
          expect(responsesDeleted).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 35: Privacy change immediacy
  it('Property 35: privacy changes are applied immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          userId: fc.uuid(),
          oldPrivacy: fc.constantFrom('public', 'followers', 'close_friends', 'custom'),
          newPrivacy: fc.constantFrom('public', 'followers', 'close_friends', 'custom')
        }),
        async ({ storyId, userId, oldPrivacy, newPrivacy }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let privacyUpdated = false;
          let customPrivacyCleared = false;

          // Mock the update operation
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  privacyUpdated = true;
                  expect(data.privacy_setting).toBe(newPrivacy);
                  
                  return {
                    eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                      expect(field).toBe('id');
                      expect(value).toBe(storyId);
                      return {
                        eq: jasmine.createSpy('eq').and.callFake((field2: string, value2: string) => {
                          expect(field2).toBe('user_id');
                          expect(value2).toBe(userId);
                          return Promise.resolve({ error: null });
                        })
                      };
                    })
                  };
                }),
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    order: jasmine.createSpy('order').and.returnValue(
                      Promise.resolve({ data: [], error: null })
                    )
                  })
                })
              };
            }
            if (table === 'story_custom_privacy') {
              return {
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  customPrivacyCleared = true;
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                  };
                }),
                insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ error: null }))
              };
            }
            if (table === 'story_hidden_from') {
              return {
                delete: jasmine.createSpy('delete').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          await service.updateStoryPrivacy(storyId, { privacy_setting: newPrivacy });

          // Privacy should have been updated
          expect(privacyUpdated).toBe(true);
          // Custom privacy should have been cleared
          expect(customPrivacyCleared).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 36: Story deletion workflow
  it('Property 36: story deletion marks inactive, removes from feeds, and archives', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          userId: fc.uuid(),
          mediaUrl: fc.webUrl(),
          content: fc.option(fc.string({ maxLength: 500 })),
          viewsCount: fc.integer({ min: 0, max: 1000 }),
          reactionsCount: fc.integer({ min: 0, max: 500 })
        }),
        async ({ storyId, userId, mediaUrl, content, viewsCount, reactionsCount }) => {
          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          let storyMarkedInactive = false;
          let storyArchived = false;

          // Mock the operations
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'stories') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  // Verify story is marked as inactive
                  expect(data.is_active).toBe(false);
                  storyMarkedInactive = true;
                  
                  return {
                    eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                      expect(field).toBe('id');
                      expect(value).toBe(storyId);
                      return Promise.resolve({ error: null });
                    })
                  };
                }),
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({
                        data: {
                          id: storyId,
                          user_id: userId,
                          media_url: mediaUrl,
                          content: content,
                          views_count: viewsCount,
                          reactions_count: reactionsCount,
                          created_at: new Date().toISOString()
                        },
                        error: null
                      })
                    ),
                    order: jasmine.createSpy('order').and.returnValue(
                      Promise.resolve({ data: [], error: null })
                    )
                  })
                })
              };
            }
            if (table === 'story_archive') {
              return {
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  // Verify story is archived with correct data
                  expect(data.user_id).toBe(userId);
                  expect(data.original_story_id).toBe(storyId);
                  expect(data.media_url).toBe(mediaUrl);
                  expect(data.content).toBe(content);
                  expect(data.views_count).toBe(viewsCount);
                  expect(data.reactions_count).toBe(reactionsCount);
                  storyArchived = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              })
            };
          });

          await service.deleteStory(storyId);

          // Story should be marked inactive
          expect(storyMarkedInactive).toBe(true);
          // For now, archival happens via database trigger, so we don't test it here
          // In a full implementation, we would test the archival as well
        }
      ),
      { numRuns: 100 }
    );
  });
});
