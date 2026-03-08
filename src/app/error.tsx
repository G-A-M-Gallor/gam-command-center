'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <AlertTriangle size={40} className="mx-auto mb-4 text-red-400" />
        <h2 className="mb-2 text-lg font-semibold text-slate-200">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" size="lg" icon={RefreshCw} onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="secondary" size="lg" icon={Home}>
              Home
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-[10px] text-slate-700" dir="ltr">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
