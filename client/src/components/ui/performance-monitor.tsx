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
          usedJSHeapSize: `${Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024)}MB`,
          totalJSHeapSize: `${Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024)}MB`,
          jsHeapSizeLimit: `${Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
        
        errorHandler.reportPerformance('high-memory-usage', memoryInfo.usedJSHeapSize, {
          component: componentName,
          renderCount: renderCount.current,
          memoryInfo: {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
            limit: memoryInfo.jsHeapSizeLimit
          }
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

// Web Vitals monitoring with proper buffered entries and CLS aggregation
export const WebVitalsMonitor = () => {
  useEffect(() => {
    let clsValue = 0;
    
    // First Contentful Paint Observer with buffered entries
    const fcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          console.log(`Performance metric - first-contentful-paint:`, {
            value: `${Math.round(entry.startTime)}ms`,
            entryType: entry.entryType,
            url: window.location.pathname
          });
          
          errorHandler.reportPerformance('first-contentful-paint', entry.startTime, {
            entryType: entry.entryType,
            url: window.location.pathname
          });
        }
      });
    });

    // Largest Contentful Paint Observer with buffered entries
    const lcpObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`Performance metric - largest-contentful-paint:`, {
            value: `${Math.round(entry.startTime)}ms`,
            entryType: entry.entryType,
            url: window.location.pathname
          });
          
          errorHandler.reportPerformance('largest-contentful-paint', entry.startTime, {
            entryType: entry.entryType,
            url: window.location.pathname
          });
        }
      });
    });

    // Cumulative Layout Shift Observer with proper aggregation
    const clsObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          
          console.log(`Performance metric - cumulative-layout-shift:`, {
            value: clsValue.toFixed(4),
            entryType: entry.entryType,
            url: window.location.pathname
          });
          
          errorHandler.reportPerformance('cumulative-layout-shift', clsValue, {
            entryType: entry.entryType,
            url: window.location.pathname
          });
        }
      });
    });

    try {
      // FIX: Use buffered:true to capture events that occurred before observer mounted
      fcpObserver.observe({ type: 'paint', buffered: true });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('Enhanced Performance observation not supported:', error);
    }

    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
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
        

          totalModules: moduleCount,
          timestamp: new Date().toISOString()
        });

        // Warn about potential bundle bloat
        if (moduleCount > 100) {

        }
      } catch (error) {

      }
    };

    // Run analysis after initial render
    setTimeout(analyzeBundleSize, 2000);
  }, []);

  return null;
};