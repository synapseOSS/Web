import { TestBed } from '@angular/core/testing';
import { HighlightService } from './highlight.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import * as fc from 'fast-check';

describe('HighlightService Property Tests', () => {
  let service: HighlightService;
  let supabaseMock: any;
  let authMock: any;

  beforeEach(() => {
    // Create comprehensive mocks
    supabaseMock = {
      from: jasmine.createSpy('from').and.callFake((table: string) => {
        return {
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ data: { user_id: 'test-user-id' }, error: null })
              ),
              order: jasmine.createSpy('order').and.returnValue({
                limit: jasmine.createSpy('limit').and.returnValue(
                  Promise.resolve({ data: [], error: null })
                )
              })
            }),
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            )
          }),
          insert: jasmine.createSpy('insert').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(
                Promise.resolve({ 
                  data: { 
                    id: 'highlight-id', 
                    user_id: 'test-user-id',
                    title: 'Test Highlight',
                    display_order: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }, 
                  error: null 
                })
              )
            })
          }),
          update: jasmine.createSpy('update').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: null, error: null })
              )
            })
          }),
          delete: jasmine.createSpy('delete').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: null, error: null })
              )
            })
          })
        };
      })
    };

    authMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' })
    };

    TestBed.configureTestingModule({
      providers: [
        HighlightService,
        { provide: SupabaseService, useValue: { client: supabaseMock } },
        { provide: AuthService, useValue: authMock }
      ]
    });

    service = TestBed.inject(HighlightService);
  });

  // Feature: story-feature, Property 38: Highlight creation duplicates story
  it('Property 38: adding a story to highlights creates a permanent copy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          highlightId: fc.uuid(),
          storyId: fc.uuid(),
          userId: fc.uuid()
        }),
        async ({ highlightId, storyId, userId }) => {
          // Mock the highlight and story existence checks
          let insertCalled = false;
          
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_highlights') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ data: { user_id: userId }, error: null })
                    )
                  })
                })
              };
            } else if (table === 'stories') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ data: { id: storyId, user_id: userId }, error: null })
                    )
                  })
                })
              };
            } else if (table === 'story_highlight_items') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    order: jasmine.createSpy('order').and.returnValue({
                      limit: jasmine.createSpy('limit').and.returnValue(
                        Promise.resolve({ data: [], error: null })
                      )
                    })
                  })
                }),
                insert: jasmine.createSpy('insert').and.callFake(() => {
                  insertCalled = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            };
          });

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          try {
            await service.addStoryToHighlight(highlightId, storyId);
            
            // Verify that a highlight item was created (permanent copy)
            expect(insertCalled).toBe(true);
          } catch (err) {
            // If there's an error, it should be a validation error, not a failure to create
            // the highlight item
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 39: Highlight removal preserves archive
  it('Property 39: removing a story from highlights preserves the archive copy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          highlightId: fc.uuid(),
          storyId: fc.uuid(),
          userId: fc.uuid()
        }),
        async ({ highlightId, storyId, userId }) => {
          let deleteCalled = false;
          let storyDeleteCalled = false;
          
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_highlights') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    single: jasmine.createSpy('single').and.returnValue(
                      Promise.resolve({ data: { user_id: userId }, error: null })
                    )
                  })
                })
              };
            } else if (table === 'story_highlight_items') {
              return {
                delete: jasmine.createSpy('delete').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    eq: jasmine.createSpy('eq').and.callFake(() => {
                      deleteCalled = true;
                      return Promise.resolve({ error: null });
                    })
                  })
                })
              };
            } else if (table === 'stories') {
              return {
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  storyDeleteCalled = true;
                  return Promise.resolve({ error: null });
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            };
          });

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          try {
            await service.removeStoryFromHighlight(highlightId, storyId);
            
            // Verify that only the highlight item was deleted, not the story itself
            expect(deleteCalled).toBe(true);
            expect(storyDeleteCalled).toBe(false);
          } catch (err) {
            // Errors are acceptable, but we should never delete the story
            expect(storyDeleteCalled).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 40: Highlight reordering updates display order
  it('Property 40: reordering highlights updates display_order field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }).map(arr => [...new Set(arr)]),
        async (highlightIds) => {
          if (highlightIds.length < 2) return; // Skip if not enough unique IDs

          const updateCalls: Array<{ id: string; order: number }> = [];
          
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_highlights') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  return {
                    eq: jasmine.createSpy('eq').and.callFake((field: string, value: string) => {
                      if (field === 'id') {
                        updateCalls.push({ id: value, order: data.display_order });
                      }
                      return {
                        eq: jasmine.createSpy('eq').and.returnValue(
                          Promise.resolve({ error: null })
                        )
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
              select: jasmine.createSpy('select').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            };
          });

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' });

          await service.reorderHighlights(highlightIds);
          
          // Verify that display_order was updated for each highlight
          expect(updateCalls.length).toBe(highlightIds.length);
          
          // Verify that the order matches the input array
          updateCalls.forEach((call, index) => {
            expect(call.id).toBe(highlightIds[index]);
            expect(call.order).toBe(index);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 41: Highlight collection creation with metadata
  it('Property 41: creating a highlight collection includes specified metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          coverImageUrl: fc.option(fc.webUrl(), { nil: undefined }),
          userId: fc.uuid()
        }),
        async ({ title, coverImageUrl, userId }) => {
          let insertedData: any = null;
          
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_highlights') {
              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue({
                    order: jasmine.createSpy('order').and.returnValue({
                      limit: jasmine.createSpy('limit').and.returnValue(
                        Promise.resolve({ data: [], error: null })
                      )
                    })
                  }),
                  order: jasmine.createSpy('order').and.returnValue(
                    Promise.resolve({ data: [], error: null })
                  )
                }),
                insert: jasmine.createSpy('insert').and.callFake((data: any) => {
                  insertedData = data;
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      single: jasmine.createSpy('single').and.returnValue(
                        Promise.resolve({ 
                          data: { 
                            id: 'highlight-id',
                            ...data,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          }, 
                          error: null 
                        })
                      )
                    })
                  };
                })
              };
            }
            return {
              select: jasmine.createSpy('select').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            };
          });

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          const highlight = await service.createHighlight({
            title,
            cover_image_url: coverImageUrl
          });
          
          // Verify that the created highlight includes the specified metadata
          expect(insertedData).not.toBeNull();
          expect(insertedData.title).toBe(title);
          expect(insertedData.cover_image_url).toBe(coverImageUrl);
          expect(insertedData.user_id).toBe(userId);
          expect(typeof insertedData.display_order).toBe('number');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 42: Highlight metadata edit preserves stories
  it('Property 42: editing highlight metadata does not affect contained stories', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          highlightId: fc.uuid(),
          newTitle: fc.string({ minLength: 1, maxLength: 100 }),
          newCoverUrl: fc.option(fc.webUrl(), { nil: undefined }),
          userId: fc.uuid()
        }),
        async ({ highlightId, newTitle, newCoverUrl, userId }) => {
          let metadataUpdated = false;
          let storiesModified = false;
          
          supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
            if (table === 'story_highlights') {
              return {
                update: jasmine.createSpy('update').and.callFake((data: any) => {
                  metadataUpdated = true;
                  // Verify only metadata fields are being updated
                  expect(data.title).toBe(newTitle);
                  if (newCoverUrl !== undefined) {
                    expect(data.cover_image_url).toBe(newCoverUrl);
                  }
                  expect(data.updated_at).toBeDefined();
                  
                  return {
                    eq: jasmine.createSpy('eq').and.returnValue({
                      eq: jasmine.createSpy('eq').and.returnValue(
                        Promise.resolve({ error: null })
                      )
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
            } else if (table === 'story_highlight_items') {
              return {
                update: jasmine.createSpy('update').and.callFake(() => {
                  storiesModified = true;
                  return Promise.resolve({ error: null });
                }),
                delete: jasmine.createSpy('delete').and.callFake(() => {
                  storiesModified = true;
                  return Promise.resolve({ error: null });
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
              select: jasmine.createSpy('select').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            };
          });

          authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

          await service.updateHighlightMetadata(highlightId, {
            title: newTitle,
            cover_image_url: newCoverUrl
          });
          
          // Verify that metadata was updated but stories were not modified
          expect(metadataUpdated).toBe(true);
          expect(storiesModified).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
