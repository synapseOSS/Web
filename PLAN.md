# Synapse Project Launch Plan

This document outlines the major phases, milestones, and deliverables for building the Synapse social media platform. The project begins with a Progressive Web App (PWA) foundation and scales to a comprehensive multi-platform deployment.

## Project Metadata

**Project Name:** Synapse
**Development Company:** StudioAs Inc.
**Main Developer:** Ashik
**GitHub Handle:** @TheRealAshik

## Phase 0: Foundations & Architecture

**Goal:** Define the scope, core technologies, and basic design identity.

**Status: 10% - 15% Complete**

*   **Project Scope & Persona:** [Completed]
    The target audience and core value proposition (fast, offline-first community) have been defined.

*   **Core Tech Stack:** [Completed]
    The following technologies have been selected:
    *   **Frontend:** Angular + TypeScript
    *   **UI:** Shadcn UI + Tailwind CSS
    *   **Backend/DB:** Supabase Auth and Database (PostgreSQL)
    *   **AI:** Gemini API (GenAI)

*   **Brand Kit:** [Pending]
    Development of the logo, color palette (primary/secondary), and typography is required.

## Phase 1: Web Presence & PWA Core

**Goal:** Create a strong public presence and establish the minimum criteria for the PWA, focusing on installability and offline resilience.

**Status: 90% - 95% Complete**

### Landing Page

*   **Landing Page Development:** [Completed]
    A single, responsive Angular page with a clear Call-to-Action (CTA) for the PWA has been created.

*   **SEO & Performance:** [Completed]
    Comprehensive SEO meta tags, Open Graph, Twitter Cards, and performance optimization implemented.

### PWA Shell Setup

*   **Manifest File:** [Completed]
    The `manifest.json` file has been configured with icons, shortcuts, and app metadata. Linked in `index.html`.

*   **Service Worker:** [Completed]
    Custom service worker (`sw.js`) registered with cache-first strategy, offline support, and push notification infrastructure.

*   **App Shell Caching:** [Completed]
    Core assets are cached on install with runtime caching for dynamic content.

*   **Network Strategy:** [Completed]
    Cache-first strategy implemented with network fallback. Offline page available at `/offline.html`.

## Phase 2: Social Media Functionality

**Goal:** Build the primary features of the social platform within the PWA framework. This phase encompasses the core user experience.

**Status: 45% - 55% Complete**

### Core Systems

*   **User Authentication:** [Completed]
    Full implementation of Sign-in, Sign-up, session management, and auth guards using Supabase Auth.

*   **Real-time Feed:** [Completed]
    Home feed with real-time updates via Supabase Realtime. Live indicator and new posts banner implemented.

*   **Search & Discovery:** [In Progress]
    Search service scaffolded. UI implementation pending.

*   **Notifications:** [Completed]
    Real-time notification system with browser notifications, unread count tracking, and notification center.

*   **Seamless Translation:** [Pending]
    Break down language barriers instantly. With a single tap, posts and comments in foreign languages are translated into your preferred language, making global connection seamless and natural.

*   **Advanced Search Filters:** [Pending]
    Find exactly what you're looking for. Go beyond simple keywords with granular filters for date ranges, specific media types (photos, videos, links), location, and specific users, turning the platform into a searchable knowledge base.

### Content Creation

*   **Smart Post Creation:** [Completed]
    Compose page with text and multi-media upload. Gemini API integration pending for smart suggestions.

*   **Advanced Multipost:** [Completed]
    Facebook-style grid view for posts with multiple media items. Posts with 4+ items display overlay count. Support for simultaneous upload of photos and videos.

*   **Polls:** [Pending]
    A feature allowing users to create time-limited polls with multiple options and features.

*   **Stories:** [Pending]
    Ephemeral content support for temporary, time-limited visual updates.

*   **Rich Media Support:** [Pending]
    Optimization for video playback and handling.

*   **Link Previews:** [Pending]
    Rich Open Graph previews for shared links in posts and comments.

*   **Scheduled Posts:** [Pending]
    Functionality to draft and schedule posts for future publishing.

*   **Collaborative Posts:** [Pending]
    A feature allowing two users to co-author a single post.

