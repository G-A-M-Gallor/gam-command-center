"use client";

// Web Vitals tracking for real performance data
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

// Store metrics locally before sending
let vitalsBuffer: WebVitalsMetric[] = [];

// Send metrics to our API endpoint
async function sendVitalsToAPI(metrics: WebVitalsMetric[]) {
  try {
    await fetch('/api/performance/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vitals: metrics,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }),
    });
  } catch (error) {
    console.error('Failed to send Web Vitals:', error);
  }
}

// Batch send metrics every 10 seconds or when 5+ metrics collected
function flushVitals() {
  if (vitalsBuffer.length > 0) {
    sendVitalsToAPI([...vitalsBuffer]);
    vitalsBuffer = [];
  }
}

// Auto-flush every 10 seconds
setInterval(flushVitals, 10000);

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushVitals);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushVitals();
    }
  });
}

// Collect and store Web Vitals
function handleVital(metric: WebVitalsMetric) {
  // Add to buffer
  vitalsBuffer.push(metric);

  // Send immediately if buffer is full
  if (vitalsBuffer.length >= 5) {
    flushVitals();
  }

  // Log for debugging
  console.log(`📊 ${metric.name}:`, {
    value: metric.value,
    rating: getVitalRating(metric.name, metric.value),
    delta: metric.delta
  });
}

// Get performance rating for each vital
function getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  switch (name) {
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}

// Initialize Web Vitals tracking
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Dynamic import to avoid SSR issues
  import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
    onCLS(handleVital);
    onFCP(handleVital);
    onINP(handleVital);  // onINP replaced onFID in newer web-vitals
    onLCP(handleVital);
    onTTFB(handleVital);
  }).catch(err => {
    console.warn('Web Vitals not available:', err);
  });
}

// Export for manual tracking
export { handleVital, flushVitals };