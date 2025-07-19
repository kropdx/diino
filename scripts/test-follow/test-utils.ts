import { createClient } from '@supabase/supabase-js'
import { Database } from '../../lib/supabase/types'
import * as crypto from 'crypto'
import { PerformanceTracker, TestReporter } from './mcp-test-client'

export { PerformanceTracker, TestReporter }

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface TestUser {
  user_id: string
  email: string
  username: string
  display_name: string
}

export interface TestTag {
  tag_id: string
  name: string
}

export interface TestUserTag {
  user_tag_id: string
  user_id: string
  tag_id: string
  tag: TestTag
}

export interface TestStory {
  story_id: string
  short_id: string
  title: string
  content: string
  author_id: string
  user_tag_id: string
}

// Utility class for creating and managing test data
export class TestDataGenerator {
  constructor(private supabase: SupabaseClient) {}

  // Generate a unique test identifier
  private testId() {
    return Math.random().toString(36).substring(2, 9)
  }

  // Create test users
  async createTestUsers(count: number, prefix: string = 'test_'): Promise<TestUser[]> {
    const users: TestUser[] = []
    
    for (let i = 0; i < count; i++) {
      const id = this.testId()
      const email = `${prefix}user_${id}@test.com`
      const username = `${prefix}user_${id}`
      
      // For test users, we'll create them directly in the User table
      // In a real scenario with auth, you'd use auth.admin.createUser
      // but that requires service role key
      const userId = crypto.randomUUID()
      
      // Create user profile
      const { data: userData, error: userError } = await this.supabase
        .from('User')
        .insert({
          user_id: userId,
          email,
          username,
          display_name: `Test User ${i + 1}`
        })
        .select()
        .single()
      
      if (userError) {
        console.error(`Failed to create user profile ${username}:`, userError)
        continue
      }
      
      users.push(userData)
    }
    
    return users
  }

  // Create test tags
  async createTestTags(tagNames: string[]): Promise<TestTag[]> {
    const tags: TestTag[] = []
    
    for (const name of tagNames) {
      const { data, error } = await this.supabase
        .from('CanonicalTag')
        .insert({ name: name.toLowerCase() })
        .select()
        .single()
      
      if (error) {
        // Tag might already exist
        const { data: existing } = await this.supabase
          .from('CanonicalTag')
          .select()
          .eq('name', name.toLowerCase())
          .single()
        
        if (existing) {
          tags.push(existing)
        }
      } else {
        tags.push(data)
      }
    }
    
    return tags
  }

  // Create user tags (assign tags to users)
  async createUserTags(userId: string, tagIds: string[]): Promise<TestUserTag[]> {
    const userTags: TestUserTag[] = []
    
    for (const tagId of tagIds) {
      const { data, error } = await this.supabase
        .from('UserTag')
        .insert({
          user_id: userId,
          tag_id: tagId
        })
        .select(`
          *,
          tag:CanonicalTag(*)
        `)
        .single()
      
      if (!error && data) {
        userTags.push(data as any)
      }
    }
    
    return userTags
  }

  // Create test stories
  async createTestStories(
    userId: string, 
    userTagIds: string[], 
    storiesPerTag: number
  ): Promise<TestStory[]> {
    const stories: TestStory[] = []
    
    for (const userTagId of userTagIds) {
      for (let i = 0; i < storiesPerTag; i++) {
        const id = this.testId()
        const { data, error } = await this.supabase
          .from('Story')
          .insert({
            short_id: `test_${id}`,
            title: `Test Story ${id}`,
            content: `This is test content for story ${id}. It contains enough text to be realistic.`,
            story_type: 'text',
            author_id: userId,
            user_tag_id: userTagId,
            upvotes: Math.floor(Math.random() * 100)
          })
          .select()
          .single()
        
        if (!error && data) {
          stories.push(data)
        }
      }
    }
    
    return stories
  }

