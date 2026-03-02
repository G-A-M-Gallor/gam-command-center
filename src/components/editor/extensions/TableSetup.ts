// ===================================================
// GAM Command Center — Table Extensions
// Wraps @tiptap/extension-table with GAM classes
// Requires: npm install @tiptap/extension-table
//           @tiptap/extension-table-row
//           @tiptap/extension-table-cell
//           @tiptap/extension-table-header
// ===================================================

import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

export const GamTable = Table.configure({
  resizable: true,
  HTMLAttributes: { class: 'gam-table' },
});

export const GamTableRow = TableRow.configure({
  HTMLAttributes: { class: 'gam-table__row' },
});

export const GamTableCell = TableCell.configure({
  HTMLAttributes: { class: 'gam-table__cell' },
});

export const GamTableHeader = TableHeader.configure({
  HTMLAttributes: { class: 'gam-table__header' },
});

// Export all table extensions as array for easy import
export const tableExtensions = [GamTable, GamTableRow, GamTableCell, GamTableHeader];
