#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { TEST_CONFIG, validateConfig } from './config'
import { PerformanceTester, PerformanceTracker, TestReporter } from './test-utils'
import { Database } from '../../lib/supabase/types'

async function testFollowPerformance() {
  console.log('⚡ Testing Follow Performance...\n')
  
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
  
  const perfTester = new PerformanceTester(supabase)
  const tracker = new PerformanceTracker()
  const reporter = new TestReporter()
  
  try {
    // Get test users for performance testing
    const { data: testUsers } = await supabase
      .from('User')
      .select('user_id, username')
      .like('username', `${TEST_CONFIG.testUserPrefix}%`)
      .limit(20)
    
    if (!testUsers || testUsers.length === 0) {
      console.error('❌ No test users found. Run seed-test-data.ts first.')
      process.exit(1)
    }
    
    console.log(`Found ${testUsers.length} test users for performance testing\n`)
    
    // Test 1: Feed Query Performance
    console.log('1️⃣  Testing Feed Query Performance...')
    console.log('   Measuring time to generate personalized feeds\n')
    
    for (let i = 0; i < Math.min(10, testUsers.length); i++) {
      const user = testUsers[i]
      const duration = await perfTester.measureFeedQuery(user.user_id)
      tracker.track('feed_query', duration)
      
      console.log(`   User ${i + 1}: ${duration.toFixed(2)}ms`)
    }
    
    const feedStats = tracker.getStats('feed_query')!
    console.log('\n   Feed Query Statistics:')
    console.log(`   - Min: ${feedStats.min.toFixed(2)}ms`)
    console.log(`   - Max: ${feedStats.max.toFixed(2)}ms`)
    console.log(`   - Avg: ${feedStats.avg.toFixed(2)}ms`)
    console.log(`   - Median: ${feedStats.median.toFixed(2)}ms`)
    console.log(`   - P95: ${feedStats.p95.toFixed(2)}ms`)
    
    // Evaluate performance
    const feedPerf = feedStats.avg < TEST_CONFIG.performance.feedQuery.good ? 'good' :
                    feedStats.avg < TEST_CONFIG.performance.feedQuery.acceptable ? 'acceptable' : 'bad'
    
    reporter.addResult(
      'Feed query performance',
      feedPerf !== 'bad',
      { stats: feedStats, evaluation: feedPerf },
      feedStats.avg
    )
    
    // Test 2: Follow Operation Performance
    console.log('\n2️⃣  Testing Follow Operation Performance...')
    console.log('   Measuring time to create/update follow relationships\n')
    
    // Reset tracker for follow operations
    tracker.reset()
    
    for (let i = 0; i < Math.min(10, testUsers.length - 1); i++) {
      const follower = testUsers[i]
      const target = testUsers[i + 1]
      
      // Get target's user tags
      const { data: userTags } = await supabase
        .from('UserTag')
        .select('user_tag_id')
        .eq('user_id', target.user_id)
        .limit(5)
      
      if (userTags && userTags.length > 0) {
        const duration = await perfTester.measureFollowOperation(
          follower.user_id,
          target.user_id,
          userTags.map(ut => ut.user_tag_id)
        )
        tracker.track('follow_operation', duration)
        
        console.log(`   Operation ${i + 1}: ${duration.toFixed(2)}ms`)
      }
    }
    
    const followStats = tracker.getStats('follow_operation')!
    console.log('\n   Follow Operation Statistics:')
    console.log(`   - Min: ${followStats.min.toFixed(2)}ms`)
    console.log(`   - Max: ${followStats.max.toFixed(2)}ms`)
    console.log(`   - Avg: ${followStats.avg.toFixed(2)}ms`)
    console.log(`   - Median: ${followStats.median.toFixed(2)}ms`)
    console.log(`   - P95: ${followStats.p95.toFixed(2)}ms`)
    
    const followPerf = followStats.avg < TEST_CONFIG.performance.followOperation.good ? 'good' :
                      followStats.avg < TEST_CONFIG.performance.followOperation.acceptable ? 'acceptable' : 'bad'
    
    reporter.addResult(
      'Follow operation performance',
      followPerf !== 'bad',
      { stats: followStats, evaluation: followPerf },
      followStats.avg
    )
    
    // Test 3: Concurrent Follow Operations
    console.log('\n3️⃣  Testing Concurrent Follow Operations...')
    console.log('   Simulating multiple users following at the same time\n')
    
    const concurrentOps = 5
    const promises: Promise<number>[] = []
    
    for (let i = 0; i < concurrentOps && i < testUsers.length - 1; i++) {
      const follower = testUsers[i]
      const target = testUsers[testUsers.length - 1 - i]
      
      promises.push((async () => {
        const { data: userTags } = await supabase
          .from('UserTag')
          .select('user_tag_id')
          .eq('user_id', target.user_id)
          .limit(3)
        
        if (userTags && userTags.length > 0) {
          return perfTester.measureFollowOperation(
            follower.user_id,
            target.user_id,
            userTags.map(ut => ut.user_tag_id)
          )
        }
        return 0
      })())
    }
    
    const start = performance.now()
    const results = await Promise.all(promises)
    const totalDuration = performance.now() - start
    
    console.log(`   Completed ${concurrentOps} concurrent operations in ${totalDuration.toFixed(2)}ms`)
    console.log(`   Average per operation: ${(totalDuration / concurrentOps).toFixed(2)}ms`)
    
    reporter.addResult(
      'Concurrent follow operations',
      totalDuration < TEST_CONFIG.performance.followOperation.acceptable * concurrentOps,
      { 
        operations: concurrentOps,
        totalDuration,
        avgDuration: totalDuration / concurrentOps 
      }
    )
    
    // Test 4: Large Follow List Performance
    console.log('\n4️⃣  Testing Large Follow List Performance...')
    console.log('   Testing users with many follows\n')
    
    // Find user with most follows
    const { data: userWithMostFollows } = await supabase
      .from('Follow')
      .select('follower_user_id')
      .select('follower_user_id', { count: 'exact' })
      .group('follower_user_id')
      .order('count', { ascending: false })
      .limit(1)
    
    if (userWithMostFollows && userWithMostFollows.length > 0) {
      const userId = userWithMostFollows[0].follower_user_id
      
      const { count: followCount } = await supabase
        .from('Follow')
        .select('*', { count: 'exact', head: true })
        .eq('follower_user_id', userId)
      
      const duration = await perfTester.measureFeedQuery(userId)
      
      console.log(`   User with ${followCount} follows: ${duration.toFixed(2)}ms`)
      
      reporter.addResult(
        'Large follow list performance',
        duration < TEST_CONFIG.performance.feedQuery.bad,
        { followCount, duration }
      )
    }
    
    // Test 5: Index Effectiveness
    console.log('\n5️⃣  Testing Index Effectiveness...')
    console.log('   Analyzing query plans\n')
    
    // This would require EXPLAIN ANALYZE which needs special permissions
    // For now, we'll do a simple comparison test
    
    const sampleUser = testUsers[0]
    
    // Test query with index (follower_user_id)
    const start1 = performance.now()
    await supabase
      .from('Follow')
      .select('*')
      .eq('follower_user_id', sampleUser.user_id)
    const indexedQueryTime = performance.now() - start1
    
    // Test query that might not use optimal index
    const start2 = performance.now()
    await supabase
      .from('Follow')
      .select('*')
      .eq('channel_id', sampleUser.user_id)
      .eq('channel_type', 'USER_ALL')
    const potentiallySlowQueryTime = performance.now() - start2
    
    console.log(`   Indexed query: ${indexedQueryTime.toFixed(2)}ms`)
    console.log(`   Potentially slower query: ${potentiallySlowQueryTime.toFixed(2)}ms`)
    
    reporter.addResult(
      'Index effectiveness',
      indexedQueryTime < potentiallySlowQueryTime * 2,
      { indexedQueryTime, potentiallySlowQueryTime }
    )
    
    // Generate Performance Report
    console.log('\n📊 Performance Summary:')
    console.log('========================')
    
    const allStats = tracker.getAllStats()
    for (const [operation, stats] of Object.entries(allStats)) {
      if (stats) {
        console.log(`\n${operation}:`)
        console.log(`  Samples: ${stats.count}`)
        console.log(`  Average: ${stats.avg.toFixed(2)}ms`)
        console.log(`  Median: ${stats.median.toFixed(2)}ms`)
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
        console.log(`  P99: ${stats.p99.toFixed(2)}ms`)
      }
    }
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:')
    
    if (feedStats.avg > TEST_CONFIG.performance.feedQuery.acceptable) {
      console.log('  ⚠️  Feed queries are slow. Consider:')
      console.log('     - Adding additional indexes')
      console.log('     - Implementing query result caching')
      console.log('     - Paginating results more aggressively')
    }
    
    if (followStats.avg > TEST_CONFIG.performance.followOperation.acceptable) {
      console.log('  ⚠️  Follow operations are slow. Consider:')
      console.log('     - Batching follow operations')
      console.log('     - Using database transactions')
      console.log('     - Reviewing RLS policies for performance')
    }
    
    // Print final report
    reporter.printReport()
    
    // Exit with appropriate code
    const summary = reporter.getSummary()
    process.exit(summary.failed > 0 ? 1 : 0)
    
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  }
}

// Run the tests
testFollowPerformance()