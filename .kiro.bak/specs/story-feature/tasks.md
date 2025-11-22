# Implementation Plan

- [x] 1. Set up database schema and RLS policies
  - Create all story-related tables (stories, story_views, story_reactions, story_replies, close_friends, story_custom_privacy, story_hidden_from, story_highlights, story_highlight_items, story_interactive_elements, story_interactive_responses, story_mentions, story_archive)
  - Add indexes for performance optimization
  - Create storage buckets (story-media, story-thumbnails)
  - Implement Row Level Security policies for all tables
  - Create storage bucket RLS policies
  - _Requirements: 1.9, 2.1-2.10, 12.3_

- [x] 1.1 Write property test for public story visibility
  - **Property 9: Public story visibility**
  - **Validates: Requirements 2.1**

- [x] 1.2 Write property test for followers-only visibility
  - **Property 10: Followers-only visibility**
  - **Validates: Requirements 2.2**

- [x] 1.3 Write property test for close friends visibility
  - **Property 11: Close friends visibility**
  - **Validates: Requirements 2.3**

- [x] 1.4 Write property test for custom privacy visibility
  - **Property 12: Custom privacy visibility**
  - **Validates: Requirements 2.4**

- [x] 2. Create database functions and triggers
  - Implement `can_view_story()` function for access control
  - Implement `get_user_story_feed()` function for feed generation
  - Implement `archive_expired_stories()` function for expiration handling
  - Create trigger for real-time story updates
  - Create trigger for automatic archival on expiration
  - _Requirements: 2.8, 3.1, 7.2, 7.3_

- [ ] 2.1 Write property test for privacy check ordering
  - **Property 16: Privacy check ordering**
  - **Validates: Requirements 2.8**

- [ ] 2.2 Write property test for story feed ordering
  - **Property 19: Story feed ordering**
  - **Validates: Requirements 3.1**

- [x] 3. Implement core StoryService
  - Create TypeScript interfaces (Story, StoryView, StoryReaction, StoryReply, etc.)
  - Create StoryModel class with helper methods
  - Implement StoryService with dependency injection
  - Add signal-based state management
  - _Requirements: 1.1-1.10, 3.11, 4.2, 4.3_

- [x] 3.1 Implement story creation with media upload
  - Implement file validation (type, size, dimensions)
  - Implement media compression and optimization
  - Implement storage upload with retry logic
  - Implement database record creation
  - Implement transaction rollback on failure
  - _Requirements: 1.1, 1.2, 1.9, 1.10_

- [x] 3.1.1 Write property test for file validation


  - **Property 1: File validation rejects invalid uploads**
  - **Validates: Requirements 1.1**

- [x] 3.1.2 Write property test for media compression


  - **Property 2: Media compression maintains quality threshold**
  - **Validates: Requirements 1.2**

- [x] 3.1.3 Write property test for story creation atomicity

  - **Property 7: Story creation atomicity**
  - **Validates: Requirements 1.9**

- [x] 3.1.4 Write property test for failed creation rollback

  - **Property 8: Failed creation rollback**
  - **Validates: Requirements 1.10**

- [x] 3.2 Implement story viewing and view tracking


  - Implement `viewStory()` method to record views
  - Implement view count increment
  - Implement duplicate view prevention
  - Implement view duration tracking
  - _Requirements: 3.11_

- [x] 3.2.1 Write property test for view recording completeness

  - **Property 20: View recording completeness**
  - **Validates: Requirements 3.11**

- [x] 3.2.2 Write property test for view count accuracy


  - **Property 26: View count accuracy**
  - **Validates: Requirements 5.1**

- [x] 3.3 Implement story privacy and visibility


  - Implement privacy setting validation
  - Implement `canViewStory()` method using database function
  - Implement close friends list management
  - Implement custom privacy list management
  - Implement hide list management
  - _Requirements: 2.1-2.10_

- [x] 3.3.1 Write property test for block list enforcement


  - **Property 14: Block list enforcement**
  - **Validates: Requirements 2.6**

- [x] 3.3.2 Write property test for hide list override

  - **Property 15: Hide list override**
  - **Validates: Requirements 2.7**

- [x] 3.3.3 Write property test for most restrictive privacy wins

  - **Property 18: Most restrictive privacy wins**
  - **Validates: Requirements 2.10**

- [x] 3.4 Implement story feed fetching


  - Implement `fetchStories()` method using database function
  - Implement feed caching strategy
  - Implement unviewed story detection
  - Implement story grouping by user
  - _Requirements: 3.1_

