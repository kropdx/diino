#!/usr/bin/env node

import { execSync } from 'child_process'
import { resolve } from 'path'

console.log('🚀 Running Follow Functionality Test Suite\n')

const scripts = [
  {
    name: 'Data Integrity Tests',
    file: 'test-follow-integrity.ts',
    description: 'Verifies database constraints and data consistency'
  },
  {
    name: 'Performance Tests',
    file: 'test-follow-performance.ts',
    description: 'Measures query and operation performance'
  }
]

const baseDir = resolve(__dirname)
let allPassed = true

async function runTest(script: typeof scripts[0]) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`Running: ${script.name}`)
  console.log(`${script.description}`)
  console.log(${'='.repeat(60)}\n`)
  
  try {
    execSync(`npx tsx ${resolve(baseDir, script.file)}`, {
      stdio: 'inherit',
      cwd: baseDir
    })
    console.log(`\n✅ ${script.name} passed`)
  } catch (error) {
    console.error(`\n❌ ${script.name} failed`)
    allPassed = false
  }
}

async function main() {
  // Check if we need to seed data first
  const seedFlag = process.argv.includes('--seed')
  const inspectFlag = process.argv.includes('--inspect')
  const username = process.argv.find(arg => !arg.startsWith('--') && arg !== process.argv[1])
  
  if (seedFlag) {
    console.log('🌱 Seeding test data first...\n')
    try {
      execSync(`npx tsx ${resolve(baseDir, 'seed-test-data.ts')}`, {
        stdio: 'inherit',
        cwd: baseDir
      })
      console.log('\n✅ Test data seeded successfully\n')
    } catch (error) {
      console.error('\n❌ Failed to seed test data')
      process.exit(1)
    }
  }
  
  // Run all tests
  for (const script of scripts) {
    await runTest(script)
  }
  
  // Run inspection if requested
  if (inspectFlag) {
    console.log(`\n${'='.repeat(60)}`)
    console.log('Running: Database Inspector')
    console.log(${'='.repeat(60)}\n`)
    
    const inspectCmd = username 
      ? `npx tsx ${resolve(baseDir, 'inspect-follows.ts')} ${username}`
      : `npx tsx ${resolve(baseDir, 'inspect-follows.ts')}`
    
    try {
      execSync(inspectCmd, {
        stdio: 'inherit',
        cwd: baseDir
      })
    } catch (error) {
      console.error('\n❌ Inspection failed')
    }
  }
  
  // Final summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('TEST SUITE SUMMARY')
  console.log(${'='.repeat(60)}\n`)
  
  if (allPassed) {
    console.log('✅ All tests passed!')
  } else {
    console.log('❌ Some tests failed. Please check the output above.')
  }
  
  console.log('\nUseful commands:')
  console.log('  npm run test:follow             # Run all tests')
  console.log('  npm run test:follow:seed        # Seed data and run tests')
  console.log('  npm run test:follow:inspect     # Run tests and inspect database')
  console.log('  npm run test:follow:user <name> # Inspect specific user')
  
  process.exit(allPassed ? 0 : 1)
}

main()