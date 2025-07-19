#!/usr/bin/env node

// This script uses the Supabase MCP to run performance tests
// It measures query performance directly in the database

const performanceQueries = [
  {
    name: "Feed Query - Simple User",
    description: "Get feed for a user with few follows",
    query: `
      -- Get kropdx's feed with timing
      EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
      WITH user_info AS (
          SELECT user_id FROM "User" WHERE username = 'kropdx'
      ),
      followed_users AS (
          SELECT channel_id 
          FROM "Follow" 
          WHERE follower_user_id = (SELECT user_id FROM user_info)
          AND channel_type = 'USER_ALL'
      ),
      followed_tags AS (
          SELECT channel_id 
          FROM "Follow" 
          WHERE follower_user_id = (SELECT user_id FROM user_info)
          AND channel_type = 'USER_TAG'
      )
      SELECT 
          s.story_id,
          s.title,
          s.created_at,
          u.username as author,
          ct.name as tag
      FROM "Story" s
      JOIN "User" u ON s.author_id = u.user_id
      LEFT JOIN "UserTag" ut ON s.user_tag_id = ut.user_tag_id
      LEFT JOIN "CanonicalTag" ct ON ut.tag_id = ct.tag_id
      WHERE 
          s.author_id = (SELECT user_id FROM user_info)
          OR s.author_id IN (SELECT channel_id FROM followed_users)
          OR s.user_tag_id IN (SELECT channel_id FROM followed_tags)
      ORDER BY s.created_at DESC
      LIMIT 50
    `
  },
  {
    name: "Follow Count Query",
    description: "Count follows by type",
    query: `
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT 
          channel_type,
          COUNT(*) as count
      FROM "Follow"
      GROUP BY channel_type
    `
  },
  {
    name: "User Follow Stats",
    description: "Get follow statistics per user",
    query: `
      EXPLAIN (ANALYZE, FORMAT JSON)
      SELECT 
          u.username,
          COUNT(DISTINCT f1.channel_id) FILTER (WHERE f1.channel_type = 'USER_ALL') as following_users,
          COUNT(DISTINCT f1.channel_id) FILTER (WHERE f1.channel_type = 'USER_TAG') as following_tags,
          COUNT(DISTINCT f2.follower_user_id) as followers
      FROM "User" u
      LEFT JOIN "Follow" f1 ON u.user_id = f1.follower_user_id
      LEFT JOIN "Follow" f2 ON u.user_id = f2.channel_id AND f2.channel_type = 'USER_ALL'
      GROUP BY u.user_id, u.username
    `
  }
]

console.log(`# Supabase Follow Performance Analysis

## Database Performance Tests

Run these queries using the Supabase MCP execute_sql command to analyze performance:

`)

performanceQueries.forEach((test, index) => {
  console.log(`### Test ${index + 1}: ${test.name}

**Description:** ${test.description}

\`\`\`sql
${test.query.trim()}
\`\`\`

To run this test, use:
\`\`\`
mcp__supabase__execute_sql({ query: \`${test.query.trim()}\` })
\`\`\`

---

`)
})

console.log(`## Performance Metrics to Track

1. **Query Execution Time** - Look for "Execution Time" in EXPLAIN ANALYZE output
2. **Index Usage** - Check if indexes are being used (Index Scan vs Seq Scan)
3. **Buffer Usage** - Shared hit/read ratio indicates cache effectiveness
4. **Row Estimates** - Compare estimated vs actual rows

## Current Database State

Based on the current data:
- 2 users (kropdx, zenzenkro)
- 2 follow relationships
- 5 stories across different tags

## Recommendations

1. **Add Test Data**: The current dataset is too small for meaningful performance testing
   - Run \`npm run test:follow:seed\` to create 100 test users with stories and follows
   
2. **Monitor Query Plans**: Use EXPLAIN ANALYZE to identify slow operations
   
3. **Index Optimization**: Check if these indexes exist:
   - Follow(follower_user_id)
   - Follow(channel_id, channel_type)
   - Story(author_id, created_at)
   - Story(user_tag_id, created_at)

4. **Consider Materialized Views**: For frequently accessed feed data

5. **Connection Pooling**: Ensure proper connection management for concurrent users
`)