- [x] 3.4.1 Write property test for unfollow removes from feed


  - **Property 17: Unfollow removes from feed**
  - **Validates: Requirements 2.9**

- [x] 4. Implement story reactions and replies



  - Create StoryReactionService
  - Implement `addReaction()` method
  - Implement `removeReaction()` method
  - Implement `getReactions()` method
  - Create StoryReplyService
  - Implement `sendReply()` method
  - Implement `getReply()` method
  - _Requirements: 4.2, 4.3_

- [x] 4.1 Write property test for reaction recording and counting


  - **Property 21: Reaction recording and counting**
  - **Validates: Requirements 4.2**

- [x] 4.2 Write property test for reply creates message thread


  - **Property 22: Reply creates message thread**
  - **Validates: Requirements 4.3**

- [x] 5. Implement interactive elements
  - Create InteractiveElementService
  - Implement poll creation and validation
  - Implement question creation and validation
  - Implement countdown creation and validation
  - Implement link creation and validation
  - Implement response recording
  - Implement response aggregation
  - _Requirements: 1.5, 4.8, 4.9, 4.10_

- [x] 5.1 Write property test for interactive element validation
  - **Property 3: Interactive element validation**
  - **Validates: Requirements 1.5**

- [x] 5.2 Write property test for interactive response recording
  - **Property 23: Interactive response recording and aggregation**
  - **Validates: Requirements 4.8**

- [x] 5.3 Write property test for poll percentage calculation
  - **Property 24: Poll percentage calculation**
  - **Validates: Requirements 4.9**

- [x] 5.4 Write property test for question responses completeness
  - **Property 25: Question responses completeness**
  - **Validates: Requirements 4.10**

- [x] 6. Implement story mentions and hashtags
  - Create MentionHashtagService
  - Implement mention validation
  - Implement mention storage
  - Implement mention notifications
  - Implement hashtag parsing
  - Implement hashtag indexing
  - _Requirements: 1.6, 1.8_

- [x] 6.1 Write property test for mention validation
  - **Property 4: Mention validation requires existing users**
  - **Validates: Requirements 1.6**

- [x] 6.2 Write property test for hashtag parsing and indexing
  - **Property 6: Hashtag parsing and indexing**
  - **Validates: Requirements 1.8**

- [x] 7. Implement story location tagging




  - Create LocationService
  - Implement location metadata storage
  - Implement location search
  - _Requirements: 1.7, 9.3_

- [x] 7.1 Write property test for location metadata round-trip


  - **Property 5: Location metadata round-trip**
  - **Validates: Requirements 1.7**

- [x] 7.2 Write property test for location search completeness


  - **Property 53: Location search completeness**
  - **Validates: Requirements 9.3**

- [x] 8. Implement story analytics




  - Create StoryAnalyticsService
  - Implement view analytics (count, list, timestamps)
  - Implement engagement metrics (reactions, replies, responses)
  - Implement completion rate calculation
  - Implement exit rate calculation
  - Implement click-through rate calculation
  - Implement analytics export
  - _Requirements: 5.1-5.6, 5.9_

- [x] 8.1 Write property test for viewer list completeness


  - **Property 27: Viewer list completeness**
  - **Validates: Requirements 5.2**

- [x] 8.2 Write property test for engagement metrics accuracy

  - **Property 28: Engagement metrics accuracy**
  - **Validates: Requirements 5.3**

- [x] 8.3 Write property test for completion rate calculation

  - **Property 29: Completion rate calculation**
  - **Validates: Requirements 5.4**

- [x] 8.4 Write property test for exit rate calculation

  - **Property 30: Exit rate calculation**
  - **Validates: Requirements 5.5**

- [x] 8.5 Write property test for click-through rate calculation

  - **Property 31: Click-through rate calculation**
  - **Validates: Requirements 5.6**

- [x] 8.6 Write property test for analytics export completeness


  - **Property 32: Analytics export completeness**
  - **Validates: Requirements 5.9**


- [x] 9. Implement story editing and management




  - Implement `updateStory()` method for text edits
  - Implement `updatePrivacy()` method
  - Implement `deleteStory()` method with archival
  - Implement edit validation (ownership, expiration)
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9.1 Write property test for text edit preserves media and history


  - **Property 33: Text edit preserves media and history**
  - **Validates: Requirements 6.1**