  // Create follow relationships
  async createFollows(
    followerUserId: string,
    targetUserId: string,
    mode: 'all' | 'some' | 'none',
    specificUserTagIds?: string[]
  ) {
    // First clean up any existing follows
    await this.supabase
      .from('Follow')
      .delete()
      .eq('follower_user_id', followerUserId)
      .in('channel_id', [targetUserId, ...(specificUserTagIds || [])])
    
    if (mode === 'all') {
      // Follow all tags from the user
      await this.supabase
        .from('Follow')
        .insert({
          follower_user_id: followerUserId,
          channel_type: 'USER_ALL',
          channel_id: targetUserId
        })
    } else if (mode === 'some' && specificUserTagIds) {
      // Follow specific tags
      const follows = specificUserTagIds.map(userTagId => ({
        follower_user_id: followerUserId,
        channel_type: 'USER_TAG' as const,
        channel_id: userTagId
      }))
      
      await this.supabase
        .from('Follow')
        .insert(follows)
    }
    // mode === 'none' means no follows (already deleted above)
  }

  // Clean up test data
  async cleanupTestUsers(prefix: string = 'test_') {
    // Delete users (cascade will handle related data)
    await this.supabase
      .from('User')
      .delete()
      .like('username', `${prefix}%`)
  }
}

// Performance testing utilities
export class PerformanceTester {
  constructor(private supabase: SupabaseClient) {}

  async measureFeedQuery(userId: string): Promise<number> {
    const start = performance.now()
    
    // Get user's follows
    const { data: follows } = await this.supabase
      .from('Follow')
      .select('channel_type, channel_id')
      .eq('follower_user_id', userId)
    
    const followedUserIds: string[] = []
    const followedUserTagIds: string[] = []
    
    follows?.forEach(follow => {
      if (follow.channel_type === 'USER_ALL') {
        followedUserIds.push(follow.channel_id)
      } else if (follow.channel_type === 'USER_TAG') {
        followedUserTagIds.push(follow.channel_id)
      }
    })
    
    // Build feed query
    let query = this.supabase
      .from('Story')
      .select(`
        *,
        author:User!Story_author_id_fkey(
          user_id,
          username,
          display_name
        ),
        user_tag:UserTag(
          user_tag_id,
          tag:CanonicalTag(
            tag_id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    const conditions = [`author_id.eq.${userId}`]
    
    if (followedUserIds.length > 0) {
      conditions.push(`author_id.in.(${followedUserIds.join(',')})`)
    }
    
    if (followedUserTagIds.length > 0) {
      conditions.push(`user_tag_id.in.(${followedUserTagIds.join(',')})`)
    }
    
    query = query.or(conditions.join(','))
    
    await query
    
    return performance.now() - start
  }

  async measureFollowOperation(
    followerUserId: string,
    targetUserId: string,
    userTagIds: string[]
  ): Promise<number> {
    const start = performance.now()
    
    // Delete existing follows
    await this.supabase
      .from('Follow')
      .delete()
      .eq('follower_user_id', followerUserId)
      .in('channel_id', [targetUserId])
    
    // Create new follows
    const follows = userTagIds.map(id => ({
      follower_user_id: followerUserId,
      channel_type: 'USER_TAG' as const,
      channel_id: id
    }))
    
    await this.supabase
      .from('Follow')
      .insert(follows)
    
    return performance.now() - start
  }
}

// Verification utilities
export async function verifyFollowIntegrity(supabase: SupabaseClient) {
  const issues: string[] = []
  
  // Check for orphaned follows (pointing to non-existent users)
  const { data: orphanedUserFollows } = await supabase
    .from('Follow')
    .select('follower_user_id, channel_id')
    .eq('channel_type', 'USER_ALL')
  
  if (orphanedUserFollows) {
    for (const follow of orphanedUserFollows) {
      const { data: user } = await supabase
        .from('User')
        .select('user_id')
        .eq('user_id', follow.channel_id)
        .single()
      
      if (!user) {
        issues.push(`Orphaned USER_ALL follow: follower=${follow.follower_user_id}, channel=${follow.channel_id}`)
      }
    }
  }
  
  // Check for orphaned user tag follows
  const { data: orphanedTagFollows } = await supabase
    .from('Follow')
    .select('follower_user_id, channel_id')
    .eq('channel_type', 'USER_TAG')
  
  if (orphanedTagFollows) {
    for (const follow of orphanedTagFollows) {
      const { data: userTag } = await supabase
        .from('UserTag')
        .select('user_tag_id')
        .eq('user_tag_id', follow.channel_id)
        .single()
      
      if (!userTag) {
        issues.push(`Orphaned USER_TAG follow: follower=${follow.follower_user_id}, channel=${follow.channel_id}`)
      }
    }
  }
  
  return issues
}