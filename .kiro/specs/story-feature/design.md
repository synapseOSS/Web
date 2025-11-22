# Design Document

## Overview

This design document outlines the architecture and implementation strategy for a production-ready story feature integrated with Supabase. The system enables users to create, share, and interact with ephemeral media content (images and videos) that automatically expires after a configurable duration (default 24 hours). The design emphasizes scalability, security, real-time updates, and comprehensive privacy controls similar to Instagram Stories, Facebook Stories, and X (Twitter) Fleets.

The implementation leverages Supabase's core features:
- **PostgreSQL database** with Row Level Security (RLS) for data storage and access control
- **Supabase Storage** for media file management with CDN delivery
- **Realtime subscriptions** for live updates and notifications
- **Edge Functions** for serverless processing (media optimization, content moderation)
- **Authentication** for user identity and JWT-based authorization

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Angular Client │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─── HTTP/WebSocket ───┐
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│  Supabase API   │    │  Realtime Server │
│   (PostgREST)   │    │   (WebSocket)    │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         ├──────────────────────┤
         │                      │
         ▼                      ▼
┌──────────────────────────────────┐
│      PostgreSQL Database         │
│  ┌────────────────────────────┐  │
│  │  Tables:                   │  │
│  │  - stories                 │  │
│  │  - story_views             │  │
│  │  - story_reactions         │  │
│  │  - story_replies           │  │
│  │  - story_highlights        │  │
│  │  - story_privacy_settings  │  │
│  │  - close_friends           │  │
│  │  - story_interactive_elements│ │
│  │  - story_mentions          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│      Supabase Storage            │
│  ┌────────────────────────────┐  │
│  │  Buckets:                  │  │
│  │  - story-media (private)   │  │
│  │  - story-thumbnails (CDN)  │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│      Edge Functions              │
│  - media-processor               │
│  - content-moderator             │
│  - story-expiration-worker       │
└──────────────────────────────────┘
```

### Data Flow

1. **Story Creation Flow**:
   - User uploads media → Frontend validates → Compress/optimize → Upload to Storage
   - Create database record with metadata → Apply privacy settings → Trigger real-time notification
   - Process media asynchronously (thumbnails, transcoding) → Update record

2. **Story Viewing Flow**:
   - User requests stories → Check RLS policies → Fetch visible stories
   - User opens story → Record view → Increment counter → Real-time update to creator
   - Preload next stories → Cache media URLs

3. **Real-time Update Flow**:
   - Database change occurs → Trigger fires → Realtime broadcast
   - Connected clients receive update → Update local state → Re-render UI

## Components and Interfaces

### 1. Database Schema

#### stories table
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 24,
  content TEXT, -- Optional text overlay
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  views_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_setting VARCHAR(20) NOT NULL DEFAULT 'followers' 
    CHECK (privacy_setting IN ('public', 'followers', 'close_friends', 'custom')),
  
  -- Media metadata
  media_width INTEGER,
  media_height INTEGER,
  media_duration_seconds INTEGER, -- For videos
  file_size_bytes BIGINT,
  
  -- Engagement metrics
  reactions_count INTEGER NOT NULL DEFAULT 0,
  replies_count INTEGER NOT NULL DEFAULT 0,
  
  -- Moderation
  is_reported BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at) WHERE is_active = TRUE;
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_privacy ON stories(privacy_setting);
```

#### story_views table
```sql
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_duration_seconds INTEGER, -- How long they watched
  completed BOOLEAN DEFAULT FALSE, -- Did they watch to the end
  
  UNIQUE(story_id, viewer_id)
);

CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_story_views_viewed_at ON story_views(viewed_at DESC);
```

#### story_reactions table
```sql
CREATE TABLE story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- emoji or reaction name
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(story_id, user_id)
);

CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX idx_story_reactions_user_id ON story_reactions(user_id);
```

#### story_replies table
```sql
CREATE TABLE story_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_story_replies_story_id ON story_replies(story_id);
CREATE INDEX idx_story_replies_sender_id ON story_replies(sender_id);
```

#### close_friends table
```sql
CREATE TABLE close_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_close_friends_user_id ON close_friends(user_id);
CREATE INDEX idx_close_friends_friend_id ON close_friends(friend_id);
```

#### story_custom_privacy table
```sql
CREATE TABLE story_custom_privacy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  allowed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  UNIQUE(story_id, allowed_user_id)
);

CREATE INDEX idx_story_custom_privacy_story_id ON story_custom_privacy(story_id);
```

#### story_hidden_from table
```sql
CREATE TABLE story_hidden_from (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  hidden_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  UNIQUE(story_id, hidden_user_id)
);

CREATE INDEX idx_story_hidden_from_story_id ON story_hidden_from(story_id);
```

#### story_highlights table
```sql
CREATE TABLE story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  cover_image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_highlights_user_id ON story_highlights(user_id);
```

#### story_highlight_items table
```sql
CREATE TABLE story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(highlight_id, story_id)
);

CREATE INDEX idx_story_highlight_items_highlight_id ON story_highlight_items(highlight_id);
```