*   **In-App Editor:** [Pending]
    Tools for cropping, filtering, and adding stickers to images and videos.

*   **Developer Mode (Code Snippets):** [Pending]
    Share code beautifully. Synapse recognizes code blocks in posts and applies native syntax highlighting for a wide range of programming languages, making it the go-to social platform for developers to share snippets and solutions.

*   **Rich Text Formatting:** [Pending]
    Express yourself precisely. Users can utilize bold, italics, strikethrough, bullet points, and numbered lists within their posts and comments, ensuring their message is conveyed exactly as intended with clear emphasis and structure.

*   **Spoiler Tags:** [Pending]
    Keep secrets safe. Users can wrap specific text or images in a spoiler mask, requiring viewers to click to reveal the content. This is perfect for discussing movies, books, or sensitive topics without ruining the surprise for others.

### Interactions & Engagement

*   **Post Interactions:** [In Progress]
    Like system implemented. Multi-reaction UI (Love, Haha, Wow, Sad, Angry) pending.

*   **Detailed Post View:** [Completed]
    Dedicated post detail page with full media display, stats, and action bar.

*   **Comment System:** [Completed]
    Comprehensive comment system featuring:
    *   ✅ Nested replies with threading
    *   ✅ Multi-reaction support (Like/Unlike)
    *   ✅ Sorting logic (Featured, Newest, Oldest)
    *   ✅ Rich media support: Images, Videos, GIFs, Voice notes
    *   ✅ Actions: Delete, Edit (with edit indicator)
    *   ✅ Real-time updates via Supabase Realtime
    *   ⏳ Smart comment suggestions via Gemini API (pending)
    *   ⏳ Report functionality (pending)

*   **Tagging & Mentions:** [Pending]
    Vast feature set for context-aware @mention suggestions in posts and comments.

*   **Hashtags:** [Pending]
    Vast feature set for trending topics, hashtag following, and auto-complete.

*   **Repost & Share:** [Pending]
    Functionality to share others' posts to a user's feed, with or without added text.

*   **Bookmarks:** [In Progress]
    Service methods implemented. UI integration pending.

*   **Live Streaming:** [Pending]
    Real-time video broadcasting capabilities.

*   **Synapse Stages (Audio Rooms):** [Pending]
    Drop into a live audio conversation effortlessly. Whether it's a casual hang with friends or a hosted panel discussion, Stages allows users to speak, listen, and react in real-time, with robust moderator controls to manage speakers and listeners.

*   **Creator Tipping & Subscriptions:** [Pending]
    Support your favorite creators directly. This feature enables users to send one-time tips or subscribe for exclusive monthly content, giving creators sustainable ways to earn from their passion directly within the platform.

*   **Synapse Marketplace:** [Pending]
    Buy, sell, and discover unique items locally. A dedicated space for users to list items for sale, browse local listings with rich categorization, and chat securely with buyers or sellers without leaving the app.

*   **Event Hub:** [Pending]
    Plan and discover happenings around you. From virtual webinars to local meetups, users can create rich event pages, manage RSVPs, invite friends, and sync schedules directly to their personal calendar.

*   **Smart Reminders:** [Pending]
    Never miss a beat. Users can set "Remind Me" alerts on any post or thread to receive a notification after a set duration (e.g., 1 hour, tomorrow), perfect for revisiting long reads or checking back on active discussions.

*   **Watch Parties:** [Pending]
    Watch together, even when apart. Users can start a synchronized video session in a Direct Message or Group Chat, allowing everyone to watch videos from supported platforms simultaneously with real-time reactions and chat overlay.

*   **Memories:** [Pending]
    Revisit the past. The platform automatically curates a nostalgic "On This Day" feed, surfacing your posts and interactions from previous years, allowing you to reminisce or share your journey's milestones with your current network.

### User Management & Privacy

*   **User Profile:** [Pending]
    A page displaying user-specific posts, bio, and follow/unfollow controls.

*   **Direct Messaging (Chat):** [Pending]
    Real-time, one-to-one chat functionality.

*   **Groups & Communities:** [Pending]
    Creation of private or public communities for focused discussions.

*   **Moderation Tools:** [Pending]
    Reporting systems and administrative tools for content moderation.

