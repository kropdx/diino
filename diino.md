# Diino - Social Content Sharing Platform

## Project Overview

Diino is a modern social content sharing platform built with Next.js 15, Supabase, and TypeScript. It allows users to create and share content through a unique tag-based system, where users own their own "channels" (tags) and can share text posts, URLs, and reposts.

## Core Architecture

### Technology Stack
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Authentication**: Supabase Auth (migrated from Clerk)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React hooks and context
- **Caching**: In-memory cache for user data

### Key Features
1. **Unique Lock Screen**: Custom unlock mechanism before accessing sign-up
2. **Tag-Based Content System**: Users create and own tags (channels)
3. **Story Types**: Text posts, URL shares, and reposts with commentary
4. **Following System**: Follow specific user tags, not users
5. **Bookmarking**: Save stories for later
6. **Trash System**: Soft delete with recovery option
7. **Credibility Scoring**: Tag reputation system
8. **URL Metadata Extraction**: Automatic title and favicon fetching

## Database Schema

### User Table
```sql
User {
  user_id: UUID (Primary Key)
  email: String (Unique, Required)
  username: String (Unique, Optional)
  display_name: String (Optional)
  bio: String (Optional)
  url: String (Optional)
  profile_image_source_url: String (Optional)
  profile_image_optimized_url: String (Optional)
  onboarded: Boolean (Default: false)
  created_at: Timestamp
  updated_at: Timestamp
  auth_id: String (Supabase Auth ID)
  clerk_id: String (Legacy, for migration)
}
```

### CanonicalTag Table
```sql
CanonicalTag {
  tag_id: UUID (Primary Key)
  name: String (Unique, Required, Lowercase)
  created_at: Timestamp
}
```

### UserTag Table
```sql
UserTag {
  user_tag_id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> User)
  tag_id: UUID (Foreign Key -> CanonicalTag)
  credibility_score: BigInt (Default: 0)
  follower_count: BigInt (Default: 0)
  created_at: Timestamp
  updated_at: Timestamp
  
  Unique: (user_id, tag_id)
}
```

### Story Table
```sql
Story {
  story_id: UUID (Primary Key)
  short_id: String (Unique, URL-friendly ID)
  author_id: UUID (Foreign Key -> User)
  user_tag_id: UUID (Foreign Key -> UserTag)
  story_type: Enum ('TEXT', 'URL', 'REPOST')
  content: Text (Optional)
  url: String (Optional)
  title: String (Optional, for URL stories)
  favicon: String (Optional, base64 or URL)
  favicon_blob_url: String (Optional)
  favicon_imgix_url: String (Optional)
  subtag: String (Optional, hashtag within tag)
  upvotes: BigInt (Default: 0)
  original_story_id: UUID (Optional, for reposts)
  original_user_tag_id: UUID (Optional, stores original tag when moved to trash)
  commentary: Text (Optional, for reposts)
  created_at: Timestamp
  updated_at: Timestamp
}
```

### StoryUpvote Table
```sql
StoryUpvote {
  user_id: UUID (Foreign Key -> User)
  story_id: UUID (Foreign Key -> Story)
  created_at: Timestamp
  
  Primary Key: (user_id, story_id)
}
```

### Bookmark Table
```sql
Bookmark {
  user_id: UUID (Foreign Key -> User)
  story_id: UUID (Foreign Key -> Story)
  created_at: Timestamp
  
  Primary Key: (user_id, story_id)
}
```

### UserTagFollow Table
```sql
UserTagFollow {
  follower_user_id: UUID (Foreign Key -> User)
  followed_user_tag_id: UUID (Foreign Key -> UserTag)
  created_at: Timestamp
  
  Primary Key: (follower_user_id, followed_user_tag_id)
}
```

### Comment Table
```sql
Comment {
  comment_id: UUID (Primary Key)
  story_id: UUID (Foreign Key -> Story)
  author_id: UUID (Foreign Key -> User)
  content: Text (Required)
  upvotes: BigInt (Default: 0)
  created_at: Timestamp
  updated_at: Timestamp
}
```

### CommentUpvote Table
```sql
CommentUpvote {
  user_id: UUID (Foreign Key -> User)
  comment_id: UUID (Foreign Key -> Comment)
  created_at: Timestamp
  
  Primary Key: (user_id, comment_id)
}
```

### StoryReport Table
```sql
StoryReport {
  report_id: UUID (Primary Key)
  story_id: UUID (Foreign Key -> Story)
  reporting_user_id: UUID (Foreign Key -> User)
  reason: Text (Required)
  status: Enum ('PENDING', 'REVIEWED', 'RESOLVED')
  created_at: Timestamp
  updated_at: Timestamp
}
```

