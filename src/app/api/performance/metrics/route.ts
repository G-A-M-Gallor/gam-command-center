import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetrics {
  timestamp: string;
  pageLoad: {
    fcp: number;          // First Contentful Paint
    lcp: number;          // Largest Contentful Paint
    cls: number;          // Cumulative Layout Shift
    fid: number;          // First Input Delay
    ttfb: number;         // Time To First Byte
  };
  bundle: {
    totalSize: number;
    chunks: Record<string, number>;
    heaviestComponents: Array<{
      name: string;
      size: number;
      loadTime: number;
    }>;
  };
  apis: {
    endpoints: Record<string, {
      avgResponseTime: number;
      lastResponseTime: number;
      errorRate: number;
      totalCalls: number;
    }>;
  };
  system: {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    cpuUsage: number;
    activeConnections: number;
  };
  geographic: {
    israel: {
      users: number;
      avgPerformance: number;
      regions: Record<string, {
        users: number;
        performance: number;
      }>;
    };
    international: {
      users: number;
      avgPerformance: number;
      countries: Record<string, {
        users: number;
        performance: number;
      }>;
    };
  };
  errors: {
    total: number;
    lastHour: number;
    topErrors: Array<{
      message: string;
      count: number;
      lastSeen: string;
    }>;
  };
}

