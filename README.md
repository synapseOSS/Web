<div align="center">
  <img src="public/icons/icon-512x512.png" alt="Synapse Logo" width="120" height="120">
  
  # Synapse
  
  **Fast, offline-first, open-source social media platform**
  
  Connect with your community, share moments, and stay in sync even without internet.
  
  [![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)](https://angular.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com)
  [![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
  
  [Live Demo](https://synapse.social) · [Documentation](https://synapse.social/docs) · [Report Bug](https://github.com/yourusername/synapse/issues) · [Request Feature](https://github.com/yourusername/synapse/issues)
  
</div>

---

## ✨ Features

<table>
  <tr>
    <td width="50%">
      
### 🚀 Performance & Reliability
- **Offline-First Architecture** - Works seamlessly without internet
- **Progressive Web App** - Install as native app on any device
- **Service Worker Caching** - Lightning-fast load times
- **Optimistic UI Updates** - Instant feedback on actions
      
### 💬 Social Features
- **Real-time Feed** - Live updates from your network
- **Direct Messaging** - Private conversations
- **Stories** - 24-hour temporary content
- **Bookmarks** - Save posts for later
- **Notifications** - Stay updated with activity
      
    </td>
    <td width="50%">
      
### 👤 User Experience
- **Customizable Profiles** - Express your identity
- **Follow System** - Build your network
- **Explore Page** - Discover trending content
- **Dark/Light Mode** - Automatic theme switching
- **Responsive Design** - Perfect on any screen size
      
### 🔒 Security & Privacy
- **Supabase Auth** - Secure authentication
- **Row Level Security** - Database-level protection
- **Password Reset** - Easy account recovery
- **Session Management** - Secure token handling
      
    </td>
  </tr>
</table>

## 🛠️ Tech Stack

<table>
  <tr>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg" width="48" height="48" alt="Angular" />
      <br>Angular 21
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
      <br>TypeScript
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind" />
      <br>Tailwind CSS
    </td>
    <td align="center" width="96">
      <img src="https://supabase.com/favicon/favicon-32x32.png" width="48" height="48" alt="Supabase" />
      <br>Supabase
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="48" height="48" alt="Firebase" />
      <br>Firebase
    </td>
    <td align="center" width="96">
      <img src="https://vitejs.dev/logo.svg" width="48" height="48" alt="Vite" />
      <br>Vite
    </td>
  </tr>
</table>

**Frontend**: Angular 21 · TypeScript 5.9 · Tailwind CSS · RxJS  
**Backend**: Supabase (PostgreSQL + Auth + Realtime)  
**Storage**: Cloudinary / Cloudflare R2  
**Analytics**: Firebase Analytics  
**Build**: Vite · Angular CLI  
**Testing**: Jasmine · Karma · Fast-check

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ and npm installed
- **Git** for version control
- A **Supabase** account (free tier available)
- (Optional) **Firebase** account for analytics

### Installation

1️⃣ **Clone the repository**
```bash
git clone https://github.com/yourusername/synapse.git
cd synapse
```

2️⃣ **Install dependencies**
```bash
npm install
```

3️⃣ **Set up environment variables**
```bash
cp .env.example .env.local
```

4️⃣ **Configure your `.env.local`**

```env
# Required: Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Optional: Firebase Analytics
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Optional: AI Features
VITE_GEMINI_API_KEY=your_gemini_key
```

5️⃣ **Set up Supabase database**
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

6️⃣ **Start the development server**
```bash
npm run dev
```

🎉 Open [http://localhost:3000](http://localhost:3000) in your browser!

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run test suite |

### First-Time Setup Checklist

- [ ] Clone repository and install dependencies
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy environment variables from `.env.example`
- [ ] Run database migrations
- [ ] Configure image upload provider (Cloudinary or R2)
- [ ] (Optional) Set up Firebase for analytics
- [ ] Start development server and create your first account!

## 📁 Project Structure

```
synapse/
├── 📂 src/
│   ├── 📄 app.component.ts          # Root component
│   ├── 📄 app.routes.ts             # Route configuration
│   ├── 📂 components/               # Reusable UI components
│   │   ├── story-archive.component.ts
│   │   ├── post-card.component.ts
│   │   └── ...
│   ├── 📂 directives/               # Custom Angular directives
│   ├── 📂 guards/                   # Route guards (auth, etc.)
│   │   └── auth.guard.ts
│   ├── 📂 layouts/                  # Layout components
│   │   ├── landing-layout.component.ts
│   │   └── app-layout.component.ts
│   ├── 📂 pages/                    # Page components
│   │   ├── feed.component.ts
│   │   ├── messages.component.ts
│   │   ├── profile.component.ts
│   │   └── ...
│   ├── 📂 services/                 # Business logic services
│   │   ├── auth.service.ts
│   │   ├── pwa.service.ts
│   │   └── ...
│   └── 📄 firebase.config.ts        # Firebase configuration
├── 📂 public/
│   ├── 📂 icons/                    # PWA icons (192x192, 512x512)
│   ├── 📄 manifest.json             # PWA manifest
│   ├── 📄 sw.js                     # Service worker
│   ├── 📄 offline.html              # Offline fallback page
│   └── 📄 robots.txt                # SEO configuration
├── 📂 supabase/
│   └── 📂 migrations/               # Database migrations
├── 📄 angular.json                  # Angular CLI config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependencies
└── 📄 .env.example                  # Environment template
```

## 🗺️ Application Routes

### Public Routes
| Route | Description | Features |
|-------|-------------|----------|
| `/` | Landing page | Feature showcase, hero section, CTAs |
| `/login` | Authentication | Sign in/up, password reset |
| `/docs` | Documentation | Guides, API reference, tutorials |
| `/pricing` | Pricing plans | Subscription tiers and features |
| `/roadmap` | Feature roadmap | Upcoming features and timeline |
| `/changelog` | Version history | Release notes and updates |
| `/about` | About page | Mission, team, contact info |
| `/support` | Help center | FAQs, troubleshooting, contact |

### Protected Routes (Requires Authentication)
| Route | Description | Features |
|-------|-------------|----------|
| `/app/feed` | Main feed | Posts from followed users, infinite scroll |
| `/app/messages` | Direct messages | Real-time chat, conversations list |
| `/app/profile` | User profile | Posts, followers, following, bio |
| `/app/profile/:username` | Other user profile | View any user's public profile |
| `/app/compose` | Create post | Text, images, hashtags, mentions |
| `/app/explore` | Discover | Trending posts, suggested users |
| `/app/bookmarks` | Saved posts | Collection of bookmarked content |
| `/app/notifications` | Activity feed | Likes, comments, follows, mentions |
| `/app/settings` | User settings | Account, privacy, appearance |
| `/app/archive` | Story archive | Past stories, highlights |
| `/app/post/:id` | Post detail | Single post view with comments |
| `/admin` | Admin panel | User management, analytics |

## 🔐 Authentication & Security

Synapse uses **Supabase Auth** for enterprise-grade authentication:

### Supported Auth Methods
- ✉️ **Email/Password** - Traditional authentication
- 🔗 **Magic Links** - Passwordless email login
- 🔄 **Password Reset** - Secure recovery flow
- 🎫 **Session Management** - JWT-based tokens

### Security Features
- 🛡️ **Row Level Security (RLS)** - Database-level access control
- 🔒 **Auth Guards** - Route protection with `authGuard`
- 🚫 **CSRF Protection** - Built-in security measures
- 🔑 **Secure Token Storage** - HttpOnly cookies support
- ⏱️ **Session Expiry** - Automatic token refresh

### Implementation Example
```typescript
// Protected route configuration
{
  path: 'app',
  component: AppLayoutComponent,
  canActivate: [authGuard],  // Requires authentication
  children: [...]
}
```

## 🗄️ Database Schema

Synapse uses **Supabase (PostgreSQL)** with the following core tables:

### Core Tables
- **users** - User profiles, bio, avatar, settings
- **posts** - User-generated content with metadata
- **comments** - Threaded discussions on posts
- **likes** - Post and comment reactions
- **follows** - User relationship graph
- **messages** - Direct messaging system
- **notifications** - Activity feed events
- **bookmarks** - Saved posts per user
- **stories** - Temporary 24-hour content

### Database Management

**Apply migrations:**
```bash
supabase db push
```

**Create new migration:**
```bash
supabase migration new migration_name
```

**Reset database (dev only):**
```bash
supabase db reset
```

**View database in Studio:**
```bash
supabase studio
```

All migrations are version-controlled in `supabase/migrations/` for reproducible deployments.

## 📸 Image Upload & Storage

Synapse supports multiple storage providers for flexibility:

### Option 1: Cloudinary (Recommended)
**Pros:** Easy setup, generous free tier, automatic optimization  
**Configuration:**
```env
# Already configured with default preset
Cloud Name: djw3fgbls
Preset: synapse (unsigned, no overwrite)
```

**Features:**
- ✅ Automatic image optimization
- ✅ CDN delivery worldwide
- ✅ On-the-fly transformations
- ✅ No backend required (unsigned uploads)

### Option 2: Cloudflare R2
**Pros:** S3-compatible, no egress fees, cost-effective at scale  
**Configuration:**
```env
Account ID: 76bea77fbdac3cdf71e6cf580f270ea6
Bucket: synapse
Endpoint: https://76bea77fbdac3cdf71e6cf580f270ea6.r2.cloudflarestorage.com
```

**Features:**
- ✅ S3-compatible API
- ✅ Zero egress fees
- ✅ Global edge network
- ✅ Cost-effective for large files

### Supported Formats
- Images: JPEG, PNG, WebP, GIF, SVG
- Max size: 10MB per upload
- Automatic format conversion and compression

## 📱 Progressive Web App (PWA)

Synapse is a **fully-featured PWA** that works like a native app:

### PWA Capabilities
| Feature | Description | Status |
|---------|-------------|--------|
| 📥 **Installable** | Add to home screen on any device | ✅ |
| 🔌 **Offline Support** | Works without internet connection | ✅ |
| ⚡ **Fast Loading** | Service worker caching | ✅ |
| 🎯 **App Shortcuts** | Quick actions from home screen | ✅ |
| 📲 **Push Notifications** | Real-time alerts (coming soon) | 🚧 |
| 🔄 **Background Sync** | Sync when connection restored | 🚧 |
| 📍 **Standalone Mode** | Runs in its own window | ✅ |

### App Shortcuts
Quick access from your home screen:
- 📰 **Feed** - Jump to your social feed
- ✍️ **Compose** - Create a new post instantly
- 💬 **Messages** - Open direct messages

### Installation
**Desktop (Chrome/Edge):**
1. Click the install icon in the address bar
2. Click "Install" in the prompt

**Mobile (iOS/Android):**
1. Tap the share button
2. Select "Add to Home Screen"
3. Confirm installation

### Offline Features
When offline, you can:
- ✅ View cached posts and profiles
- ✅ Compose posts (synced when online)
- ✅ Browse bookmarks
- ✅ View the offline fallback page

## 🤝 Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements, all contributions are welcome.

### How to Contribute

1️⃣ **Fork the repository**
```bash
# Click the "Fork" button on GitHub
```

2️⃣ **Clone your fork**
```bash
git clone https://github.com/YOUR_USERNAME/synapse.git
cd synapse
```

3️⃣ **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```

4️⃣ **Make your changes**
```bash
# Write code, add tests, update docs
```

5️⃣ **Commit with conventional commits**
```bash
git commit -m "feat: add amazing feature"
git commit -m "fix: resolve bug in feed"
git commit -m "docs: update README"
```

6️⃣ **Push to your fork**
```bash
git push origin feature/amazing-feature
```

7️⃣ **Open a Pull Request**
- Go to the original repository
- Click "New Pull Request"
- Select your branch and submit

### Contribution Guidelines

- ✅ Follow the existing code style
- ✅ Write meaningful commit messages
- ✅ Add tests for new features
- ✅ Update documentation as needed
- ✅ Keep PRs focused and atomic
- ✅ Be respectful and constructive

### Development Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
npm run dev
npm test

# Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### Code Style

- Use TypeScript strict mode
- Follow Angular style guide
- Use Tailwind CSS for styling
- Write self-documenting code
- Add comments for complex logic

### Need Help?

- 💬 Join our discussions on GitHub
- 📧 Email us at support@synapse.social
- 📖 Read the [Contributing Guide](CONTRIBUTING.md)

## 📊 Performance

Synapse is built for speed:

- ⚡ **Lighthouse Score**: 95+ across all metrics
- 🚀 **First Contentful Paint**: < 1.5s
- 📦 **Bundle Size**: Optimized with code splitting
- 🔄 **Real-time Updates**: WebSocket connections
- 💾 **Caching Strategy**: Service worker + IndexedDB

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Testing Stack:**
- **Unit Tests**: Jasmine + Karma
- **Property-Based Testing**: Fast-check
- **E2E Tests**: (Coming soon)

## 🚢 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/synapse)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/synapse)

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy
```

### Environment Variables

Don't forget to set environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_FIREBASE_*` (optional)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2024 Synapse Contributors
```

## 💬 Support & Community

### Get Help
- 📖 **Documentation**: [synapse.social/docs](https://synapse.social/docs)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/synapse/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/synapse/discussions)
- 📧 **Email**: support@synapse.social

### Stay Connected
- 🌟 Star us on [GitHub](https://github.com/yourusername/synapse)
- 🐦 Follow us on Twitter [@SynapseSocial](https://twitter.com/SynapseSocial)
- 💼 Connect on [LinkedIn](https://linkedin.com/company/synapse)
- 📱 Join our [Discord](https://discord.gg/synapse)

## 🗓️ Roadmap

### Q1 2024
- [x] Core social features (feed, posts, profiles)
- [x] Real-time messaging
- [x] PWA implementation
- [ ] Push notifications
- [ ] Video support

### Q2 2024
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced search
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] API v2

### Q3 2024
- [ ] Monetization features
- [ ] Live streaming
- [ ] Groups & communities
- [ ] Marketplace

See the full [Roadmap](https://synapse.social/roadmap) for details.

## 📝 Changelog

### v0.1.0 (Current)
- Initial release
- Core social features
- PWA support
- Real-time messaging
- Dark mode

See [CHANGELOG.md](CHANGELOG.md) for full version history.

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Angular](https://angular.dev) - The web framework
- [Supabase](https://supabase.com) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Firebase](https://firebase.google.com) - Analytics
- [Vite](https://vitejs.dev) - Build tool

Special thanks to all [contributors](https://github.com/yourusername/synapse/graphs/contributors) who help make Synapse better!

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/synapse&type=Date)](https://star-history.com/#yourusername/synapse&Date)

---

<div align="center">
  
  **Built with ❤️ by the Synapse community**
  
  [Website](https://synapse.social) · [Documentation](https://synapse.social/docs) · [GitHub](https://github.com/yourusername/synapse)
  
  If you find Synapse useful, please consider giving it a ⭐ on GitHub!
  
</div>
