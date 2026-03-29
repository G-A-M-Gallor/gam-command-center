-- Automations Live Data Schema
-- Created: 2026-03-30

-- Automations table
CREATE TABLE automations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status automation_status DEFAULT 'draft',
    category VARCHAR(100),
    trigger_type trigger_type NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    last_run_at TIMESTAMP WITH TIME ZONE,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    folder_id UUID REFERENCES automation_folders(id),
    is_active BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1
);

-- Automation status enum
CREATE TYPE automation_status AS ENUM ('draft', 'active', 'inactive', 'error');

-- Trigger types enum
CREATE TYPE trigger_type AS ENUM ('webhook', 'cron', 'manual', 'email', 'file_watch');

-- Run status enum
CREATE TYPE run_status AS ENUM ('running', 'success', 'failed', 'cancelled', 'pending');

-- Step status enum
CREATE TYPE step_status AS ENUM ('pending', 'running', 'completed', 'failed', 'skipped');

-- Automation folders
CREATE TABLE automation_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES automation_folders(id),
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Workflow nodes (for builder)
CREATE TABLE workflow_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- client-side node ID
    node_type node_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER DEFAULT 180,
    height INTEGER DEFAULT 80,
    config JSONB NOT NULL DEFAULT '{}',
    inputs TEXT[] DEFAULT '{}',
    outputs TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(automation_id, node_id)
);

-- Node types enum
CREATE TYPE node_type AS ENUM ('trigger', 'action', 'condition', 'delay');

-- Workflow connections
CREATE TABLE workflow_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
    connection_id VARCHAR(100) NOT NULL, -- client-side connection ID
    from_node_id VARCHAR(100) NOT NULL,
    to_node_id VARCHAR(100) NOT NULL,
    from_port VARCHAR(50) DEFAULT 'output',
    to_port VARCHAR(50) DEFAULT 'input',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(automation_id, connection_id)
);

-- Automation runs
CREATE TABLE automation_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    automation_id UUID REFERENCES automations(id),
    run_number SERIAL,
    status run_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    trigger_source VARCHAR(100),
    triggered_by UUID REFERENCES auth.users(id),
    trigger_data JSONB DEFAULT '{}',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run steps (execution log)
CREATE TABLE automation_run_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    run_id UUID REFERENCES automation_runs(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    status step_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    logs TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation statistics (materialized view for performance)
CREATE MATERIALIZED VIEW automation_stats AS
SELECT
    a.id,
    a.name,
    COUNT(r.id) as total_runs,
    COUNT(CASE WHEN r.status = 'success' THEN 1 END) as successful_runs,
    COUNT(CASE WHEN r.status = 'failed' THEN 1 END) as failed_runs,
    COUNT(CASE WHEN r.status = 'running' THEN 1 END) as running_now,
    COALESCE(AVG(r.duration_ms), 0)::INTEGER as avg_duration_ms,
    CASE
        WHEN COUNT(r.id) > 0 THEN
            ROUND((COUNT(CASE WHEN r.status = 'success' THEN 1 END)::DECIMAL / COUNT(r.id) * 100), 2)
        ELSE 0
    END as success_rate,
    MAX(r.completed_at) as last_run_at,
    COUNT(CASE WHEN r.started_at >= CURRENT_DATE THEN 1 END) as runs_today
FROM automations a
LEFT JOIN automation_runs r ON a.id = r.automation_id
GROUP BY a.id, a.name;

-- Indexes for performance
CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_created_by ON automations(created_by);
CREATE INDEX idx_automations_folder ON automations(folder_id);
CREATE INDEX idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_started_at ON automation_runs(started_at);
CREATE INDEX idx_run_steps_run_id ON automation_run_steps(run_id);
CREATE INDEX idx_run_steps_status ON automation_run_steps(status);

-- RLS Policies
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_run_steps ENABLE ROW LEVEL SECURITY;

-- Policies for automations
CREATE POLICY "Users can view their own automations" ON automations
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create automations" ON automations
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own automations" ON automations
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own automations" ON automations
    FOR DELETE USING (created_by = auth.uid());

-- Similar policies for other tables...
CREATE POLICY "Users can manage their automation folders" ON automation_folders
    FOR ALL USING (created_by = auth.uid());

CREATE POLICY "Users can manage their workflow nodes" ON workflow_nodes
    FOR ALL USING (automation_id IN (SELECT id FROM automations WHERE created_by = auth.uid()));

CREATE POLICY "Users can manage their workflow connections" ON workflow_connections
    FOR ALL USING (automation_id IN (SELECT id FROM automations WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their automation runs" ON automation_runs
    FOR SELECT USING (automation_id IN (SELECT id FROM automations WHERE created_by = auth.uid()));

CREATE POLICY "Users can view their run steps" ON automation_run_steps
    FOR SELECT USING (run_id IN (SELECT id FROM automation_runs WHERE automation_id IN (SELECT id FROM automations WHERE created_by = auth.uid())));

-- Functions for automation management
CREATE OR REPLACE FUNCTION refresh_automation_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW automation_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh stats after runs
CREATE TRIGGER refresh_stats_after_run_change
    AFTER INSERT OR UPDATE OR DELETE ON automation_runs
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_automation_stats();

-- Function to get automation with stats
CREATE OR REPLACE FUNCTION get_automation_with_stats(automation_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    status automation_status,
    category VARCHAR(100),
    total_runs BIGINT,
    success_rate DECIMAL(5,2),
    avg_duration_ms INTEGER,
    last_run_at TIMESTAMP WITH TIME ZONE,
    running_now BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.description,
        a.status,
        a.category,
        COALESCE(s.total_runs, 0) as total_runs,
        COALESCE(s.success_rate, 0) as success_rate,
        COALESCE(s.avg_duration_ms, 0) as avg_duration_ms,
        s.last_run_at,
        COALESCE(s.running_now, 0) as running_now,
        a.created_at
    FROM automations a
    LEFT JOIN automation_stats s ON a.id = s.id
    WHERE a.id = automation_uuid;
END;
$$ LANGUAGE plpgsql;