- [x] 9.2 Write property test for interactive element edit preserves responses

  - **Property 34: Interactive element edit preserves responses**
  - **Validates: Requirements 6.2**

- [x] 9.3 Write property test for privacy change immediacy

  - **Property 35: Privacy change immediacy**
  - **Validates: Requirements 6.3**

- [x] 9.4 Write property test for story deletion workflow

  - **Property 36: Story deletion workflow**
  - **Validates: Requirements 6.4**

- [x] 10. Implement story highlights




  - Create HighlightService
  - Implement highlight collection creation
  - Implement story addition to highlights
  - Implement story removal from highlights
  - Implement highlight reordering
  - Implement highlight metadata editing
  - _Requirements: 6.6, 6.7, 6.8, 6.9, 6.10_

- [x] 10.1 Write property test for highlight creation duplicates story


  - **Property 38: Highlight creation duplicates story**
  - **Validates: Requirements 6.6**

- [x] 10.2 Write property test for highlight removal preserves archive


  - **Property 39: Highlight removal preserves archive**
  - **Validates: Requirements 6.7**

- [x] 10.3 Write property test for highlight reordering


  - **Property 40: Highlight reordering updates display order**
  - **Validates: Requirements 6.8**

- [x] 10.4 Write property test for highlight collection creation


  - **Property 41: Highlight collection creation with metadata**
  - **Validates: Requirements 6.9**

- [x] 10.5 Write property test for highlight metadata edit


  - **Property 42: Highlight metadata edit preserves stories**
  - **Validates: Requirements 6.10**

- [x] 11. Implement story archival and expiration
  - Create ArchiveService
  - Implement archive viewing
  - Implement archive download
  - Implement archive deletion
  - Implement story restoration from archive
  - Implement expiration timestamp calculation
  - Implement custom duration validation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_

- [x] 11.1 Write property test for expiration timestamp calculation

  - **Property 43: Expiration timestamp calculation**
  - **Validates: Requirements 7.1**

- [x] 11.2 Write property test for expired story marking

  - **Property 44: Expired story marking**
  - **Validates: Requirements 7.2**

- [x] 11.3 Write property test for expiration triggers archival

  - **Property 45: Expiration triggers archival**
  - **Validates: Requirements 7.3**

- [x] 11.4 Write property test for archive ordering

  - **Property 46: Archive ordering by date**
  - **Validates: Requirements 7.4**

- [x] 11.5 Write property test for archive download includes metadata

  - **Property 47: Archive download includes metadata**
  - **Validates: Requirements 7.5**

- [x] 11.6 Write property test for permanent deletion

  - **Property 48: Permanent deletion removes all data**
  - **Validates: Requirements 7.6**

- [x] 11.7 Write property test for custom duration validation

  - **Property 49: Custom duration validation**
  - **Validates: Requirements 7.8**

- [x] 11.8 Write property test for archive restoration conditions

  - **Property 37: Archive restoration conditions**
  - **Validates: Requirements 6.5**

- [x] 12. Implement story discovery and search



  - Create DiscoveryService
  - Implement explore feed (unfollowed users)
  - Implement hashtag search
  - Implement location search
  - Implement content type filtering
  - Implement discovery opt-out
  - Implement privacy-aware search
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7, 9.8, 9.10_

- [x] 12.1 Write property test for explore shows unfollowed users

  - **Property 51: Explore shows unfollowed users only**
  - **Validates: Requirements 9.1**

- [x] 12.2 Write property test for hashtag search completeness

  - **Property 52: Hashtag search completeness**
  - **Validates: Requirements 9.2**

- [x] 12.3 Write property test for content type filtering

  - **Property 54: Content type filtering**
  - **Validates: Requirements 9.4**

- [x] 12.4 Write property test for explore view recording

  - **Property 55: Explore view recording**
  - **Validates: Requirements 9.6**

- [x] 12.5 Write property test for follow adds to feed

  - **Property 56: Follow adds to feed**
  - **Validates: Requirements 9.7**

- [x] 12.6 Write property test for discovery opt-out exclusion

  - **Property 57: Discovery opt-out exclusion**
  - **Validates: Requirements 9.8**

- [x] 12.7 Write property test for search respects privacy

  - **Property 58: Search respects privacy**
  - **Validates: Requirements 9.10**

- [x] 13. Implement real-time subscriptions





  - Set up Realtime channel configuration
  - Implement story creation broadcasts
  - Implement story update broadcasts
  - Implement view count updates
  - Implement reaction notifications
  - Implement reply notifications
  - Implement connection management and reconnection
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

