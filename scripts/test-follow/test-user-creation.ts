#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import * as crypto from 'crypto'

async function testUserCreation() {
  console.log('🧪 Testing User Creation\n')
  
  validateConfig()
  
  const supabase = createClient(
    TEST_CONFIG.supabaseUrl,
    TEST_CONFIG.supabaseAnonKey
  )
  
  try {
    // Test 1: Try to create a single test user
    console.log('Creating a test user...')
    
    const testId = Math.random().toString(36).substring(2, 9)
    const userId = crypto.randomUUID()
    const username = `test_user_${testId}`
    const email = `${username}@test.com`
    
    const { data, error } = await supabase
      .from('User')
      .insert({
        user_id: userId,
        email,
        username,
        display_name: `Test User ${testId}`
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to create user:', error)
      
      // Check if it's an RLS issue
      if (error.message.includes('policy')) {
        console.log('\n💡 This appears to be an RLS (Row Level Security) issue.')
        console.log('   Users might need to be authenticated to create profiles.')
        console.log('   Consider using Supabase service role key or adjusting RLS policies.')
      }
    } else {
      console.log('✅ Successfully created user:', data)
      
      // Try to clean up
      console.log('\nCleaning up test user...')
      const { error: deleteError } = await supabase
        .from('User')
        .delete()
        .eq('user_id', userId)
      
      if (deleteError) {
        console.error('❌ Failed to delete test user:', deleteError)
      } else {
        console.log('✅ Test user cleaned up')
      }
    }
    
    // Test 2: Check existing users
    console.log('\n\nChecking existing users...')
    const { data: users, error: listError } = await supabase
      .from('User')
      .select('username, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (listError) {
      console.error('❌ Failed to list users:', listError)
    } else {
      console.log(`✅ Found ${users?.length || 0} users:`)
      users?.forEach(u => {
        console.log(`   - @${u.username} (created: ${new Date(u.created_at).toLocaleDateString()})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testUserCreation()