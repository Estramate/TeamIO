// Performance monitoring component for production optimization
import { useEffect, useRef } from 'react';
import { errorHandler } from '@/lib/error-handler';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const renderTime = Date.now() - startTime.current;

    // Track long render times
    if (renderTime > 100) {
      errorHandler.reportPerformance('slow-render', renderTime, {
        component: componentName,
        renderCount: renderCount.current
      });
    }

    // Monitor memory usage in development
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB threshold
        console.warn(`High memory usage in ${componentName}:`, {
          used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) + 'MB'
        });
      }
    }
  });

  const measureInteraction = (actionName: string) => {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      if (duration > 200) {
        errorHandler.reportPerformance('slow-interaction', duration, {
          component: componentName,
          action: actionName
        });
      }
    };
  };

  return { measureInteraction };
};

// Web Vitals monitoring
export const WebVitalsMonitor = () => {
  useEffect(() => {
    // Core Web Vitals monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const metric = entry.name;
        const value = entry.startTime || (entry as any).value;

        // Log important metrics
        if (['first-contentful-paint', 'largest-contentful-paint'].includes(metric)) {
          errorHandler.reportPerformance(metric, value, {
            entryType: entry.entryType,
            url: window.location.pathname
          });
        }
      });
    });

    // Observe paint and layout metrics
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
    } catch (error) {
      // Browser might not support all entry types
      console.warn('Performance observer setup failed:', error);
    }

    return () => observer.disconnect();
  }, []);

  return null;
};

// Bundle size analyzer for development
export const BundleAnalyzer = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const analyzeBundleSize = async () => {
      try {
        const modules = await import.meta.glob('/src/**/*.{ts,tsx,js,jsx}');
        const moduleCount = Object.keys(modules).length;
        
        console.log('📊 Bundle Analysis:', {
          totalModules: moduleCount,
          timestamp: new Date().toISOString()
        });

        // Warn about potential bundle bloat
        if (moduleCount > 100) {
          console.warn('⚠️ Large bundle detected. Consider code splitting for better performance.');
        }
      } catch (error) {
        console.warn('Bundle analysis failed:', error);
      }
    };

    // Run analysis after initial render
    setTimeout(analyzeBundleSize, 2000);
  }, []);

  return null;
};