"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { PageHeader } from "@/components/command-center/PageHeader";
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  BookOpen,
  Users,
  X,
  Save,
  Building
} from "lucide-react";
import {
  searchKnowledgeItems,
  fetchKnowledgeTypes,
  fetchKnowledgeDepartments,
  fetchKnowledgeStreams,
  fetchKnowledgeUseCases,
  fetchKnowledgeLenses,
  fetchKnowledgeStats,
  createKnowledgeItem,
  deleteKnowledgeItem,
  populateKnowledgeItemRelations,
  type KnowledgeItem,
  type KnowledgeType,
  type KnowledgeDepartment,
  type KnowledgeStream,
  type KnowledgeUseCase,
  type KnowledgeLens,
  type KnowledgeSearchOptions,
  type KnowledgeSearchFilters
} from "@/lib/supabase/knowledgeQueries";

// ─── Main Component ───────────────────────────────────

export default function KnowledgePage() {
  const { language } = useSettings();
  const t = getTranslations(language);
  const k = t.knowledge;
  const isRtl = language === "he";

  // ── State ──────────────────────────────────────

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dictionary data
  const [types, setTypes] = useState<KnowledgeType[]>([]);
  const [departments, setDepartments] = useState<KnowledgeDepartment[]>([]);
  const [streams, setStreams] = useState<KnowledgeStream[]>([]);
  const [useCases, setUseCases] = useState<KnowledgeUseCase[]>([]);
  const [lenses, setLenses] = useState<KnowledgeLens[]>([]);

  // Search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<KnowledgeSearchFilters>({});
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'title' | 'priority' | 'confidence'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // ── Data Loading ─────────────────────────────────

  const loadDictionaryData = useCallback(async () => {
    try {
      const [typesData, deptsData, streamsData, useCasesData, lensesData] = await Promise.all([
        fetchKnowledgeTypes(),
        fetchKnowledgeDepartments(),
        fetchKnowledgeStreams(),
        fetchKnowledgeUseCases(),
        fetchKnowledgeLenses()
      ]);

      setTypes(typesData);
      setDepartments(deptsData);
      setStreams(streamsData);
      setUseCases(useCasesData);
      setLenses(lensesData);
    } catch (err) {
      console.error('Failed to load dictionary data:', err);
    }
  }, []);

  const loadKnowledgeItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchOptions: KnowledgeSearchOptions = {
        filters: {
          ...filters,
          search: searchTerm || undefined
        },
        sortBy,
        sortDirection,
        limit: 100
      };

      const itemsData = await searchKnowledgeItems(searchOptions);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load knowledge items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, sortBy, sortDirection]);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await fetchKnowledgeStats();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadDictionaryData();
    loadStats();
  }, [loadDictionaryData, loadStats]);

  useEffect(() => {
    loadKnowledgeItems();
  }, [loadKnowledgeItems]);

  // ── Handlers ─────────────────────────────────────

  const handleFilterChange = useCallback((key: keyof KnowledgeSearchFilters, value: string | string[] | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchTerm("");
  }, []);

  const handleToggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const handleViewDetails = useCallback(async (item: KnowledgeItem) => {
    try {
      const enrichedItem = await populateKnowledgeItemRelations(item);
      setSelectedItem(enrichedItem);
    } catch (err) {
      console.error('Failed to load item details:', err);
    }
  }, []);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!confirm(k.confirmDelete)) return;

    try {
      await deleteKnowledgeItem(itemId);
      await loadKnowledgeItems();
      await loadStats();

      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert(k.errorSaving);
    }
  }, [k, selectedItem, loadKnowledgeItems, loadStats]);

  // ── Computed Values ──────────────────────────────

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== undefined) || searchTerm.length > 0;
  }, [filters, searchTerm]);

  const _statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return counts;
  }, [items]);

  // ── Render ───────────────────────────────────────

  return (
    <div className="h-full flex flex-col" dir={isRtl ? "rtl" : "ltr"}>
      <PageHeader pageKey="knowledge">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={k.searchPlaceholder}
              className="h-8 rounded-lg border border-slate-700 bg-slate-800/50 pe-3 ps-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none w-64"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg border p-1.5 ${showFilters ? "border-purple-600 text-purple-400" : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"}`}
            title={k.filters}
          >
            <Filter className="h-4 w-4" />
          </button>

          {/* Reset filters */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
              title={k.resetFilters}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={loadKnowledgeItems}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:border-slate-600 hover:text-slate-300"
            title={k.refresh}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Add New */}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-500"
          >
            <Plus className="h-4 w-4" />
            {k.addNew}
          </button>
        </div>
      </PageHeader>

      {/* Filters Panel */}
      {showFilters && (
        <FiltersPanel
          filters={filters}
          types={types}
          departments={departments}
          streams={streams}
          k={k}
          isRtl={isRtl}
          onFilterChange={handleFilterChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onSortDirectionChange={setSortDirection}
        />
      )}

      {/* Stats Bar */}
      {stats && (
        <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <FileText className="h-3.5 w-3.5" />
              <span>{k.totalItems}: {stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Edit className="h-3.5 w-3.5" />
              <span>{k.draftCount}: {stats.byStatus.draft}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{k.approvedCount}: {stats.byStatus.approved}</span>
            </div>
            {stats.needsReview > 0 && (
              <div className="flex items-center gap-1.5 text-orange-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{k.needsReview}: {stats.needsReview}</span>
              </div>
            )}
            {stats.expiringSoon > 0 && (
              <div className="flex items-center gap-1.5 text-red-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{k.expiringSoon}: {stats.expiringSoon}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
            <span className="ms-2 text-slate-500">{k.loadingItems}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <span className="ms-2 text-red-400">{k.errorLoading}: {error}</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-slate-500">{k.noResults}</span>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <KnowledgeItemCard
                    key={item.id}
                    item={item}
                    types={types}
                    departments={departments}
                    streams={streams}
                    isExpanded={expandedItems.has(item.id)}
                    k={k}
                    isRtl={isRtl}
                    onToggleExpand={handleToggleExpand}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedItem && (
              <div className="w-1/3 border-s border-slate-800 bg-slate-900/30">
                <KnowledgeItemDetail
                  item={selectedItem}
                  k={k}
                  isRtl={isRtl}
                  onClose={() => setSelectedItem(null)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Form Modal */}
      {showAddForm && (
        <AddKnowledgeItemModal
          types={types}
          departments={departments}
          streams={streams}
          useCases={useCases}
          lenses={lenses}
          k={k}
          isRtl={isRtl}
          onClose={() => setShowAddForm(false)}
          onSaved={() => {
            setShowAddForm(false);
            loadKnowledgeItems();
            loadStats();
          }}
        />
      )}
    </div>
  );
}

// ─── Filters Panel Component ──────────────────────

interface FiltersPanelProps {
  filters: KnowledgeSearchFilters;
  types: KnowledgeType[];
  departments: KnowledgeDepartment[];
  streams: KnowledgeStream[];
  k: Record<string, any>;
  isRtl: boolean;
  onFilterChange: (key: keyof KnowledgeSearchFilters, value: string | string[] | undefined) => void;
  sortBy: string;
  sortDirection: string;
  onSortChange: (sort: "title" | "confidence" | "created_at" | "updated_at" | "priority") => void;
  onSortDirectionChange: (dir: "asc" | "desc") => void;
}

function FiltersPanel({
  filters, types, departments, streams: _streams, k, isRtl: _isRtl, onFilterChange,
  sortBy, sortDirection, onSortChange, onSortDirectionChange
}: FiltersPanelProps) {
  return (
    <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Type Filter */}
        <select
          value={filters.type_id || ""}
          onChange={(e) => onFilterChange('type_id', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">{k.allTypes}</option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name_he || type.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ""}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">{k.allStatuses}</option>
          <option value="draft">{k.draft}</option>
          <option value="classified">{k.classified}</option>
          <option value="reviewed">{k.reviewed}</option>
          <option value="approved">{k.approved}</option>
          <option value="archived">{k.archived}</option>
        </select>

        {/* Department Filter */}
        <select
          value={filters.department_id || ""}
          onChange={(e) => onFilterChange('department_id', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">{k.allDepartments}</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name_he || dept.name}
            </option>
          ))}
        </select>

        {/* Owner Domain Filter */}
        <select
          value={filters.owner_domain || ""}
          onChange={(e) => onFilterChange('owner_domain', e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
        >
          <option value="">{k.allOwners}</option>
          <option value="case_preparation">{k.case_preparation}</option>
          <option value="sales">{k.sales}</option>
          <option value="recruitment">{k.recruitment}</option>
          <option value="finance">{k.finance}</option>
          <option value="systems">{k.systems}</option>
          <option value="management">{k.management}</option>
        </select>

        {/* Sort */}
        <div className="flex gap-1">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as "title" | "confidence" | "created_at" | "updated_at" | "priority")}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200"
          >
            <option value="created_at">{k.sortNewest}</option>
            <option value="updated_at">{k.sortNewest}</option>
            <option value="title">{k.sortTitle}</option>
            <option value="priority">{k.sortPriority}</option>
            <option value="confidence">{k.sortConfidence}</option>
          </select>
          <button
            onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 text-slate-400 hover:text-slate-200"
          >
            {sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Knowledge Item Card Component ─────────────────

interface KnowledgeItemCardProps {
  item: KnowledgeItem;
  types: KnowledgeType[];
  departments: KnowledgeDepartment[];
  streams: KnowledgeStream[];
  isExpanded: boolean;
  k: Record<string, any>;
  isRtl: boolean;
  onToggleExpand: (id: string) => void;
  onViewDetails: (item: KnowledgeItem) => void;
  onDelete: (id: string) => void;
}

function KnowledgeItemCard({
  item, types, departments, streams, isExpanded, k, isRtl: _isRtl,
  onToggleExpand, onViewDetails, onDelete
}: KnowledgeItemCardProps) {
  const type = types.find(t => t.id === item.knowledge_type_id);
  const itemDepartments = departments.filter(d => item.department_ids.includes(d.id));
  const _itemStreams = streams.filter(s => item.stream_ids.includes(s.id));

  const statusColors = {
    draft: "text-slate-400 bg-slate-500/10",
    classified: "text-blue-400 bg-blue-500/10",
    reviewed: "text-amber-400 bg-amber-500/10",
    approved: "text-emerald-400 bg-emerald-500/10",
    locked_to_sot: "text-purple-400 bg-purple-500/10",
    deprecated: "text-orange-400 bg-orange-500/10",
    archived: "text-slate-500 bg-slate-500/10",
    rejected: "text-red-400 bg-red-500/10"
  };

  const confidenceColors = {
    low: "text-slate-400 bg-slate-500/10",
    medium: "text-amber-400 bg-amber-500/10",
    high: "text-blue-400 bg-blue-500/10",
    verified: "text-emerald-400 bg-emerald-500/10"
  };

  const priorityColors = {
    critical: "text-red-400 bg-red-500/10",
    high: "text-orange-400 bg-orange-500/10",
    normal: "text-slate-400 bg-slate-500/10",
    low: "text-slate-500 bg-slate-500/10"
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 hover:border-slate-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-200 mb-1">{item.title}</h3>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {type && (
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                <BookOpen className="h-3 w-3" />
                {type.name_he || type.name}
              </span>
            )}
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${statusColors[item.status]}`}>
              {k[item.status]}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${confidenceColors[item.confidence]}`}>
              {k[item.confidence]}
            </span>
            {item.priority !== 'normal' && (
              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${priorityColors[item.priority]}`}>
                {item.priority === 'high' ? k.priorityHigh : k[item.priority]}
              </span>
            )}
            {item.needs_resolution && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                <AlertTriangle className="h-3 w-3" />
                {k.needsResolution}
              </span>
            )}
          </div>

          {/* Content Preview */}
          <p className="text-sm text-slate-400 mb-2">
            {isExpanded ? item.content : item.content.slice(0, 150) + (item.content.length > 150 ? '...' : '')}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(item.created_at).toLocaleDateString('he-IL')}
            </div>
            {item.owner_domain && (
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                {k[item.owner_domain]}
              </div>
            )}
            {itemDepartments.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {itemDepartments.map(d => d.name_he || d.name).join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleExpand(item.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            title={isExpanded ? k.showLess : k.showMore}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={() => onViewDetails(item)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
            title={k.viewDetails}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-800 hover:text-red-300"
            title={k.delete}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800">
          {item.tags.map((tag, index) => (
            <span key={index} className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Knowledge Item Detail Component ───────────────

interface KnowledgeItemDetailProps {
  item: KnowledgeItem;
  k: Record<string, any>;
  isRtl: boolean;
  onClose: () => void;
}

function KnowledgeItemDetail({ item, k, isRtl: _isRtl, onClose }: KnowledgeItemDetailProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h3 className="font-medium text-slate-200">{k.viewDetails}</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title & Content */}
        <div>
          <h4 className="font-medium text-slate-200 mb-2">{item.title}</h4>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{item.content}</p>
          </div>
        </div>

        {/* Metadata */}
        <div>
          <h5 className="text-sm font-medium text-slate-300 mb-2">{k.metadata}</h5>
          <div className="space-y-2 text-sm">
            {item.knowledge_type && (
              <div className="flex justify-between">
                <span className="text-slate-500">{k.type}:</span>
                <span className="text-slate-300">{item.knowledge_type.name_he || item.knowledge_type.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">{k.confidence}:</span>
              <span className="text-slate-300">{k[item.confidence]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{k.priority}:</span>
              <span className="text-slate-300">{k[item.priority]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{k.sotLevel}:</span>
              <span className="text-slate-300">{item.sot_level}/5</span>
            </div>
            {item.owner_domain && (
              <div className="flex justify-between">
                <span className="text-slate-500">{k.author}:</span>
                <span className="text-slate-300">{k[item.owner_domain]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Departments & Streams */}
        {item.departments && item.departments.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-slate-300 mb-2">{k.departments}</h5>
            <div className="flex flex-wrap gap-1">
              {item.departments.map((dept) => (
                <span key={dept.id} className="inline-block rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
                  {dept.name_he || dept.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-slate-300 mb-2">{k.tags}</h5>
            <div className="flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span key={index} className="inline-block rounded-md bg-purple-500/10 px-2 py-1 text-xs text-purple-400">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dates */}
        <div>
          <h5 className="text-sm font-medium text-slate-300 mb-2">{k.lifecycle}</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{k.createdAt}:</span>
              <span className="text-slate-300">{new Date(item.created_at).toLocaleDateString('he-IL')}</span>
            </div>
            {item.updated_at && (
              <div className="flex justify-between">
                <span className="text-slate-500">{k.updatedAt}:</span>
                <span className="text-slate-300">{new Date(item.updated_at).toLocaleDateString('he-IL')}</span>
              </div>
            )}
            {item.valid_until && (
              <div className="flex justify-between">
                <span className="text-slate-500">{k.validUntil}:</span>
                <span className="text-slate-300">{new Date(item.valid_until).toLocaleDateString('he-IL')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Knowledge Item Modal ──────────────────────

interface AddKnowledgeItemModalProps {
  types: KnowledgeType[];
  departments: KnowledgeDepartment[];
  streams: KnowledgeStream[];
  useCases: KnowledgeUseCase[];
  lenses: KnowledgeLens[];
  k: Record<string, any>;
  isRtl: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function AddKnowledgeItemModal({
  types, departments: _departments, streams: _streams, useCases: _useCases, lenses: _lenses, k, isRtl, onClose, onSaved
}: AddKnowledgeItemModalProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    knowledge_type_id: '',
    department_ids: [] as string[],
    stream_ids: [] as string[],
    use_case_ids: [] as string[],
    lens_ids: [] as string[],
    tags: '',
    owner_domain: '',
    priority: 'normal' as const,
    confidence: 'medium' as const,
    visibility: 'internal' as const
  });

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.knowledge_type_id) {
      alert("נא למלא שדות חובה");
      return;
    }

    setSaving(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      await createKnowledgeItem({
        title: formData.title,
        content: formData.content,
        knowledge_type_id: formData.knowledge_type_id,
        department_ids: formData.department_ids,
        stream_ids: formData.stream_ids,
        use_case_ids: formData.use_case_ids,
        lens_ids: formData.lens_ids,
        tags: tagsArray,
        owner_domain: (formData.owner_domain as any) || undefined,
        priority: formData.priority,
        confidence: formData.confidence,
        visibility: formData.visibility,
        language: 'he'
      });

      onSaved();
    } catch (err) {
      console.error('Failed to save:', err);
      alert(k.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h3 className="text-lg font-medium text-slate-200">{k.newKnowledgeItem}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto max-h-[calc(90vh-8rem)] px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {k.titleRequired} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {k.contentRequired} *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none resize-none"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {k.selectType} *
              </label>
              <select
                value={formData.knowledge_type_id}
                onChange={(e) => setFormData({ ...formData, knowledge_type_id: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              >
                <option value="">{k.selectType}</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name_he || type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner Domain */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {k.selectOwner}
              </label>
              <select
                value={formData.owner_domain}
                onChange={(e) => setFormData({ ...formData, owner_domain: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              >
                <option value="">{k.selectOwner}</option>
                <option value="case_preparation">{k.case_preparation}</option>
                <option value="sales">{k.sales}</option>
                <option value="recruitment">{k.recruitment}</option>
                <option value="finance">{k.finance}</option>
                <option value="systems">{k.systems}</option>
                <option value="management">{k.management}</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {k.priority}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              >
                <option value="normal">{k.normal}</option>
                <option value="high">{k.high}</option>
                <option value="critical">{k.critical}</option>
                <option value="low">{k.low}</option>
              </select>
            </div>

            {/* Confidence */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {k.confidence}
              </label>
              <select
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200"
              >
                <option value="low">{k.low}</option>
                <option value="medium">{k.medium}</option>
                <option value="high">{k.high}</option>
                <option value="verified">{k.verified}</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {k.tags}
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder={k.tagsPlaceholder}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-purple-500 focus:outline-none"
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:border-slate-600 hover:text-slate-300 disabled:opacity-50"
          >
            {k.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? k.saving : k.save}
          </button>
        </div>
      </div>
    </div>
  );
}