#### story_interactive_elements table
```sql
CREATE TABLE story_interactive_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  element_type VARCHAR(20) NOT NULL 
    CHECK (element_type IN ('poll', 'question', 'countdown', 'link', 'music', 'location')),
  element_data JSONB NOT NULL, -- Flexible storage for different element types
  position_x FLOAT, -- Position on story (0-1)
  position_y FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_interactive_elements_story_id ON story_interactive_elements(story_id);
CREATE INDEX idx_story_interactive_elements_type ON story_interactive_elements(element_type);
```

#### story_interactive_responses table
```sql
CREATE TABLE story_interactive_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id UUID NOT NULL REFERENCES story_interactive_elements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL, -- Poll vote, question answer, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(element_id, user_id)
);

CREATE INDEX idx_story_interactive_responses_element_id ON story_interactive_responses(element_id);
```

#### story_mentions table
```sql
CREATE TABLE story_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_x FLOAT,
  position_y FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(story_id, mentioned_user_id)
);

CREATE INDEX idx_story_mentions_story_id ON story_mentions(story_id);
CREATE INDEX idx_story_mentions_mentioned_user_id ON story_mentions(mentioned_user_id);
```

#### story_archive table
```sql
CREATE TABLE story_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_story_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views_count INTEGER NOT NULL DEFAULT 0,
  reactions_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_story_archive_user_id ON story_archive(user_id);
CREATE INDEX idx_story_archive_created_at ON story_archive(created_at DESC);
```

### 2. Row Level Security (RLS) Policies

#### Stories Table RLS

```sql
-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stories
CREATE POLICY "Users can view own stories"
ON stories FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can view public stories
CREATE POLICY "Users can view public stories"
ON stories FOR SELECT
TO authenticated
USING (
  privacy_setting = 'public' 
  AND is_active = TRUE 
  AND expires_at > NOW()
  AND user_id NOT IN (
    SELECT blocked_user_id FROM user_blocks 
    WHERE blocker_id = auth.uid()
  )
  AND auth.uid() NOT IN (
    SELECT hidden_user_id FROM story_hidden_from 
    WHERE story_id = stories.id
  )
);

-- Policy: Users can view stories from followed users (followers privacy)
CREATE POLICY "Users can view followers stories"
ON stories FOR SELECT
TO authenticated
USING (
  privacy_setting = 'followers'
  AND is_active = TRUE
  AND expires_at > NOW()
  AND user_id IN (
    SELECT following_id FROM follows 
    WHERE follower_id = auth.uid()
  )
  AND user_id NOT IN (
    SELECT blocked_user_id FROM user_blocks 
    WHERE blocker_id = auth.uid()
  )
  AND auth.uid() NOT IN (
    SELECT hidden_user_id FROM story_hidden_from 
    WHERE story_id = stories.id
  )
);

-- Policy: Users can view close friends stories
CREATE POLICY "Users can view close friends stories"
ON stories FOR SELECT
TO authenticated
USING (
  privacy_setting = 'close_friends'
  AND is_active = TRUE
  AND expires_at > NOW()
  AND auth.uid() IN (
    SELECT friend_id FROM close_friends 
    WHERE user_id = stories.user_id
  )
  AND user_id NOT IN (
    SELECT blocked_user_id FROM user_blocks 
    WHERE blocker_id = auth.uid()
  )
);

-- Policy: Users can view custom privacy stories
CREATE POLICY "Users can view custom privacy stories"
ON stories FOR SELECT
TO authenticated
USING (
  privacy_setting = 'custom'
  AND is_active = TRUE
  AND expires_at > NOW()
  AND auth.uid() IN (
    SELECT allowed_user_id FROM story_custom_privacy 
    WHERE story_id = stories.id
  )
  AND user_id NOT IN (
    SELECT blocked_user_id FROM user_blocks 
    WHERE blocker_id = auth.uid()
  )
);

-- Policy: Users can insert their own stories
CREATE POLICY "Users can create stories"
ON stories FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own stories
CREATE POLICY "Users can update own stories"
ON stories FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete own stories"
ON stories FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

#### Story Views Table RLS

```sql
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own view records
CREATE POLICY "Users can view own view records"
ON story_views FOR SELECT
TO authenticated
USING (viewer_id = auth.uid());

-- Policy: Story creators can view who viewed their stories
CREATE POLICY "Creators can view story views"
ON story_views FOR SELECT
TO authenticated
USING (
  story_id IN (
    SELECT id FROM stories WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert view records
CREATE POLICY "Users can record views"
ON story_views FOR INSERT
TO authenticated
WITH CHECK (viewer_id = auth.uid());
```

#### Story Reactions Table RLS

```sql
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on stories they can see
CREATE POLICY "Users can view reactions on visible stories"
ON story_reactions FOR SELECT
TO authenticated
USING (
  story_id IN (
    SELECT id FROM stories 
    WHERE user_id = auth.uid() 
    OR (is_active = TRUE AND expires_at > NOW())
  )
);

-- Policy: Users can add reactions
CREATE POLICY "Users can add reactions"
ON story_reactions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON story_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());
```

### 3. Storage Buckets and Policies

```sql
-- Create storage bucket for story media
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-media', 'story-media', false);

-- Create storage bucket for thumbnails (public for CDN)
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-thumbnails', 'story-thumbnails', true);

-- RLS Policy: Users can upload to their own folder
CREATE POLICY "Users can upload story media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can read their own media
CREATE POLICY "Users can read own story media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'story-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Users can read media from stories they can view
CREATE POLICY "Users can read visible story media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'story-media'
  AND EXISTS (
    SELECT 1 FROM stories
    WHERE media_url LIKE '%' || storage.objects.name || '%'
    AND (
      user_id = auth.uid()
      OR (is_active = TRUE AND expires_at > NOW())
    )
  )
);

