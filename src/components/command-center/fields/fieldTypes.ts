// ===================================================
// GAM Command Center — Field Types Registry
// 8 field types across 3 categories
// ===================================================

import {
  Type,
  CheckSquare,
  ChevronDown,
  ListChecks,
  Calendar,
  CalendarClock,
  _Clock,
  Tags,
  type LucideIcon,
} from 'lucide-react';

// ─── Category ────────────────────────────────────────
export type FieldCategory = 'text' | 'selection' | 'time';

export const fieldCategories: {
  id: FieldCategory;
  label: { he: string; en: string; ru: string };
}[] = [
  { id: 'text', label: { he: 'טקסט', en: 'Text', ru: 'Текст' } },
  { id: 'selection', label: { he: 'בחירה', en: 'Selection', ru: 'Выбор' } },
  { id: 'time', label: { he: 'זמן', en: 'Time', ru: 'Время' } },
];

// ─── Field Type IDs ──────────────────────────────────
export type FieldTypeId =
  | 'short-text'
  | 'checkbox'
  | 'dropdown'
  | 'multi-select'
  | 'date'
  | 'datetime'
  | 'time'
  | 'tags';

// ─── Config Schemas (per field type) ─────────────────
export interface ShortTextConfig {
  label: string;
  placeholder: string;
  required: boolean;
  maxLength: number;
  defaultValue: string;
}

export interface CheckboxConfig {
  label: string;
  defaultChecked: boolean;
}

export interface DropdownConfig {
  label: string;
  options: string[];
  required: boolean;
  defaultValue: string;
}

export interface MultiSelectConfig {
  label: string;
  options: string[];
  required: boolean;
  maxSelections: number;
  defaultValue: string[];
}

export interface DateConfig {
  label: string;
  format: string;
  minDate: string;
  maxDate: string;
  defaultValue: string;
}

export interface DateTimeConfig {
  label: string;
  format: string;
  minDate: string;
  maxDate: string;
  defaultValue: string;
}

export interface TimeConfig {
  label: string;
  format: '24h' | '12h';
  defaultValue: string;
}

export interface TagsConfig {
  label: string;
  predefinedTags: string[];
  allowCustom: boolean;
  maxTags: number;
  defaultValue: string[];
}

export type FieldConfig =
  | ShortTextConfig
  | CheckboxConfig
  | DropdownConfig
  | MultiSelectConfig
  | DateConfig
  | DateTimeConfig
  | TimeConfig
  | TagsConfig;

// ─── Default Configs ─────────────────────────────────
export const defaultConfigs: Record<FieldTypeId, FieldConfig> = {
  'short-text': {
    label: '',
    placeholder: '',
    required: false,
    maxLength: 255,
    defaultValue: '',
  },
  checkbox: {
    label: '',
    defaultChecked: false,
  },
  dropdown: {
    label: '',
    options: ['אפשרות 1', 'אפשרות 2', 'אפשרות 3'],
    required: false,
    defaultValue: '',
  },
  'multi-select': {
    label: '',
    options: ['אפשרות 1', 'אפשרות 2', 'אפשרות 3'],
    required: false,
    maxSelections: 0,
    defaultValue: [],
  },
  date: {
    label: '',
    format: 'DD/MM/YYYY',
    minDate: '',
    maxDate: '',
    defaultValue: '',
  },
  datetime: {
    label: '',
    format: 'DD/MM/YYYY HH:mm',
    minDate: '',
    maxDate: '',
    defaultValue: '',
  },
  time: {
    label: '',
    format: '24h',
    defaultValue: '',
  },
  tags: {
    label: '',
    predefinedTags: [],
    allowCustom: true,
    maxTags: 10,
    defaultValue: [],
  },
};

// ─── Field Type Definition ───────────────────────────
export interface FieldTypeDefinition {
  id: FieldTypeId;
  icon: LucideIcon;
  label: { he: string; en: string; ru: string };
  description: { he: string; en: string; ru: string };
  category: FieldCategory;
  defaultConfig: FieldConfig;
}

// ─── Registry ────────────────────────────────────────
export const fieldTypes: FieldTypeDefinition[] = [
  {
    id: 'short-text',
    icon: Type,
    label: { he: 'טקסט קצר', en: 'Short Text', ru: 'Короткий текст' },
    description: { he: 'שדה טקסט חופשי', en: 'Free text input field', ru: 'Поле свободного ввода текста' },
    category: 'text',
    defaultConfig: defaultConfigs['short-text'],
  },
  {
    id: 'checkbox',
    icon: CheckSquare,
    label: { he: "צ'קבוקס", en: 'Checkbox', ru: 'Флажок' },
    description: { he: 'תיבת סימון כן/לא', en: 'Yes/No toggle', ru: 'Переключатель да/нет' },
    category: 'selection',
    defaultConfig: defaultConfigs.checkbox,
  },
  {
    id: 'dropdown',
    icon: ChevronDown,
    label: { he: 'רשימה נפתחת', en: 'Dropdown', ru: 'Выпадающий список' },
    description: { he: 'בחירה מרשימת אפשרויות', en: 'Select from options', ru: 'Выбор из вариантов' },
    category: 'selection',
    defaultConfig: defaultConfigs.dropdown,
  },
  {
    id: 'multi-select',
    icon: ListChecks,
    label: { he: 'בחירה מרובה', en: 'Multi Select', ru: 'Множественный выбор' },
    description: { he: 'בחירה מרובה מרשימה', en: 'Select multiple options', ru: 'Выбор нескольких вариантов' },
    category: 'selection',
    defaultConfig: defaultConfigs['multi-select'],
  },
  {
    id: 'date',
    icon: Calendar,
    label: { he: 'תאריך', en: 'Date', ru: 'Дата' },
    description: { he: 'בורר תאריך', en: 'Date picker', ru: 'Выбор даты' },
    category: 'time',
    defaultConfig: defaultConfigs.date,
  },
  {
    id: 'datetime',
    icon: CalendarClock,
    label: { he: 'תאריך ושעה', en: 'Date & Time', ru: 'Дата и время' },
    description: { he: 'בורר תאריך ושעה', en: 'Date and time picker', ru: 'Выбор даты и времени' },
    category: 'time',
    defaultConfig: defaultConfigs.datetime,
  },
  {
    id: 'time',
    icon: _Clock,
    label: { he: 'שעה', en: 'Time', ru: 'Время' },
    description: { he: 'בורר שעה', en: 'Time picker', ru: 'Выбор времени' },
    category: 'time',
    defaultConfig: defaultConfigs.time,
  },
  {
    id: 'tags',
    icon: Tags,
    label: { he: 'תגיות', en: 'Tags', ru: 'Теги' },
    description: { he: 'תגיות עם צבעים', en: 'Colored tag labels', ru: 'Цветные метки' },
    category: 'selection',
    defaultConfig: defaultConfigs.tags,
  },
];

// ─── Lookup helpers ──────────────────────────────────
export function getFieldType(id: FieldTypeId): FieldTypeDefinition | undefined {
  return fieldTypes.find((f) => f.id === id);
}

export function getFieldsByCategory(category: FieldCategory): FieldTypeDefinition[] {
  return fieldTypes.filter((f) => f.category === category);
}
