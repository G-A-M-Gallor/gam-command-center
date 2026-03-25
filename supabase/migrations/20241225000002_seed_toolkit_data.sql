-- ===================================================
-- GAM Command Center — Toolkit Seed Data
-- Real data for tools, MCPs, and automations
-- ===================================================

-- ─── Workspace ID ───────────────────────────────────
-- This should match the workspace ID used in the API routes
\set WORKSPACE_ID '3ecaf990-43ef-4b91-9956-904a8b97b851'

-- ─── Development Tools ──────────────────────────────
INSERT INTO cc_toolkit (name, emoji, category, status, description, install_command, link, claude_prompt, notes) VALUES
  ('Claude Code CLI', '🤖', 'ai', 'installed', 'AI-powered development assistant with file editing, code generation, and project management capabilities', 'npm install -g @anthropic/claude-code', 'https://claude.ai/claude-code', 'Advanced AI coding assistant with access to filesystem and development tools', 'Primary AI development companion'),
  ('Git', '📋', 'development', 'installed', 'Distributed version control system for tracking changes in source code', 'git --version', 'https://git-scm.com', 'Version control and repository management', 'Integrated with GitHub, handles all source control'),
  ('Node.js', '🟢', 'development', 'installed', 'JavaScript runtime built on Chrome V8 engine for server-side development', 'node --version', 'https://nodejs.org', 'JavaScript runtime and package management', 'Required for Next.js development'),
  ('Docker', '🐳', 'development', 'recommended', 'Containerization platform for building, sharing, and running applications', 'docker --version', 'https://docker.com', 'Container orchestration and deployment', 'Useful for local development environments'),
  ('Figma CLI', '🎨', 'development', 'optional', 'Command-line interface for Figma design tool integration', 'npm install -g figma-cli', 'https://figma.com', 'Design system integration and asset export', 'Connects design system with development'),
  ('Whisper AI', '🎤', 'transcription', 'installed', 'OpenAI speech recognition model for high-quality transcription', 'pip install openai-whisper', 'https://github.com/openai/whisper', 'Speech-to-text processing for meeting transcripts and audio content', 'Used for client call transcriptions'),
  ('yt-dlp', '📺', 'media', 'optional', 'Feature-rich command-line audio/video downloader', 'pip install yt-dlp', 'https://github.com/yt-dlp/yt-dlp', 'Media download and format conversion', 'For downloading content for analysis'),
  ('FFmpeg', '🎬', 'media', 'recommended', 'Complete solution for recording, converting and streaming audio/video', 'ffmpeg -version', 'https://ffmpeg.org', 'Audio/video processing and conversion', 'Required for media manipulation tasks'),
  ('Postman', '📡', 'development', 'recommended', 'API development and testing platform', 'Download from website', 'https://postman.com', 'API testing and documentation', 'Essential for API development workflow'),
  ('VS Code Extensions', '🔌', 'development', 'installed', 'Essential Visual Studio Code extensions for development', 'code --list-extensions', 'https://marketplace.visualstudio.com', 'IDE enhancement and productivity tools', 'Tailwind, Prettier, ESLint configured');