### AdminUser Table
```sql
AdminUser {
  admin_id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> User, Unique)
  created_at: Timestamp
}
```

## Feed Building Queries

### Home Feed Query
The home feed shows stories from tags the user follows, plus their own stories:

```sql
-- Get stories for authenticated user's home feed
SELECT 
  s.*,
  u.username, u.display_name, u.profile_image_optimized_url,
  ut.credibility_score, ut.follower_count,
  ct.name as tag_name,
  COUNT(su.user_id) as has_upvoted,
  COUNT(b.user_id) as has_bookmarked,
  COUNT(reposts.story_id) as repost_count,
  os.* as original_story -- For reposts
FROM Story s
JOIN User u ON s.author_id = u.user_id
JOIN UserTag ut ON s.user_tag_id = ut.user_tag_id
JOIN CanonicalTag ct ON ut.tag_id = ct.tag_id
LEFT JOIN StoryUpvote su ON s.story_id = su.story_id AND su.user_id = :current_user_id
LEFT JOIN Bookmark b ON s.story_id = b.story_id AND b.user_id = :current_user_id
LEFT JOIN Story reposts ON s.story_id = reposts.original_story_id
LEFT JOIN Story os ON s.original_story_id = os.story_id
WHERE 
  -- Exclude trash tags
  ct.name NOT LIKE 'trash_%'
  AND (
    -- Stories from followed tags
    ut.user_tag_id IN (
      SELECT followed_user_tag_id 
      FROM UserTagFollow 
      WHERE follower_user_id = :current_user_id
    )
    -- Or user's own stories
    OR s.author_id = :current_user_id
  )
ORDER BY s.created_at DESC
LIMIT 50;
```

### Tag Feed Query
Shows all stories for a specific user's tag:

```sql
-- Get stories for a specific user tag
SELECT 
  s.*,
  u.username, u.display_name,
  COUNT(su.user_id) as has_upvoted,
  COUNT(b.user_id) as has_bookmarked
FROM Story s
JOIN User u ON s.author_id = u.user_id
JOIN UserTag ut ON s.user_tag_id = ut.user_tag_id
JOIN CanonicalTag ct ON ut.tag_id = ct.tag_id
LEFT JOIN StoryUpvote su ON s.story_id = su.story_id AND su.user_id = :current_user_id
LEFT JOIN Bookmark b ON s.story_id = b.story_id AND b.user_id = :current_user_id
WHERE 
  u.username = :username
  AND ct.name = :tag_name
  AND ct.name NOT LIKE 'trash_%'
ORDER BY s.created_at DESC;
```

### Bookmarks Feed Query
```sql
-- Get user's bookmarked stories
SELECT 
  s.*,
  u.username, u.display_name,
  ut.credibility_score, ut.follower_count,
  ct.name as tag_name,
  true as has_bookmarked,
  COUNT(su.user_id) as has_upvoted
FROM Bookmark b
JOIN Story s ON b.story_id = s.story_id
JOIN User u ON s.author_id = u.user_id
JOIN UserTag ut ON s.user_tag_id = ut.user_tag_id
JOIN CanonicalTag ct ON ut.tag_id = ct.tag_id
LEFT JOIN StoryUpvote su ON s.story_id = su.story_id AND su.user_id = :current_user_id
WHERE 
  b.user_id = :current_user_id
  AND ct.name NOT LIKE 'trash_%'
GROUP BY s.story_id, u.user_id, ut.user_tag_id, ct.tag_id
ORDER BY b.created_at DESC;
```

### Trash Feed Query
```sql
-- Get user's trashed stories
SELECT 
  s.*,
  ct_original.name as original_tag_name,
  ct_original.tag_id as original_tag_id
FROM Story s
JOIN UserTag ut ON s.user_tag_id = ut.user_tag_id
JOIN CanonicalTag ct ON ut.tag_id = ct.tag_id
LEFT JOIN CanonicalTag ct_original ON s.original_user_tag_id = ct_original.tag_id
WHERE 
  s.author_id = :current_user_id
  AND ct.name = CONCAT('trash_', :current_user_id)
ORDER BY s.updated_at DESC;
```

## Key Functionality

### 1. Lock Screen System
- Custom unlock mechanism at `/lock`
- Combination stored in environment variable `LOCK_COMBINATION`
- Sets HTTP-only cookie `unlock_verified` on success
- Middleware protects `/sign-up` route, requiring unlock first

