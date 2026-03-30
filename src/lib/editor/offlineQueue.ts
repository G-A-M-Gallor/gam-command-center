// ===================================================
// GAM Command Center — Editor Offline Queue
// IndexedDB-backed queue for failed saves
// ===================================================

const DB_NAME = 'cc-editor-offline';
const STORE_NAME = 'pending-saves';
const DB_VERSION = 1;

interface PendingSave {
  id?: number;
  documentId: string;
  content: unknown;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const _request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('documentId', 'documentId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(_request.result);
    request.onerror = () => reject(_request.error);
  });
}

/** Save content to the offline queue when server save fails */
export async function saveToOfflineQueue(
  documentId: string,
  content: unknown,
): Promise<void> {
  if (typeof indexedDB === 'undefined') return;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // Remove any older pending saves for this document (keep only latest)
  const index = store.index('documentId');
  const range = IDBKeyRange.only(documentId);
  const cursor = index.openCursor(range);

  await new Promise<void>((resolve, reject) => {
    cursor.onsuccess = () => {
      const result = cursor.result;
      if (result) {
        result.delete();
        result.continue();
      } else {
        resolve();
      }
    };
    cursor.onerror = () => reject(cursor.error);
  });

  // Add the latest version
  store.add({ documentId, content, timestamp: Date.now() } satisfies PendingSave);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Replay all pending saves to the server. Returns number of items flushed. */
export async function flushOfflineQueue(
  saveFn: (documentId: string, content: unknown) => Promise<boolean>,
): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  const items: PendingSave[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (items.length === 0) return 0;

  let flushed = 0;
  for (const item of items) {
    const success = await saveFn(item.documentId, item.content);
    if (success && item.id != null) {
      const deleteTx = db.transaction(STORE_NAME, 'readwrite');
      deleteTx.objectStore(STORE_NAME).delete(item.id);
      await new Promise<void>((resolve) => {
        deleteTx.oncomplete = () => resolve();
        deleteTx.onerror = () => resolve(); // don't block on delete failure
      });
      flushed++;
    } else {
      break; // Still failing, stop trying
    }
  }
  return flushed;
}

/** Get count of pending unsaved documents */
export async function getPendingCount(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
