'use client';

import { useState, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Plus, X, GripVertical,
  Eye, EyeOff, Settings2, Zap,
} from 'lucide-react';
import type {
  TemplateConfig, TemplateSection, ActionButton,
  ViewType, GlobalField, I18nLabel,
} from '@/lib/entities/types';
import { defaultTemplateConfig } from '@/lib/entities/types';

const VIEW_OPTIONS: ViewType[] = ['table', 'board', 'list', 'calendar', 'gantt', 'timeline'];
const EMPTY_LABEL: I18nLabel = { he: '', en: '', ru: '' };

const BUTTON_ICONS = [
  'Phone', 'Mail', 'MessageSquare', 'FileText', 'AlertTriangle',
  'CheckCircle', 'XCircle', 'Clock', 'Star', 'Zap',
  'Send', 'Download', 'Upload', 'RefreshCw', 'Trash2',
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
  const isHe = language === 'he';

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
    },
  }[lang];

  const [openPanel, setOpenPanel] = useState<string | null>('views');

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

  const updateActionButton = (idx: number, patch: Partial<ActionButton>) => {
    const buttons = (c.action_buttons ?? []).map((b, i) => i === idx ? { ...b, ...patch } : b);
    update({ action_buttons: buttons });
  };

  const removeActionButton = (idx: number) => {
    update({ action_buttons: (c.action_buttons ?? []).filter((_, i) => i !== idx) });
  };

  // ─── View toggles ──────────
  const toggleView = (view: ViewType) => {
    const views = c.available_views.includes(view)
      ? c.available_views.filter(v => v !== view)
      : [...c.available_views, view];
    update({ available_views: views });
  };

  const PanelToggle = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setOpenPanel(openPanel === id ? null : id)}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.04] rounded-lg transition-colors"
    >
      {openPanel === id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {label}
    </button>
  );

  return (
    <div className="space-y-2" dir={isHe ? 'rtl' : 'ltr'}>
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
          {(c.action_buttons ?? []).map((btn, idx) => (
            <div key={btn.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">{btn.icon}</span>
                <span className="text-xs text-slate-300 flex-1 truncate">
                  {btn.label[lang] || btn.id}
                </span>
                <button onClick={() => removeActionButton(idx)} className="text-slate-500 hover:text-red-400">
                  <X size={12} />
                </button>
              </div>

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

              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={btn.confirm ?? false}
                  onChange={e => updateActionButton(idx, { confirm: e.target.checked })}
                  className="rounded border-white/20"
                />
                {t.confirm}
              </label>
            </div>
          ))}

          <button
            onClick={addActionButton}
            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
          >
            <Plus size={10} />
            {t.addAction}
          </button>
        </div>
      )}
    </div>
  );
}
