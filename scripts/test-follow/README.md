# Follow Functionality Test Suite

This directory contains comprehensive tests for the follow functionality in Diino. The tests verify data integrity, performance, and edge cases using the Supabase database.

## Prerequisites

- Node.js and npm installed
- `.env.local` file with Supabase credentials
- Optional: `SUPABASE_SERVICE_ROLE_KEY` for admin operations (falls back to anon key)

## Test Scripts

### 1. Seed Test Data
Generate test users, tags, stories, and follow relationships:
```bash
npm run test:follow:seed
```

This creates:
- 100 test users (prefixed with `test_perf_`)
- 30 tags (technology, science, gaming, etc.)
- 100 stories per user
- 20-200 follow relationships per user (mix of "follow all" and specific tags)

### 2. Run All Tests
Execute the complete test suite:
```bash
npm run test:follow
```

### 3. Inspect Database
View detailed follow statistics and user information:
```bash
# Overall statistics
npm run test:follow:user

# Specific user details
npm run test:follow:user test_perf_user_abc123
```

### 4. Clean Test Data
Remove all test users and their data:
```bash
npm run test:follow:clean
```

## Test Categories

### Data Integrity Tests (`test-follow-integrity.ts`)
- Verifies Follow table constraints
- Tests duplicate follow prevention
- Checks cascade deletes
- Validates foreign key relationships
- Ensures no orphaned records

### Performance Tests (`test-follow-performance.ts`)
- Measures feed query performance
- Tests follow operation speed
- Simulates concurrent operations
- Analyzes query performance with large datasets
- Provides performance recommendations

### Database Inspector (`inspect-follows.ts`)
- Shows overall statistics (users, follows, averages)
- Displays most followed users
- Shows most active users
- User-specific details:
  - Who they follow (all vs specific tags)
  - Who follows them
  - Feed preview

## Performance Thresholds

The tests use these performance benchmarks:

**Feed Queries:**
- Good: < 100ms
- Acceptable: < 500ms
- Bad: > 1000ms

**Follow Operations:**
- Good: < 50ms
- Acceptable: < 200ms
- Bad: > 500ms

## Test Data Configuration

Configuration in `config.ts`:
- 100 test users
- 100 stories per user
- 20-200 follows per user
- 30 different tags

## Using with Database Branches

To test on a separate database branch:

1. Create a branch using Supabase MCP:
   ```typescript
   await mcp__supabase__create_branch({
     name: "test-follow-functionality"
   })
   ```

2. Update your `.env.local` to point to the branch database

3. Run the test suite

4. Delete the branch when done

## Troubleshooting

### "No test users found"
Run `npm run test:follow:seed` first to create test data.

### Permission errors
Some operations require the service role key. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.

### Slow performance
Check the performance test output for specific recommendations about indexes and query optimization.

## Example Output

```
📊 Overall Statistics:
=====================

Total users: 142
Test users: 100
Non-test users: 42

Total follows: 15,234
  - USER_ALL: 3,045
  - USER_TAG: 12,189
Average follows per user: 107.35

🏆 Most Followed Users:
=======================

  @test_perf_user_xyz789: 89 followers
  @test_perf_user_abc123: 85 followers
  ...
```

## Integration with CI/CD

The test scripts exit with appropriate codes:
- 0: All tests passed
- 1: One or more tests failed

This makes them suitable for CI/CD pipelines.