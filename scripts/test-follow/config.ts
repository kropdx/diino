import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

export const TEST_CONFIG = {
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Test data configuration
  testUserCount: 100,
  storiesPerUser: 100,
  followsPerUser: {
    min: 20,
    max: 200
  },
  
  // Test data prefixes
  testUserPrefix: 'test_perf_',
  
  // Performance thresholds (in milliseconds)
  performance: {
    feedQuery: {
      good: 100,
      acceptable: 500,
      bad: 1000
    },
    followOperation: {
      good: 50,
      acceptable: 200,
      bad: 500
    }
  },
  
  // Tag pool for testing
  testTags: [
    'technology', 'science', 'gaming', 'music', 'art',
    'photography', 'travel', 'food', 'fitness', 'fashion',
    'business', 'finance', 'politics', 'sports', 'movies',
    'books', 'education', 'health', 'nature', 'history',
    'comedy', 'news', 'programming', 'design', 'crypto',
    'ai', 'space', 'climate', 'psychology', 'philosophy'
  ]
}

// Validate configuration
export function validateConfig() {
  const required = ['supabaseUrl', 'supabaseAnonKey']
  const missing = required.filter(key => !TEST_CONFIG[key as keyof typeof TEST_CONFIG])
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`)
  }
  
  console.log('✓ Configuration validated')
  console.log(`  - Supabase URL: ${TEST_CONFIG.supabaseUrl}`)
  console.log(`  - Test users: ${TEST_CONFIG.testUserCount}`)
  console.log(`  - Stories per user: ${TEST_CONFIG.storiesPerUser}`)
  console.log(`  - Follows per user: ${TEST_CONFIG.followsPerUser.min}-${TEST_CONFIG.followsPerUser.max}`)
}