-- RLS Policy: Anyone can read thumbnails (public bucket)
CREATE POLICY "Public can read thumbnails"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'story-thumbnails');
```

### 4. Database Functions

#### Function: Check if user can view story
```sql
CREATE OR REPLACE FUNCTION can_view_story(story_uuid UUID, viewer_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  story_record RECORD;
  can_view BOOLEAN := FALSE;
BEGIN
  -- Get story details
  SELECT * INTO story_record
  FROM stories
  WHERE id = story_uuid
  AND is_active = TRUE
  AND expires_at > NOW();
  
  -- Story doesn't exist or expired
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Owner can always view
  IF story_record.user_id = viewer_uuid THEN
    RETURN TRUE;
  END IF;
  
  -- Check if viewer is blocked
  IF EXISTS (
    SELECT 1 FROM user_blocks
    WHERE blocker_id = viewer_uuid
    AND blocked_user_id = story_record.user_id
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if hidden from viewer
  IF EXISTS (
    SELECT 1 FROM story_hidden_from
    WHERE story_id = story_uuid
    AND hidden_user_id = viewer_uuid
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Check privacy settings
  CASE story_record.privacy_setting
    WHEN 'public' THEN
      can_view := TRUE;
    
    WHEN 'followers' THEN
      can_view := EXISTS (
        SELECT 1 FROM follows
        WHERE follower_id = viewer_uuid
        AND following_id = story_record.user_id
      );
    
    WHEN 'close_friends' THEN
      can_view := EXISTS (
        SELECT 1 FROM close_friends
        WHERE user_id = story_record.user_id
        AND friend_id = viewer_uuid
      );
    
    WHEN 'custom' THEN
      can_view := EXISTS (
        SELECT 1 FROM story_custom_privacy
        WHERE story_id = story_uuid
        AND allowed_user_id = viewer_uuid
      );
    
    ELSE
      can_view := FALSE;
  END CASE;
  
  RETURN can_view;
END;
$$;
```

#### Function: Get stories for user feed
```sql
CREATE OR REPLACE FUNCTION get_user_story_feed(viewer_uuid UUID)
RETURNS TABLE (
  story_id UUID,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  story_count BIGINT,
  has_unviewed BOOLEAN,
  latest_story_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as story_id,
    s.user_id,
    u.username,
    u.avatar,
    COUNT(*) OVER (PARTITION BY s.user_id) as story_count,
    NOT EXISTS (
      SELECT 1 FROM story_views sv
      WHERE sv.story_id = s.id
      AND sv.viewer_id = viewer_uuid
    ) as has_unviewed,
    MAX(s.created_at) OVER (PARTITION BY s.user_id) as latest_story_time
  FROM stories s
  JOIN users u ON u.uid = s.user_id
  WHERE s.is_active = TRUE
  AND s.expires_at > NOW()
  AND can_view_story(s.id, viewer_uuid)
  ORDER BY has_unviewed DESC, latest_story_time DESC;
END;
$$;
```

#### Function: Archive expired stories
```sql
CREATE OR REPLACE FUNCTION archive_expired_stories()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER := 0;
BEGIN
  -- Move expired stories to archive
  INSERT INTO story_archive (
    user_id,
    original_story_id,
    media_url,
    thumbnail_url,
    content,
    created_at,
    views_count,
    reactions_count
  )
  SELECT 
    user_id,
    id,
    media_url,
    thumbnail_url,
    content,
    created_at,
    views_count,
    reactions_count
  FROM stories
  WHERE is_active = TRUE
  AND expires_at <= NOW();
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  -- Mark stories as inactive
  UPDATE stories
  SET is_active = FALSE
  WHERE is_active = TRUE
  AND expires_at <= NOW();
  
  RETURN archived_count;
END;
$$;
```

### 5. Real-time Subscriptions

#### Realtime Channel Configuration

```typescript
// Channel for story updates
const storyChannel = supabase
  .channel('stories:all', {
    config: { private: true }
  })
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'stories'
    },
    (payload) => {
      // Handle new story
      handleNewStory(payload.new);
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'stories',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Handle story update (views, reactions)
      handleStoryUpdate(payload.new);
    }
  )
  .subscribe();

// Channel for story views (for creators)
const viewsChannel = supabase
  .channel(`story-views:${storyId}`, {
    config: { private: true }
  })
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'story_views',
      filter: `story_id=eq.${storyId}`
    },
    (payload) => {
      // Handle new view
      handleNewView(payload.new);
    }
  )
  .subscribe();
