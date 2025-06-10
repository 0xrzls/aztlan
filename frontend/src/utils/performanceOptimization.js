// src/utils/performanceOptimization.js - PERFORMANCE IMPROVEMENTS
import { aztecClient } from '../lib/aztecClient';

// Lazy loading utilities
export const lazyLoadComponent = (importFunc) => {
  return React.lazy(() => 
    importFunc().catch(error => {
      console.error('Component lazy loading failed:', error);
      // Return a fallback component
      return {
        default: () => React.createElement('div', {
          className: 'p-4 text-center text-red-400'
        }, 'Failed to load component')
      };
    })
  );
};

// Bundle splitting for Aztec.js
export const loadAztecLibrary = async () => {
  try {
    // Dynamically import heavy Aztec libraries only when needed
    const aztecModule = await import('@aztec/aztec.js');
    const accountsModule = await import('@aztec/accounts/schnorr');
    
    return {
      ...aztecModule,
      getSchnorrAccount: accountsModule.getSchnorrAccount
    };
  } catch (error) {
    console.error('Failed to load Aztec libraries:', error);
    throw new Error('Aztec libraries could not be loaded');
  }
};

// Connection pooling and caching
class ConnectionManager {
  constructor() {
    this.connectionPool = new Map();
    this.cache = new Map();
    this.maxCacheAge = 60000; // 1 minute
    this.maxPoolSize = 5;
  }

  async getConnection(url) {
    const existing = this.connectionPool.get(url);
    if (existing && existing.isHealthy) {
      return existing;
    }

    // Clean up stale connections
    this.cleanupConnections();

    // Create new connection
    try {
      const connection = await this.createConnection(url);
      this.connectionPool.set(url, {
        connection,
        created: Date.now(),
        isHealthy: true,
        lastUsed: Date.now()
      });
      
      return connection;
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    }
  }

  async createConnection(url) {
    const { createPXEClient, waitForPXE } = await loadAztecLibrary();
    const pxe = createPXEClient(url);
    
    // Test connection with timeout
    await Promise.race([
      waitForPXE(pxe),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      )
    ]);
    
    return pxe;
  }

  cleanupConnections() {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    
    for (const [url, info] of this.connectionPool.entries()) {
      if (now - info.lastUsed > maxAge) {
        this.connectionPool.delete(url);
      }
    }
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.maxCacheAge) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20 entries
      for (let i = 0; i < 20; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
}

// Singleton connection manager
export const connectionManager = new ConnectionManager();

// Debounced operations
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Throttled operations for frequent calls
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory usage monitoring
class MemoryMonitor {
  constructor() {
    this.checkInterval = null;
    this.thresholds = {
      warning: 100 * 1024 * 1024, // 100MB
      critical: 200 * 1024 * 1024 // 200MB
    };
  }

  start() {
    if (this.checkInterval) return;
    
    this.checkInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000); // Check every 30 seconds
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  checkMemoryUsage() {
    if (!performance.memory) return;
    
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    if (usedJSHeapSize > this.thresholds.critical) {
      console.warn('🚨 Critical memory usage detected:', {
        used: `${Math.round(usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(jsHeapSizeLimit / 1024 / 1024)}MB`
      });
      
      this.triggerMemoryCleanup();
    } else if (usedJSHeapSize > this.thresholds.warning) {
      console.warn('⚠️ High memory usage detected:', {
        used: `${Math.round(usedJSHeapSize / 1024 / 1024)}MB`
      });
    }
  }

  triggerMemoryCleanup() {
    // Clear caches
    connectionManager.cache.clear();
    
    // Request garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Emit memory pressure event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memoryPressure', {
        detail: { 
          used: performance.memory?.usedJSHeapSize,
          total: performance.memory?.totalJSHeapSize
        }
      }));
    }
  }

  getMemoryUsage() {
    if (!performance.memory) {
      return { available: false };
    }
    
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
    
    return {
      available: true,
      used: usedJSHeapSize,
      total: totalJSHeapSize,
      limit: jsHeapSizeLimit,
      usedMB: Math.round(usedJSHeapSize / 1024 / 1024),
      totalMB: Math.round(totalJSHeapSize / 1024 / 1024),
      limitMB: Math.round(jsHeapSizeLimit / 1024 / 1024),
      percentage: Math.round((usedJSHeapSize / jsHeapSizeLimit) * 100)
    };
  }
}

export const memoryMonitor = new MemoryMonitor();

