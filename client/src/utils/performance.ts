// Performance Monitoring Utilities

export interface PerformanceMetrics {
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    loadTime: 0,
    domContentLoaded: 0
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  initializeMetrics() {
    if (typeof window === 'undefined') return;

    // Basic timing metrics
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
    });

    // Web Vitals
    this.observeWebVitals();
  }

  private observeWebVitals() {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      }
    }).observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.metrics.cumulativeLayoutShift = clsValue;
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  reportMetrics() {
    console.group('🚀 Performance Metrics');
    console.log('Load Time:', `${this.metrics.loadTime}ms`);
    console.log('DOM Content Loaded:', `${this.metrics.domContentLoaded}ms`);
    if (this.metrics.firstContentfulPaint) {
      console.log('First Contentful Paint:', `${this.metrics.firstContentfulPaint}ms`);
    }
    if (this.metrics.largestContentfulPaint) {
      console.log('Largest Contentful Paint:', `${this.metrics.largestContentfulPaint}ms`);
    }
    if (this.metrics.firstInputDelay) {
      console.log('First Input Delay:', `${this.metrics.firstInputDelay}ms`);
    }
    if (this.metrics.cumulativeLayoutShift) {
      console.log('Cumulative Layout Shift:', this.metrics.cumulativeLayoutShift);
    }
    console.groupEnd();
  }
}

// Image optimization utilities
export const optimizeImageSrc = (src: string, width?: number, quality?: number): string => {
  if (!src || src.startsWith('data:')) return src;
  
  // For external images, you might want to use a CDN like Cloudinary
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());
  
  const separator = src.includes('?') ? '&' : '?';
  return params.toString() ? `${src}${separator}${params.toString()}` : src;
};

// Bundle analyzer helper
export const analyzeBundle = () => {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then(({ BundleAnalyzerPlugin }) => {
      console.log('Bundle analysis available at: http://localhost:8888');
    }).catch(() => {
      console.log('Bundle analyzer not available in this environment');
    });
  }
};