-- ─── MCP Connections ────────────────────────────────
-- Real MCP connections with current health status (all 19 MCPs)
INSERT INTO vb_mcp_connections (workspace_id, name, health_status, health_latency_ms, description, settings) VALUES
  -- Claude.ai MCPs (Cloud)
  (:'WORKSPACE_ID', 'claude.ai Gmail', 'healthy', 245, 'Gmail integration for email management and automation', '{"platform": "claude.ai", "category": "communication", "emoji": "📧", "capabilities": ["read_messages", "send_messages", "manage_labels", "search"]}'),
  (:'WORKSPACE_ID', 'claude.ai Notion', 'healthy', 180, 'Notion workspace integration for knowledge management', '{"platform": "claude.ai", "category": "productivity", "emoji": "📝", "capabilities": ["read_pages", "write_pages", "query_databases", "create_blocks"]}'),
  (:'WORKSPACE_ID', 'claude.ai GitHub', 'healthy', 320, 'GitHub repository management and automation', '{"platform": "claude.ai", "category": "development", "emoji": "🐙", "capabilities": ["create_issues", "manage_prs", "read_repos", "create_files"]}'),
  (:'WORKSPACE_ID', 'claude.ai Google Calendar', 'healthy', 890, 'Google Calendar integration for scheduling', '{"platform": "claude.ai", "category": "productivity", "emoji": "📅", "capabilities": ["read_events", "create_events", "manage_calendars"]}'),
  (:'WORKSPACE_ID', 'claude.ai Vercel', 'healthy', 650, 'Vercel deployment platform integration', '{"platform": "claude.ai", "category": "deployment", "emoji": "▲", "capabilities": ["deploy_apps", "manage_projects", "view_logs"]}'),
  (:'WORKSPACE_ID', 'claude.ai Make', 'healthy', 410, 'Make.com automation platform integration', '{"platform": "claude.ai", "category": "automation", "emoji": "⚡", "capabilities": ["create_scenarios", "manage_connections", "trigger_workflows"]}'),
  (:'WORKSPACE_ID', 'claude.ai Canva', 'healthy', 720, 'Canva design platform integration', '{"platform": "claude.ai", "category": "design", "emoji": "🎨", "capabilities": ["generate_designs", "search_templates", "create_graphics"]}'),
  (:'WORKSPACE_ID', 'claude.ai Mermaid Chart', 'healthy', 95, 'Mermaid chart generation and visualization', '{"platform": "claude.ai", "category": "visualization", "emoji": "📊", "capabilities": ["generate_charts", "create_diagrams", "flowcharts"]}'),
  (:'WORKSPACE_ID', 'claude.ai Supabase', 'healthy', 340, 'Supabase database management integration', '{"platform": "claude.ai", "category": "database", "emoji": "🗄️", "capabilities": ["query_tables", "manage_data", "execute_sql"]}'),
  (:'WORKSPACE_ID', 'claude.ai Origami MCP', 'healthy', 280, 'Origami CRM system integration', '{"platform": "claude.ai", "category": "crm", "emoji": "🏢", "capabilities": ["manage_entities", "query_data", "create_instances"]}'),
  (:'WORKSPACE_ID', 'claude.ai Raindrop', 'healthy', 450, 'Raindrop bookmark management', '{"platform": "claude.ai", "category": "productivity", "emoji": "🔖", "capabilities": ["manage_bookmarks", "search_content", "organize_collections"]}'),
  (:'WORKSPACE_ID', 'NotebookLM', 'healthy', 580, 'NotebookLM knowledge management', '{"platform": "claude.ai", "category": "knowledge", "emoji": "📚", "capabilities": ["query_notebooks", "search_content", "analyze_documents"]}'),

  -- Claude Code MCPs (Terminal)
  (:'WORKSPACE_ID', 'Claude Code Filesystem', 'healthy', 15, 'Local file system access and management', '{"platform": "Claude Code", "category": "development", "emoji": "📁", "capabilities": ["read_files", "write_files", "create_directories", "file_search"]}'),
  (:'WORKSPACE_ID', 'Claude Code Git', 'healthy', 25, 'Git version control operations', '{"platform": "Claude Code", "category": "development", "emoji": "🔀", "capabilities": ["git_status", "git_commit", "git_push", "git_branch", "git_merge"]}'),
  (:'WORKSPACE_ID', 'Claude Code Terminal', 'healthy', 35, 'Terminal command execution', '{"platform": "Claude Code", "category": "development", "emoji": "💻", "capabilities": ["run_commands", "process_management", "environment_access"]}'),
  (:'WORKSPACE_ID', 'Claude Code NPM', 'healthy', 120, 'Node.js package management', '{"platform": "Claude Code", "category": "development", "emoji": "📦", "capabilities": ["install_packages", "run_scripts", "manage_dependencies"]}'),
  (:'WORKSPACE_ID', 'Firebase MCP', 'healthy', 85, 'Firebase project management and deployment', '{"platform": "Claude Code", "category": "backend", "emoji": "🔥", "capabilities": ["project_management", "deployment", "firestore", "auth"]}'),
  (:'WORKSPACE_ID', 'Claude Code Python', 'healthy', 45, 'Python environment and package management', '{"platform": "Claude Code", "category": "development", "emoji": "🐍", "capabilities": ["run_python", "pip_install", "virtual_env"]}'),
  (:'WORKSPACE_ID', 'Claude Code Docker', 'healthy', 150, 'Docker container management', '{"platform": "Claude Code", "category": "development", "emoji": "🐳", "capabilities": ["build_images", "run_containers", "manage_volumes"]}');

-- ─── Automations ────────────────────────────────────
-- Real automation workflows
INSERT INTO cc_automations (name, description, type, status, trigger_config, last_run, next_run, run_count, success_count, error_count) VALUES
  ('Vercel Production Deploy', 'Automated deployment pipeline for production releases via Vercel', 'deployment', 'active', '{"trigger": "git_push", "branch": "main", "webhook_url": "https://api.vercel.com/v1/integrations/deploy"}', NOW() - INTERVAL '2 hours', null, 145, 142, 3),
  ('Daily Database Backup', 'Automated Supabase database backup to cloud storage', 'backup', 'active', '{"trigger": "cron", "schedule": "0 2 * * *", "retention_days": 30}', NOW() - INTERVAL '10 hours', NOW() + INTERVAL '14 hours', 89, 87, 2),
  ('RSS Feed Sync', 'Sync Israeli construction & real estate news from multiple RSS sources', 'sync', 'active', '{"trigger": "cron", "schedule": "*/30 * * * *", "sources": ["globes.co.il", "calcalist.co.il", "themarker.com"]}', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '15 minutes', 2880, 2845, 35),
  ('Security Vulnerability Scan', 'Weekly security audit of dependencies and codebase', 'security', 'active', '{"trigger": "cron", "schedule": "0 3 * * 0", "scan_types": ["dependencies", "secrets", "code_quality"]}', NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days', 12, 10, 2),
  ('Performance Monitor', 'Continuous monitoring of application performance and alerts', 'monitoring', 'error', '{"trigger": "continuous", "thresholds": {"response_time": 2000, "error_rate": 0.05}}', NOW() - INTERVAL '1 hour', null, 150, 120, 30),
  ('Client Email Automation', 'Automated email sequences for client onboarding and follow-ups', 'automation', 'active', '{"trigger": "webhook", "source": "origami_crm", "templates": ["welcome", "follow_up", "contract_reminder"]}', NOW() - INTERVAL '45 minutes', null, 324, 310, 14),
  ('Document Generation', 'Automated contract and agreement generation from templates', 'automation', 'active', '{"trigger": "api_call", "template_engine": "tiptap", "output_formats": ["pdf", "docx"]}', NOW() - INTERVAL '3 hours', null, 67, 65, 2),
  ('Notion Sync', 'Bidirectional sync between Supabase and Notion databases', 'sync', 'paused', '{"trigger": "webhook", "direction": "bidirectional", "tables": ["projects", "clients", "tasks"]}', NOW() - INTERVAL '2 days', null, 45, 40, 5);

-- ─── Update health check timestamps ────────────────
UPDATE vb_mcp_connections SET health_last_check = NOW() WHERE health_status IN ('healthy', 'timeout', 'unhealthy');