```

#### RLS Policies for Realtime

```sql
-- Enable realtime for stories table
ALTER PUBLICATION supabase_realtime ADD TABLE stories;
ALTER PUBLICATION supabase_realtime ADD TABLE story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE story_reactions;

-- Realtime authorization policies
CREATE POLICY "authenticated can receive story broadcasts"
ON "realtime"."messages"
FOR SELECT
TO authenticated
USING (
  (SELECT realtime.topic()) LIKE 'stories:%'
);

CREATE POLICY "authenticated can send story broadcasts"
ON "realtime"."messages"
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT realtime.topic()) LIKE 'stories:%'
);
```

### 6. Angular Service Interfaces

#### StoryService Interface
```typescript
export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  content?: string;
  duration_hours: number;
  created_at: string;
  expires_at: string;
  views_count: number;
  reactions_count: number;
  replies_count: number;
  is_active: boolean;
  privacy_setting: 'public' | 'followers' | 'close_friends' | 'custom';
  is_viewed?: boolean;
  user?: UserProfile;
  interactive_elements?: InteractiveElement[];
  mentions?: StoryMention[];
}

export interface StoryView {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
  view_duration_seconds?: number;
  completed: boolean;
  viewer?: UserProfile;
}

export interface StoryReaction {
  id: string;
  story_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
  user?: UserProfile;
}

export interface StoryReply {
  id: string;
  story_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  sender?: UserProfile;
}

export interface InteractiveElement {
  id: string;
  story_id: string;
  element_type: 'poll' | 'question' | 'countdown' | 'link' | 'music' | 'location';
  element_data: any;
  position_x?: number;
  position_y?: number;
  responses?: InteractiveResponse[];
}

export interface InteractiveResponse {
  id: string;
  element_id: string;
  user_id: string;
  response_data: any;
  created_at: string;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image_url?: string;
  display_order: number;
  stories: Story[];
  created_at: string;
}

export interface StoryPrivacySettings {
  privacy_setting: 'public' | 'followers' | 'close_friends' | 'custom';
  custom_allowed_users?: string[];
  hidden_from_users?: string[];
}

export interface StoryCreationOptions {
  media: File;
  content?: string;
  privacy: StoryPrivacySettings;
  duration_hours?: number;
  interactive_elements?: Partial<InteractiveElement>[];
  mentions?: string[];
  location?: string;
  music?: string;
}
```

## Data Models

### TypeScript Models

```typescript
// Core Story Model
export class StoryModel {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string;
  content?: string;
  durationHours: number;
  createdAt: Date;
  expiresAt: Date;
  viewsCount: number;
  reactionsCount: number;
  repliesCount: number;
  isActive: boolean;
  privacySetting: PrivacySetting;
  isViewed: boolean = false;
  user?: UserProfile;
  
  constructor(data: any) {
    this.id = data.id;
    this.userId = data.user_id;
    this.mediaUrl = data.media_url;
    this.mediaType = data.media_type;
    this.thumbnailUrl = data.thumbnail_url;
    this.content = data.content;
    this.durationHours = data.duration_hours;
    this.createdAt = new Date(data.created_at);
    this.expiresAt = new Date(data.expires_at);
    this.viewsCount = data.views_count;
    this.reactionsCount = data.reactions_count;
    this.repliesCount = data.replies_count;
    this.isActive = data.is_active;
    this.privacySetting = data.privacy_setting;
  }
  
  isExpired(): boolean {
    return this.expiresAt <= new Date();
  }
  
  timeRemaining(): number {
    return Math.max(0, this.expiresAt.getTime() - Date.now());
  }
  
  canEdit(currentUserId: string): boolean {
    return this.userId === currentUserId && !this.isExpired();
  }
}

// Story Feed Item (grouped by user)
export class StoryFeedItem {
  userId: string;
  username: string;
  avatarUrl: string;
  stories: StoryModel[];
  hasUnviewed: boolean;
  latestStoryTime: Date;
  
  constructor(data: any) {
    this.userId = data.user_id;
    this.username = data.username;
    this.avatarUrl = data.avatar_url;
    this.stories = data.stories.map((s: any) => new StoryModel(s));
    this.hasUnviewed = data.has_unviewed;
    this.latestStoryTime = new Date(data.latest_story_time);
  }
  
  get totalStories(): number {
    return this.stories.length;
  }
  
