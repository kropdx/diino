'use client';

import { useState, useEffect } from 'react';
import { performanceLogger } from '@/lib/performance-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SummaryStats {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
}

interface SlowQuery {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export default function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<Record<string, SummaryStats>>({});
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSummary(performanceLogger.getSummary());
      setSlowQueries(performanceLogger.getSlowQueries());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
        title="Toggle Performance Dashboard"
      >
        ⚡
      </button>

      {/* Dashboard overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-96 bg-background shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="m-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Performance Dashboard</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    performanceLogger.clear();
                    setSummary({});
                    setSlowQueries([]);
                  }}
                >
                  Clear
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Operation Summary */}
                <div>
                  <h3 className="font-semibold mb-2">Operation Summary</h3>
                  <div className="space-y-2">
                    {Object.entries(summary).map(([operation, stats]) => (
                      <div key={operation} className="text-sm">
                        <div className="flex justify-between">
                          <span className="font-mono">{operation}</span>
                          <span className="text-muted-foreground">
                            {stats.count}x
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>avg: {stats.avgDuration.toFixed(2)}ms</span>
                          <span>min: {stats.minDuration.toFixed(2)}ms</span>
                          <span>max: {stats.maxDuration.toFixed(2)}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Slow Queries */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Slow Operations (&gt;100ms)
                  </h3>
                  <div className="space-y-2">
                    {slowQueries.map((query, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-red-50 dark:bg-red-950 rounded"
                      >
                        <div className="font-mono">{query.operation}</div>
                        <div className="text-xs text-muted-foreground">
                          {query.duration.toFixed(2)}ms at{' '}
                          {new Date(query.timestamp).toLocaleTimeString()}
                        </div>
                        {query.metadata && (
                          <pre className="text-xs mt-1">
                            {JSON.stringify(query.metadata, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                    {slowQueries.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No slow operations detected
                      </p>
                    )}
                  </div>
                </div>

                {/* Console Summary */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => performanceLogger.printSummary()}
                    className="w-full"
                  >
                    Print Summary to Console
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}