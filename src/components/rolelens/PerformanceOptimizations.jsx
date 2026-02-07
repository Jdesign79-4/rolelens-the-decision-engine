/**
 * Performance Optimization Utilities
 * Handles memoization, caching, and performance monitoring
 */

// Cache for expensive calculations
const scoreCache = new Map();

export function getCachedScore(key, calculationFn) {
  if (scoreCache.has(key)) {
    return scoreCache.get(key);
  }
  const result = calculationFn();
  scoreCache.set(key, result);
  return result;
}

export function clearScoreCache() {
  scoreCache.clear();
}

// Debounce function for expensive operations
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Monitor render performance
export function logRenderTime(componentName, startTime) {
  const renderTime = performance.now() - startTime;
  if (renderTime > 16.67) { // > 1 frame at 60fps
    console.warn(`[PERF] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
  }
}