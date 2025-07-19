#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import { Database } from '../../lib/supabase/types'

async function quickTest() {
  console.log('🚀 Quick Follow Test\n')
  
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
    // Test 1: Can we query the Follow table?
    console.log('1️⃣  Testing Follow table access...')
    const { data: follows, error: followError } = await supabase
      .from('Follow')
      .select('*')
      .limit(5)
    
    if (followError) {
      console.error('❌ Cannot access Follow table:', followError)
    } else {
      console.log(`✓ Follow table accessible. Found ${follows?.length || 0} follows`)
    }
    
    // Test 2: Can we query users?
    console.log('\n2️⃣  Testing User table access...')
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('user_id, username')
      .limit(5)
    
    if (userError) {
      console.error('❌ Cannot access User table:', userError)
    } else {
      console.log(`✓ User table accessible. Found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('  Sample users:', users.map(u => u.username).join(', '))
      }
    }
    
    // Test 3: Can we query with joins?
    console.log('\n3️⃣  Testing complex query with joins...')
    const { data: stories, error: storyError } = await supabase
      .from('Story')
      .select(`
        story_id,
        title,
        author:User!Story_author_id_fkey(username),
        user_tag:UserTag(
          tag:CanonicalTag(name)
        )
      `)
      .limit(3)
    
    if (storyError) {
      console.error('❌ Cannot perform join query:', storyError)
    } else {
      console.log(`✓ Join query successful. Found ${stories?.length || 0} stories`)
      stories?.forEach(story => {
        console.log(`  - "${story.title}" by @${story.author?.username} in #${story.user_tag?.tag?.name || 'uncategorized'}`)
      })
    }
    
    // Test 4: Check for test users
    console.log('\n4️⃣  Checking for test users...')
    const { count: testUserCount } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true })
      .like('username', `${TEST_CONFIG.testUserPrefix}%`)
    
    console.log(`✓ Found ${testUserCount || 0} test users`)
    if (!testUserCount || testUserCount === 0) {
      console.log('  💡 Run "npm run test:follow:seed" to create test data')
    }
    
    // Test 5: Test follow creation (non-destructive)
    console.log('\n5️⃣  Testing follow operations...')
    
    // Get two test users
    const { data: testUsers } = await supabase
      .from('User')
      .select('user_id')
      .like('username', `${TEST_CONFIG.testUserPrefix}%`)
      .limit(2)
    
    if (testUsers && testUsers.length >= 2) {
      const [follower, target] = testUsers
      
      // Check if follow already exists
      const { data: existingFollow } = await supabase
        .from('Follow')
        .select('*')
        .eq('follower_user_id', follower.user_id)
        .eq('channel_id', target.user_id)
        .eq('channel_type', 'USER_ALL')
        .single()
      
      if (existingFollow) {
        console.log('✓ Follow relationship already exists')
      } else {
        // Try to create a follow
        const { error: createError } = await supabase
          .from('Follow')
          .insert({
            follower_user_id: follower.user_id,
            channel_type: 'USER_ALL',
            channel_id: target.user_id
          })
        
        if (createError) {
          console.error('❌ Could not create follow:', createError)
        } else {
          console.log('✓ Successfully created test follow')
          
          // Clean up
          await supabase
            .from('Follow')
            .delete()
            .eq('follower_user_id', follower.user_id)
            .eq('channel_id', target.user_id)
            .eq('channel_type', 'USER_ALL')
          
          console.log('✓ Cleaned up test follow')
        }
      }
    } else {
      console.log('  ⚠️  Not enough test users for follow test')
    }
    
    console.log('\n✅ Quick test complete!')
    
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  }
}

// Run the quick test
quickTest()