#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import { Database } from '../../lib/supabase/types'

async function inspectFollows(username?: string) {
  console.log('🔍 Follow Database Inspector\n')
  
  try {
    validateConfig()
  } catch (error) {
    console.error('❌ Configuration error:', error)
    process.exit(1)
  }
  
  const supabase = createClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey
  )
  
  try {
    // Get overall statistics
    console.log('📊 Overall Statistics:')
    console.log('=====================\n')
    
    // Total users
    const { count: totalUsers } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
    
    const { count: testUsers } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .like('username', `${TEST_CONFIG.testUserPrefix}%`)
    
    console.log(`Total users: ${totalUsers}`)
    console.log(`Test users: ${testUsers}`)
    console.log(`Non-test users: ${(totalUsers || 0) - (testUsers || 0)}`)
    
    // Total follows
    const { count: totalFollows } = await supabase
      .from('Follow')
      .select('*', { count: 'exact', head: true })
    
    const { count: userAllFollows } = await supabase
      .from('Follow')
      .select('*', { count: 'exact', head: true })
      .eq('channel_type', 'USER_ALL')
    
    const { count: userTagFollows } = await supabase
      .from('Follow')
      .select('*', { count: 'exact', head: true })
      .eq('channel_type', 'USER_TAG')
    
    console.log(`\nTotal follows: ${totalFollows}`)
    console.log(`  - USER_ALL: ${userAllFollows}`)
    console.log(`  - USER_TAG: ${userTagFollows}`)
    
    // Average follows per user
    if (totalUsers && totalFollows) {
      console.log(`Average follows per user: ${(totalFollows / totalUsers).toFixed(2)}`)
    }
    
    // If username provided, show specific user details
    if (username) {
      console.log(`\n\n👤 User Details: @${username}`)
      console.log('========================\n')
      
      // Get user
      const { data: user } = await supabase
        .from('User')
        .select('*')
        .eq('username', username)
        .single()
      
      if (!user) {
        console.error(`User @${username} not found`)
        return
      }
      
      // Get user's follows (who they follow)
      const { data: follows } = await supabase
        .from('Follow')
        .select(`
          *,
          followed_user:User!Follow_channel_id_fkey(
            user_id,
            username,
            display_name
          )
        `)
        .eq('follower_user_id', user.user_id)
      
      console.log(`Following: ${follows?.length || 0} channels`)
      
      // Group by type
      const followsByType = follows?.reduce((acc, follow) => {
        if (!acc[follow.channel_type]) {
          acc[follow.channel_type] = []
        }
        acc[follow.channel_type].push(follow)
        return acc
      }, {} as Record<string, any[]>) || {}
      
      // Show USER_ALL follows
      if (followsByType['USER_ALL']) {
        console.log(`\n📌 Following All Tags From:`)
        for (const follow of followsByType['USER_ALL']) {
          console.log(`  - @${follow.followed_user?.username || follow.channel_id}`)
        }
      }
      
      // Show USER_TAG follows
      if (followsByType['USER_TAG']) {
        console.log(`\n🏷️  Following Specific Tags:`)
        
        // Group by user
        const tagsByUser: Record<string, string[]> = {}
        
        for (const follow of followsByType['USER_TAG']) {
          // Get the user tag details
          const { data: userTag } = await supabase
            .from('UserTag')
            .select(`
              *,
              user:User!UserTag_user_id_fkey(username),
              tag:CanonicalTag!UserTag_tag_id_fkey(name)
            `)
            .eq('user_tag_id', follow.channel_id)
            .single()
          
          if (userTag && userTag.user && userTag.tag) {
            const username = userTag.user.username
            if (!tagsByUser[username]) {
              tagsByUser[username] = []
            }
            tagsByUser[username].push(userTag.tag.name)
          }
        }
        
        for (const [targetUsername, tags] of Object.entries(tagsByUser)) {
          console.log(`  From @${targetUsername}: ${tags.map(t => `#${t}`).join(', ')}`)
        }
      }
      
      // Get followers (who follows them)
      const { data: followers } = await supabase
        .from('Follow')
        .select(`
          *,
          follower:User!Follow_follower_user_id_fkey(
            user_id,
            username,
            display_name
          )
        `)
        .eq('channel_id', user.user_id)
        .eq('channel_type', 'USER_ALL')
      
      console.log(`\n👥 Followers: ${followers?.length || 0} users following all tags`)
      
      if (followers && followers.length > 0) {
        console.log('Recent followers:')
        followers
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .forEach(f => {
            console.log(`  - @${f.follower?.username} (${new Date(f.created_at).toLocaleDateString()})`)
          })
      }
      
      // Show feed preview
      console.log(`\n📰 Feed Preview (last 5 posts):`)
      console.log('================================\n')
      
      // Build feed query similar to the actual feed
      const { data: followData } = await supabase
        .from('Follow')
        .select('channel_type, channel_id')
        .eq('follower_user_id', user.user_id)
      
      const followedUserIds: string[] = []
      const followedUserTagIds: string[] = []
      
      followData?.forEach(follow => {
        if (follow.channel_type === 'USER_ALL') {
          followedUserIds.push(follow.channel_id)
        } else if (follow.channel_type === 'USER_TAG') {
          followedUserTagIds.push(follow.channel_id)
        }
      })
      
      let feedQuery = supabase
        .from('Story')
        .select(`
          *,
          author:User!Story_author_id_fkey(
            username,
            display_name
          ),
          user_tag:UserTag(
            tag:CanonicalTag(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
      
      const conditions = [`author_id.eq.${user.user_id}`]
      
      if (followedUserIds.length > 0) {
        conditions.push(`author_id.in.(${followedUserIds.join(',')})`)
      }
      
      if (followedUserTagIds.length > 0) {
        conditions.push(`user_tag_id.in.(${followedUserTagIds.join(',')})`)
      }
      
      feedQuery = feedQuery.or(conditions.join(','))
      
      const { data: feedStories } = await feedQuery
      
      if (feedStories && feedStories.length > 0) {
        feedStories.forEach(story => {
          const tagName = story.user_tag?.tag?.name || 'uncategorized'
          console.log(`📄 ${story.title || 'Untitled'}`)
          console.log(`   By @${story.author?.username} in #${tagName}`)
          console.log(`   ${new Date(story.created_at).toLocaleDateString()} - ${story.upvotes || 0} upvotes`)
          console.log(`   ${story.content?.substring(0, 100)}...`)
          console.log()
        })
      } else {
        console.log('No stories in feed')
      }
      
    } else {
      // Show top followed users
      console.log('\n\n🏆 Most Followed Users:')
      console.log('=======================\n')
      
      const { data: topFollowed } = await supabase
        .from('Follow')
        .select('channel_id')
        .eq('channel_type', 'USER_ALL')
        .select('channel_id', { count: 'exact' })
      
      // Manual grouping since Supabase doesn't support GROUP BY well
      const followerCounts: Record<string, number> = {}
      topFollowed?.forEach(f => {
        followerCounts[f.channel_id] = (followerCounts[f.channel_id] || 0) + 1
      })
      
      const sortedUsers = Object.entries(followerCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
      
      for (const [userId, count] of sortedUsers) {
        const { data: user } = await supabase
          .from('User')
          .select('username')
          .eq('user_id', userId)
          .single()
        
        if (user) {
          console.log(`  @${user.username}: ${count} followers`)
        }
      }
      
      // Show most active users (most follows)
      console.log('\n\n🚀 Most Active Users (following most):')
      console.log('=====================================\n')
      
      const { data: mostActive } = await supabase
        .from('Follow')
        .select('follower_user_id')
      
      const followCounts: Record<string, number> = {}
      mostActive?.forEach(f => {
        followCounts[f.follower_user_id] = (followCounts[f.follower_user_id] || 0) + 1
      })
      
      const sortedActive = Object.entries(followCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
      
      for (const [userId, count] of sortedActive) {
        const { data: user } = await supabase
          .from('User')
          .select('username')
          .eq('user_id', userId)
          .single()
        
        if (user) {
          console.log(`  @${user.username}: following ${count} channels`)
        }
      }
    }
    
    console.log('\n✅ Inspection complete!')
    
  } catch (error) {
    console.error('❌ Inspection error:', error)
    process.exit(1)
  }
}

// Parse command line arguments
const username = process.argv[2]

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: npx tsx inspect-follows.ts [username]')
  console.log('\nExamples:')
  console.log('  npx tsx inspect-follows.ts              # Show overall statistics')
  console.log('  npx tsx inspect-follows.ts test_user_1  # Show specific user details')
  process.exit(0)
}

// Run the inspection
inspectFollows(username)