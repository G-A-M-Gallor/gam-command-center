"use client";

import { useState } from "react";
import {
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  Github,
  Database,
  Bot,
  Mail,
  MessageSquare,
  Cloud
} from "lucide-react";

interface ApiService {
  name: string;
  key: string;
  endpoint?: string;
  status: 'healthy' | 'error' | 'checking' | 'unknown';
  lastCheck?: string;
  responseTime?: number;
  errorMessage?: string;
  category: 'ai' | 'database' | 'external' | 'auth' | 'system';
  icon: React.ElementType;
  required: boolean;
}

interface CredentialsHealthProps {
  isRtl: boolean;
}

const initialServices: ApiService[] = [
  // AI Services
  { name: 'Anthropic Claude', key: 'ANTHROPIC_API_KEY', endpoint: 'https://api.anthropic.com/v1/messages', status: 'unknown', category: 'ai', icon: Bot, required: true },
  { name: 'Google AI (Gemini)', key: 'GOOGLE_AI_API_KEY', endpoint: 'https://generativelanguage.googleapis.com/v1/models', status: 'unknown', category: 'ai', icon: Bot, required: false },
  { name: 'Voyage AI', key: 'VOYAGE_API_KEY', status: 'unknown', category: 'ai', icon: Bot, required: false },

  // Database
  { name: 'Supabase', key: 'SUPABASE_SERVICE_ROLE_KEY', endpoint: '/rest/v1/', status: 'unknown', category: 'database', icon: Database, required: true },

  // External Services
  { name: 'Notion', key: 'NOTION_API_KEY', endpoint: 'https://api.notion.com/v1/users/me', status: 'unknown', category: 'external', icon: Database, required: true },
  { name: 'Resend Email', key: 'RESEND_API_KEY', endpoint: 'https://api.resend.com/domains', status: 'unknown', category: 'external', icon: Mail, required: true },
  { name: 'WATI WhatsApp', key: 'WATI_API_TOKEN', status: 'unknown', category: 'external', icon: MessageSquare, required: false },

  // Auth & OAuth
  { name: 'Google OAuth', key: 'GOOGLE_CLIENT_ID', status: 'unknown', category: 'auth', icon: Shield, required: true },
  { name: 'NextAuth', key: 'NEXTAUTH_SECRET', status: 'unknown', category: 'auth', icon: Shield, required: true },

  // System
  { name: 'Vercel Blob', key: 'BLOB_READ_WRITE_TOKEN', status: 'unknown', category: 'system', icon: Cloud, required: true },
  { name: 'VAPID Keys', key: 'VAPID_PRIVATE_KEY', status: 'unknown', category: 'system', icon: Key, required: true },
];

function ServiceStatusBadge({ status, responseTime }: { status: ApiService['status']; responseTime?: number }) {
  const configs = {
    healthy: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle2, label: '✓ תקין' },
    error: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle, label: '✗ שגיאה' },
    checking: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: RefreshCw, label: '⟳ בודק' },
    unknown: { bg: 'bg-slate-500/10', text: 'text-slate-400', icon: AlertTriangle, label: '? לא נבדק' }
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${config.bg} ${config.text}`}>
      <Icon className={`h-3 w-3 ${status === 'checking' ? 'animate-spin' : ''}`} />
      <span>{config.label}</span>
      {responseTime && status === 'healthy' && (
        <span className="text-slate-500">({responseTime}ms)</span>
      )}
    </div>
  );
}

function ServiceCard({ service, onTest, showCredential, onToggleCredential }: {
  service: ApiService;
  onTest: (key: string) => void;
  showCredential: boolean;
  onToggleCredential: () => void;
}) {
  const categoryIcons = {
    ai: '🤖',
    database: '🗄️',
    external: '📬',
    auth: '🔐',
    system: '⚡'
  };

  return (
    <div className="border border-white/[0.06] rounded-lg p-4 bg-slate-800/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoryIcons[service.category]}</span>
            <div>
              <h4 className="font-medium text-white">{service.name}</h4>
              <p className="text-xs text-slate-400">{service.key}</p>
            </div>
          </div>
          {service.required && (
            <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded">דרוש</span>
          )}
        </div>
        <ServiceStatusBadge status={service.status} responseTime={service.responseTime} />
      </div>

      {service.status === 'error' && service.errorMessage && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {service.errorMessage}
        </div>
      )}

      {service.lastCheck && (
        <p className="text-xs text-slate-500 mb-3">
          נבדק לאחרונה: {new Date(service.lastCheck).toLocaleString('he-IL')}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={() => onTest(service.key)}
          disabled={service.status === 'checking'}
          className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${service.status === 'checking' ? 'animate-spin' : ''}`} />
          בדוק
        </button>

        <button
          onClick={onToggleCredential}
          className="flex items-center gap-2 px-3 py-1 bg-slate-600/10 hover:bg-slate-600/20 text-slate-400 rounded text-xs transition-colors"
        >
          {showCredential ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {showCredential ? 'הסתר' : 'הראה'}
        </button>

        {service.endpoint && (
          <a
            href={service.endpoint}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded text-xs transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            API
          </a>
        )}
      </div>
    </div>
  );
}