-

- [x] 14. Implement storage quota management


  - Create QuotaService
  - Implement storage usage tracking
  - Implement quota enforcement
  - Implement quota notifications
  - _Requirements: 7.10_

- [x] 14.1 Write property test for storage quota enforcement

  - **Property 50: Storage quota enforcement**
  - **Validates: Requirements 7.10**

- [x] 15. Create story creation UI component


  - Create StoryCreatorComponent
  - Implement media upload UI with drag-and-drop
  - Implement text overlay editor
  - Implement filter and effect selector
  - Implement interactive element tools (poll, question, countdown, link)
  - Implement mention picker
  - Implement location picker
  - Implement privacy settings selector
  - Implement preview mode
  - _Requirements: 1.1-1.8_

- [x] 16. Create story viewing UI component





  - Create StoryViewerComponent
  - Implement full-screen story display
  - Implement progress indicators
  - Implement navigation (tap left/right, swipe)
  - Implement pause on hold
  - Implement auto-advance on completion
  - Implement interactive element rendering
  - Implement reaction picker
  - Implement reply input
  - _Requirements: 3.2-3.12_

- [x] 17. Create story rail UI component



  - Update StoryRailComponent
  - Implement story grouping by user
  - Implement unviewed indicator
  - Implement "Create Story" button
  - Implement horizontal scrolling
  - Implement story preview on hover
  - _Requirements: 3.1_

- [x] 18. Create story insights UI component



  - Create StoryInsightsComponent
  - Implement view list display
  - Implement engagement metrics display
  - Implement completion/exit rate charts
  - Implement analytics export button
  - _Requirements: 5.1-5.9_

- [x] 19. Create story highlights UI component






  - Create HighlightsComponent
  - Implement highlight collection display
  - Implement highlight creation dialog
  - Implement story selection for highlights
  - Implement highlight editing
  - Implement highlight reordering
  - _Requirements: 6.6-6.10_

- [x] 20. Create story archive UI component






  - Create ArchiveComponent
  - Implement archive grid display
  - Implement date-based organization
  - Implement archive download
  - Implement archive deletion
  - Implement story restoration
  - _Requirements: 7.3-7.6_

- [x] 21. Create story discovery UI component




  - Create ExploreStoriesComponent
  - Implement explore feed display
  - Implement search interface (hashtag, location)
  - Implement content type filters
  - Implement discovery opt-out toggle in settings
  - _Requirements: 9.1-9.10_

- [x] 22. Implement error handling and user feedback





  - Create error handling service
  - Implement retry logic for failed uploads
  - Implement graceful degradation
  - Implement user-friendly error messages
  - Implement loading states
  - Implement success confirmations
  - _Requirements: 1.10, 14.1-14.10_

- [x] 23. Implement performance optimizations





  - Implement media compression pipeline
  - Implement thumbnail generation
  - Implement lazy loading for story feed
  - Implement image preloading for next stories
  - Implement client-side caching
  - Implement debouncing for real-time updates
  - _Requirements: 11.1-11.10_

- [x] 24. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Add accessibility features
  - Implement keyboard navigation
  - Add ARIA labels and roles
  - Implement screen reader announcements
  - Ensure color contrast compliance
  - Add alt text support for stories
  - _Requirements: 13.1-13.6_

- [x] 26. Add internationalization support
  - Set up i18n framework
  - Extract all UI strings
  - Implement locale-based formatting (dates, numbers)
  - Support RTL languages
  - _Requirements: 13.7-13.10_

- [x] 27. Set up monitoring and logging
  - Integrate error tracking (Sentry)
  - Implement performance monitoring
  - Set up storage usage alerts
  - Implement real-time connection monitoring
  - _Requirements: 11.10_

- [x] 28. Create database migration scripts
  - Create initial schema migration
  - Create RLS policies migration
  - Create functions and triggers migration
  - Create indexes migration
  - Document migration process
  - _Requirements: All database-related requirements_

- [x] 29. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Storage Setup Required

To fix the "bucket not found" error, run the SQL in `setup-storage.sql` in your Supabase SQL Editor:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy and paste contents of setup-storage.sql
# 5. Run the query

# Option 2: Via Supabase CLI (if linked)
supabase db execute -f setup-storage.sql
```

This creates:
- `story-media` bucket (public read, authenticated upload)
- `story-thumbnails` bucket (public read, authenticated upload)
- RLS policies for both buckets
