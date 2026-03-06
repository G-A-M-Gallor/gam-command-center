'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4 text-red-400" />
        <h2 className="mb-2 text-lg font-semibold text-slate-200">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          {error.message || 'An unexpected error occurred in the dashboard.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        {error.digest && (
          <p className="mt-4 text-[10px] text-slate-700" dir="ltr">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
