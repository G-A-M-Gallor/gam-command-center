"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSettings } from "@/contexts/SettingsContext";
import { EntityCardFront } from "./EntityCardFront";
import { EntityCardBack } from "./EntityCardBack";
import { executeFieldAction } from "./EntityCardActions";
import { getEntityCardConfig } from "./entityCardTemplates";
import type { EntityCardProps, FieldActionType } from "./entityCard.types";

async function fetchEntity(entityId: string) {
  const { data, error } = await supabase
    .from("vb_records")
    .select("*")
    .eq("id", entityId)
    .eq("is_deleted", false)
    .single();
  if (error) throw error;
  return data as {
    id: string;
    title: string;
    meta: Record<string, unknown>;
    entity_type: string | null;
    status: string;
    created_at: string;
  };
}

export function EntityCard({ entityType, entityId, config, page, mode }: EntityCardProps) {
  const { language } = useSettings();
  const router = useRouter();
  const queryClient = useQueryClient();

  const cardConfig = config ?? getEntityCardConfig(entityType);

  const { data: entity, isLoading, error } = useQuery({
    queryKey: ["entity", entityId],
    queryFn: () => fetchEntity(entityId),
    staleTime: 30_000,
    enabled: !!entityId,
  });

  const handleAction = useCallback(
    (type: FieldActionType, value: string) => {
      executeFieldAction(type, value, entityId, router.push, (msg: string) => {
        window.dispatchEvent(
          new CustomEvent("cc-notify", { detail: { message: msg, type: "success" } }),
        );
      });
    },
    [entityId, router],
  );

  // Inline edit: update meta field in Supabase + invalidate cache
  const handleFieldChange = useCallback(
    async (metaKey: string, value: string) => {
      if (!entity) return;
      const updatedMeta = { ...(entity.meta as Record<string, unknown>), [metaKey]: value };
      await supabase.from("vb_records").update({ meta: updatedMeta }).eq("id", entityId);
      await queryClient.invalidateQueries({ queryKey: ["entity", entityId] });
      window.dispatchEvent(
        new CustomEvent("cc-notify", { detail: { message: "השדה עודכן", type: "success" } }),
      );
    },
    [entityId, entity, queryClient],
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3 animate-pulse">
        <div className="h-4 w-2/3 rounded bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-700" />
        <div className="h-3 w-3/4 rounded bg-slate-700" />
        <div className="h-3 w-1/3 rounded bg-slate-700" />
      </div>
    );
  }

  // Error state
  if (error || !entity) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 p-4 text-center">
        <span className="text-lg">⚠️</span>
        <p className="text-xs text-red-400">
          {error ? "שגיאה בטעינת הישות" : "ישות לא נמצאה"}
        </p>
      </div>
    );
  }

  const meta: Record<string, unknown> = {
    ...entity.meta,
    title: entity.title,
    status: entity.status,
    created_at: entity.created_at,
  };

  const isCompact = mode === "compact";

  // Title + subtitle header
  const titleValue = String(meta[cardConfig.titleField] ?? entity.title ?? "");
  const subtitleValue = cardConfig.subtitleField
    ? String(meta[cardConfig.subtitleField] ?? "")
    : "";
  const statusValue = cardConfig.statusField
    ? String(meta[cardConfig.statusField] ?? "")
    : "";

  // Avatar / icon
  const avatarUrl = cardConfig.avatarField ? String(meta[cardConfig.avatarField] ?? "") : "";
  const entityIcon = entity.meta?.icon as string | undefined;

  const header = (
    <div className="px-3 pt-2 pb-1 border-b border-slate-700/30">
      <div className="flex items-center gap-2">
        {/* Avatar or icon */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-600"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-700/60 flex items-center justify-center shrink-0 text-sm">
            {entityIcon ?? titleValue.charAt(0) ?? "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{titleValue}</h3>
          {subtitleValue && !isCompact && (
            <p className="text-xs text-slate-400 truncate">{subtitleValue}</p>
          )}
        </div>
        {statusValue && (
          <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">
            {statusValue}
          </span>
        )}
      </div>
    </div>
  );

  if (page === "both") {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto md:border-l border-b md:border-b-0 border-slate-700/30">
            <EntityCardFront
              fields={cardConfig.frontFields}
              meta={meta}
              language={language}
              compact={isCompact}
              onAction={handleAction}
            />
          </div>
          <div className="flex-1 overflow-auto">
            <EntityCardBack
              fields={cardConfig.backFields}
              meta={meta}
              language={language}
              compact={isCompact}
              onAction={handleAction}
              onFieldChange={handleFieldChange}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex-1 overflow-auto">
        {page === "front" ? (
          <EntityCardFront
            fields={cardConfig.frontFields}
            meta={meta}
            language={language}
            compact={isCompact}
            onAction={handleAction}
          />
        ) : (
          <EntityCardBack
            fields={cardConfig.backFields}
            meta={meta}
            language={language}
            compact={isCompact}
            onAction={handleAction}
            onFieldChange={handleFieldChange}
          />
        )}
      </div>
    </div>
  );
}
