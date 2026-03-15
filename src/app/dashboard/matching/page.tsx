"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Search, ChevronDown, Database } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { getTranslations } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";
import { MatchBoard } from "@/components/matching/MatchBoard";
import { MatchProfileEditor } from "@/components/matching/MatchProfileEditor";
import { extractMatchProfile } from "@/lib/matching/matchProfiles";
import type { NoteRecord, EntityType, GlobalField } from "@/lib/entities/types";
import type { MatchScoreRow, MatchProfile, MatchWeights } from "@/lib/matching/types";

export default function MatchingPage() {
  const { language } = useSettings();
  const router = useRouter();
  const t = getTranslations(language);
  const mt = t.matching as Record<string, string>;
  const pt = (t.pages as Record<string, Record<string, string>>).matching;

  // ── State ──
  const [entityTypes, setEntityTypes] = useState<EntityType[]>([]);
  const [globalFields, setGlobalFields] = useState<GlobalField[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [targetType, setTargetType] = useState<string>("");
  const [entities, setEntities] = useState<NoteRecord[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<NoteRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scores, setScores] = useState<MatchScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [profile, setProfile] = useState<MatchProfile | null>(null);

  // Target titles and types for display
  const [targetTitles, setTargetTitles] = useState<Record<string, string>>({});
  const [targetTypes, setTargetTypes] = useState<Record<string, string>>({});

  // ── Load entity types & fields on mount ──
  useEffect(() => {
    async function load() {
      const [typesRes, fieldsRes] = await Promise.all([
        supabase.from("entity_types").select("*").order("sort_order"),
        supabase.from("global_fields").select("*"),
      ]);
      setEntityTypes((typesRes.data ?? []) as EntityType[]);
      setGlobalFields((fieldsRes.data ?? []) as GlobalField[]);
    }
    load();
  }, []);

  // ── Load entities when type changes ──
  useEffect(() => {
    if (!selectedType) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setEntities([]);
      return;
    }
    async function loadEntities() {
      setLoadingEntities(true);
      const { data } = await supabase
        .from("vb_records")
        .select("*")
        .eq("entity_type", selectedType)
        .eq("is_deleted", false)
        .order("last_edited_at", { ascending: false })
        .limit(100);
      setEntities((data ?? []) as NoteRecord[]);
      setLoadingEntities(false);
    }
    loadEntities();
  }, [selectedType]);

  // ── Extract profile when entity is selected ──
  useEffect(() => {
    if (!selectedEntity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- setState in effect is intentional (data fetching/init)
      setProfile(null);
      return;
    }
    const et = entityTypes.find((t) => t.slug === selectedEntity.entity_type);
    if (!et) return;
    const p = extractMatchProfile(selectedEntity, et, globalFields);
    setProfile(p);
  }, [selectedEntity, entityTypes, globalFields]);

  // ── Find matches ──
  const findMatches = useCallback(
    async (forceRefresh = false) => {
      if (!selectedEntity) return;

      setLoading(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("/api/matching/score", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            source_id: selectedEntity.id,
            target_type: targetType || undefined,
            limit: 20,
            force_refresh: forceRefresh,
          }),
        });

        const data = await res.json();
        if (res.ok && data.scores) {
          setScores(data.scores);

          // Fetch target titles
          const ids = data.scores.map((s: MatchScoreRow) => s.target_id);
          if (ids.length > 0) {
            const { data: targetNotes } = await supabase
              .from("vb_records")
              .select("id, title, entity_type")
              .in("id", ids);

            const titles: Record<string, string> = {};
            const types: Record<string, string> = {};
            for (const note of targetNotes ?? []) {
              titles[note.id] = note.title;
              types[note.id] = note.entity_type || "";
            }
            setTargetTitles(titles);
            setTargetTypes(types);
          }
        }
      } catch {
        // Silent fail
      }
      setLoading(false);
    },
    [selectedEntity, targetType]
  );

  // ── Handle entity selection ──
  const handleEntitySelect = (entity: NoteRecord) => {
    setSelectedEntity(entity);
    setScores([]);
  };

  // ── Handle card click → navigate to entity ──
  const handleCardClick = (targetId: string) => {
    const targetEntityType = targetTypes[targetId];
    if (targetEntityType) {
      router.push(`/dashboard/entities/${targetEntityType}/${targetId}`);
    }
  };

  // ── Handle weight save ──
  const handleWeightSave = async (weights: MatchWeights) => {
    if (!selectedEntity) return;
    // Save weights to entity meta.__match_profile
    const currentMeta = selectedEntity.meta || {};
    const newMeta = {
      ...currentMeta,
      __match_profile: { weights },
    };
    await supabase
      .from("vb_records")
      .update({ meta: newMeta })
      .eq("id", selectedEntity.id);
  };

  // ── Filter entities by search ──
  const filteredEntities = entities.filter((e) =>
    searchQuery
      ? e.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const isRtl = language === "he";

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      data-cc-id="matching.page"
      className="flex h-[calc(100vh-48px)] bg-slate-900"
    >
      {/* ── Left Panel: Entity Selector ── */}
      <div className="w-80 shrink-0 border-e border-slate-700/50 flex flex-col bg-slate-900">
        {/* Page header */}
        <div className="shrink-0 border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--cc-accent-400)]" />
            <div>
              <h1 className="text-sm font-semibold text-slate-100">
                {pt?.title || "Matching"}
              </h1>
              <p className="text-[10px] text-slate-500">
                {pt?.description || "AI-powered entity matching"}
              </p>
            </div>
          </div>
        </div>

        {/* Source type selector */}
        <div className="shrink-0 border-b border-slate-700/50 p-3 space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-slate-600">
            {mt.sourceEntity}
          </label>
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setSelectedEntity(null);
                setScores([]);
              }}
              className="w-full appearance-none rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-[var(--cc-accent-500)] focus:outline-none"
            >
              <option value="">{mt.selectType}</option>
              {entityTypes.map((et) => (
                <option key={et.id} value={et.slug}>
                  {et.label[language] || et.label.en || et.slug}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>

          {/* Target type filter */}
          <label className="text-[10px] uppercase tracking-wider text-slate-600">
            {mt.targetType}
          </label>
          <div className="relative">
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 focus:border-[var(--cc-accent-500)] focus:outline-none"
            >
              <option value="">All types</option>
              {entityTypes.map((et) => (
                <option key={et.id} value={et.slug}>
                  {et.label[language] || et.label.en || et.slug}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-2.5 top-2.5 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Entity search */}
        {selectedType && (
          <div className="shrink-0 border-b border-slate-700/50 p-3">
            <div className="relative">
              <Search className="absolute start-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={mt.selectSource}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-1.5 ps-8 pe-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-[var(--cc-accent-500)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Entity list */}
        <div className="flex-1 overflow-y-auto">
          {loadingEntities ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-slate-500">{t.common.loading}</span>
            </div>
          ) : !selectedType ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Database className="h-8 w-8 text-slate-700 mb-2" />
              <span className="text-xs text-slate-500">{mt.selectType}</span>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-xs text-slate-500">{mt.noMatches}</span>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {filteredEntities.map((entity) => {
                const isSelected = selectedEntity?.id === entity.id;
                return (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => handleEntitySelect(entity)}
                    className={`w-full rounded-lg px-3 py-2 text-start text-sm transition-colors ${
                      isSelected
                        ? "bg-[var(--cc-accent-600-20)] text-[var(--cc-accent-300)]"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    }`}
                  >
                    <span className="block truncate">{entity.title}</span>
                    <span className="block text-[10px] text-slate-600 mt-0.5">
                      {entity.status} &middot;{" "}
                      {new Date(entity.last_edited_at).toLocaleDateString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Find matches button */}
        {selectedEntity && (
          <div className="shrink-0 border-t border-slate-700/50 p-3">
            <button
              type="button"
              onClick={() => findMatches(false)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--cc-accent-600-20)] px-4 py-2 text-sm font-medium text-[var(--cc-accent-300)] transition-colors hover:bg-[var(--cc-accent-600-30)] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {mt.findMatches}
            </button>
          </div>
        )}
      </div>

      {/* ── Right Panel: Results ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedEntity ? (
          <>
            {/* Match Board */}
            <div className="flex-1 min-h-0">
              <MatchBoard
                sourceTitle={selectedEntity.title}
                sourceType={selectedEntity.entity_type || ""}
                scores={scores}
                targetTitles={targetTitles}
                targetTypes={targetTypes}
                loading={loading}
                onRefresh={() => findMatches(true)}
                onCardClick={handleCardClick}
              />
            </div>

            {/* Profile Editor (collapsible bottom section) */}
            <div className="shrink-0 border-t border-slate-700/50 max-h-64 overflow-y-auto">
              <MatchProfileEditor
                profile={profile}
                savedWeights={
                  (selectedEntity.meta?.__match_profile as { weights?: MatchWeights } | undefined)?.weights
                }
                onSave={handleWeightSave}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
            <Sparkles className="h-12 w-12 text-slate-700 mb-4" />
            <h2 className="text-lg font-medium text-slate-400 mb-1">
              {pt?.title || "Matching Engine"}
            </h2>
            <p className="text-sm text-slate-600 max-w-md">
              {pt?.description || "Select an entity to find AI-powered matches"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
