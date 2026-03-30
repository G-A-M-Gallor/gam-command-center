// ===================================================
// Priority Aliases — Template-specific priority levels
// ===================================================

import type { GlobalField, TemplateConfig, PriorityAlias, FieldOption } from './types';

/**
 * Get priority options for a field, using template-specific aliases if available
 */
export function getPriorityOptions(
  field: GlobalField,
  templateConfig?: TemplateConfig | null
): FieldOption[] {
  // Only apply to priority field
  if (field.meta_key !== 'priority') {
    return field.options;
  }

  // Check if template has priority aliases
  if (templateConfig?.priority_aliases && templateConfig.priority_aliases.length > 0) {
    // Convert PriorityAlias[] to FieldOption[] format
    return templateConfig.priority_aliases
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((alias): FieldOption => ({
        value: alias.value,
        label: alias.label,
        color: alias.color,
      }));
  }

  // Fallback to global priority options
  return field.options;
}

/**
 * Get priority alias details by value (for tooltips, icons, etc.)
 */
export function getPriorityAlias(
  value: string,
  templateConfig?: TemplateConfig | null
): PriorityAlias | null {
  if (!templateConfig?.priority_aliases) {
    return null;
  }

  return templateConfig.priority_aliases.find(alias => alias.value === value) || null;
}

/**
 * Get priority display color by value
 */
export function getPriorityColor(
  value: string,
  field: GlobalField,
  templateConfig?: TemplateConfig | null
): string | undefined {
  // Try template aliases first
  const alias = getPriorityAlias(value, templateConfig);
  if (alias) {
    return alias.color;
  }

  // Fallback to global field options
  const globalOption = field.options.find(opt => opt.value === value);
  return globalOption?.color;
}

/**
 * Get priority display label by value
 */
export function getPriorityLabel(
  value: string,
  field: GlobalField,
  templateConfig?: TemplateConfig | null,
  lang: 'he' | 'en' | 'ru' = 'he'
): string {
  // Try template aliases first
  const alias = getPriorityAlias(value, templateConfig);
  if (alias) {
    return alias.label[lang] || alias.label.he || value;
  }

  // Fallback to global field options
  const globalOption = field.options.find(opt => opt.value === value);
  return globalOption?.label[lang] || globalOption?.label.he || value;
}