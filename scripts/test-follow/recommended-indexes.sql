-- Recommended Database Indexes for Follow Functionality
-- Generated from performance testing on January 13, 2025

-- ============================================
-- EXISTING INDEXES (Already in place)
-- ============================================
-- These indexes were discovered during performance testing:
-- ✅ idx_story_author - ON "Story"(author_id)
-- ✅ idx_story_tag - ON "Story"(user_tag_id)
-- ✅ User_username_key - ON "User"(username)
-- ✅ Follow_pkey - PRIMARY KEY ON "Follow"(follower_user_id, channel_type, channel_id)

-- ============================================
-- RECOMMENDED NEW INDEXES
-- ============================================

-- 1. Optimize Story table for feed queries (add created_at for sorting)
-- These composite indexes will help with feed generation queries
CREATE INDEX IF NOT EXISTS idx_story_author_created 
ON "Story"(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_usertag_created 
ON "Story"(user_tag_id, created_at DESC);

-- 2. Optimize Follow table for reverse lookups
-- This helps find who follows a specific user/tag
CREATE INDEX IF NOT EXISTS idx_follow_channel 
ON "Follow"(channel_id, channel_type);

-- 3. Optimize UserTag lookups by user
-- Helps when listing all tags for a user
CREATE INDEX IF NOT EXISTS idx_usertag_user 
ON "UserTag"(user_id);

-- 4. Add covering index for common feed query pattern
-- This index includes all needed columns to avoid table lookups
CREATE INDEX IF NOT EXISTS idx_story_feed_covering 
ON "Story"(created_at DESC) 
INCLUDE (story_id, author_id, user_tag_id, title, content);

-- ============================================
-- OPTIONAL INDEXES (For scale > 1000 users)
-- ============================================

-- 5. Partial index for active stories (if you implement soft delete)
-- CREATE INDEX IF NOT EXISTS idx_story_active_created 
-- ON "Story"(created_at DESC) 
-- WHERE deleted_at IS NULL;

-- 6. Index for popular tags (if tracking popularity)
-- CREATE INDEX IF NOT EXISTS idx_usertag_followers 
-- ON "UserTag"(follower_count DESC) 
-- WHERE follower_count > 100;

-- ============================================
-- MAINTENANCE COMMANDS
-- ============================================

-- Analyze tables to update statistics after index creation
ANALYZE "Story";
ANALYZE "Follow";
ANALYZE "UserTag";
ANALYZE "User";

-- Check index usage (run after indexes have been used for a while)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- ROLLBACK COMMANDS (if needed)
-- ============================================
-- DROP INDEX IF EXISTS idx_story_author_created;
-- DROP INDEX IF EXISTS idx_story_usertag_created;
-- DROP INDEX IF EXISTS idx_follow_channel;
-- DROP INDEX IF EXISTS idx_usertag_user;
-- DROP INDEX IF EXISTS idx_story_feed_covering;