'use client'

import { useState, useEffect } from 'react'
import { performanceLogger, type PerformanceLog } from '@/lib/performance-logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/AppLayout'

export default function PerformanceDebugPage() {
  type SummaryStats = {
    count: number;
    totalDuration: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  };
  const [summary, setSummary] = useState<Record<string, SummaryStats>>({})
  const [slowQueries, setSlowQueries] = useState<PerformanceLog[]>([])
  const [allLogs, setAllLogs] = useState<PerformanceLog[]>([])
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    updatePerformanceData()
  }, [])

  const updatePerformanceData = () => {
    setSummary(performanceLogger.getSummary())
    setSlowQueries(performanceLogger.getSlowQueries())
    setAllLogs(performanceLogger.getAllLogs())
  }

  const clearLogs = () => {
    performanceLogger.clear()
    updatePerformanceData()
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Performance Debug</h1>
          <div className="space-x-2">
            <Button onClick={updatePerformanceData} variant="outline">
              Refresh
            </Button>
            <Button onClick={clearLogs} variant="outline">
              Clear Logs
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Auth Status</CardTitle>
            <CardDescription>Current authentication state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>User ID:</strong> {user?.id || 'Not logged in'}</p>
              <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
              <p><strong>Username:</strong> {profile?.username || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Aggregated performance metrics by operation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Operation</th>
                    <th className="text-right p-2">Count</th>
                    <th className="text-right p-2">Avg (ms)</th>
                    <th className="text-right p-2">Min (ms)</th>
                    <th className="text-right p-2">Max (ms)</th>
                    <th className="text-right p-2">Total (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary).map(([operation, stats]: [string, SummaryStats]) => (
                    <tr key={operation} className="border-b">
                      <td className="p-2 font-mono text-xs">{operation}</td>
                      <td className="text-right p-2">{stats.count}</td>
                      <td className="text-right p-2">{stats.avgDuration.toFixed(2)}</td>
                      <td className="text-right p-2">{stats.minDuration.toFixed(2)}</td>
                      <td className="text-right p-2">{stats.maxDuration.toFixed(2)}</td>
                      <td className="text-right p-2">{stats.totalDuration.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slow Queries</CardTitle>
            <CardDescription>Operations that took longer than 100ms</CardDescription>
          </CardHeader>
          <CardContent>
            {slowQueries.length === 0 ? (
              <p className="text-muted-foreground">No slow queries detected</p>
            ) : (
              <div className="space-y-2">
                {slowQueries.map((query, index) => (
                  <div key={index} className="border p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-sm">{query.operation}</span>
                      <span className="text-sm font-semibold text-red-600">
                        {query.duration.toFixed(2)}ms
                      </span>
                    </div>
                    {query.metadata && (
                      <pre className="text-xs mt-2 text-muted-foreground">
                        {JSON.stringify(query.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Operations</CardTitle>
            <CardDescription>Last 20 operations tracked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allLogs.slice(0, 20).map((log, index) => (
                <div key={index} className="border p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-sm">{log.operation}</span>
                    <span className={`text-sm font-semibold ${
                      log.duration > 100 ? 'text-red-600' : 
                      log.duration > 50 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {log.duration.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  {log.metadata && (
                    <pre className="text-xs mt-2 text-muted-foreground">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}