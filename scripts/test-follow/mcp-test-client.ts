#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// MCP-like interface for test scripts
// This simulates MCP commands but uses the Supabase client directly
export class MCPTestClient {
  private supabase: any
  private projectRef: string
  
  constructor(supabaseUrl: string, supabaseKey: string, projectRef: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.projectRef = projectRef
  }

  async executeSQL(query: string): Promise<any> {
    const start = performance.now()
    
    try {
      // For SELECT queries, use the Supabase RPC or direct query
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        // We'll use RPC function for raw SQL queries
        const { data, error } = await this.supabase.rpc('exec_sql', { query })
        
        if (error) {
          console.error('SQL Error:', error)
          throw error
        }
        
        const duration = performance.now() - start
        return {
          data,
          duration,
          rowCount: data?.length || 0
        }
      } else {
        // For other queries, we'll need to handle them differently
        // This is a limitation - in real MCP we could execute any SQL
        console.warn('Non-SELECT queries need special handling')
        const duration = performance.now() - start
        return {
          data: null,
          duration,
          rowCount: 0
        }
      }
    } catch (error) {
      const duration = performance.now() - start
      throw {
        error,
        duration
      }
    }
  }

  async listTables(schemas: string[] = ['public']): Promise<any> {
    const query = `
      SELECT 
        schemaname as schema,
        tablename as name,
        hasindexes as has_indexes,
        tablespace
      FROM pg_tables 
      WHERE schemaname = ANY($1::text[])
      ORDER BY schemaname, tablename
    `
    
    return this.executeSQL(query.replace('$1::text[]', `'{${schemas.join(',')}}'`))
  }

  async getTableInfo(tableName: string, schema: string = 'public'): Promise<any> {
    const query = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = '${schema}'
      AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `
    
    return this.executeSQL(query)
  }

  async getTableRowCount(tableName: string): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "${tableName}"`
    const result = await this.executeSQL(query)
    return result.data?.[0]?.count || 0
  }

  // Performance analysis
  async explainQuery(query: string): Promise<any> {
    const explainQuery = `EXPLAIN ANALYZE ${query}`
    return this.executeSQL(explainQuery)
  }

  // Direct Supabase client access for operations not supported by SQL
  getSupabaseClient() {
    return this.supabase
  }
}

// Performance tracking utilities
export class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map()

  track(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    this.metrics.get(operation)!.push(duration)
  }

  getStats(operation: string) {
    const durations = this.metrics.get(operation) || []
    if (durations.length === 0) return null

    const sorted = [...durations].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)
    
    return {
      count: sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }

  getAllStats() {
    const stats: Record<string, any> = {}
    for (const [operation, _] of this.metrics) {
      stats[operation] = this.getStats(operation)
    }
    return stats
  }

  reset() {
    this.metrics.clear()
  }
}

// Test result reporting
export class TestReporter {
  private results: any[] = []
  private startTime: number = Date.now()

  addResult(test: string, passed: boolean, details?: any, duration?: number) {
    this.results.push({
      test,
      passed,
      details,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  getSummary() {
    const totalDuration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    
    return {
      total: this.results.length,
      passed,
      failed,
      duration: totalDuration,
      passRate: (passed / this.results.length * 100).toFixed(2) + '%'
    }
  }

  getFailures() {
    return this.results.filter(r => !r.passed)
  }

  printReport() {
    console.log('\n=== TEST REPORT ===')
    console.log(`Total Tests: ${this.results.length}`)
    console.log(`Passed: ${this.results.filter(r => r.passed).length}`)
    console.log(`Failed: ${this.results.filter(r => !r.passed).length}`)
    
    const failures = this.getFailures()
    if (failures.length > 0) {
      console.log('\n=== FAILURES ===')
      failures.forEach(f => {
        console.log(`\n❌ ${f.test}`)
        if (f.details) {
          console.log('Details:', f.details)
        }
      })
    }
    
    const summary = this.getSummary()
    console.log('\n=== SUMMARY ===')
    console.log(`Pass Rate: ${summary.passRate}`)
    console.log(`Total Duration: ${(summary.duration / 1000).toFixed(2)}s`)
  }
}