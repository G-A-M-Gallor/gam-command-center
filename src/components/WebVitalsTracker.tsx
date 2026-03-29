"use client";

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export default function WebVitalsTracker() {
  useEffect(() => {
    // Initialize Web Vitals tracking on client side
    initWebVitals();
  }, []);

  // This component renders nothing, just tracks metrics
  return null;
}