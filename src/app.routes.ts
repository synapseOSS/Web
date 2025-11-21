
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { DownloadsComponent } from './pages/downloads.component';
import { ChangelogComponent } from './pages/changelog.component';
import { AuthComponent } from './pages/auth.component';
import { AdminComponent } from './pages/admin.component';
import { DocsComponent } from './pages/docs.component';
import { PricingComponent } from './pages/pricing.component';
import { SupportComponent } from './pages/support.component';
import { RoadmapComponent } from './pages/roadmap.component';
import { AppLayoutComponent } from './pages/app-layout.component';
import { LandingLayoutComponent } from './layouts/landing-layout.component';
import { FeedComponent } from './pages/feed.component';
import { MessagesComponent } from './pages/messages.component';
import { ProfileComponent } from './pages/profile.component';
import { EditProfileComponent } from './pages/edit-profile.component';
import { ComposeComponent } from './pages/compose.component';
import { PostDetailComponent } from './pages/post-detail.component';
import { FollowersComponent } from './pages/followers.component';
import { AboutComponent } from './pages/about.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Web App Routes (Protected, No Landing Navbar/Footer)
  { 
    path: 'app', 
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'feed', pathMatch: 'full' },
      { path: 'feed', component: FeedComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'profile/:username', component: ProfileComponent },
      { path: 'profile/:username/:type', component: FollowersComponent },
      { path: 'edit-profile', component: EditProfileComponent },
      { path: 'compose', component: ComposeComponent },
      { path: 'post/:id', component: PostDetailComponent }
    ]
  },

  // Landing Page Routes (Public, With Navbar/Footer)
  {
    path: '',
    component: LandingLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'downloads', component: DownloadsComponent },
      { path: 'docs', component: DocsComponent },
      { path: 'docs/:topic', component: DocsComponent },
      { path: 'pricing', component: PricingComponent },
      { path: 'support', component: SupportComponent },
      { path: 'roadmap', component: RoadmapComponent },
      { path: 'changelog', component: ChangelogComponent },
      { path: 'about', component: AboutComponent },
      { path: 'login', component: AuthComponent },
      { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
    ]
  },
  
  // Fallback
  { path: '**', redirectTo: '' }
];