// Resource preloading
export const preloadCriticalResources = async () => {
  try {
    // Preload critical images
    const criticalImages = [
      '/uid/01UID.png',
      '/uid/02UID.png',
      '/uid/03UID.png',
      '/desktoplogo/desktopdark.svg',
      '/mobilelogo/mobiledark.svg'
    ];
    
    const imagePromises = criticalImages.map(src => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(null);
        img.src = src;
      });
    });
    
    await Promise.all(imagePromises);
    console.log('✅ Critical images preloaded');
    
    // Preload Aztec libraries if not in mock mode
    if (localStorage.getItem('aztec_use_mock') !== 'true') {
      loadAztecLibrary().catch(error => {
        console.warn('⚠️ Aztec library preload failed:', error);
      });
    }
    
  } catch (error) {
    console.warn('⚠️ Resource preloading failed:', error);
  }
};

// Performance metrics collection
class PerformanceTracker {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startTracking() {
    // Track page load metrics
    this.trackPageLoad();
    
    // Track component render times
    this.trackComponentRenders();
    
    // Track Aztec operation times
    this.trackAztecOperations();
    
    // Track memory usage
    memoryMonitor.start();
  }

  trackPageLoad() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        this.metrics.set('pageLoad', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        });
        
        console.log('📊 Page load metrics:', this.metrics.get('pageLoad'));
      }
    });
  }

  trackComponentRenders() {
    // Track React component render times using Performance API
    if (typeof window !== 'undefined' && window.performance.mark) {
      const originalConsoleTime = console.time;
      const originalConsoleTimeEnd = console.timeEnd;
      
      console.time = (label) => {
        window.performance.mark(`${label}-start`);
        return originalConsoleTime.call(console, label);
      };
      
      console.timeEnd = (label) => {
        window.performance.mark(`${label}-end`);
        window.performance.measure(label, `${label}-start`, `${label}-end`);
        return originalConsoleTimeEnd.call(console, label);
      };
    }
  }

  trackAztecOperations() {
    // Wrap Aztec client methods to track performance
    const originalMethods = {};
    const methodsToTrack = ['initialize', 'createWallet', 'createProfile', 'loadContracts'];
    
    methodsToTrack.forEach(method => {
      if (aztecClient[method]) {
        originalMethods[method] = aztecClient[method];
        aztecClient[method] = async (...args) => {
          const startTime = performance.now();
          const startMark = `aztec-${method}-start`;
          const endMark = `aztec-${method}-end`;
          
          performance.mark(startMark);
          
          try {
            const result = await originalMethods[method].apply(aztecClient, args);
            
            performance.mark(endMark);
            performance.measure(`aztec-${method}`, startMark, endMark);
            
            const duration = performance.now() - startTime;
            this.metrics.set(`aztec-${method}`, duration);
            
            console.log(`⚡ Aztec ${method} completed in ${Math.round(duration)}ms`);
            
            return result;
          } catch (error) {
            performance.mark(endMark);
            performance.measure(`aztec-${method}-error`, startMark, endMark);
            throw error;
          }
        };
      }
    });
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  getPerformanceEntries() {
    return {
      navigation: performance.getEntriesByType('navigation'),
      resource: performance.getEntriesByType('resource'),
      measure: performance.getEntriesByType('measure'),
      mark: performance.getEntriesByType('mark')
    };
  }
}

export const performanceTracker = new PerformanceTracker();

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const chunks = [];
  
  // Analyze loaded scripts
  document.querySelectorAll('script[src]').forEach(script => {
    chunks.push({
      url: script.src,
      type: 'script'
    });
  });
  
  // Analyze loaded stylesheets
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    chunks.push({
      url: link.href,
      type: 'stylesheet'
    });
  });
  
  console.log('📦 Loaded chunks:', chunks);
  
  // Estimate bundle sizes
  fetch('/asset-manifest.json')
    .then(response => response.json())
    .then(manifest => {
      console.log('📦 Asset manifest:', manifest);
    })
    .catch(() => {
      console.log('📦 Asset manifest not available');
    });
};

// Error tracking with performance context
export const trackErrorWithPerformance = (error, context = {}) => {
  const performanceContext = {
    memory: memoryMonitor.getMemoryUsage(),
    metrics: performanceTracker.getMetrics(),
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...context
  };
  
  console.error('🐛 Error with performance context:', {
    error: error.message,
    stack: error.stack,
    performance: performanceContext
  });
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, LogRocket, etc.
    // errorTrackingService.captureException(error, { extra: performanceContext });
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  performanceTracker.startTracking();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Analyze bundle in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(analyzeBundleSize, 2000);
  }
  
  // Listen for memory pressure events
  if (typeof window !== 'undefined') {
    window.addEventListener('memoryPressure', (event) => {
      console.warn('🧠 Memory pressure detected:', event.detail);
      
      // Trigger app-wide memory cleanup
      if (window.aztlanApp && window.aztlanApp.handleMemoryPressure) {
        window.aztlanApp.handleMemoryPressure();
      }
    });
  }
  
  console.log('🚀 Performance monitoring initialized');
};
