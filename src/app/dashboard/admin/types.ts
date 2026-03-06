// ─── Admin Page Types ───────────────────────────────────

export type Status = 'active' | 'placeholder' | 'coming-soon' | 'deprecated';
export type Phase = 1 | 2 | 3 | 4 | 5;
export type WorkflowStatus = 'inbox' | 'wishlist' | 'todo' | 'next' | 'inProgress' | 'hold' | 'stuck' | 'freeze' | 'complete' | 'cancelled';
export type SortField = 'date' | 'name' | 'phase' | 'workflow' | 'fileCount';
export type GroupField = 'none' | 'workflow' | 'phase' | 'date' | 'fileDir';

export interface FieldEntry {
  name: string;
  type: string;
  source?: string;
}

export interface ComponentEntry {
  id: string;
  name: string;
  file: string;
  status: Status;
  fields?: FieldEntry[];
}

export interface RouteEntry {
  id: string;
  path: string;
  name: string;
  nameHe: string;
  icon: React.ElementType;
  phase: Phase;
  status: Status;
  version: string;
  addedDate: string;
  descriptionHe: string;
  descriptionEn: string;
  components: ComponentEntry[];
  contexts: string[];
  supabaseTables?: string[];
  connectedTo?: string[];
  visible: boolean;
  sidebarTab: boolean;
}

export interface WidgetEntry {
  id: string;
  name: string;
  nameHe: string;
  file: string;
  defaultSize: string;
  panelMode: string;
  status: Status;
  version: string;
  addedDate: string;
}

export interface ContextEntry {
  id: string;
  name: string;
  file: string;
  storageKeys: string[];
  status: Status;
  version: string;
}

// ─── Changelog Types ────────────────────────────────────

export type FeatureStatus = 'working' | 'not-verified' | 'broken';
export type CommitStatus = 'committed' | 'uncommitted';

export interface ChangelogEntry {
  id: string;
  feature: string;
  featureHe: string;
  status: FeatureStatus;
  commitStatus: CommitStatus;
  workflowStatus: WorkflowStatus;
  commitHash?: string;
  date: string;
  phase?: Phase;
  files: string[];
  route?: string;
  notes: string;
  notesHe: string;
  purpose: string;
  purposeHe: string;
  connectedTo?: string[];
}

export interface DataCcIdEntry {
  ccId: string;
  file: string;
  line: number;
  textEditable: boolean;
  description: string;
  descriptionHe: string;
}

export interface GitStatusData {
  branch: string;
  modified: string[];
  untracked: string[];
  commits: { hash: string; message: string }[];
  isDirty: boolean;
}

// ─── Dev Checklist Types ────────────────────────────────

export type DevChecklistKey = 'guideContent' | 'usageDoc' | 'diagram' | 'aiSourceOfTruth' | 'conflictReview';

export interface DevChecklistItem {
  key: DevChecklistKey;
  done: boolean;
  note?: string;
  noteHe?: string;
}

export interface DevChecklist {
  items: DevChecklistItem[];
  reviewedBy?: string;
  reviewedDate?: string;
}
