import { TestBed } from '@angular/core/testing';
import { StoryAnalyticsService } from './story-analytics.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import fc from 'fast-check';

describe('StoryAnalyticsService Property Tests', () => {
  let service: StoryAnalyticsService;
  let supabaseMock: any;
  let authMock: any;

  beforeEach(() => {
    // Create mock Supabase client
    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null })),
            order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: [], error: null }))
          }),
          in: jasmine.createSpy('in').and.returnValue(Promise.resolve({ data: [], error: null })),
          order: jasmine.createSpy('order').and.returnValue(Promise.resolve({ data: [], error: null }))
        }),
        insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ data: null, error: null })),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null }))
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null }))
        })
      })
    };

    authMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' })
    };

    TestBed.configureTestingModule({
      providers: [
        StoryAnalyticsService,
        { provide: SupabaseService, useValue: { client: supabaseMock } },
        { provide: AuthService, useValue: authMock }
      ]
    });

    service = TestBed.inject(StoryAnalyticsService);
  });

  // Feature: story-feature, Property 27: Viewer list completeness
  describe('Property 27: Viewer list completeness', () => {
    it('for any story, the viewer list should contain all users who have viewed the story with accurate timestamps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            viewers: fc.array(
              fc.record({
                viewer_id: fc.uuid(),
                username: fc.string({ minLength: 3, maxLength: 20 }),
                display_name: fc.string({ minLength: 3, maxLength: 30 }),
                avatar: fc.webUrl(),
                viewed_at: fc.date().map(d => d.toISOString()),
                view_duration_seconds: fc.option(fc.integer({ min: 1, max: 300 })),
                completed: fc.boolean()
              }),
              { minLength: 1, maxLength: 50 }
            )
          }),
          async ({ storyId, viewers }) => {
            // Mock the database response
            const mockViews = viewers.map(v => ({
              viewer_id: v.viewer_id,
              viewed_at: v.viewed_at,
              view_duration_seconds: v.view_duration_seconds,
              completed: v.completed,
              viewer: {
                username: v.username,
                display_name: v.display_name,
                avatar: v.avatar
              }
            }));

            supabaseMock.from = jasmine.createSpy('from').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  order: jasmine.createSpy('order').and.returnValue(
                    Promise.resolve({ data: mockViews, error: null })
                  )
                })
              })
            });

            // Get viewer list
            const result = await service.getViewerList(storyId);

            // Verify all viewers are present
            expect(result.length).toBe(viewers.length);

            // Verify each viewer has accurate data
            result.forEach((viewer, index) => {
              const expected = viewers[index];
              expect(viewer.viewer_id).toBe(expected.viewer_id);
              expect(viewer.username).toBe(expected.username);
              expect(viewer.display_name).toBe(expected.display_name);
              expect(viewer.avatar).toBe(expected.avatar);
              expect(viewer.viewed_at).toBe(expected.viewed_at);
              expect(viewer.view_duration_seconds).toBe(expected.view_duration_seconds);
              expect(viewer.completed).toBe(expected.completed);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 28: Engagement metrics accuracy
  describe('Property 28: Engagement metrics accuracy', () => {
    it('for any story, the displayed reaction count, reply count, and interactive response count should match the actual number of records', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            reactionsCount: fc.integer({ min: 0, max: 100 }),
            repliesCount: fc.integer({ min: 0, max: 50 }),
            interactiveResponsesCount: fc.integer({ min: 0, max: 75 })
          }),
          async ({ storyId, reactionsCount, repliesCount, interactiveResponsesCount }) => {
            // Mock database responses for counts
            let callCount = 0;
            supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
              const counts = {
                'story_reactions': reactionsCount,
                'story_replies': repliesCount,
                'story_interactive_responses': interactiveResponsesCount
              };

              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({ count: counts[table as keyof typeof counts] || 0, error: null })
                  ),
                  in: jasmine.createSpy('in').and.returnValue(
                    Promise.resolve({ count: interactiveResponsesCount, error: null })
                  )
                })
              };
            });

            // For interactive responses, we need to mock the elements query first
            const originalFrom = supabaseMock.from;
            supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
              if (table === 'story_interactive_elements') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue(
                      Promise.resolve({ 
                        data: [{ id: 'element-1' }, { id: 'element-2' }], 
                        error: null 
                      })
                    )
                  })
                };
              }
              return originalFrom(table);
            });

            // Get counts
            const reactions = await service.getReactionsCount(storyId);
            const replies = await service.getRepliesCount(storyId);
            const responses = await service.getInteractiveResponsesCount(storyId);

            // Verify counts match
            expect(reactions).toBe(reactionsCount);
            expect(replies).toBe(repliesCount);
            expect(responses).toBe(interactiveResponsesCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 29: Completion rate calculation
  describe('Property 29: Completion rate calculation', () => {
    it('for any story, the completion rate should equal (viewers who watched to end / total viewers) * 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            views: fc.array(
              fc.record({
                completed: fc.boolean()
              }),
              { minLength: 1, maxLength: 100 }
            )
          }),
          async ({ storyId, views }) => {
            // Mock database response
            supabaseMock.from = jasmine.createSpy('from').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: views, error: null })
                )
              })
            });

            // Calculate expected completion rate
            const totalViewers = views.length;
            const completedViewers = views.filter(v => v.completed).length;
            const expectedRate = (completedViewers / totalViewers) * 100;

            // Get completion rate
            const actualRate = await service.calculateCompletionRate(storyId);

            // Verify calculation
            expect(actualRate).toBeCloseTo(expectedRate, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when there are no views', async () => {
      const storyId = 'test-story-id';

      supabaseMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ data: [], error: null })
          )
        })
      });

      const rate = await service.calculateCompletionRate(storyId);
      expect(rate).toBe(0);
    });
  });

  // Feature: story-feature, Property 30: Exit rate calculation
  describe('Property 30: Exit rate calculation', () => {
    it('for any story in a sequence, the exit rate should equal (viewers who exited at this story / viewers who reached this story) * 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            userId: fc.uuid(),
            viewersReached: fc.integer({ min: 1, max: 100 }),
            viewersContinued: fc.integer({ min: 0, max: 100 })
          }).filter(({ viewersReached, viewersContinued }) => viewersContinued <= viewersReached),
          async ({ storyId, userId, viewersReached, viewersContinued }) => {
            const nextStoryId = 'next-story-id';
            const createdAt = new Date().toISOString();

            // Mock story query
            let callIndex = 0;
            supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
              if (table === 'stories') {
                callIndex++;
                if (callIndex === 1) {
                  // First call: get current story
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      eq: jasmine.createSpy('eq').and.returnValue({
                        single: jasmine.createSpy('single').and.returnValue(
                          Promise.resolve({ 
                            data: { user_id: userId, created_at: createdAt }, 
                            error: null 
                          })
                        )
                      })
                    })
                  };
                } else if (callIndex === 2) {
                  // Second call: get user stories
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      eq: jasmine.createSpy('eq').and.callFake(() => ({
                        eq: jasmine.createSpy('eq').and.returnValue({
                          order: jasmine.createSpy('order').and.returnValue(
                            Promise.resolve({ 
                              data: [
                                { id: storyId, created_at: createdAt },
                                { id: nextStoryId, created_at: new Date(Date.now() + 1000).toISOString() }
                              ], 
                              error: null 
                            })
                          )
                        })
                      }))
                    })
                  };
                }
              } else if (table === 'story_views') {
                callIndex++;
                if (callIndex === 3) {
                  // Third call: views for current story
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      eq: jasmine.createSpy('eq').and.returnValue(
                        Promise.resolve({ count: viewersReached, error: null })
                      )
                    })
                  };
                } else if (callIndex === 4) {
                  // Fourth call: views for next story
                  return {
                    select: jasmine.createSpy('select').and.returnValue({
                      eq: jasmine.createSpy('eq').and.returnValue(
                        Promise.resolve({ count: viewersContinued, error: null })
                      )
                    })
                  };
                }
              }

              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              };
            });

            // Calculate expected exit rate
            const exitedViewers = viewersReached - viewersContinued;
            const expectedRate = (exitedViewers / viewersReached) * 100;

            // Get exit rate
            const actualRate = await service.calculateExitRate(storyId);

            // Verify calculation
            expect(actualRate).toBeCloseTo(expectedRate, 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: story-feature, Property 31: Click-through rate calculation
  describe('Property 31: Click-through rate calculation', () => {
    it('for any story with links, the CTR should equal (link clicks / total views) * 100%', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            totalViews: fc.integer({ min: 1, max: 1000 }),
            linkClicks: fc.integer({ min: 0, max: 1000 })
          }).filter(({ totalViews, linkClicks }) => linkClicks <= totalViews),
          async ({ storyId, totalViews, linkClicks }) => {
            let callIndex = 0;
            supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
              if (table === 'story_views') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue(
                      Promise.resolve({ count: totalViews, error: null })
                    )
                  })
                };
              } else if (table === 'story_interactive_elements') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    eq: jasmine.createSpy('eq').and.callFake(() => ({
                      eq: jasmine.createSpy('eq').and.returnValue(
                        Promise.resolve({ 
                          data: [{ id: 'link-1' }, { id: 'link-2' }], 
                          error: null 
                        })
                      )
                    }))
                  })
                };
              } else if (table === 'story_interactive_responses') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    in: jasmine.createSpy('in').and.returnValue(
                      Promise.resolve({ count: linkClicks, error: null })
                    )
                  })
                };
              }

              return {
                select: jasmine.createSpy('select').and.returnValue({
                  eq: jasmine.createSpy('eq').and.returnValue(
                    Promise.resolve({ data: null, error: null })
                  )
                })
              };
            });

            // Calculate expected CTR
            const expectedCTR = (linkClicks / totalViews) * 100;

            // Get CTR
            const actualCTR = await service.calculateClickThroughRate(storyId);

            // Verify calculation
            expect(actualCTR).toBeCloseTo(expectedCTR, 2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 0 when there are no views', async () => {
      const storyId = 'test-story-id';

      supabaseMock.from = jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ count: 0, error: null })
          )
        })
      });

      const ctr = await service.calculateClickThroughRate(storyId);
      expect(ctr).toBe(0);
    });

    it('should return 0 when there are no link elements', async () => {
      const storyId = 'test-story-id';

      let callIndex = 0;
      supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'story_views') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ count: 100, error: null })
              )
            })
          };
        } else if (table === 'story_interactive_elements') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.callFake(() => ({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: [], error: null })
                )
              }))
            })
          };
        }

        return {
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue(
              Promise.resolve({ data: null, error: null })
            )
          })
        };
      });

      const ctr = await service.calculateClickThroughRate(storyId);
      expect(ctr).toBe(0);
    });
  });

  // Feature: story-feature, Property 32: Analytics export completeness
  describe('Property 32: Analytics export completeness', () => {
    it('for any analytics export, the exported data should contain all metrics', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            storyId: fc.uuid(),
            userId: fc.uuid(),
            createdAt: fc.date().map(d => d.toISOString()),
            expiresAt: fc.date().map(d => d.toISOString()),
            viewsCount: fc.integer({ min: 0, max: 100 }),
            reactionsCount: fc.integer({ min: 0, max: 50 }),
            repliesCount: fc.integer({ min: 0, max: 30 }),
            interactiveResponsesCount: fc.integer({ min: 0, max: 40 }),
            completionRate: fc.float({ min: 0, max: 100 }),
            exitRate: fc.float({ min: 0, max: 100 }),
            clickThroughRate: fc.float({ min: 0, max: 100 })
          }),
          async ({ 
            storyId, 
            userId, 
            createdAt, 
            expiresAt, 
            viewsCount, 
            reactionsCount, 
            repliesCount, 
            interactiveResponsesCount,
            completionRate,
            exitRate,
            clickThroughRate
          }) => {
            // Mock auth to return the correct user
            authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

            // Mock story query
            supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
              if (table === 'stories') {
                return {
                  select: jasmine.createSpy('select').and.returnValue({
                    eq: jasmine.createSpy('eq').and.returnValue({
                      single: jasmine.createSpy('single').and.returnValue(
                        Promise.resolve({ 
                          data: { 
                            user_id: userId, 
                            created_at: createdAt, 
                            expires_at: expiresAt 
                          }, 
                          error: null 
                        })
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

            // Mock getStoryAnalytics
            spyOn(service, 'getStoryAnalytics').and.returnValue(Promise.resolve({
              story_id: storyId,
              views_count: viewsCount,
              reactions_count: reactionsCount,
              replies_count: repliesCount,
              interactive_responses_count: interactiveResponsesCount,
              completion_rate: completionRate,
              exit_rate: exitRate,
              click_through_rate: clickThroughRate,
              viewers: [],
              engagement_metrics: {
                total_views: viewsCount,
                total_reactions: reactionsCount,
                total_replies: repliesCount,
                total_interactive_responses: interactiveResponsesCount,
                unique_viewers: viewsCount,
                average_view_duration: 0
              }
            }));

            // Export analytics
            const exported = await service.exportAnalytics(storyId);

            // Verify all required fields are present
            expect(exported.story_id).toBe(storyId);
            expect(exported.created_at).toBe(createdAt);
            expect(exported.expires_at).toBe(expiresAt);
            expect(exported.views_count).toBe(viewsCount);
            expect(exported.reactions_count).toBe(reactionsCount);
            expect(exported.replies_count).toBe(repliesCount);
            expect(exported.interactive_responses_count).toBe(interactiveResponsesCount);
            expect(exported.completion_rate).toBe(completionRate);
            expect(exported.exit_rate).toBe(exitRate);
            expect(exported.click_through_rate).toBe(clickThroughRate);
            expect(exported.viewers).toBeDefined();
            expect(exported.engagement_metrics).toBeDefined();
            expect(exported.exported_at).toBeDefined();

            // Verify engagement metrics are present
            expect(exported.engagement_metrics.total_views).toBeDefined();
            expect(exported.engagement_metrics.total_reactions).toBeDefined();
            expect(exported.engagement_metrics.total_replies).toBeDefined();
            expect(exported.engagement_metrics.total_interactive_responses).toBeDefined();
            expect(exported.engagement_metrics.unique_viewers).toBeDefined();
            expect(exported.engagement_metrics.average_view_duration).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
