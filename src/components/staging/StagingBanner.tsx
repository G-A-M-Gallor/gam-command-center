'use client';

import React from 'react';

interface StagingBannerProps {
  className?: string;
}

export function StagingBanner({ className = '' }: StagingBannerProps) {
  const isStaging = process.env.STAGING_MODE === 'true' ||
                   process.env.NEXT_PUBLIC_VERCEL_ENV === 'staging' ||
                   typeof window !== 'undefined' && window.location.hostname.includes('staging');

  if (!isStaging) {
    return null;
  }

  return (
    <div className={`
      fixed top-0 left-0 right-0 z-50
      bg-gradient-to-r from-yellow-500 to-orange-500
      text-white text-center py-2 px-4 font-medium text-sm
      shadow-lg border-b-2 border-yellow-600
      ${className}
    `}>
      <div className="flex items-center justify-center gap-2">
        <span className="animate-pulse text-yellow-100">⚠️</span>
        <span>
          <strong>STAGING ENVIRONMENT</strong> -
          This is a test environment. Data may be reset at any time.
        </span>
        <span className="animate-pulse text-yellow-100">⚠️</span>
      </div>
    </div>
  );
}

// Staging info panel for developers
export function StagingInfo() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [healthData, setHealthData] = React.useState<{
    status: string;
    database?: { status: string };
    system?: { response_time: number };
  } | null>(null);

  const isStaging = process.env.STAGING_MODE === 'true' ||
                   process.env.NEXT_PUBLIC_VERCEL_ENV === 'staging';

  React.useEffect(() => {
    if (isStaging) {
      // Fetch staging health data
      fetch('/api/staging/health')
        .then(res => res.json())
        .then(data => setHealthData(data))
        .catch(console.error);
    }
  }, [isStaging]);

  if (!isStaging) {
    return null;
  }

  return (
    <>
      {/* Staging info toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="
          fixed bottom-4 right-4 z-40
          bg-yellow-500 hover:bg-yellow-600
          text-white rounded-full p-3 shadow-lg
          transition-colors duration-200
        "
        title="Toggle staging info"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Staging info panel */}
      {isVisible && (
        <div className="
          fixed bottom-20 right-4 z-40
          bg-white border border-yellow-300 rounded-lg shadow-xl p-4
          w-80 max-h-96 overflow-y-auto
        ">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">🧪 Staging Environment</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Environment info */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Environment</h4>
              <div className="bg-gray-50 p-2 rounded text-xs font-mono">
                <div>NODE_ENV: {process.env.NODE_ENV}</div>
                <div>URL: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
              </div>
            </div>

            {/* Health status */}
            {healthData && (
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Health Status</h4>
                <div className={`
                  p-2 rounded text-xs
                  ${healthData.status === 'healthy' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}
                `}>
                  <div>Status: {healthData.status}</div>
                  <div>Database: {healthData.database?.status}</div>
                  <div>Response Time: {healthData.system?.response_time}ms</div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Quick Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={() => window.open('/api/staging/health', '_blank')}
                  className="
                    w-full text-left p-2 text-xs
                    bg-blue-50 hover:bg-blue-100
                    rounded border border-blue-200
                  "
                >
                  📊 View Full Health Report
                </button>

                <button
                  onClick={() => {
                    fetch('/api/staging/health', { cache: 'no-store' })
                      .then(res => res.json())
                      .then(data => setHealthData(data));
                  }}
                  className="
                    w-full text-left p-2 text-xs
                    bg-green-50 hover:bg-green-100
                    rounded border border-green-200
                  "
                >
                  🔄 Refresh Health Data
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <div className="text-yellow-800 text-xs">
                <strong>⚠️ Warning:</strong> This is a staging environment.
                Data may be reset without notice.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}