  get unviewedCount(): number {
    return this.stories.filter(s => !s.isViewed).length;
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File validation rejects invalid uploads
*For any* uploaded file, if the file type, size, or dimensions are outside acceptable ranges, then the upload should be rejected with a clear error message.
**Validates: Requirements 1.1**

### Property 2: Media compression maintains quality threshold
*For any* uploaded media file, after compression, the file size should be reduced while the quality metric remains above the acceptable threshold (e.g., SSIM > 0.95 for images).
**Validates: Requirements 1.2**

### Property 3: Interactive element validation
*For any* interactive element (poll, question, countdown, link, music), the element configuration should be validated against its schema before storage, and invalid configurations should be rejected.
**Validates: Requirements 1.5**

### Property 4: Mention validation requires existing users
*For any* user mention in a story, the mentioned user must exist in the system, and mentions of non-existent users should be rejected.
**Validates: Requirements 1.6**

### Property 5: Location metadata round-trip
*For any* story with location metadata, storing and retrieving the location should preserve all location data fields.
**Validates: Requirements 1.7**

### Property 6: Hashtag parsing and indexing
*For any* story content containing hashtags, all hashtags should be correctly extracted, normalized, and indexed for search.
**Validates: Requirements 1.8**

### Property 7: Story creation atomicity
*For any* story creation attempt, either all steps (media upload, database record, expiration timestamp) complete successfully, or none of them persist.
**Validates: Requirements 1.9**

### Property 8: Failed creation rollback
*For any* failed story creation, no partial data (media files, database records) should remain in the system.
**Validates: Requirements 1.10**

### Property 9: Public story visibility
*For any* story with privacy setting "public", any authenticated user should be able to view the story (excluding blocked users).
**Validates: Requirements 2.1**

### Property 10: Followers-only visibility
*For any* story with privacy setting "followers", only users who follow the creator should be able to view the story.
**Validates: Requirements 2.2**

### Property 11: Close friends visibility
*For any* story with privacy setting "close_friends", only users in the creator's close friends list should be able to view the story.
**Validates: Requirements 2.3**

### Property 12: Custom privacy visibility
*For any* story with privacy setting "custom", only users explicitly listed in the custom privacy settings should be able to view the story.
**Validates: Requirements 2.4**

### Property 13: Close friends list update immediacy
*For any* close friends list update, stories with "close_friends" privacy should immediately reflect the new visibility rules.
**Validates: Requirements 2.5**

### Property 14: Block list enforcement
*For any* user blocked by a story creator, that user should not be able to view any of the creator's stories regardless of privacy settings.
**Validates: Requirements 2.6**

### Property 15: Hide list override
*For any* user in a story's hide list, that user should not be able to view the story even if other privacy rules would allow it.
**Validates: Requirements 2.7**

### Property 16: Privacy check ordering
*For any* story visibility check, the system should evaluate block lists and hide lists before evaluating privacy settings.
**Validates: Requirements 2.8**

### Property 17: Unfollow removes from feed
*For any* user who unfollows a story creator, the creator's stories should be removed from the user's story feed.
**Validates: Requirements 2.9**

### Property 18: Most restrictive privacy wins
*For any* story with conflicting privacy rules, the most restrictive rule should be applied.
**Validates: Requirements 2.10**

### Property 19: Story feed ordering
*For any* user's story feed, stories should be ordered with unviewed stories first, then by recency within each group.
**Validates: Requirements 3.1**

### Property 20: View recording completeness
*For any* story view, the system should record the view, increment the view count, and mark the story as viewed for that viewer atomically.
**Validates: Requirements 3.11**

### Property 21: Reaction recording and counting
*For any* reaction added to a story, the reaction should be stored and the story's reaction count should be incremented.
**Validates: Requirements 4.2**

### Property 22: Reply creates message thread
*For any* story reply, a direct message thread should be created containing the reply text and a reference to the story.
**Validates: Requirements 4.3**

### Property 23: Interactive response recording and aggregation
*For any* interactive element response (poll vote, question answer), the response should be recorded and aggregate results should be updated.
**Validates: Requirements 4.8**

### Property 24: Poll percentage calculation
*For any* poll with responses, the percentage for each option should equal (option votes / total votes) * 100, and all percentages should sum to 100%.
**Validates: Requirements 4.9**

### Property 25: Question responses completeness
*For any* story with question responses, viewing the responses should return all submitted responses with viewer identities.
**Validates: Requirements 4.10**

### Property 26: View count accuracy
*For any* story, the view count should equal the number of unique viewers who have viewed the story.
**Validates: Requirements 5.1**

### Property 27: Viewer list completeness
*For any* story, the viewer list should contain all users who have viewed the story with accurate timestamps.
**Validates: Requirements 5.2**

### Property 28: Engagement metrics accuracy
*For any* story, the displayed reaction count, reply count, and interactive response count should match the actual number of records.
**Validates: Requirements 5.3**

### Property 29: Completion rate calculation
*For any* story, the completion rate should equal (viewers who watched to end / total viewers) * 100%.
**Validates: Requirements 5.4**

### Property 30: Exit rate calculation
*For any* story in a sequence, the exit rate should equal (viewers who exited at this story / viewers who reached this story) * 100%.
**Validates: Requirements 5.5**

### Property 31: Click-through rate calculation
*For any* story with links, the CTR should equal (link clicks / total views) * 100%.
**Validates: Requirements 5.6**

### Property 32: Analytics export completeness
*For any* analytics export, the exported data should contain all metrics (views, reactions, replies, completion rate, exit rate, CTR).
**Validates: Requirements 5.9**

### Property 33: Text edit preserves media and history
*For any* story text edit, the media URL and view history should remain unchanged after the edit.
**Validates: Requirements 6.1**

### Property 34: Interactive element edit preserves responses
*For any* interactive element edit, existing responses should remain unchanged and associated with the element.
**Validates: Requirements 6.2**

### Property 35: Privacy change immediacy
*For any* privacy setting change, the new visibility rules should be applied immediately to all access checks.
**Validates: Requirements 6.3**

### Property 36: Story deletion workflow
*For any* story deletion, the story should be marked inactive, removed from feeds, and moved to archive atomically.
**Validates: Requirements 6.4**

### Property 37: Archive restoration conditions
*For any* archived story, restoration should succeed if and only if the story has not expired.
**Validates: Requirements 6.5**

### Property 38: Highlight creation duplicates story
*For any* story added to highlights, a permanent copy should be created in the highlights collection while the original remains in the archive.
**Validates: Requirements 6.6**

### Property 39: Highlight removal preserves archive
*For any* story removed from highlights, only the highlight copy should be deleted, and the archive copy should remain.
**Validates: Requirements 6.7**

### Property 40: Highlight reordering updates display order
*For any* highlight reorder operation, the display_order field should be updated to reflect the new order.
**Validates: Requirements 6.8**

### Property 41: Highlight collection creation with metadata
*For any* highlight collection creation, the collection should be created with the specified name and cover image.
**Validates: Requirements 6.9**

### Property 42: Highlight metadata edit preserves stories
*For any* highlight collection metadata edit, the contained stories should remain unchanged.
**Validates: Requirements 6.10**

### Property 43: Expiration timestamp calculation
*For any* story creation, the expiration timestamp should be set to exactly 24 hours (or configured duration) after the creation timestamp.
**Validates: Requirements 7.1**

### Property 44: Expired story marking
*For any* story where current time exceeds expiration timestamp, the story should be marked as expired and removed from active feeds.
**Validates: Requirements 7.2**

### Property 45: Expiration triggers archival
*For any* expired story, the story should be moved to the creator's archive.
**Validates: Requirements 7.3**

### Property 46: Archive ordering by date
*For any* user's archive, stories should be ordered by creation date in descending order.
**Validates: Requirements 7.4**

### Property 47: Archive download includes metadata
*For any* archived story download, the download should include the original media file and all associated metadata.
**Validates: Requirements 7.5**

### Property 48: Permanent deletion removes all data
*For any* archived story permanent deletion, both the database record and storage media should be removed.
**Validates: Requirements 7.6**

### Property 49: Custom duration validation
*For any* custom expiration duration, the system should accept durations between 1 hour and 7 days (168 hours) and reject others.
**Validates: Requirements 7.8**

### Property 50: Storage quota enforcement
*For any* story creation attempt when storage quota is reached, the creation should be rejected with an appropriate error.
**Validates: Requirements 7.10**

### Property 51: Explore shows unfollowed users only
*For any* user's explore feed, all displayed stories should be from users that the viewer does not follow.
**Validates: Requirements 9.1**

### Property 52: Hashtag search completeness
*For any* hashtag search query, all public stories containing that hashtag should be returned.
**Validates: Requirements 9.2**

### Property 53: Location search completeness
*For any* location search query, all public stories tagged with that location should be returned.
**Validates: Requirements 9.3**

### Property 54: Content type filtering
*For any* content type filter (image/video), only stories matching the selected media type should be returned.
**Validates: Requirements 9.4**

### Property 55: Explore view recording
*For any* story viewed from explore, the view should be recorded with the same completeness as regular story views.
**Validates: Requirements 9.6**

### Property 56: Follow adds to feed
*For any* user follow action, the followed user's active stories should appear in the follower's story feed.
**Validates: Requirements 9.7**

### Property 57: Discovery opt-out exclusion
*For any* user who has opted out of discovery, their stories should not appear in explore or search results.
**Validates: Requirements 9.8**

### Property 58: Search respects privacy
*For any* search result, only stories that the viewer has permission to view should be included.
**Validates: Requirements 9.10**

## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input data (file type, size, privacy settings)
   - Return 400 Bad Request with specific error message
   - Do not persist any data

2. **Authorization Errors**: User lacks permission to perform action
   - Return 403 Forbidden
   - Log security event

3. **Not Found Errors**: Requested resource doesn't exist
   - Return 404 Not Found
   - Check if resource was deleted or never existed

4. **Conflict Errors**: Operation conflicts with current state
   - Return 409 Conflict
   - Provide resolution guidance

5. **Storage Errors**: Media upload/download failures
   - Return 500 Internal Server Error
   - Retry up to 3 times with exponential backoff
   - Rollback any partial operations

6. **Database Errors**: Query failures, constraint violations
   - Return 500 Internal Server Error
   - Log full error context
   - Rollback transaction

### Error Recovery Strategies

1. **Transactional Operations**: Use database transactions for multi-step operations
   ```typescript
   async createStory(data: StoryCreationOptions): Promise<Story> {
     const client = await this.supabase.client;
     
     try {
       // Start transaction
       const { data: story, error: storyError } = await client
         .from('stories')
         .insert(storyData)
         .select()
         .single();
       
       if (storyError) throw storyError;
       
       // Upload media
       const mediaUrl = await this.uploadMedia(data.media, story.id);
       
       // Update story with media URL
       await client
         .from('stories')
         .update({ media_url: mediaUrl })
         .eq('id', story.id);
       
       return story;
     } catch (error) {
       // Rollback: delete story record and uploaded media
       await this.rollbackStoryCreation(story?.id);
       throw error;
     }
   }
   ```

2. **Retry Logic**: Implement exponential backoff for transient failures
   ```typescript
   async uploadWithRetry(file: File, maxRetries = 3): Promise<string> {
     for (let attempt = 0; attempt < maxRetries; attempt++) {
       try {
         return await this.upload(file);
       } catch (error) {
         if (attempt === maxRetries - 1) throw error;
         await this.delay(Math.pow(2, attempt) * 1000);
       }
     }
   }
   ```

3. **Graceful Degradation**: Continue operation with reduced functionality
   ```typescript
   async fetchStories(): Promise<Story[]> {
     try {
       // Try to fetch with full data
       return await this.fetchStoriesWithDetails();
     } catch (error) {
       // Fall back to basic story data
       return await this.fetchBasicStories();
     }
   }
   ```

4. **User Feedback**: Provide clear, actionable error messages
   ```typescript
   handleError(error: any): string {
     if (error.code === 'PGRST116') {
       return 'Story not found. It may have expired or been deleted.';
     }
     if (error.message.includes('storage')) {
       return 'Failed to upload media. Please check your file size and try again.';
     }
     return 'An unexpected error occurred. Please try again.';
   }
   ```

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

1. **Service Method Tests**
   - Test each StoryService method with mocked dependencies
   - Verify correct API calls are made
   - Test error handling paths
   - Example: Test `createStory()` with valid and invalid inputs

2. **Component Tests**
   - Test Angular components with mocked services
   - Verify UI rendering based on state
   - Test user interactions
   - Example: Test StoryRailComponent displays correct stories

3. **Utility Function Tests**
   - Test helper functions (date formatting, validation, etc.)
   - Test edge cases (null, undefined, empty values)
   - Example: Test `calculateTimeRemaining()` with various timestamps

4. **RLS Policy Tests**
   - Test database policies with different user contexts
   - Verify access control rules
   - Example: Test that followers-only stories are not visible to non-followers

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** library for TypeScript:

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage.

**Test Tagging**: Each property-based test must include a comment explicitly referencing the correctness property from this design document using the format:
```typescript
// Feature: story-feature, Property 1: File validation rejects invalid uploads
```

**Property Test Examples**:

```typescript
import fc from 'fast-check';

describe('Story Property Tests', () => {
  // Feature: story-feature, Property 9: Public story visibility
  it('public stories are visible to all authenticated users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerId: fc.uuid(),
          creatorId: fc.uuid(),
        }),
        async ({ storyId, viewerId, creatorId }) => {
          // Create public story
          const story = await createTestStory({
            id: storyId,
            user_id: creatorId,
            privacy_setting: 'public'
          });
          
          // Any authenticated user should be able to view
          const canView = await storyService.canViewStory(storyId, viewerId);
          expect(canView).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 26: View count accuracy
  it('view count equals number of unique viewers', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          storyId: fc.uuid(),
          viewerIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 50 }).map(arr => [...new Set(arr)])
        }),
        async ({ storyId, viewerIds }) => {
          // Create story
          const story = await createTestStory({ id: storyId });
          
          // Record views from unique viewers
          for (const viewerId of viewerIds) {
            await storyService.viewStory(storyId, viewerId);
          }
          
          // Fetch updated story
          const updatedStory = await storyService.getStory(storyId);
          
          // View count should equal number of unique viewers
          expect(updatedStory.views_count).toBe(viewerIds.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 43: Expiration timestamp calculation
  it('expiration timestamp is exactly duration hours after creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          durationHours: fc.integer({ min: 1, max: 168 }),
          createdAt: fc.date()
        }),
        async ({ durationHours, createdAt }) => {
          const story = await createTestStory({
            duration_hours: durationHours,
            created_at: createdAt.toISOString()
          });
          
          const expectedExpiration = new Date(createdAt);
          expectedExpiration.setHours(expectedExpiration.getHours() + durationHours);
          
          const actualExpiration = new Date(story.expires_at);
          
          // Should be within 1 second (accounting for processing time)
          const diff = Math.abs(actualExpiration.getTime() - expectedExpiration.getTime());
          expect(diff).toBeLessThan(1000);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: story-feature, Property 24: Poll percentage calculation
  it('poll percentages sum to 100 and match vote distribution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          pollId: fc.uuid(),
          votes: fc.array(
            fc.record({
              userId: fc.uuid(),
              optionIndex: fc.integer({ min: 0, max: 3 })
            }),
            { minLength: 1, maxLength: 100 }
          )
        }),
        async ({ pollId, votes }) => {
          // Create poll with 4 options
          const poll = await createTestPoll({ id: pollId, optionCount: 4 });
          
          // Record votes
          for (const vote of votes) {
            await pollService.vote(pollId, vote.userId, vote.optionIndex);
          }
          
          // Get results
          const results = await pollService.getResults(pollId);
          
          // Calculate expected percentages
          const voteCounts = [0, 0, 0, 0];
          votes.forEach(v => voteCounts[v.optionIndex]++);
          const totalVotes = votes.length;
          
          // Verify percentages
          const percentageSum = results.reduce((sum, r) => sum + r.percentage, 0);
          expect(Math.abs(percentageSum - 100)).toBeLessThan(0.1); // Allow for rounding
          
          results.forEach((result, index) => {
            const expectedPercentage = (voteCounts[index] / totalVotes) * 100;
            expect(Math.abs(result.percentage - expectedPercentage)).toBeLessThan(0.1);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify interactions between components:

1. **End-to-End Story Creation Flow**
   - Test complete flow from upload to database storage
   - Verify media processing and thumbnail generation
   - Test real-time notifications

2. **Privacy and Access Control**
   - Test RLS policies with real database
   - Verify visibility rules across different privacy settings
   - Test block and hide list enforcement

3. **Real-time Updates**
   - Test WebSocket connections
   - Verify real-time view updates
   - Test notification delivery

### Test Data Generators

Create generators for property-based tests:

```typescript
// Story generator
const storyArbitrary = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  media_type: fc.constantFrom('image', 'video'),
  privacy_setting: fc.constantFrom('public', 'followers', 'close_friends', 'custom'),
  duration_hours: fc.integer({ min: 1, max: 168 }),
  content: fc.option(fc.string({ maxLength: 500 })),
});

