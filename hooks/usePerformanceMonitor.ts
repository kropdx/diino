import { useEffect, useRef } from 'react';
import { performanceLogger } from '@/lib/performance-logger';

export function usePerformanceMonitor(componentName: string) {
  const mountTime = useRef<number | undefined>(undefined);
  const renderCount = useRef(0);

  useEffect(() => {
    // Log component mount time
    if (!mountTime.current) {
      mountTime.current = performance.now();
      console.debug(`⚡ ${componentName} mounted`);
    }

    // Log render count
    renderCount.current++;
    if (renderCount.current > 10) {
      console.warn(`⚠️ ${componentName} has rendered ${renderCount.current} times`);
    }

    return () => {
      // Log component lifetime on unmount
      if (mountTime.current) {
        const lifetime = performance.now() - mountTime.current;
        console.debug(`⚡ ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);

  // Utility to measure async operations within the component
  const measureAsync = async <T,>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    return performanceLogger.measureAsync(
      `${componentName}.${operationName}`,
      fn,
      metadata
    );
  };

  // Utility to measure sync operations within the component
  const measure = <T,>(
    operationName: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T => {
    return performanceLogger.measure(
      `${componentName}.${operationName}`,
      fn,
      metadata
    );
  };

  return { measureAsync, measure };
}