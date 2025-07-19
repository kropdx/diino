#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import { TestDataGenerator } from './test-utils'
import { Database } from '../../lib/supabase/types'

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n')
  
  try {
    validateConfig()
  } catch (error) {
    console.error('❌ Configuration error:', error)
    process.exit(1)
  }
  
  // Create Supabase client
  const supabase = createClient<Database>(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  const generator = new TestDataGenerator(supabase)
  
  try {
    // Step 1: Clean up existing test data
    console.log('🧹 Cleaning up existing test data...')
    await generator.cleanupTestUsers(TEST_CONFIG.testUserPrefix)
    console.log('✓ Cleanup complete\n')
    
    // Step 2: Create tags
    console.log('🏷️  Creating test tags...')
    const tags = await generator.createTestTags(TEST_CONFIG.testTags)
    console.log(`✓ Created ${tags.length} tags\n`)
    
    // Step 3: Create test users
    console.log('👥 Creating test users...')
    const users = await generator.createTestUsers(
      TEST_CONFIG.testUserCount,
      TEST_CONFIG.testUserPrefix
    )
    console.log(`✓ Created ${users.length} users\n`)
    
    // Step 4: Assign tags to users and create stories
    console.log('📝 Creating user tags and stories...')
    let totalStories = 0
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      
      // Each user gets 3-7 random tags
      const numTags = 3 + Math.floor(Math.random() * 5)
      const userTagPool = [...tags].sort(() => Math.random() - 0.5).slice(0, numTags)
      
      // Create user tags
      const userTags = await generator.createUserTags(
        user.user_id,
        userTagPool.map(t => t.tag_id)
      )
      
      // Create stories distributed across user's tags
      const storiesPerTag = Math.floor(TEST_CONFIG.storiesPerUser / userTags.length)
      const stories = await generator.createTestStories(
        user.user_id,
        userTags.map(ut => ut.user_tag_id),
        storiesPerTag
      )
      
      totalStories += stories.length
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${users.length} users`)
      }
    }
    
    console.log(`✓ Created ${totalStories} total stories\n`)
    
    // Step 5: Create follow relationships
    console.log('🔗 Creating follow relationships...')
    let totalFollows = 0
    
    for (let i = 0; i < users.length; i++) {
      const follower = users[i]
      
      // Determine number of users to follow
      const numFollows = TEST_CONFIG.followsPerUser.min + 
        Math.floor(Math.random() * (TEST_CONFIG.followsPerUser.max - TEST_CONFIG.followsPerUser.min))
      
      // Select random users to follow (excluding self)
      const targets = users
        .filter(u => u.user_id !== follower.user_id)
        .sort(() => Math.random() - 0.5)
        .slice(0, numFollows)
      
      for (const target of targets) {
        // Get target's user tags
        const { data: targetUserTags } = await supabase
          .from('UserTag')
          .select('user_tag_id')
          .eq('user_id', target.user_id)
        
        if (!targetUserTags || targetUserTags.length === 0) continue
        
        // Randomly decide follow mode
        const mode = Math.random() < 0.3 ? 'all' : 'some'
        
        if (mode === 'all') {
          await generator.createFollows(
            follower.user_id,
            target.user_id,
            'all'
          )
          totalFollows++
        } else {
          // Follow 1-5 random tags from the target
          const numTagsToFollow = 1 + Math.floor(Math.random() * Math.min(5, targetUserTags.length))
          const tagsToFollow = targetUserTags
            .sort(() => Math.random() - 0.5)
            .slice(0, numTagsToFollow)
            .map(ut => ut.user_tag_id)
          
          await generator.createFollows(
            follower.user_id,
            target.user_id,
            'some',
            tagsToFollow
          )
          totalFollows += tagsToFollow.length
        }
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`  Progress: ${i + 1}/${users.length} users`)
      }
    }
    
    console.log(`✓ Created ${totalFollows} follow relationships\n`)
    
    // Step 6: Summary
    console.log('📊 Seeding Summary:')
    console.log(`  - Users: ${users.length}`)
    console.log(`  - Tags: ${tags.length}`)
    console.log(`  - Stories: ${totalStories}`)
    console.log(`  - Follow relationships: ${totalFollows}`)
    console.log(`  - Average stories per user: ${Math.floor(totalStories / users.length)}`)
    console.log(`  - Average follows per user: ${Math.floor(totalFollows / users.length)}`)
    
    console.log('\n✅ Test data seeding complete!')
    
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seeding
seedTestData()