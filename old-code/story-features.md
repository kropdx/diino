# Tiiny Story Features Roadmap

Based on the Tiiny application documentation, here's a comprehensive roadmap of features that need to be implemented for stories:

## ✅ Completed Features

### 1. Basic Story Creation

- [x] Create TEXT stories with content
- [x] Associate stories with UserTags
- [x] Generate unique short IDs for permalinks
- [x] Display stories in feed
- [x] Story permalinks (`/{username}/{shortId}`)

### 2. Story Engagement

- [x] Upvote/like functionality (heart icon)
- [x] Track upvotes in database
- [x] Show upvote count on stories
- [x] Persist like state for logged-in users

### 3. Tag Following System

- [x] Follow/unfollow user tags on profile pages
- [x] Follow/Following buttons with hover states
- [x] Track following relationships in database
- [x] Filter main feed to show only followed tags
- [x] Prevent following your own tags

### 4. Story Management

- [x] Delete stories with proper foreign key cleanup
- [x] Trash system for deleted tags
- [x] Move stories to user-specific trash tags
- [x] Preserve original tag information in trash
- [x] Story deletion with cascading cleanup

## 🚧 Core Features to Implement

### 1. Story Types Support

- [ ] **URL Stories**: Share external links
  - [ ] URL input field in story composer
  - [ ] Title extraction from URL (optional)
  - [ ] Display URL preview card
  - [ ] Commentary field for adding context
- [ ] **REPOST Stories**: Share existing Tiiny stories
  - [ ] Repost button on stories
  - [ ] Link to original story
  - [ ] Optional commentary on reposts
  - [ ] Show repost chain/attribution

### 2. Comments System

- [ ] Add comment section to story permalink page
- [ ] Create comment composer
- [ ] Display comment thread
- [ ] Comment upvoting
- [ ] Comment count display on story cards
- [ ] Real-time comment updates

### 3. User Tag System Enhancements

- [ ] Display credibility score for each UserTag
- [ ] Show follower count for UserTags
- [x] Allow following specific UserTags (not just users)
- [ ] Create dedicated UserTag pages (`/{username}/tag/{tagname}`)
- [ ] UserTag-specific feeds

### 4. Story Discovery & Feed

- [ ] Home feed based on followed UserTags
- [ ] Trending stories algorithm
- [ ] Tag-based story discovery
- [ ] Search functionality for stories
- [ ] Filter stories by type (TEXT, URL, REPOST)

### 5. Story Management

- [ ] Edit own stories (within time limit)
- [ ] Delete own stories
- [ ] Story drafts/autosave
- [ ] Story scheduling

### 6. Social Features

- [ ] Share story to external platforms
- [ ] Copy permalink with toast notification
- [ ] Story bookmarking/save for later
- [ ] Story collections/lists

### 7. Moderation & Reporting

- [ ] Report story functionality
- [ ] Report reasons dropdown
- [ ] Moderation queue for admins
- [ ] Hide reported content (based on threshold)

### 8. Analytics & Insights

- [ ] View count tracking
- [ ] Story performance metrics
- [ ] UserTag analytics dashboard
- [ ] Engagement trends

### 9. Rich Content Support

- [ ] Markdown support in TEXT stories
- [ ] Code syntax highlighting
- [ ] Image uploads/embeds
- [ ] Video embeds (YouTube, etc.)
- [ ] Twitter/X embed support

### 10. Performance & UX

- [ ] Infinite scroll for story feeds
- [ ] Optimistic UI updates
- [ ] Real-time updates via WebSockets
- [ ] Story preview on hover
- [ ] Keyboard shortcuts

## 🎯 Advanced Features (Future)

### 1. Reputation System

- [ ] Calculate credibility scores based on:
  - Story upvotes
  - Comment quality
  - Repost frequency
  - Community engagement
- [ ] Display reputation badges
- [ ] Reputation leaderboards by tag

### 2. Monetization

- [ ] Tip/support creators
- [ ] Premium UserTag subscriptions
- [ ] Sponsored stories (clearly marked)
- [ ] Creator revenue sharing

### 3. API & Integrations

- [ ] Public API for stories
- [ ] RSS feeds for UserTags
- [ ] Browser extension for sharing
- [ ] Mobile app API support

### 4. AI Features

- [ ] AI-powered story recommendations
- [ ] Auto-tagging suggestions
- [ ] Content summarization
- [ ] Duplicate content detection

## 📊 Database Considerations

Based on the schema, we need to ensure:

- Proper indexes on frequently queried fields
- Efficient pagination for large datasets
- Denormalized counters are kept in sync
- Cascade deletes are handled properly
- Transaction consistency for upvotes/follows

## 🔐 Security & Privacy

- [ ] Private story option
- [ ] Block/mute functionality
- [ ] Content filtering preferences
- [ ] GDPR compliance features
- [ ] Rate limiting on actions

## Priority Order

1. **Phase 1**: URL and REPOST story types
2. **Phase 2**: Comments system
3. **Phase 3**: UserTag following and feeds
4. **Phase 4**: Discovery and search
5. **Phase 5**: Advanced features

This roadmap aligns with Tiiny's core mission of creating a high-signal environment where users can discover and share quality content based on interests rather than personalities.
