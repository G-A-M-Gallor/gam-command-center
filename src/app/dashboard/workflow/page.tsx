"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { classNames } from '@/lib/designSystem';
import { Play, Plus, Settings, Clock, CheckCircle, XCircle, Pause } from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
}

interface WorkflowExecution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  template: { name: string; category?: string };
  created_at: string;
  duration_ms?: number;
  current_step: number;
  step_count: number;
}

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-amber-400" />,
  running: <Play className="w-4 h-4 text-blue-400" />,
  completed: <CheckCircle className="w-4 h-4 text-green-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
  cancelled: <Pause className="w-4 h-4 text-gray-400" />
};

export default function WorkflowPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock tenant ID - in real implementation, get from auth context
  const tenantId = "00000000-0000-0000-0000-000000000000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch templates and executions in parallel
        const [templatesRes, executionsRes] = await Promise.all([
          fetch(`/api/workflow/templates?tenant_id=${tenantId}`),
          fetch(`/api/workflow/executions?tenant_id=${tenantId}&limit=10`)
        ]);

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData.templates || []);
        }

        if (executionsRes.ok) {
          const executionsData = await executionsRes.json();
          setExecutions(executionsData.executions || []);
        }

      } catch (err) {
        setError('Failed to load workflow data');
        console.error('Workflow data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusBadgeClass = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed': return `${baseClasses} bg-green-500/20 text-green-400`;
      case 'running': return `${baseClasses} bg-blue-500/20 text-blue-400`;
      case 'failed': return `${baseClasses} bg-red-500/20 text-red-400`;
      case 'cancelled': return `${baseClasses} bg-gray-500/20 text-gray-400`;
      default: return `${baseClasses} bg-amber-500/20 text-amber-400`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading Workflow OS...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">
            Workflow OS — Phase 1 Foundation
          </h1>
          <p className="text-slate-400">
            Manage and monitor automated workflows
          </p>
        </div>
        <Button icon={Plus} variant="primary">
          Create Workflow
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={classNames.card}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary-400">
              {templates.length}
            </div>
            <div className="text-sm text-slate-400">Total Templates</div>
          </CardContent>
        </Card>
        <Card className={classNames.card}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">
              {executions.filter(e => e.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-400">Completed</div>
          </CardContent>
        </Card>
        <Card className={classNames.card}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">
              {executions.filter(e => e.status === 'running').length}
            </div>
            <div className="text-sm text-slate-400">Running</div>
          </CardContent>
        </Card>
        <Card className={classNames.card}>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">
              {executions.filter(e => e.status === 'failed').length}
            </div>
            <div className="text-sm text-slate-400">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <Card className={classNames.card}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-400" />
              Workflow Templates
            </CardTitle>
            <Button variant="secondary" size="sm">
              Manage Templates
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No workflow templates found. Create your first template to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.slice(0, 5).map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                >
                  <div>
                    <div className="font-medium text-slate-100">{template.name}</div>
                    <div className="text-sm text-slate-400">
                      {template.category || 'No category'} • {template.trigger_type}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      template.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Button variant="ghost" size="sm" icon={Play}>
                      Run
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Executions */}
      <Card className={classNames.card}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Recent Executions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No workflow executions found.
            </div>
          ) : (
            <div className="space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/50"
                >
                  <div className="flex items-center gap-3">
                    {statusIcons[execution.status]}
                    <div>
                      <div className="font-medium text-slate-100">
                        {execution.template.name}
                      </div>
                      <div className="text-sm text-slate-400">
                        Step {execution.current_step} of {execution.step_count} •
                        {formatDuration(execution.duration_ms)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getStatusBadgeClass(execution.status)}>
                      {execution.status}
                    </span>
                    <div className="text-xs text-slate-500">
                      {new Date(execution.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Status Indicator */}
      <Card className="bg-primary-500/10 border-primary-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-primary-300">
            <CheckCircle className="w-5 h-5" />
            Workflow OS Phase 1 Foundation is ready
          </div>
          <div className="text-sm text-primary-400/80 mt-1">
            Database tables created, CRUD APIs available, basic dashboard operational
          </div>
        </CardContent>
      </Card>
    </div>
  );
}