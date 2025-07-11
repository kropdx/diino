# Story Features TODO List

Based on the Tiiny documentation, here are the essential features still needed for stories:

## 🚨 Critical Missing Features

### 1. Story Types Support

Currently we only support TEXT stories. We need to add:

- [ ] **URL Stories** - Share external links
  - [ ] Add URL input field to story composer
  - [ ] Validate URLs (ensure they're valid)
  - [ ] Add optional title field
  - [ ] Add commentary field (for adding context to shared links)
  - [ ] Display URL preview cards in feed
  - [ ] Store URL in the `url` column
  - [ ] Update story type to 'URL' in database

- [ ] **REPOST Stories** - Share existing Tiiny stories
  - [ ] Add repost button to each story card
  - [ ] Create repost modal/interface
  - [ ] Add optional commentary field for reposts
  - [ ] Store reference to original story in `original_story_id`
  - [ ] Display repost attribution (show original author)
  - [ ] Update story type to 'REPOST' in database
  - [ ] Show repost chain if story is reposted multiple times

### 2. Comments System

The Comments table exists but is completely unused:

- [ ] Add comment section to story permalink page
- [ ] Create comment input component
- [ ] Display comments thread under stories
- [ ] Add comment count to story cards
- [ ] Implement comment upvoting
- [ ] Add real-time comment updates
- [ ] Add pagination for long comment threads

### 3. Story Display Enhancements

- [ ] Show story type indicator (TEXT/URL/REPOST icons)
- [ ] Display URL domain for URL stories
- [ ] Show repost attribution and chain
- [ ] Add "via @username" for reposts
- [ ] Display commentary separately from content

## 📊 Data & Analytics

### 4. Credibility Score System

Currently not implemented at all:

- [ ] Update credibility score when stories get upvoted
- [ ] Display credibility score on user profiles
- [ ] Show credibility badge next to username in stories
- [ ] Calculate credibility based on:
  - Story upvotes
  - Comment quality
  - Repost frequency
  - Overall engagement

### 5. Follower Count Updates

- [ ] Update `follower_count` in UserTags when followed/unfollowed
- [ ] Display follower count on tag badges
- [ ] Show trending tags based on follower growth

## 🔍 Discovery Features

### 6. UserTag Following System

✅ **COMPLETED** - Core functionality implemented:

- [x] Create follow/unfollow buttons for UserTags
- [x] Build UserTagFollows relationships
- [ ] Create "Following" page to manage followed tags
- [x] Build personalized home feed based on followed UserTags
- [x] Show "Follow" button on user profiles next to each tag

### 7. Feed Improvements

- [x] Filter home feed by followed UserTags only
- [ ] Add "Explore" feed for discovering new content
- [ ] Sort by recent/trending/top
- [ ] Add pagination or infinite scroll
- [x] Show stories from followed UserTags prominently

## 🛡️ Moderation & Safety

### 8. Story Reporting

The StoryReports table exists but is unused:

- [ ] Add "Report" option to story menu
- [ ] Create report modal with reason selection
- [ ] Store reports in StoryReports table
- [ ] Add moderation queue for admins
- [ ] Auto-hide stories with multiple reports

## 🎨 UI/UX Improvements

### 9. Story Composer Enhancements

- [ ] Add story type selector (Text/Link/Repost)
- [ ] Show different UI based on selected type
- [ ] Add URL preview when pasting links
- [ ] Character count for text stories
- [ ] Markdown preview for text stories
- [ ] Tag autocomplete/suggestions

### 10. Story Card Improvements

- [ ] Add dropdown menu (Edit/Delete/Report)
- [ ] Show engagement metrics more prominently
- [ ] Add share button (copy link with toast)
- [ ] Quick repost button
- [ ] Hover to preview full content

## 🔧 Technical Debt

### 11. Database Constraints

- [ ] Ensure story_type validation works
- [ ] Verify cascade deletes are functioning
- [ ] Add indexes for performance
- [ ] Implement proper transactions for complex operations

### 12. API Improvements

- [ ] Add rate limiting to prevent spam
- [ ] Implement proper error handling
- [ ] Add input validation
- [ ] Create batch endpoints for efficiency

## 📱 Future Considerations

### 13. Rich Media Support

- [ ] Image uploads for stories
- [ ] Video embeds
- [ ] Code syntax highlighting
- [ ] Twitter/X embeds
- [ ] Markdown rendering

### 14. Advanced Features

- [ ] Story drafts
- [ ] Scheduled posting
- [ ] Story collections/threads
- [ ] Export stories
- [ ] Story analytics dashboard

## Priority Order

1. **Phase 1 (Core Missing Features)**
   - URL story type
   - REPOST story type
   - UserTag following system

2. **Phase 2 (Engagement)**
   - Comments system
   - Credibility scores
   - Improved feeds

3. **Phase 3 (Safety & Polish)**
   - Reporting system
   - UI enhancements
   - Rich media support

The most critical missing piece is the **UserTag following system**, as this is the core differentiator of Tiiny - following interests rather than just people.
