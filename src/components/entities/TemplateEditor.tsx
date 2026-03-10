'use client';

import { useState, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, ChevronUp, Plus, X, GripVertical,
  Eye, EyeOff, Settings2, Zap, Library,
} from 'lucide-react';
import type {
  TemplateConfig, TemplateSection, ActionButton, ActionPosition, HandlerType,
  ViewType, GlobalField, I18nLabel,
  NavigateConfig, SetFieldConfig, CustomEventConfig, WebhookConfig,
} from '@/lib/entities/types';
import { defaultTemplateConfig } from '@/lib/entities/types';
import { BUILTIN_ACTIONS } from '@/lib/entities/actionRegistry';
import { resolveActionIcon } from '@/lib/entities/actionIconMap';

const VIEW_OPTIONS: ViewType[] = ['table', 'board', 'list', 'calendar', 'gantt', 'timeline'];
const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };
const ALL_POSITIONS: ActionPosition[] = ['sidebar', 'toolbar', 'detail_header', 'floating'];
const HANDLER_TYPES: HandlerType[] = ['builtin', 'navigate', 'set_field', 'custom_event', 'webhook'];

const BUTTON_ICONS = [
  'Phone', 'Mail', 'MessageSquare', 'FileText', 'AlertTriangle',
  'CheckCircle', 'XCircle', 'Clock', 'Star', 'Zap',
  'Send', 'Download', 'Upload', 'RefreshCw', 'Trash2',
  'Archive', 'ArchiveRestore', 'ArrowRightLeft', 'Bot', 'Bell',
  'Pencil', 'UserPlus', 'ExternalLink', 'Globe', 'Link',
];

interface Props {
  config: TemplateConfig | null;
  fieldRefs: string[];
  fields: GlobalField[];
  language: string;
  onChange: (config: TemplateConfig) => void;
}

