#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import { PerformanceTracker, TestReporter } from './test-utils'

async function testWithExistingUsers() {
  console.log('🧪 Testing Follow Functionality with Existing Users\n')
  
  validateConfig()
  
  const supabase = createClient(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey
  )
  
  const tracker = new PerformanceTracker()
  const reporter = new TestReporter()
  
  try {
    // Get existing users
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('user_id, username')
    
    if (userError || !users || users.length < 2) {
      console.error('❌ Need at least 2 users to test')
      return
    }
    
    console.log(`Found ${users.length} users: ${users.map(u => u.username).join(', ')}\n`)
    
    // Test 1: Create various follow scenarios
    console.log('1️⃣ Testing Follow Creation Scenarios\n')
    
    const [user1, user2] = users
    
    // Clean up any existing test follows
    await supabase
      .from('Follow')
      .delete()
      .eq('follower_user_id', user1.user_id)
      .eq('channel_id', user2.user_id)
    
    // Test following all tags
    console.log(`Testing ${user1.username} following all tags from ${user2.username}...`)
    
    const start1 = performance.now()
    const { error: followAllError } = await supabase
      .from('Follow')
      .insert({
        follower_user_id: user1.user_id,
        channel_type: 'USER_ALL',
        channel_id: user2.user_id
      })
    
    const followAllTime = performance.now() - start1
    tracker.track('follow_all_creation', followAllTime)
    
    if (followAllError) {
      console.error('❌ Failed to create USER_ALL follow:', followAllError)
      reporter.addResult('Create USER_ALL follow', false, { error: followAllError })
    } else {
      console.log(`✅ Created USER_ALL follow in ${followAllTime.toFixed(2)}ms`)
      reporter.addResult('Create USER_ALL follow', true, { duration: followAllTime })
    }
    
    // Test 2: Get user tags to follow specific ones
    console.log(`\n2️⃣ Testing Specific Tag Following\n`)
    
    const { data: userTags } = await supabase
      .from('UserTag')
      .select(`
        user_tag_id,
        tag:CanonicalTag(name)
      `)
      .eq('user_id', user2.user_id)
    
    if (userTags && userTags.length > 0) {
      console.log(`Found ${userTags.length} tags for ${user2.username}`)
      
      // Clean up the USER_ALL follow
      await supabase
        .from('Follow')
        .delete()
        .eq('follower_user_id', user1.user_id)
        .eq('channel_id', user2.user_id)
        .eq('channel_type', 'USER_ALL')
      
      // Follow specific tags
      const tagsToFollow = userTags.slice(0, Math.min(3, userTags.length))
      console.log(`Following ${tagsToFollow.length} specific tags...`)
      
      const start2 = performance.now()
      const follows = tagsToFollow.map(ut => ({
        follower_user_id: user1.user_id,
        channel_type: 'USER_TAG' as const,
        channel_id: ut.user_tag_id
      }))
      
      const { error: tagFollowError } = await supabase
        .from('Follow')
        .insert(follows)
      
      const tagFollowTime = performance.now() - start2
      tracker.track('follow_tags_creation', tagFollowTime)
      
      if (tagFollowError) {
        console.error('❌ Failed to create USER_TAG follows:', tagFollowError)
        reporter.addResult('Create USER_TAG follows', false, { error: tagFollowError })
      } else {
        console.log(`✅ Created ${follows.length} USER_TAG follows in ${tagFollowTime.toFixed(2)}ms`)
        reporter.addResult('Create USER_TAG follows', true, { 
          count: follows.length,
          duration: tagFollowTime 
        })
      }
    }
    
    // Test 3: Feed Query Performance
    console.log(`\n3️⃣ Testing Feed Query Performance\n`)
    
    for (const user of users) {
      const start = performance.now()
      
      // Get user's follows
      const { data: userFollows } = await supabase
        .from('Follow')
        .select('channel_type, channel_id')
        .eq('follower_user_id', user.user_id)
      
      const followedUserIds: string[] = []
      const followedUserTagIds: string[] = []
      
      userFollows?.forEach(follow => {
        if (follow.channel_type === 'USER_ALL') {
          followedUserIds.push(follow.channel_id)
        } else if (follow.channel_type === 'USER_TAG') {
          followedUserTagIds.push(follow.channel_id)
        }
      })
      
      // Build feed query
      let query = supabase
        .from('Story')
        .select(`
          story_id,
          title,
          created_at,
          author:User!Story_author_id_fkey(username),
          user_tag:UserTag(
            tag:CanonicalTag(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      
      const conditions = [`author_id.eq.${user.user_id}`]
      
      if (followedUserIds.length > 0) {
        conditions.push(`author_id.in.(${followedUserIds.join(',')})`)
      }
      
      if (followedUserTagIds.length > 0) {
        conditions.push(`user_tag_id.in.(${followedUserTagIds.join(',')})`)
      }
      
      query = query.or(conditions.join(','))
      
      const { data: feed, error: feedError } = await query
      
      const duration = performance.now() - start
      tracker.track('feed_query', duration)
      
      if (feedError) {
        console.error(`❌ Feed query failed for ${user.username}:`, feedError)
        reporter.addResult(`Feed query for ${user.username}`, false, { error: feedError })
      } else {
        console.log(`✅ ${user.username}'s feed: ${feed?.length || 0} stories in ${duration.toFixed(2)}ms`)
        reporter.addResult(`Feed query for ${user.username}`, true, { 
          stories: feed?.length || 0,
          duration 
        })
      }
    }
    
    // Test 4: Concurrent Operations
    console.log(`\n4️⃣ Testing Concurrent Follow Operations\n`)
    
    if (users.length >= 2) {
      const promises = []
      
      // Simulate multiple users following each other simultaneously
      for (let i = 0; i < Math.min(3, users.length - 1); i++) {
        const follower = users[i]
        const target = users[users.length - 1 - i]
        
        promises.push((async () => {
          const start = performance.now()
          
          await supabase
            .from('Follow')
            .delete()
            .eq('follower_user_id', follower.user_id)
            .eq('channel_id', target.user_id)
          
          const { error } = await supabase
            .from('Follow')
            .insert({
              follower_user_id: follower.user_id,
              channel_type: 'USER_ALL',
              channel_id: target.user_id
            })
          
          const duration = performance.now() - start
          
          return { follower: follower.username, target: target.username, error, duration }
        })())
      }
      
      const results = await Promise.all(promises)
      
      results.forEach(result => {
        if (result.error) {
          console.error(`❌ ${result.follower} → ${result.target}: Failed`)
          reporter.addResult(`Concurrent follow ${result.follower} → ${result.target}`, false)
        } else {
          console.log(`✅ ${result.follower} → ${result.target}: ${result.duration.toFixed(2)}ms`)
          reporter.addResult(`Concurrent follow ${result.follower} → ${result.target}`, true, {
            duration: result.duration
          })
          tracker.track('concurrent_follow', result.duration)
        }
      })
    }
    
    // Performance Summary
    console.log('\n📊 Performance Summary:')
    console.log('========================\n')
    
    const stats = tracker.getAllStats()
    for (const [operation, stat] of Object.entries(stats)) {
      if (stat) {
        console.log(`${operation}:`)
        console.log(`  Count: ${stat.count}`)
        console.log(`  Average: ${stat.avg.toFixed(2)}ms`)
        console.log(`  Min: ${stat.min.toFixed(2)}ms`)
        console.log(`  Max: ${stat.max.toFixed(2)}ms`)
        console.log(`  Median: ${stat.median.toFixed(2)}ms`)
        console.log()
      }
    }
    
    // Clean up test follows
    console.log('🧹 Cleaning up test follows...')
    
    for (const user of users) {
      await supabase
        .from('Follow')
        .delete()
        .eq('follower_user_id', user.user_id)
        .neq('channel_id', user.user_id) // Don't delete self-follows if any
    }
    
    reporter.printReport()
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

testWithExistingUsers()