// Simulate real-time performance data
function generateMockMetrics(): PerformanceMetrics {
  const now = new Date().toISOString();

  return {
    timestamp: now,
    pageLoad: {
      fcp: 1200 + Math.random() * 800,        // 1.2-2s
      lcp: 2100 + Math.random() * 1000,       // 2.1-3.1s
      cls: 0.05 + Math.random() * 0.1,        // 0.05-0.15
      fid: 89 + Math.random() * 100,          // 89-189ms
      ttfb: 156 + Math.random() * 200         // 156-356ms
    },
    bundle: {
      totalSize: 8420000, // ~8.4MB
      chunks: {
        'main': 2300000,
        'widgets': 1800000,     // Heavy!
        'ai-hub': 892000,
        'pages': 1200000,
        'vendor': 2228000
      },
      heaviestComponents: [
        { name: 'WidgetRegistry', size: 450000, loadTime: 234 },
        { name: 'TiptapEditor', size: 380000, loadTime: 189 },
        { name: 'StoryMapBoard', size: 290000, loadTime: 167 },
        { name: 'EntityCanvas', size: 245000, loadTime: 134 },
        { name: 'AIHub', size: 210000, loadTime: 98 }
      ]
    },
    apis: {
      endpoints: {
        '/api/entities': {
          avgResponseTime: 234,
          lastResponseTime: 189,
          errorRate: 0.02,
          totalCalls: 1247
        },
        '/api/ai-chat': {
          avgResponseTime: 1240,      // Slow!
          lastResponseTime: 1890,
          errorRate: 0.08,
          totalCalls: 567
        },
        '/api/courses': {
          avgResponseTime: 89,
          lastResponseTime: 67,
          errorRate: 0.01,
          totalCalls: 234
        },
        '/api/semantic/search': {
          avgResponseTime: 445,
          lastResponseTime: 623,
          errorRate: 0.03,
          totalCalls: 789
        },
        '/functions/v1/claude-code-context': {
          avgResponseTime: 678,
          lastResponseTime: 534,
          errorRate: 0.01,
          totalCalls: 123
        }
      }
    },
    system: {
      memoryUsage: {
        used: 245000000,     // 245MB
        total: 512000000,    // 512MB
        percentage: 47.9
      },
      cpuUsage: 23.4,
      activeConnections: 8
    },
    geographic: {
      israel: {
        users: 42,
        avgPerformance: 1.2,
        regions: {
          'Tel Aviv': { users: 19, performance: 1.1 },
          'Jerusalem': { users: 8, performance: 1.3 },
          'Haifa': { users: 6, performance: 1.2 },
          'Center': { users: 5, performance: 1.1 },
          'South': { users: 4, performance: 1.4 }
        }
      },
      international: {
        users: 3,
        avgPerformance: 2.8,
        countries: {
          'United States': { users: 2, performance: 2.6 },
          'Germany': { users: 1, performance: 3.2 }
        }
      }
    },
    errors: {
      total: 127,
      lastHour: 5,
      topErrors: [
        {
          message: 'TypeError: Cannot read property of undefined',
          count: 23,
          lastSeen: new Date(Date.now() - 1000 * 60 * 12).toISOString()
        },
        {
          message: 'API call timeout: Claude API',
          count: 18,
          lastSeen: new Date(Date.now() - 1000 * 60 * 8).toISOString()
        },
        {
          message: 'Supabase RLS policy violation',
          count: 12,
          lastSeen: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ]
    }
  };
}

// Store recent metrics (in production, this would be in Redis/DB)
let metricsHistory: PerformanceMetrics[] = [];
const MAX_HISTORY = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'current';

  try {
    if (type === 'current') {
      // Return current metrics
      const metrics = generateMockMetrics();

      // Store in history
      metricsHistory.unshift(metrics);
      if (metricsHistory.length > MAX_HISTORY) {
        metricsHistory = metricsHistory.slice(0, MAX_HISTORY);
      }

      return NextResponse.json({
        success: true,
        data: metrics
      });
    }

    if (type === 'history') {
      const limit = parseInt(searchParams.get('limit') || '24');
      return NextResponse.json({
        success: true,
        data: metricsHistory.slice(0, limit)
      });
    }

    if (type === 'summary') {
      const latest = metricsHistory[0] || generateMockMetrics();
      const summary = {
        performanceScore: calculatePerformanceScore(latest),
        healthStatus: getHealthStatus(latest),
        criticalIssues: getCriticalIssues(latest),
        activeUsers: latest.geographic.israel.users + latest.geographic.international.users
      };

      return NextResponse.json({
        success: true,
        data: summary
      });
    }

    return NextResponse.json(
      { error: 'Invalid type parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Performance metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

// Calculate overall performance score (0-100)
function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  const scores = {
    pageLoad: Math.max(0, 100 - (metrics.pageLoad.lcp - 1000) / 20), // Good LCP < 2.5s
    bundle: Math.max(0, 100 - (metrics.bundle.totalSize / 1000000) * 5), // Penalty for large bundles
    apis: Math.max(0, 100 - Object.values(metrics.apis.endpoints)
      .reduce((avg, api) => avg + api.avgResponseTime, 0) / Object.keys(metrics.apis.endpoints).length / 10),
    memory: Math.max(0, 100 - metrics.system.memoryUsage.percentage),
    errors: Math.max(0, 100 - metrics.errors.lastHour * 5)
  };

  return Math.round(Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length);
}

// Determine health status
function getHealthStatus(metrics: PerformanceMetrics): 'healthy' | 'warning' | 'critical' {
  const score = calculatePerformanceScore(metrics);

  if (score >= 80) return 'healthy';
  if (score >= 60) return 'warning';
  return 'critical';
}

// Get critical issues
function getCriticalIssues(metrics: PerformanceMetrics): string[] {
  const issues: string[] = [];

  if (metrics.pageLoad.lcp > 3000) {
    issues.push(`Slow page load: ${(metrics.pageLoad.lcp / 1000).toFixed(1)}s LCP`);
  }

  if (metrics.bundle.totalSize > 10000000) {
    issues.push(`Large bundle: ${(metrics.bundle.totalSize / 1000000).toFixed(1)}MB`);
  }

  const slowApis = Object.entries(metrics.apis.endpoints)
    .filter(([_, api]) => api.avgResponseTime > 1000);

  if (slowApis.length > 0) {
    issues.push(`Slow APIs: ${slowApis.map(([name]) => name).join(', ')}`);
  }

  if (metrics.system.memoryUsage.percentage > 80) {
    issues.push(`High memory usage: ${metrics.system.memoryUsage.percentage.toFixed(1)}%`);
  }

  if (metrics.errors.lastHour > 10) {
    issues.push(`High error rate: ${metrics.errors.lastHour} errors/hour`);
  }

  return issues;
}

// POST endpoint for receiving real performance data from client
export async function POST(request: NextRequest) {
  try {
    const clientMetrics = await request.json();

    // In production, store these metrics in database
    console.log('Received client performance metrics:', clientMetrics);

    return NextResponse.json({
      success: true,
      message: 'Metrics received'
    });

  } catch (error) {
    console.error('Error storing client metrics:', error);
    return NextResponse.json(
      { error: 'Failed to store metrics' },
      { status: 500 }
    );
  }
}