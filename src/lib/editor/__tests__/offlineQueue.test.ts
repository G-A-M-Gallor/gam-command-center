// ===================================================
// offlineQueue — Unit Tests
// Tests IndexedDB-backed offline save queue
// ===================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';

// Ensure fake-indexeddb is on globalThis before importing the module under test
globalThis.indexedDB = new IDBFactory();
globalThis.IDBKeyRange = IDBKeyRange;

// Now import the module (it reads `indexedDB` at call time, not import time)
import { saveToOfflineQueue, flushOfflineQueue, getPendingCount } from '../offlineQueue';

// Reset fake-indexeddb between tests for isolation
function resetIndexedDB() {
  globalThis.indexedDB = new IDBFactory();
}

describe('offlineQueue', () => {
  beforeEach(() => {
    resetIndexedDB();
  });

  afterEach(() => {
    resetIndexedDB();
  });

  // ----- Module Exports -----
  describe('module exports', () => {
    it('exports saveToOfflineQueue as a function', () => {
      expect(typeof saveToOfflineQueue).toBe('function');
    });

    it('exports flushOfflineQueue as a function', () => {
      expect(typeof flushOfflineQueue).toBe('function');
    });

    it('exports getPendingCount as a function', () => {
      expect(typeof getPendingCount).toBe('function');
    });
  });

  // ----- Graceful Degradation (no IndexedDB) -----
  describe('graceful degradation when IndexedDB is undefined', () => {
    let savedIndexedDB: IDBFactory;

    beforeEach(() => {
      savedIndexedDB = globalThis.indexedDB;
      // @ts-expect-error — intentionally removing indexedDB for test
      delete globalThis.indexedDB;
    });

    afterEach(() => {
      globalThis.indexedDB = savedIndexedDB;
    });

    it('saveToOfflineQueue does not crash when indexedDB is undefined', async () => {
      await expect(
        saveToOfflineQueue('doc-1', { type: 'doc', content: [] }),
      ).resolves.toBeUndefined();
    });

    it('flushOfflineQueue returns 0 when indexedDB is undefined', async () => {
      const result = await flushOfflineQueue(async () => true);
      expect(result).toBe(0);
    });

    it('getPendingCount returns 0 when indexedDB is undefined', async () => {
      const count = await getPendingCount();
      expect(count).toBe(0);
    });
  });

  // ----- Core Functionality -----
  describe('saveToOfflineQueue', () => {
    it('stores an item and getPendingCount returns 1', async () => {
      await saveToOfflineQueue('doc-1', { type: 'doc', content: [{ text: 'hello' }] });
      const count = await getPendingCount();
      expect(count).toBe(1);
    });

    it('stores multiple items for different documents', async () => {
      await saveToOfflineQueue('doc-1', { text: 'content-1' });
      await saveToOfflineQueue('doc-2', { text: 'content-2' });
      await saveToOfflineQueue('doc-3', { text: 'content-3' });
      const count = await getPendingCount();
      expect(count).toBe(3);
    });

    it('saving same documentId twice keeps only the latest version', async () => {
      await saveToOfflineQueue('doc-1', { version: 1 });
      await saveToOfflineQueue('doc-1', { version: 2 });
      const count = await getPendingCount();
      expect(count).toBe(1);

      // Verify the stored content is the latest version
      const saveFn = vi.fn().mockResolvedValue(true);
      await flushOfflineQueue(saveFn);
      expect(saveFn).toHaveBeenCalledOnce();
      expect(saveFn).toHaveBeenCalledWith('doc-1', { version: 2 });
    });

    it('saving same documentId three times keeps only the latest', async () => {
      await saveToOfflineQueue('doc-1', { v: 'a' });
      await saveToOfflineQueue('doc-1', { v: 'b' });
      await saveToOfflineQueue('doc-1', { v: 'c' });
      const count = await getPendingCount();
      expect(count).toBe(1);
    });
  });

  describe('getPendingCount', () => {
    it('returns 0 when queue is empty', async () => {
      const count = await getPendingCount();
      expect(count).toBe(0);
    });

    it('returns accurate count after multiple saves', async () => {
      await saveToOfflineQueue('doc-a', { data: 1 });
      await saveToOfflineQueue('doc-b', { data: 2 });
      expect(await getPendingCount()).toBe(2);

      // Save over one of them — count should stay 2
      await saveToOfflineQueue('doc-a', { data: 3 });
      expect(await getPendingCount()).toBe(2);
    });
  });

  describe('flushOfflineQueue', () => {
    it('returns 0 when queue is empty', async () => {
      const saveFn = vi.fn().mockResolvedValue(true);
      const flushed = await flushOfflineQueue(saveFn);
      expect(flushed).toBe(0);
      expect(saveFn).not.toHaveBeenCalled();
    });

    it('calls saveFn for each pending item and returns count', async () => {
      await saveToOfflineQueue('doc-1', { text: 'one' });
      await saveToOfflineQueue('doc-2', { text: 'two' });

      const saveFn = vi.fn().mockResolvedValue(true);
      const flushed = await flushOfflineQueue(saveFn);

      expect(flushed).toBe(2);
      expect(saveFn).toHaveBeenCalledTimes(2);
      expect(saveFn).toHaveBeenCalledWith('doc-1', { text: 'one' });
      expect(saveFn).toHaveBeenCalledWith('doc-2', { text: 'two' });
    });

    it('removes flushed items from the queue', async () => {
      await saveToOfflineQueue('doc-1', { text: 'data' });
      await saveToOfflineQueue('doc-2', { text: 'data' });

      const saveFn = vi.fn().mockResolvedValue(true);
      await flushOfflineQueue(saveFn);

      const count = await getPendingCount();
      expect(count).toBe(0);
    });

    it('stops on first failure and keeps remaining items', async () => {
      await saveToOfflineQueue('doc-1', { text: 'one' });
      await saveToOfflineQueue('doc-2', { text: 'two' });
      await saveToOfflineQueue('doc-3', { text: 'three' });

      // First succeeds, second fails
      const saveFn = vi.fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const flushed = await flushOfflineQueue(saveFn);

      expect(flushed).toBe(1);
      expect(saveFn).toHaveBeenCalledTimes(2);
      // doc-2 and doc-3 should still be in the queue
      const remaining = await getPendingCount();
      expect(remaining).toBe(2);
    });

    it('passes correct documentId and content to saveFn', async () => {
      const content = { type: 'doc', content: [{ type: 'paragraph', text: 'test' }] };
      await saveToOfflineQueue('my-doc-id', content);

      const saveFn = vi.fn().mockResolvedValue(true);
      await flushOfflineQueue(saveFn);

      expect(saveFn).toHaveBeenCalledWith('my-doc-id', content);
    });
  });
});