### 2. Authentication Flow
- Supabase Auth handles user authentication
- On first sign-in, creates User record with auth_id
- Username selection during onboarding
- Profile completion (display name, bio, URL)

### 3. Tag System
- Users create tags (channels) they own
- Tags are normalized to lowercase
- Each UserTag tracks credibility score and follower count
- Trash tags automatically created (pattern: `trash_[user_id]`)

### 4. Story Creation
- **Text Stories**: Plain text content
- **URL Stories**: Automatic metadata extraction
  - Fetches title from URL
  - Extracts favicon (stored as base64 or URL)
  - Falls back to Google favicon service
- **Reposts**: Reference original story with optional commentary

### 5. Feed Algorithm
- No complex algorithm - chronological order
- Home feed shows:
  - Stories from followed tags
  - User's own stories
- Excludes trash tags from all feeds

### 6. Interaction Features
- **Upvoting**: Like stories (updates count)
- **Bookmarking**: Save for later
- **Following**: Follow specific user tags
- **Comments**: Nested discussion on stories

### 7. Trash System
- Soft delete by moving to user's trash tag
- Stores original tag ID for restoration
- 30-day retention (managed externally)
- Bulk operations when deleting tags

### 8. URL Processing
```javascript
// URL metadata extraction flow
1. User submits URL
2. Frontend extracts base URL info
3. API fetches page content
4. Extracts <title> tag
5. Looks for favicon in multiple locations:
   - <link rel="icon">
   - <link rel="shortcut icon">
   - /favicon.ico
6. Converts favicon to base64 if small enough
7. Stores with story
```

### 9. Credibility System
- Each UserTag has credibility_score
- Intended for future reputation features
- Currently tracks but doesn't affect visibility

### 10. Search and Discovery
- Username-based navigation: /@username
- Tag pages: /@username/tagname
- Direct story links: /@username/tagname/storyId

## API Endpoints

### Authentication
- `GET /api/user/me` - Get current user
- `POST /api/user/onboard` - Complete onboarding
- `POST /api/verify-combination` - Verify lock screen

### Stories
- `GET /api/stories` - Get feed stories
- `POST /api/stories` - Create new story
- `GET /api/story/[storyId]` - Get single story
- `PUT /api/stories/[storyId]` - Update story
- `DELETE /api/stories/[storyId]` - Move to trash
- `POST /api/stories/[storyId]/like` - Toggle upvote

### Tags
- `GET /api/user/tags` - Get user's tags
- `POST /api/user/tags` - Create new tag
- `DELETE /api/user/tags/[tagId]` - Delete tag (moves stories to trash)
- `POST /api/user/tags/[tagId]/follow` - Follow tag
- `DELETE /api/user/tags/[tagId]/follow` - Unfollow tag

### Bookmarks
- `GET /api/bookmarks` - Get bookmarked stories
- `POST /api/bookmarks` - Toggle bookmark

### User Management
- `GET /api/user` - Get user profile
- `PUT /api/user` - Update profile
- `GET /api/check-username` - Check username availability
- `GET /api/user/trash` - Get trash contents

## Security

### Row Level Security (RLS)
All tables have RLS policies:
- Users can only read their own user data
- Stories are public read, owner write
- Bookmarks/upvotes are user-specific
- Trash tags only visible to owner

### Authentication Middleware
```typescript
// Protects routes requiring authentication
if (!user && protectedPaths.includes(pathname)) {
  return redirect('/');
}

// Lock screen protection for sign-up
if (pathname === '/sign-up' && !unlockVerified) {
  return redirect('/lock');
}
```

## Performance Optimizations

### Caching Strategy
- User data cached for 5 minutes
- Reduces database queries for frequent user lookups
- Cache invalidated on user updates

### Database Optimizations
- Indexes on frequently queried columns
- Join strategies for feed queries
- Pagination for large result sets

### Frontend Optimizations
- Server-side rendering for SEO
- Incremental static regeneration
- Image optimization for avatars

## Migration from Clerk to Supabase

The platform was migrated from Clerk to Supabase Auth:
1. Added `auth_id` column to User table
2. Created Supabase auth triggers to sync users
3. Maintained `clerk_id` for backwards compatibility
4. Updated all auth checks to use Supabase

## Future Enhancements

1. **Full-text Search**: PostgreSQL text search for stories
2. **Notifications**: Real-time updates for follows/upvotes
3. **Analytics**: Tag performance metrics
4. **Moderation**: Report handling system
5. **API Rate Limiting**: Prevent abuse
6. **Mobile App**: React Native client
7. **Federation**: ActivityPub support for decentralization