*   **Blocking & Muting:** [Pending]
    Privacy controls to block users or mute their content.

*   **Digital Wellbeing Dashboard:** [Pending]
    Take charge of your digital habits. A personal dashboard that tracks time spent on the app, offers "Take a Break" reminders, and provides a "Focus Mode" to silence non-urgent notifications during study or work hours.

*   **Data Sovereignty:** [Pending]
    You own your digital footprint. A comprehensive tool allowing users to download a complete, portable archive of their data (posts, photos, chats) or permanently delete specific historical data ranges with granular precision.

*   **Profile Pinning:** [Pending]
    Highlight your best moments. Users can select up to three of their favorite or most important posts to pin to the top of their profile grid, ensuring that new visitors see their best content or critical announcements first.

*   **Custom Themes:** [Pending]
    Your app, your vibe. Beyond simple dark and light modes, users can customize their interface with a wide array of accent colors, background patterns, and font choices, creating a truly personalized visual experience.

*   **QR Connect:** [Pending]
    Instant connection. Every user, group, and event generates a unique QR code. Scanning this code with the in-app camera instantly opens the target profile or page, making real-world networking and sharing seamless.

*   **Guest Exploration:** [Pending]
    Look before you leap. New users can browse public feeds, trending topics, and community discussions in a read-only "Guest Mode" without needing to create an account immediately, reducing friction for platform discovery.

*   **Trusted Contacts:** [Pending]
    Safety in your circle. Users can designate specific friends as "Trusted Contacts" to assist with account recovery in case of locked access or to automatically receive their location during emergency situations.

### Advanced Infrastructure & Security

*   **E2EE Protocol Specification:** [Pending]
    Definition of the cryptography and key exchange protocol (referencing Signal Protocol concepts). **Note:** This applies strictly to non-public data such as Direct Messages and Private Groups.

*   **E2EE Implementation:** [Pending]
    Client-side encryption/decryption logic for private channels.

*   **Cross-Platform Sync:** [Pending]
    Strategy to synchronize user data (drafts, read state) seamlessly across devices.

*   **AI-Assisted Accessibility:** [Pending]
    An inclusive experience for everyone. The system automatically generates descriptive alt-text for images using GenAI and supports advanced voice commands for navigating the interface, ensuring the platform is usable by people with varying abilities.

*   **Data Saver Mode:** [Pending]
    Stay connected, even on slow networks. This mode reduces image quality, stops auto-play for videos, and minimizes background data usage, ensuring a smooth experience for users on limited data plans or poor connections.

## Phase 3: Multi-Platform Expansion & Polish

**Goal:** Package the PWA core into native apps, desktop clients, and specialty interfaces.

**Status: 0% - 20% Complete**

*   **Android App:** [Pending]
    Packaging the PWA as a Trusted Web Activity (TWA).

*   **iOS App:** [Pending]
    Packaging the PWA using Capacitor or Cordova.

*   **Desktop App:** [Pending]
    Creating cross-platform wrappers using Electron or Tauri.

*   **ChromeOS Integration:** [Pending]
    Optimization for ChromeOS environments.

*   **Push Notifications:** [Pending]
    Implementation of cross-platform push notifications.

*   **Accessibility (A11Y):** [Pending]
    Ensuring full compatibility with screen readers and keyboard navigation.

## Phase 4: Launch & Maintenance

**Goal:** Finalize the product for public release, execute marketing strategies, and establish maintenance procedures.

**Status: 0% Complete**

*   **Pre-launch Testing:** [Pending]
    Beta testing across various devices and network conditions (offline/2G).

*   **Production Deployment:** [Pending]
    Publishing the PWA to a CDN and native apps to their respective stores.

*   **Marketing & Release Events:** [Pending]
    *   **Physical Release Events:** Organizing launch events in **NYC**, **Bangladesh**, and **Dhaka**.
    *   **Social Media Campaign:** Executing a comprehensive campaign to drive user engagement and platform adoption.

*   **Analytics:** [Pending]
    Setup of tracking for key user journeys and performance metrics.

*   **CI/CD Pipeline:** [Pending]
    Automation of testing and deployment processes.