export default function CredentialsHealth({ isRtl }: CredentialsHealthProps) {
  const [services, setServices] = useState<ApiService[]>(initialServices);
  const [checking, setChecking] = useState(false);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [lastFullCheck, setLastFullCheck] = useState<string | null>(null);

  // Test individual service
  const testService = async (key: string) => {
    setServices(prev => prev.map(service =>
      service.key === key ? { ...service, status: 'checking' } : service
    ));

    try {
      const startTime = Date.now();

      // Call our API health check endpoint
      const response = await fetch('/api/health/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: key })
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      setServices(prev => prev.map(service =>
        service.key === key ? {
          ...service,
          status: result.success ? 'healthy' : 'error',
          responseTime: result.success ? responseTime : undefined,
          errorMessage: result.error || undefined,
          lastCheck: new Date().toISOString()
        } : service
      ));
    } catch (error) {
      setServices(prev => prev.map(service =>
        service.key === key ? {
          ...service,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          lastCheck: new Date().toISOString()
        } : service
      ));
    }
  };

  // Test all services
  const testAllServices = async () => {
    setChecking(true);

    for (const service of services) {
      await testService(service.key);
      // Small delay between checks to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLastFullCheck(new Date().toISOString());
    setChecking(false);
  };

  // Toggle credential visibility
  const toggleCredential = (key: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Calculate stats
  const stats = {
    total: services.length,
    healthy: services.filter(s => s.status === 'healthy').length,
    error: services.filter(s => s.status === 'error').length,
    unknown: services.filter(s => s.status === 'unknown').length,
    required: services.filter(s => s.required).length,
    requiredHealthy: services.filter(s => s.required && s.status === 'healthy').length
  };

  const healthPercentage = stats.total > 0 ? Math.round((stats.healthy / stats.total) * 100) : 0;
  const requiredHealthy = stats.required > 0 ? stats.requiredHealthy === stats.required : true;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`border rounded-lg p-4 ${requiredHealthy ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="font-medium text-white">שירותים קריטיים</h3>
          </div>
          <p className={`text-2xl font-bold ${requiredHealthy ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.requiredHealthy}/{stats.required}
          </p>
          <p className="text-xs text-slate-500">דרושים לפעילות</p>
        </div>

        <div className="border border-white/[0.06] rounded-lg p-4 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Key className="h-5 w-5 text-blue-400" />
            <h3 className="font-medium text-white">בריאות כללית</h3>
          </div>
          <p className={`text-2xl font-bold ${healthPercentage >= 80 ? 'text-emerald-400' : healthPercentage >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
            {healthPercentage}%
          </p>
          <p className="text-xs text-slate-500">{stats.healthy}/{stats.total} שירותים</p>
        </div>

        <div className="border border-white/[0.06] rounded-lg p-4 bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <Github className="h-5 w-5 text-purple-400" />
            <h3 className="font-medium text-white">גיבוי אחרון</h3>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {lastFullCheck ? new Date(lastFullCheck).toLocaleDateString('he-IL') : 'אף פעם'}
          </p>
          <p className="text-xs text-slate-500">בדיקה מלאה</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={testAllServices}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
          בדוק הכל
        </button>

        <button
          onClick={() => window.open('https://github.com/G-A-M-Gallor/vbrain-secrets', '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <Github className="h-4 w-4" />
          GitHub Secrets
        </button>

        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
          <ExternalLink className="h-4 w-4" />
          Vercel Env Vars
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4">
        {['ai', 'database', 'auth', 'external', 'system'].map(category => {
          const categoryServices = services.filter(s => s.category === category);
          if (categoryServices.length === 0) return null;

          const categoryNames = {
            ai: '🤖 שירותי AI',
            database: '🗄️ בסיסי נתונים',
            auth: '🔐 אימות והרשאות',
            external: '📬 שירותים חיצוניים',
            system: '⚡ מערכת ותשתית'
          };

          return (
            <div key={category} className="space-y-3">
              <h3 className="text-lg font-semibold text-white">{categoryNames[category as keyof typeof categoryNames]}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {categoryServices.map(service => (
                  <ServiceCard
                    key={service.key}
                    service={service}
                    onTest={testService}
                    showCredential={showCredentials[service.key] || false}
                    onToggleCredential={() => toggleCredential(service.key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {lastFullCheck && (
        <div className="text-center text-xs text-slate-500 pt-4 border-t border-white/[0.06]">
          בדיקה מלאה אחרונה: {new Date(lastFullCheck).toLocaleString('he-IL')}
        </div>
      )}
    </div>
  );
}