export interface PerformanceLog {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class PerformanceLogger {
  private logs: PerformanceLog[] = [];
  private slowQueryThreshold = 100; // milliseconds

  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.log(operation, duration, metadata);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.log(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  measure<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const start = performance.now();
    
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      this.log(operation, duration, metadata);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.log(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  private log(operation: string, duration: number, metadata?: Record<string, unknown>) {
    const log: PerformanceLog = {
      operation,
      duration,
      timestamp: new Date(),
      metadata
    };

    this.logs.push(log);

    // Log to console if slow
    if (duration > this.slowQueryThreshold) {
      console.warn(`⚠️ Slow operation detected:`, {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        ...metadata
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.debug(`✓ Operation completed:`, {
        operation,
        duration: `${duration.toFixed(2)}ms`,
        ...metadata
      });
    }
  }

  getSlowQueries(threshold?: number): PerformanceLog[] {
    const t = threshold || this.slowQueryThreshold;
    return this.logs.filter(log => log.duration > t);
  }

  getAllLogs(): PerformanceLog[] {
    return [...this.logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSummary() {
    const grouped = this.logs.reduce((acc, log) => {
      if (!acc[log.operation]) {
        acc[log.operation] = {
          count: 0,
          totalDuration: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        };
      }
      
      const group = acc[log.operation];
      group.count++;
      group.totalDuration += log.duration;
      group.avgDuration = group.totalDuration / group.count;
      group.minDuration = Math.min(group.minDuration, log.duration);
      group.maxDuration = Math.max(group.maxDuration, log.duration);
      
      return acc;
    }, {} as Record<string, {
      count: number;
      totalDuration: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
    }>);

    return grouped;
  }

  printSummary() {
    console.table(this.getSummary());
  }

  clear() {
    this.logs = [];
  }
}

export const performanceLogger = new PerformanceLogger();