// User generator
const userArbitrary = fc.record({
  id: fc.uuid(),
  username: fc.string({ minLength: 3, maxLength: 20 }),
  email: fc.emailAddress(),
});

// Interactive element generator
const interactiveElementArbitrary = fc.record({
  id: fc.uuid(),
  story_id: fc.uuid(),
  element_type: fc.constantFrom('poll', 'question', 'countdown', 'link'),
  element_data: fc.jsonValue(),
  position_x: fc.float({ min: 0, max: 1 }),
  position_y: fc.float({ min: 0, max: 1 }),
});
```

### Testing Tools

- **Unit Tests**: Jasmine/Karma (Angular default)
- **Property-Based Tests**: fast-check
- **Integration Tests**: Cypress or Playwright
- **API Tests**: Supertest
- **Database Tests**: Supabase local development setup

### Continuous Testing

- Run unit tests on every commit
- Run property tests on pull requests
- Run integration tests before deployment
- Monitor test coverage (target: >80% for critical paths)

## Performance Considerations

### Database Optimization

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Query Optimization**: Use `select` to fetch only needed columns
3. **Pagination**: Implement cursor-based pagination for large result sets
4. **Connection Pooling**: Use Supabase's built-in connection pooling

### Media Optimization

1. **Compression**: Compress images to WebP format, videos to H.264
2. **Thumbnails**: Generate thumbnails for quick loading
3. **CDN**: Use Supabase Storage CDN for media delivery
4. **Lazy Loading**: Load media only when needed

### Caching Strategy

1. **Client-Side**: Cache story feed for 5 minutes
2. **CDN**: Cache media files with long TTL
3. **Database**: Use materialized views for analytics

### Real-time Optimization

1. **Channel Multiplexing**: Use single channel per user for all story updates
2. **Payload Minimization**: Send only changed data in real-time updates
3. **Debouncing**: Batch rapid updates (e.g., view counts)

## Security Considerations

### Authentication and Authorization

1. **JWT Validation**: All requests validated via Supabase Auth
2. **RLS Enforcement**: All data access controlled by RLS policies
3. **API Key Protection**: Never expose service role key to client

### Data Protection

1. **Encryption at Rest**: Supabase encrypts all data at rest
2. **Encryption in Transit**: All connections use TLS 1.3
3. **Signed URLs**: Use signed URLs for private media access

### Input Validation

1. **File Upload**: Validate file type, size, dimensions
2. **SQL Injection**: Use parameterized queries (handled by Supabase)
3. **XSS Prevention**: Sanitize user-generated content

### Rate Limiting

1. **Story Creation**: Max 10 stories per user per day
2. **API Requests**: Use Supabase's built-in rate limiting
3. **Media Upload**: Max 100MB per upload

## Deployment and Operations

### Database Migrations

Use Supabase migrations for schema changes:

```sql
-- migrations/20240101_create_stories.sql
CREATE TABLE stories (
  -- schema definition
);

-- migrations/20240102_add_rls_policies.sql
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy_name" ON stories ...;
```

### Monitoring

1. **Error Tracking**: Integrate Sentry or similar
2. **Performance Monitoring**: Track API response times
3. **Storage Monitoring**: Alert when storage quota reaches 80%
4. **Real-time Monitoring**: Track WebSocket connection health

### Backup and Recovery

1. **Database Backups**: Supabase automatic daily backups
2. **Media Backups**: Replicate storage bucket to secondary region
3. **Disaster Recovery**: Document recovery procedures

## Future Enhancements

1. **Story Templates**: Pre-designed templates for quick creation
2. **Collaborative Stories**: Multiple users contribute to one story
3. **Story Ads**: Sponsored stories in feed
4. **Advanced Analytics**: ML-powered insights
5. **Story Remixing**: Create new stories from existing ones
6. **Cross-Platform Sync**: Sync story views across devices
7. **Story Scheduling**: Schedule stories for future posting
8. **Story Drafts**: Save incomplete stories as drafts