export function TemplateEditor({ config, fieldRefs, fields, language, onChange }: Props) {
  const c = config ?? defaultTemplateConfig();
  const lang = language === 'he' ? 'he' : language === 'ru' ? 'ru' : 'en';
  const isRtl = language === 'he';

  const t = {
    he: {
      templateConfig: 'הגדרות תבנית',
      sections: 'סקציות',
      addSection: 'הוסף סקציה',
      sectionKey: 'מפתח',
      sectionLabel: 'תווית',
      assignFields: 'שייך שדות',
      noFields: 'אין שדות',
      availableViews: 'תצוגות זמינות',
      boardConfig: 'הגדרות לוח',
      groupField: 'שדה קיבוץ',
      cardFields: 'שדות בכרטיס',
      ganttConfig: 'הגדרות גאנט',
      startField: 'שדה התחלה',
      endField: 'שדה סיום',
      timelineConfig: 'הגדרות ציר זמן',
      dateField: 'שדה תאריך',
      milestoneStatuses: 'סטטוסי אבני דרך',
      trackActivity: 'מעקב פעילות',
      trackKpi: 'מעקב אירועי KPI',
      actionButtons: 'כפתורי פעולה',
      addAction: 'הוסף פעולה',
      addFromLibrary: 'הוסף מספרייה',
      actionLabel: 'תווית',
      actionIcon: 'אייקון',
      actionVariant: 'סגנון',
      actionScope: 'טווח',
      showWhen: 'הצג כאשר',
      statusIn: 'סטטוס שווה ל-',
      confirm: 'אישור לפני ביצוע',
      columns: 'עמודות מטא',
      fieldOrder: 'סדר שדות',
      remove: 'הסר',
      collapsed: 'מכווץ',
      handlerType: 'סוג טיפול',
      positions: 'מיקומים',
      autoFromScope: 'אוטומטי (לפי טווח)',
      urlTemplate: 'תבנית URL',
      target: 'יעד',
      fieldKey: 'שדה',
      fieldValue: 'ערך',
      eventName: 'שם אירוע',
      detailTemplate: 'תבנית פרטים (JSON)',
      webhookUrl: 'כתובת Webhook',
      includeMeta: 'כלול מטא-דאטה',
      builtin: 'מובנה',
      builtinAction: 'פעולה מובנית',
    },
    en: {
      templateConfig: 'Template Config',
      sections: 'Sections',
      addSection: 'Add Section',
      sectionKey: 'Key',
      sectionLabel: 'Label',
      assignFields: 'Assign Fields',
      noFields: 'No fields',
      availableViews: 'Available Views',
      boardConfig: 'Board Config',
      groupField: 'Group field',
      cardFields: 'Card fields',
      ganttConfig: 'Gantt Config',
      startField: 'Start field',
      endField: 'End field',
      timelineConfig: 'Timeline Config',
      dateField: 'Date field',
      milestoneStatuses: 'Milestone statuses',
      trackActivity: 'Track Activity',
      trackKpi: 'Track KPI Events',
      actionButtons: 'Action Buttons',
      addAction: 'Add Action',
      addFromLibrary: 'Add from Library',
      actionLabel: 'Label',
      actionIcon: 'Icon',
      actionVariant: 'Variant',
      actionScope: 'Scope',
      showWhen: 'Show when',
      statusIn: 'Status equals',
      confirm: 'Confirm before action',
      columns: 'Meta Columns',
      fieldOrder: 'Field Order',
      remove: 'Remove',
      collapsed: 'Collapsed',
      handlerType: 'Handler Type',
      positions: 'Positions',
      autoFromScope: 'Auto (from scope)',
      urlTemplate: 'URL Template',
      target: 'Target',
      fieldKey: 'Field',
      fieldValue: 'Value',
      eventName: 'Event Name',
      detailTemplate: 'Detail Template (JSON)',
      webhookUrl: 'Webhook URL',
      includeMeta: 'Include metadata',
      builtin: 'Built-in',
      builtinAction: 'Built-in action',
    },
    ru: {
      templateConfig: 'Конфигурация шаблона',
      sections: 'Секции',
      addSection: 'Добавить секцию',
      sectionKey: 'Ключ',
      sectionLabel: 'Метка',
      assignFields: 'Назначить поля',
      noFields: 'Нет полей',
      availableViews: 'Доступные представления',
      boardConfig: 'Настройки доски',
      groupField: 'Поле группировки',
      cardFields: 'Поля карточки',
      ganttConfig: 'Настройки Гантта',
      startField: 'Поле начала',
      endField: 'Поле окончания',
      timelineConfig: 'Настройки хронологии',
      dateField: 'Поле даты',
      milestoneStatuses: 'Статусы вех',
      trackActivity: 'Отслеживание активности',
      trackKpi: 'Отслеживание KPI событий',
      actionButtons: 'Кнопки действий',
      addAction: 'Добавить действие',
      addFromLibrary: 'Добавить из библиотеки',
      actionLabel: 'Метка',
      actionIcon: 'Иконка',
      actionVariant: 'Стиль',
      actionScope: 'Область',
      showWhen: 'Показывать когда',
      statusIn: 'Статус равен',
      confirm: 'Подтверждение перед действием',
      columns: 'Колонки мета',
      fieldOrder: 'Порядок полей',
      remove: 'Удалить',
      collapsed: 'Свёрнут',
      handlerType: 'Тип обработчика',
      positions: 'Позиции',
      autoFromScope: 'Авто (по области)',
      urlTemplate: 'Шаблон URL',
      target: 'Цель',
      fieldKey: 'Поле',
      fieldValue: 'Значение',
      eventName: 'Имя события',
      detailTemplate: 'Шаблон деталей (JSON)',
      webhookUrl: 'URL Webhook',
      includeMeta: 'Включить метаданные',
      builtin: 'Встроенный',
      builtinAction: 'Встроенное действие',
    },
  }[lang];

  const [openPanel, setOpenPanel] = useState<string | null>('views');
  const [showBuiltinPicker, setShowBuiltinPicker] = useState(false);

  // Available fields for the entity (filtered by fieldRefs)
  const availableFields = fields.filter(f => fieldRefs.includes(f.meta_key));
  const selectFields = availableFields.filter(f => f.field_type === 'select');
  const dateFields = availableFields.filter(f => f.field_type === 'date');

  const update = useCallback((patch: Partial<TemplateConfig>) => {
    onChange({ ...c, ...patch });
  }, [c, onChange]);

  const updateLayout = useCallback((patch: Partial<TemplateConfig['layout']>) => {
    onChange({ ...c, layout: { ...c.layout, ...patch } });
  }, [c, onChange]);

  // ─── Section management ──────────
  const addSection = () => {
    const key = `section_${Date.now()}`;
    updateLayout({
      sections: [...c.layout.sections, { key, label: { ...EMPTY_LABEL }, field_refs: [] }],
    });
  };

  const updateSection = (idx: number, patch: Partial<TemplateSection>) => {
    const sections = c.layout.sections.map((s, i) => i === idx ? { ...s, ...patch } : s);
    updateLayout({ sections });
  };

  const removeSection = (idx: number) => {
    updateLayout({ sections: c.layout.sections.filter((_, i) => i !== idx) });
  };

  const moveSectionUp = (idx: number) => {
    if (idx === 0) return;
    const sections = [...c.layout.sections];
    [sections[idx - 1], sections[idx]] = [sections[idx], sections[idx - 1]];
    updateLayout({ sections });
  };

  const toggleFieldInSection = (sectionIdx: number, metaKey: string) => {
    const section = c.layout.sections[sectionIdx];
    const refs = section.field_refs.includes(metaKey)
      ? section.field_refs.filter(r => r !== metaKey)
      : [...section.field_refs, metaKey];
    updateSection(sectionIdx, { field_refs: refs });
  };

  // ─── Action button management ──────────
  const addActionButton = () => {
    const btn: ActionButton = {
      id: `action_${Date.now()}`,
      label: { ...EMPTY_LABEL },
      icon: 'Zap',
      variant: 'default',
      scope: 'single',
      sort_order: (c.action_buttons?.length ?? 0),
    };
    update({ action_buttons: [...(c.action_buttons ?? []), btn] });
  };

  const addBuiltinAction = (builtinId: string) => {
    const builtin = BUILTIN_ACTIONS[builtinId];
    if (!builtin) return;
    // Don't add duplicates
    if ((c.action_buttons ?? []).some(b => b.id === builtinId)) return;
    update({ action_buttons: [...(c.action_buttons ?? []), { ...builtin }] });
  };

  const updateActionButton = (idx: number, patch: Partial<ActionButton>) => {
    const buttons = (c.action_buttons ?? []).map((b, i) => i === idx ? { ...b, ...patch } : b);
    update({ action_buttons: buttons });
  };

  const removeActionButton = (idx: number) => {
    update({ action_buttons: (c.action_buttons ?? []).filter((_, i) => i !== idx) });
  };

  const moveAction = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0) return;
    const buttons = [...(c.action_buttons ?? [])];
    if (toIdx >= buttons.length) return;
    const [moved] = buttons.splice(fromIdx, 1);
    buttons.splice(toIdx, 0, moved);
    // Recalculate sort_order
    const reordered = buttons.map((b, i) => ({ ...b, sort_order: i }));
    update({ action_buttons: reordered });
  };

  const togglePosition = (idx: number, pos: ActionPosition) => {
    const btn = (c.action_buttons ?? [])[idx];
    if (!btn) return;
    const current = btn.positions ?? [];
    const next = current.includes(pos)
      ? current.filter(p => p !== pos)
      : [...current, pos];
    updateActionButton(idx, { positions: next.length > 0 ? next : undefined });
  };

  // ─── View toggles ──────────
  const toggleView = (view: ViewType) => {
    const views = c.available_views.includes(view)
      ? c.available_views.filter(v => v !== view)
      : [...c.available_views, view];
    update({ available_views: views });
  };

  // Builtins not yet added
  const availableBuiltins = Object.values(BUILTIN_ACTIONS).filter(
    b => !(c.action_buttons ?? []).some(existing => existing.id === b.id),
  );

  const PanelToggle = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setOpenPanel(openPanel === id ? null : id)}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.04] rounded-lg transition-colors"
    >
      {openPanel === id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {label}
    </button>
  );

  const isBuiltin = (btn: ActionButton) => btn.handler_type === 'builtin' || !!BUILTIN_ACTIONS[btn.id];

  return (
    <div className="space-y-2" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Available Views */}
      <PanelToggle id="views" label={t.availableViews} />
      {openPanel === 'views' && (
        <div className="px-3 pb-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            {VIEW_OPTIONS.map(v => (
              <button
                key={v}
                onClick={() => toggleView(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                  c.available_views.includes(v)
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                    : 'border-white/[0.08] bg-white/[0.02] text-slate-500 hover:text-slate-300'
                }`}
              >
                {c.available_views.includes(v) ? <Eye size={10} className="inline me-1" /> : <EyeOff size={10} className="inline me-1" />}
                {v}
              </button>
            ))}
          </div>

          {/* Board config */}
          {c.available_views.includes('board') && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{t.boardConfig}</span>
              <div>
                <label className="text-[10px] text-slate-400">{t.groupField}</label>
                <select
                  value={c.board_config?.group_field ?? ''}
                  onChange={e => update({ board_config: { group_field: e.target.value, card_fields: c.board_config?.card_fields ?? [] } })}
                  className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="">—</option>
                  {selectFields.map(f => (
                    <option key={f.meta_key} value={f.meta_key}>{f.label[lang] || f.meta_key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400">{t.cardFields}</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableFields.map(f => (
                    <button
                      key={f.meta_key}
                      onClick={() => {
                        const current = c.board_config?.card_fields ?? [];
                        const next = current.includes(f.meta_key)
                          ? current.filter(k => k !== f.meta_key)
                          : [...current, f.meta_key];
                        update({ board_config: { group_field: c.board_config?.group_field ?? '', card_fields: next } });
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        (c.board_config?.card_fields ?? []).includes(f.meta_key)
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-white/[0.04] text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {f.label[lang] || f.meta_key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Gantt config */}
          {c.available_views.includes('gantt') && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{t.ganttConfig}</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">{t.startField}</label>
                  <select
                    value={c.gantt_config?.start_field ?? ''}
                    onChange={e => update({ gantt_config: { start_field: e.target.value, end_field: c.gantt_config?.end_field ?? '' } })}
                    className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                  >
                    <option value="">—</option>
                    {dateFields.map(f => (
                      <option key={f.meta_key} value={f.meta_key}>{f.label[lang] || f.meta_key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">{t.endField}</label>
                  <select
                    value={c.gantt_config?.end_field ?? ''}
                    onChange={e => update({ gantt_config: { start_field: c.gantt_config?.start_field ?? '', end_field: e.target.value } })}
                    className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                  >
                    <option value="">—</option>
                    {dateFields.map(f => (
                      <option key={f.meta_key} value={f.meta_key}>{f.label[lang] || f.meta_key}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Timeline config */}
          {c.available_views.includes('timeline') && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">{t.timelineConfig}</span>
              <div>
                <label className="text-[10px] text-slate-400">{t.dateField}</label>
                <select
                  value={c.timeline_config?.date_field ?? ''}
                  onChange={e => update({ timeline_config: { date_field: e.target.value, milestone_statuses: c.timeline_config?.milestone_statuses ?? [] } })}
                  className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-300"
                >
                  <option value="">—</option>
                  {dateFields.map(f => (
                    <option key={f.meta_key} value={f.meta_key}>{f.label[lang] || f.meta_key}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400">{t.milestoneStatuses}</label>
                <input
                  type="text"
                  value={(c.timeline_config?.milestone_statuses ?? []).join(', ')}
                  onChange={e => update({
                    timeline_config: {
                      date_field: c.timeline_config?.date_field ?? '',
                      milestone_statuses: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    },
                  })}
                  placeholder="done, approved, milestone..."
                  className="mt-1 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layout — columns + sections */}
      <PanelToggle id="sections" label={t.sections} />
      {openPanel === 'sections' && (
        <div className="px-3 pb-3 space-y-3">
          {/* Meta columns */}
          <div>
            <label className="text-[10px] text-slate-400">{t.columns}</label>
            <div className="flex gap-2 mt-1">
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => updateLayout({ meta_columns: n })}
                  className={`rounded px-3 py-1 text-xs font-medium border transition-colors ${
                    c.layout.meta_columns === n
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                      : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Sections list */}
          {c.layout.sections.map((section, idx) => (
            <div key={section.key} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <button onClick={() => moveSectionUp(idx)} className="text-slate-600 hover:text-slate-300">
                  <GripVertical size={12} />
                </button>
                <input
                  type="text"
                  value={section.label[lang] || ''}
                  onChange={e => updateSection(idx, { label: { ...section.label, [lang]: e.target.value } })}
                  placeholder={t.sectionLabel}
                  className="flex-1 rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-slate-200 focus:border-purple-500/50 focus:outline-none"
                />
                <label className="flex items-center gap-1 text-[10px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={section.collapsed ?? false}
                    onChange={e => updateSection(idx, { collapsed: e.target.checked })}
                    className="rounded border-white/20"
                  />
                  {t.collapsed}
                </label>
                <button onClick={() => removeSection(idx)} className="text-slate-500 hover:text-red-400">
                  <X size={12} />
                </button>
              </div>

              {/* Field assignment */}
              <div>
                <label className="text-[9px] text-slate-500">{t.assignFields}</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {availableFields.length === 0 ? (
                    <span className="text-[10px] text-slate-600">{t.noFields}</span>
                  ) : (
                    availableFields.map(f => (
                      <button
                        key={f.meta_key}
                        onClick={() => toggleFieldInSection(idx, f.meta_key)}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                          section.field_refs.includes(f.meta_key)
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-white/[0.04] text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {f.label[lang] || f.meta_key}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addSection}
            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
          >
            <Plus size={10} />
            {t.addSection}
          </button>
        </div>
      )}

      {/* Toggles */}
      <PanelToggle id="toggles" label={`${t.trackActivity} / ${t.trackKpi}`} />
      {openPanel === 'toggles' && (
        <div className="px-3 pb-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={c.track_activity}
              onChange={e => update({ track_activity: e.target.checked })}
              className="rounded border-white/20"
            />
            <Settings2 size={12} className="text-slate-400" />
            <span className="text-xs text-slate-300">{t.trackActivity}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={c.track_kpi_events}
              onChange={e => update({ track_kpi_events: e.target.checked })}
              className="rounded border-white/20"
            />
            <Zap size={12} className="text-slate-400" />
            <span className="text-xs text-slate-300">{t.trackKpi}</span>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <PanelToggle id="actions" label={t.actionButtons} />
      {openPanel === 'actions' && (
        <div className="px-3 pb-3 space-y-3">
          {(c.action_buttons ?? []).map((btn, idx) => {
            const BtnIcon = resolveActionIcon(btn.icon);
            const isBlt = isBuiltin(btn);

            return (
              <div key={btn.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                {/* Header with reorder + icon + label + remove */}
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveAction(idx, idx - 1)}
                      disabled={idx === 0}
                      className="text-slate-600 hover:text-slate-300 disabled:opacity-20"
                    >
                      <ChevronUp size={10} />
                    </button>
                    <button
                      onClick={() => moveAction(idx, idx + 1)}
                      disabled={idx === (c.action_buttons?.length ?? 1) - 1}
                      className="text-slate-600 hover:text-slate-300 disabled:opacity-20"
                    >
                      <ChevronDown size={10} />
                    </button>
                  </div>
                  <GripVertical size={12} className="text-slate-600" />
                  <BtnIcon size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-300 flex-1 truncate">
                    {btn.label[lang] || btn.id}
                  </span>
                  {isBlt && (
                    <span className="rounded-full bg-purple-500/10 px-1.5 py-0.5 text-[9px] text-purple-400 font-medium">
                      {t.builtin}
                    </span>
                  )}
                  <span className="rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-slate-500">
                    {btn.scope}
                  </span>
                  <button onClick={() => removeActionButton(idx)} className="text-slate-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </div>

                {/* Builtin actions only show positions — no other config editable */}
                {isBlt ? (
                  <div>
                    <label className="text-[9px] text-slate-500">{t.positions}</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ALL_POSITIONS.map(pos => (
                        <button
                          key={pos}
                          onClick={() => togglePosition(idx, pos)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                            (btn.positions ?? []).includes(pos)
                              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                              : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                      {(!btn.positions || btn.positions.length === 0) && (
                        <span className="text-[9px] text-slate-600 italic">{t.autoFromScope}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Custom action config */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Label he/en */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.actionLabel} (he)</label>
                        <input
                          type="text"
                          value={btn.label.he}
                          onChange={e => updateActionButton(idx, { label: { ...btn.label, he: e.target.value } })}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 focus:border-purple-500/50 focus:outline-none"
                          dir="rtl"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500">{t.actionLabel} (en)</label>
                        <input
                          type="text"
                          value={btn.label.en}
                          onChange={e => updateActionButton(idx, { label: { ...btn.label, en: e.target.value } })}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 focus:border-purple-500/50 focus:outline-none"
                          dir="ltr"
                        />
                      </div>

                      {/* Icon */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.actionIcon}</label>
                        <select
                          value={btn.icon}
                          onChange={e => updateActionButton(idx, { icon: e.target.value })}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                        >
                          {BUTTON_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>

                      {/* Variant */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.actionVariant}</label>
                        <select
                          value={btn.variant}
                          onChange={e => updateActionButton(idx, { variant: e.target.value as ActionButton['variant'] })}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                        >
                          <option value="default">Default</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                          <option value="destructive">Destructive</option>
                        </select>
                      </div>

                      {/* Scope */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.actionScope}</label>
                        <select
                          value={btn.scope}
                          onChange={e => updateActionButton(idx, { scope: e.target.value as ActionButton['scope'] })}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                        >
                          <option value="single">Single</option>
                          <option value="bulk">Bulk</option>
                          <option value="global">Global</option>
                        </select>
                      </div>

                      {/* Handler Type */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.handlerType}</label>
                        <select
                          value={btn.handler_type ?? ''}
                          onChange={e => {
                            const ht = e.target.value as HandlerType | '';
                            updateActionButton(idx, {
                              handler_type: ht || undefined,
                              handler_config: undefined,
                            });
                          }}
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                        >
                          <option value="">—</option>
                          {HANDLER_TYPES.filter(h => h !== 'builtin').map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>

                      {/* Show when — status_in */}
                      <div>
                        <label className="text-[9px] text-slate-500">{t.statusIn}</label>
                        <input
                          type="text"
                          value={(btn.show_when?.status_in ?? []).join(', ')}
                          onChange={e => updateActionButton(idx, {
                            show_when: {
                              ...btn.show_when,
                              status_in: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                            },
                          })}
                          placeholder="active, new..."
                          className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Handler Config — per type */}
                    {btn.handler_type === 'navigate' && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-500">{t.urlTemplate}</label>
                          <input
                            type="text"
                            value={(btn.handler_config as NavigateConfig | undefined)?.url_template ?? ''}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                url_template: e.target.value,
                                target: (btn.handler_config as NavigateConfig | undefined)?.target ?? '_blank',
                              } as NavigateConfig,
                            })}
                            placeholder="https://example.com/{id}"
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">{t.target}</label>
                          <select
                            value={(btn.handler_config as NavigateConfig | undefined)?.target ?? '_blank'}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                url_template: (btn.handler_config as NavigateConfig | undefined)?.url_template ?? '',
                                target: e.target.value as '_blank' | '_self',
                              } as NavigateConfig,
                            })}
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                          >
                            <option value="_blank">_blank</option>
                            <option value="_self">_self</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {btn.handler_type === 'set_field' && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-500">{t.fieldKey}</label>
                          <select
                            value={(btn.handler_config as SetFieldConfig | undefined)?.field_key ?? ''}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                field_key: e.target.value,
                                value: (btn.handler_config as SetFieldConfig | undefined)?.value ?? '',
                              } as SetFieldConfig,
                            })}
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-300"
                          >
                            <option value="">—</option>
                            {availableFields.map(f => (
                              <option key={f.meta_key} value={f.meta_key}>{f.label[lang] || f.meta_key}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">{t.fieldValue}</label>
                          <input
                            type="text"
                            value={(btn.handler_config as SetFieldConfig | undefined)?.value ?? ''}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                field_key: (btn.handler_config as SetFieldConfig | undefined)?.field_key ?? '',
                                value: e.target.value,
                              } as SetFieldConfig,
                            })}
                            placeholder="{field_key} or literal value"
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    {btn.handler_type === 'custom_event' && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-500">{t.eventName}</label>
                          <input
                            type="text"
                            value={(btn.handler_config as CustomEventConfig | undefined)?.event_name ?? ''}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                event_name: e.target.value,
                                detail_template: (btn.handler_config as CustomEventConfig | undefined)?.detail_template ?? '{}',
                              } as CustomEventConfig,
                            })}
                            placeholder="cc-custom-action"
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">{t.detailTemplate}</label>
                          <textarea
                            value={(btn.handler_config as CustomEventConfig | undefined)?.detail_template ?? '{}'}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                event_name: (btn.handler_config as CustomEventConfig | undefined)?.event_name ?? '',
                                detail_template: e.target.value,
                              } as CustomEventConfig,
                            })}
                            rows={2}
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 font-mono focus:border-purple-500/50 focus:outline-none resize-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    {btn.handler_type === 'webhook' && (
                      <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-500">{t.webhookUrl}</label>
                          <input
                            type="text"
                            value={(btn.handler_config as WebhookConfig | undefined)?.url ?? ''}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                url: e.target.value,
                                include_meta: (btn.handler_config as WebhookConfig | undefined)?.include_meta ?? true,
                              } as WebhookConfig,
                            })}
                            placeholder="https://hooks.example.com/..."
                            className="mt-0.5 w-full rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                            dir="ltr"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(btn.handler_config as WebhookConfig | undefined)?.include_meta ?? true}
                            onChange={e => updateActionButton(idx, {
                              handler_config: {
                                url: (btn.handler_config as WebhookConfig | undefined)?.url ?? '',
                                include_meta: e.target.checked,
                              } as WebhookConfig,
                            })}
                            className="rounded border-white/20"
                          />
                          {t.includeMeta}
                        </label>
                      </div>
                    )}

                    {/* Positions */}
                    <div>
                      <label className="text-[9px] text-slate-500">{t.positions}</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ALL_POSITIONS.map(pos => (
                          <button
                            key={pos}
                            onClick={() => togglePosition(idx, pos)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                              (btn.positions ?? []).includes(pos)
                                ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                                : 'border-white/[0.08] text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                        {(!btn.positions || btn.positions.length === 0) && (
                          <span className="text-[9px] text-slate-600 italic">{t.autoFromScope}</span>
                        )}
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={btn.confirm ?? false}
                        onChange={e => updateActionButton(idx, { confirm: e.target.checked })}
                        className="rounded border-white/20"
                      />
                      {t.confirm}
                    </label>
                  </>
                )}
              </div>
            );
          })}

          {/* Add action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={addActionButton}
              className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
            >
              <Plus size={10} />
              {t.addAction}
            </button>

            {availableBuiltins.length > 0 && (
              <button
                onClick={() => setShowBuiltinPicker(!showBuiltinPicker)}
                className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300"
              >
                <Library size={10} />
                {t.addFromLibrary}
              </button>
            )}
          </div>

          {/* Builtin Picker — 2-column grid */}
          {showBuiltinPicker && availableBuiltins.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.03] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase">{t.addFromLibrary}</span>
                <button onClick={() => setShowBuiltinPicker(false)} className="text-slate-500 hover:text-slate-300">
                  <X size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {availableBuiltins.map(b => {
                  const BIcon = resolveActionIcon(b.icon);
                  return (
                    <button
                      key={b.id}
                      onClick={() => {
                        addBuiltinAction(b.id);
                        // Close picker if no more available
                        if (availableBuiltins.length <= 1) setShowBuiltinPicker(false);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-start hover:bg-white/[0.06] transition-colors"
                    >
                      <BIcon size={14} className="text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-slate-300 truncate">{b.label[lang] || b.label.en}</div>
                        <div className="text-[9px] text-slate-500">{b.scope}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
