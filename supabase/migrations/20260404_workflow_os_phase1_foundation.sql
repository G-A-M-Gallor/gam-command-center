-- Workflow OS Phase 1 Foundation
-- Date: 2026-04-04
-- Description: Core database tables for Workflow OS engine

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workflow Templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
  trigger_config JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Workflow Executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  trigger_data JSONB DEFAULT '{}',
  execution_context JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  step_count INTEGER DEFAULT 0,
  current_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Workflow Step Executions table
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_name VARCHAR(255),
  step_type VARCHAR(100) NOT NULL,
  step_config JSONB DEFAULT '{}',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Schedules table
CREATE TABLE IF NOT EXISTS workflow_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Workflow Variables table (for reusable variables)
CREATE TABLE IF NOT EXISTS workflow_variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  value JSONB NOT NULL,
  is_secret BOOLEAN DEFAULT FALSE,
  scope VARCHAR(50) DEFAULT 'tenant' CHECK (scope IN ('tenant', 'template', 'execution')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(tenant_id, name)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tenant_id ON workflow_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_trigger_type ON workflow_templates(trigger_type);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_tenant_id ON workflow_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_template_id ON workflow_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution_id ON workflow_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_status ON workflow_step_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_schedules_tenant_id ON workflow_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_template_id ON workflow_schedules(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_schedules_next_run ON workflow_schedules(next_run_at) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_workflow_variables_tenant_id ON workflow_variables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_scope ON workflow_variables(scope);

-- Add RLS policies (Row Level Security)
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_templates
CREATE POLICY "workflow_templates_tenant_isolation" ON workflow_templates
  FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- RLS Policies for workflow_executions
CREATE POLICY "workflow_executions_tenant_isolation" ON workflow_executions
  FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- RLS Policies for workflow_step_executions (via execution)
CREATE POLICY "workflow_step_executions_tenant_isolation" ON workflow_step_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workflow_executions we
      WHERE we.id = workflow_step_executions.execution_id
      AND we.tenant_id::text = auth.jwt() ->> 'tenant_id'
    )
  );

-- RLS Policies for workflow_schedules
CREATE POLICY "workflow_schedules_tenant_isolation" ON workflow_schedules
  FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- RLS Policies for workflow_variables
CREATE POLICY "workflow_variables_tenant_isolation" ON workflow_variables
  FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_schedules_updated_at BEFORE UPDATE ON workflow_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_variables_updated_at BEFORE UPDATE ON workflow_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful views
CREATE OR REPLACE VIEW workflow_execution_summary AS
SELECT
  we.id,
  we.tenant_id,
  wt.name as template_name,
  wt.category,
  we.status,
  we.started_at,
  we.completed_at,
  we.duration_ms,
  we.step_count,
  we.current_step,
  CASE
    WHEN we.status = 'completed' THEN '✅'
    WHEN we.status = 'running' THEN '⏳'
    WHEN we.status = 'failed' THEN '❌'
    WHEN we.status = 'cancelled' THEN '🚫'
    ELSE '⏸️'
  END as status_icon,
  we.created_at
FROM workflow_executions we
JOIN workflow_templates wt ON we.template_id = wt.id
ORDER BY we.created_at DESC;

-- Add workflow metrics view
CREATE OR REPLACE VIEW workflow_metrics AS
SELECT
  wt.id as template_id,
  wt.name,
  wt.category,
  COUNT(we.id) as total_executions,
  COUNT(CASE WHEN we.status = 'completed' THEN 1 END) as successful_executions,
  COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_executions,
  ROUND(
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END) * 100.0 / NULLIF(COUNT(we.id), 0),
    2
  ) as success_rate,
  AVG(CASE WHEN we.duration_ms IS NOT NULL THEN we.duration_ms END) as avg_duration_ms,
  MAX(we.created_at) as last_execution_at
FROM workflow_templates wt
LEFT JOIN workflow_executions we ON wt.id = we.template_id
GROUP BY wt.id, wt.name, wt.category;

-- Comment for rollback
-- To rollback this migration:
-- DROP VIEW IF EXISTS workflow_metrics;
-- DROP VIEW IF EXISTS workflow_execution_summary;
-- DROP TRIGGER IF EXISTS update_workflow_variables_updated_at ON workflow_variables;
-- DROP TRIGGER IF EXISTS update_workflow_schedules_updated_at ON workflow_schedules;
-- DROP TRIGGER IF EXISTS update_workflow_templates_updated_at ON workflow_templates;
-- DROP FUNCTION IF EXISTS update_updated_at_column();
-- DROP TABLE IF EXISTS workflow_variables CASCADE;
-- DROP TABLE IF EXISTS workflow_schedules CASCADE;
-- DROP TABLE IF EXISTS workflow_step_executions CASCADE;
-- DROP TABLE IF EXISTS workflow_executions CASCADE;
-- DROP TABLE IF EXISTS workflow_templates CASCADE;