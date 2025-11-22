import { TestBed } from '@angular/core/testing';
import { LocationService, LocationMetadata } from './location.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import * as fc from 'fast-check';

describe('LocationService Property Tests', () => {
  let service: LocationService;
  let supabaseMock: any;
  let authMock: any;

  // Arbitrary for generating valid location metadata
  const locationMetadataArbitrary = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    address: fc.option(fc.string({ maxLength: 200 })),
    city: fc.option(fc.string({ maxLength: 100 })),
    country: fc.option(fc.string({ maxLength: 100 })),
    place_id: fc.option(fc.string({ maxLength: 100 }))
  });

  beforeEach(() => {
    // In-memory storage for testing
    const storage: any = {};
    
    // Create mocks
    supabaseMock = {
      from: jasmine.createSpy('from').and.callFake((table: string) => ({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.callFake((field: string, value: any) => ({
            eq: jasmine.createSpy('eq').and.returnValue({
              single: jasmine.createSpy('single').and.callFake(() => {
                const stored = storage[value];
                return Promise.resolve({ 
                  data: stored || null, 
                  error: stored ? null : { code: 'PGRST116' }
                });
              })
            }),
            ilike: jasmine.createSpy('ilike').and.returnValue(Promise.resolve({ data: [], error: null }))
          }))
        }),
        insert: jasmine.createSpy('insert').and.callFake((data: any) => ({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.callFake(() => {
              const id = 'test-id-' + Math.random();
              storage[data.story_id] = {
                id,
                story_id: data.story_id,
                element_type: data.element_type,
                element_data: data.element_data,
                created_at: new Date().toISOString()
              };
              return Promise.resolve({ data: storage[data.story_id], error: null });
            })
          })
        })),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null }))
            })
          })
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        })
      })),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: true, error: null }))
    };

    authMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' })
    };

    TestBed.configureTestingModule({
      providers: [
        LocationService,
        { provide: SupabaseService, useValue: { client: supabaseMock } },
        { provide: AuthService, useValue: authMock }
      ]
    });

    service = TestBed.inject(LocationService);
  });

  // Feature: story-feature, Property 5: Location metadata round-trip
  it('Property 5: storing and retrieving location preserves all data fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          location: locationMetadataArbitrary
        }),
        async ({ storyId, location }) => {
          // Mock the insert to return the stored data
          const storedData = {
            id: fc.sample(fc.uuid(), 1)[0],
            story_id: storyId,
            element_type: 'location',
            element_data: {
              name: location.name,
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address || undefined,
              city: location.city || undefined,
              country: location.country || undefined,
              place_id: location.place_id || undefined
            },
            created_at: new Date().toISOString()
          };

          supabaseMock.from = jasmine.createSpy('from').and.returnValue({
            insert: jasmine.createSpy('insert').and.returnValue({
              select: jasmine.createSpy('select').and.returnValue({
                single: jasmine.createSpy('single').and.returnValue(
                  Promise.resolve({ data: storedData, error: null })
                )
              })
            }),
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue({
                  single: jasmine.createSpy('single').and.returnValue(
                    Promise.resolve({ data: storedData, error: null })
                  )
                })
              })
            })
          });

          // Store location metadata
          const stored = await service.storeLocationMetadata(storyId, location);

          // Retrieve location metadata
          const retrieved = await service.getLocationMetadata(storyId);

          // Verify all fields are preserved
          expect(retrieved).not.toBeNull();
          if (retrieved) {
            expect(retrieved.name).toBe(location.name);
            expect(retrieved.latitude).toBe(location.latitude);
            expect(retrieved.longitude).toBe(location.longitude);
            
            // Optional fields should match (undefined or the value)
            if (location.address !== null) {
              expect(retrieved.address).toBe(location.address || undefined);
            }
            if (location.city !== null) {
              expect(retrieved.city).toBe(location.city || undefined);
            }
            if (location.country !== null) {
              expect(retrieved.country).toBe(location.country || undefined);
            }
            if (location.place_id !== null) {
              expect(retrieved.place_id).toBe(location.place_id || undefined);
            }
            
            expect(retrieved.story_id).toBe(storyId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 53: Location search completeness
  it('Property 53: location search returns all public stories with matching location', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locationQuery: fc.string({ minLength: 1, maxLength: 50 }),
          stories: fc.array(
            fc.record({
              storyId: fc.uuid(),
              userId: fc.uuid(),
              locationName: fc.string({ minLength: 1, maxLength: 100 }),
              isPublic: fc.boolean(),
              isActive: fc.boolean(),
              isExpired: fc.boolean()
            }),
            { minLength: 0, maxLength: 20 }
          )
        }),
        async ({ locationQuery, stories }) => {
          // Filter stories that should appear in search results
          const expectedResults = stories.filter(story => {
            const matchesQuery = story.locationName.toLowerCase().includes(locationQuery.toLowerCase());
            const isPublic = story.isPublic;
            const isActive = story.isActive;
            const notExpired = !story.isExpired;
            
            return matchesQuery && isPublic && isActive && notExpired;
          });

          // Mock the database response
          const mockData = stories.map(story => ({
            id: fc.sample(fc.uuid(), 1)[0],
            story_id: story.storyId,
            element_data: {
              name: story.locationName,
              latitude: fc.sample(fc.double({ min: -90, max: 90 }), 1)[0],
              longitude: fc.sample(fc.double({ min: -180, max: 180 }), 1)[0]
            },
            created_at: new Date().toISOString(),
            stories: {
              id: story.storyId,
              user_id: story.userId,
              media_url: 'https://example.com/media.jpg',
              media_type: 'image',
              content: 'Test story',
              created_at: new Date().toISOString(),
              is_active: story.isActive,
              expires_at: story.isExpired 
                ? new Date(Date.now() - 1000).toISOString() 
                : new Date(Date.now() + 86400000).toISOString(),
              privacy_setting: story.isPublic ? 'public' : 'followers'
            }
          }));

          supabaseMock.from = jasmine.createSpy('from').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                ilike: jasmine.createSpy('ilike').and.returnValue(
                  Promise.resolve({ data: mockData, error: null })
                )
              })
            })
          });

          // Mock can_view_story to return true for public stories
          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake((funcName: string, params: any) => {
            if (funcName === 'can_view_story') {
              const story = stories.find(s => s.storyId === params.story_uuid);
              return Promise.resolve({ 
                data: story ? (story.isPublic && story.isActive && !story.isExpired) : false, 
                error: null 
              });
            }
            return Promise.resolve({ data: true, error: null });
          });

          // Perform search
          const results = await service.searchByLocation(locationQuery);

          // Verify that all expected results are present
          // The number of results should match expected results
          expect(results.length).toBe(expectedResults.length);

          // Verify each expected story is in the results
          for (const expected of expectedResults) {
            const found = results.some(r => r.story_id === expected.storyId);
            expect(found).toBe(true, `Story ${expected.storyId} should be in results`);
          }

          // Verify no unexpected stories are in results
          for (const result of results) {
            const shouldBeIncluded = expectedResults.some(e => e.storyId === result.story_id);
            expect(shouldBeIncluded).toBe(true, `Story ${result.story_id} should not be in results`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional test: Validate location metadata constraints
  it('should reject invalid location metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          invalidLocation: fc.oneof(
            // Invalid latitude
            fc.record({
              name: fc.string({ minLength: 1 }),
              latitude: fc.oneof(fc.constant(-91), fc.constant(91), fc.constant(NaN)),
              longitude: fc.double({ min: -180, max: 180 })
            }),
            // Invalid longitude
            fc.record({
              name: fc.string({ minLength: 1 }),
              latitude: fc.double({ min: -90, max: 90 }),
              longitude: fc.oneof(fc.constant(-181), fc.constant(181), fc.constant(NaN))
            }),
            // Empty name
            fc.record({
              name: fc.constant(''),
              latitude: fc.double({ min: -90, max: 90 }),
              longitude: fc.double({ min: -180, max: 180 })
            })
          )
        }),
        async ({ storyId, invalidLocation }) => {
          // Attempt to store invalid location should throw
          try {
            await service.storeLocationMetadata(storyId, invalidLocation as LocationMetadata);
            // If we get here, the test should fail
            expect(true).toBe(false, 'Should have thrown an error for invalid location');
          } catch (error: any) {
            // Verify that an appropriate error was thrown
            expect(error).toBeDefined();
            expect(error.message).toBeDefined();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // Test: Location search respects privacy settings
  it('should only return public stories in location search', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          locationQuery: fc.string({ minLength: 1, maxLength: 50 }),
          publicStories: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
          privateStories: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 })
        }),
        async ({ locationQuery, publicStories, privateStories }) => {
          const allStories = [
            ...publicStories.map(id => ({
              id,
              privacy: 'public',
              isActive: true,
              isExpired: false
            })),
            ...privateStories.map(id => ({
              id,
              privacy: 'followers',
              isActive: true,
              isExpired: false
            }))
          ];

          const mockData = allStories.map(story => ({
            id: fc.sample(fc.uuid(), 1)[0],
            story_id: story.id,
            element_data: {
              name: locationQuery,
              latitude: 0,
              longitude: 0
            },
            created_at: new Date().toISOString(),
            stories: {
              id: story.id,
              user_id: fc.sample(fc.uuid(), 1)[0],
              media_url: 'https://example.com/media.jpg',
              media_type: 'image',
              content: 'Test',
              created_at: new Date().toISOString(),
              is_active: story.isActive,
              expires_at: new Date(Date.now() + 86400000).toISOString(),
              privacy_setting: story.privacy
            }
          }));

          supabaseMock.from = jasmine.createSpy('from').and.returnValue({
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                ilike: jasmine.createSpy('ilike').and.returnValue(
                  Promise.resolve({ data: mockData, error: null })
                )
              })
            })
          });

          supabaseMock.rpc = jasmine.createSpy('rpc').and.callFake((funcName: string, params: any) => {
            if (funcName === 'can_view_story') {
              const story = allStories.find(s => s.id === params.story_uuid);
              return Promise.resolve({ 
                data: story ? story.privacy === 'public' : false, 
                error: null 
              });
            }
            return Promise.resolve({ data: true, error: null });
          });

          const results = await service.searchByLocation(locationQuery);

          // All results should be from public stories only
          for (const result of results) {
            expect(publicStories.includes(result.story_id)).toBe(true);
            expect(privateStories.includes(result.story_id)).toBe(false);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
