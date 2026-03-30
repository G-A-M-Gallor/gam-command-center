// Barrel export for Supabase utilities and queries

// Core clients and configuration
export { createClient } from './client';
export * from './server';
export * from './schema';
export * from './middleware';

// Database query modules - avoiding conflicts
export * from './activityLogger';
export * from './aiConversationQueries';
export * from './aiUsageQueries';
export * from './commQueries';
export * from './fieldQueries';
export * from './functionalMapQueries';
export * from './hubQueries';
export * from './kpiQueries';
export * from './matchingQueries';
export * from './permissionQueries';
export * from './planQueries';
export * from './projectQueries';
export * from './rssQueries';
export * from './storageQueries';
export * from './storyCardQueries';
export * from './userProfileQueries';

// Document queries - aliased to avoid conflicts
export {
  createTemplateVersion,
  fetchDocTemplates as fetchDocumentTemplates,
  fetchDocTemplate as fetchDocumentTemplate,
  createDocTemplate as createDocumentTemplate,
  updateDocTemplate as updateDocumentTemplate
} from './documentQueries';

// Editor queries - aliased to avoid conflicts
export {
  fetchTemplates as fetchEditorTemplates,
  createTemplate as createEditorTemplate,
  updateTemplate as updateEditorTemplate,
  deleteTemplate as deleteEditorTemplate
} from './editorQueries';

// Entity queries - aliased to avoid conflicts
export {
  createTemplate as createEntityTemplate
} from './entityQueries';

// Realtime modules
export * from './commRealtime';
export * from './documentRealtime';
export * from './functionalMapRealtime';
export * from './planRealtime';
export * from './storyCardRealtime';

// Utilities
export * from './fireberryBridge';
export * from './notifyUser';