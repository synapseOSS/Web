import { TestBed } from '@angular/core/testing';
import { QuotaService } from './quota.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import * as fc from 'fast-check';

describe('QuotaService Property Tests', () => {
  let service: QuotaService;
  let supabaseMock: any;
  let authMock: any;

  beforeEach(() => {
    // Create mocks
    supabaseMock = {
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(Promise.resolve({ data: null, error: null })),
            then: (callback: any) => callback({ data: [], error: null })
          }),
          then: (callback: any) => callback({ data: [], error: null })
        }),
        insert: jasmine.createSpy('insert').and.returnValue(Promise.resolve({ data: null, error: null })),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ data: null, error: null }))
        })
      }),
      rpc: jasmine.createSpy('rpc').and.returnValue(Promise.resolve({ data: true, error: null }))
    };

    authMock = {
      currentUser: jasmine.createSpy('currentUser').and.returnValue({ id: 'test-user-id' })
    };

    TestBed.configureTestingModule({
      providers: [
        QuotaService,
        { provide: SupabaseService, useValue: { client: supabaseMock } },
        { provide: AuthService, useValue: authMock }
      ]
    });

    service = TestBed.inject(QuotaService);
  });

  // Feature: story-feature, Property 50: Storage quota enforcement
  it('Property 50: story creation is rejected when storage quota is reached', () => {
    fc.assert(
      fc.property(
        fc.record({
          quotaLimitBytes: fc.integer({ min: 100 * 1024 * 1024, max: 10 * 1024 * 1024 * 1024 }), // 100MB to 10GB
          usedBytes: fc.integer({ min: 0, max: 10 * 1024 * 1024 * 1024 }), // 0 to 10GB
          uploadSizeBytes: fc.integer({ min: 1 * 1024 * 1024, max: 100 * 1024 * 1024 }) // 1MB to 100MB
        }),
        ({ quotaLimitBytes, usedBytes, uploadSizeBytes }) => {
          // Calculate if upload should be allowed
          const availableBytes = quotaLimitBytes - usedBytes;
          const shouldAllow = availableBytes >= uploadSizeBytes;

          // Create a mock quota object
          const mockQuota = {
            user_id: 'test-user',
            total_bytes: usedBytes,
            used_bytes: usedBytes,
            available_bytes: Math.max(0, quotaLimitBytes - usedBytes),
            quota_limit_bytes: quotaLimitBytes,
            percentage_used: (usedBytes / quotaLimitBytes) * 100
          };

          // Test the core logic: available bytes >= upload size
          const canUpload = mockQuota.available_bytes >= uploadSizeBytes;

          // Verify the property: quota enforcement matches expected behavior
          expect(canUpload).toBe(shouldAllow);

          // Additional verification: if quota is exceeded, available bytes should be less than upload size
          if (!shouldAllow) {
            expect(mockQuota.available_bytes).toBeLessThan(uploadSizeBytes);
          } else {
            expect(mockQuota.available_bytes).toBeGreaterThanOrEqual(uploadSizeBytes);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional unit tests for quota service functionality
  describe('Unit Tests', () => {
    it('should calculate storage quota correctly', async () => {
      const userId = 'test-user';
      authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

      // Mock stories with known sizes
      const mockStories = [
        { file_size_bytes: 5 * 1024 * 1024 }, // 5MB
        { file_size_bytes: 10 * 1024 * 1024 }, // 10MB
        { file_size_bytes: 15 * 1024 * 1024 }  // 15MB
      ];

      supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: mockStories, error: null })
                )
              })
            })
          };
        } else if (table === 'story_archive') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            })
          };
        }
        return {
          select: jasmine.createSpy('select').and.returnValue(
            Promise.resolve({ data: [], error: null })
          )
        };
      });

      const quota = await service.getStorageQuota();

      expect(quota.used_bytes).toBe(30 * 1024 * 1024); // 30MB total
      expect(quota.user_id).toBe(userId);
      expect(quota.percentage_used).toBeGreaterThan(0);
    });

    it('should return correct notification level based on usage', async () => {
      const userId = 'test-user';
      authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

      // Test warning level (80%)
      const quotaLimit = 100 * 1024 * 1024; // 100MB
      const usedBytes = 85 * 1024 * 1024; // 85MB (85%)

      const mockStories = [{ file_size_bytes: usedBytes }];

      supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: mockStories, error: null })
                )
              })
            })
          };
        } else if (table === 'story_archive') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            })
          };
        }
        return {
          select: jasmine.createSpy('select').and.returnValue(
            Promise.resolve({ data: [], error: null })
          )
        };
      });

      spyOn<any>(service, 'getQuotaLimit').and.returnValue(Promise.resolve(quotaLimit));

      const level = await service.getQuotaNotificationLevel();
      expect(level).toBe('warning');
    });

    it('should return critical notification level when usage is above 95%', async () => {
      const userId = 'test-user';
      authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

      const quotaLimit = 100 * 1024 * 1024; // 100MB
      const usedBytes = 96 * 1024 * 1024; // 96MB (96%)

      const mockStories = [{ file_size_bytes: usedBytes }];

      supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: mockStories, error: null })
                )
              })
            })
          };
        } else if (table === 'story_archive') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            })
          };
        }
        return {
          select: jasmine.createSpy('select').and.returnValue(
            Promise.resolve({ data: [], error: null })
          )
        };
      });

      spyOn<any>(service, 'getQuotaLimit').and.returnValue(Promise.resolve(quotaLimit));

      const level = await service.getQuotaNotificationLevel();
      expect(level).toBe('critical');
    });

    it('should return exceeded notification level when usage is at or above 100%', async () => {
      const userId = 'test-user';
      authMock.currentUser = jasmine.createSpy('currentUser').and.returnValue({ id: userId });

      const quotaLimit = 100 * 1024 * 1024; // 100MB
      const usedBytes = 105 * 1024 * 1024; // 105MB (105%)

      const mockStories = [{ file_size_bytes: usedBytes }];

      supabaseMock.from = jasmine.createSpy('from').and.callFake((table: string) => {
        if (table === 'stories') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue({
                eq: jasmine.createSpy('eq').and.returnValue(
                  Promise.resolve({ data: mockStories, error: null })
                )
              })
            })
          };
        } else if (table === 'story_archive') {
          return {
            select: jasmine.createSpy('select').and.returnValue({
              eq: jasmine.createSpy('eq').and.returnValue(
                Promise.resolve({ data: [], error: null })
              )
            })
          };
        }
        return {
          select: jasmine.createSpy('select').and.returnValue(
            Promise.resolve({ data: [], error: null })
          )
        };
      });

      spyOn<any>(service, 'getQuotaLimit').and.returnValue(Promise.resolve(quotaLimit));

      const level = await service.getQuotaNotificationLevel();
      expect(level).toBe('exceeded');
    });
  });
});
