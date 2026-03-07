// ===================================================
// useAutoSave — Unit Tests
// Tests debounced autosave with retry + offline fallback
// ===================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { JSONContent } from '@tiptap/react';

// ----- Mock Supabase -----
const mockSelect = vi.fn();
const mockEq = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: { from: mockFrom },
}));

// ----- Mock offlineQueue -----
const mockSaveToOfflineQueue = vi.fn().mockResolvedValue(undefined);
const mockFlushOfflineQueue = vi.fn().mockResolvedValue(0);
const mockGetPendingCount = vi.fn().mockResolvedValue(0);

vi.mock('../offlineQueue', () => ({
  saveToOfflineQueue: (a: string, b: unknown) => mockSaveToOfflineQueue(a, b),
  flushOfflineQueue: (fn: unknown) => mockFlushOfflineQueue(fn),
  getPendingCount: () => mockGetPendingCount(),
}));

// ----- Helpers -----
function setupSupabaseSuccess() {
  mockSelect.mockResolvedValue({ data: [{ id: 'test-id' }], error: null });
}

function setupSupabaseError(message = 'Network error', code = 'NETWORK') {
  mockSelect.mockResolvedValue({ data: null, error: { message, code } });
}

function setupSupabaseRLSBlock() {
  mockSelect.mockResolvedValue({ data: [], error: null });
}

const sampleContent: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
};

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    // Default: supabase succeeds
    setupSupabaseSuccess();
    // navigator.onLine defaults to true in happy-dom
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // We import useAutoSave dynamically so the mocks are set up first
  async function importHook() {
    const mod = await import('../useAutoSave');
    return mod.useAutoSave;
  }

  // ----- Initial State -----
  describe('initial state', () => {
    it('starts with saveState "idle"', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 500 }),
      );

      expect(result.current.saveState).toBe('idle');
    });

    it('starts with lastSavedAt undefined', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1' }),
      );

      expect(result.current.lastSavedAt).toBeUndefined();
    });

    it('starts with retryCount 0', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1' }),
      );

      expect(result.current.retryCount).toBe(0);
    });

    it('provides saveNow and queueSave functions', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1' }),
      );

      expect(typeof result.current.saveNow).toBe('function');
      expect(typeof result.current.queueSave).toBe('function');
    });
  });

  // ----- Flush on Mount -----
  describe('flush on mount', () => {
    it('calls getPendingCount on mount', async () => {
      const useAutoSave = await importHook();
      renderHook(() => useAutoSave({ recordId: 'rec-1' }));

      // Let the async mount effect run
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockGetPendingCount).toHaveBeenCalled();
    });

    it('calls flushOfflineQueue when there are pending saves', async () => {
      mockGetPendingCount.mockResolvedValueOnce(3);
      mockFlushOfflineQueue.mockResolvedValueOnce(3);

      const useAutoSave = await importHook();
      renderHook(() => useAutoSave({ recordId: 'rec-1' }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockFlushOfflineQueue).toHaveBeenCalled();
    });

    it('does not call flushOfflineQueue when count is 0', async () => {
      mockGetPendingCount.mockResolvedValueOnce(0);

      const useAutoSave = await importHook();
      renderHook(() => useAutoSave({ recordId: 'rec-1' }));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockFlushOfflineQueue).not.toHaveBeenCalled();
    });
  });

  // ----- saveNow (immediate save) -----
  describe('saveNow — immediate save', () => {
    it('saves to supabase immediately without debounce', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 5000 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        // No need to advance timers — should be immediate
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockFrom).toHaveBeenCalledWith('vb_records');
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'rec-1');
    });

    it('transitions to "saving" then "saved" on success', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 500 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.saveState).toBe('saved');
      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });

    it('transitions back to "idle" after 2 seconds of "saved"', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 500 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.saveState).toBe('saved');

      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.saveState).toBe('idle');
    });

    it('sets lastSavedAt on successful save', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1' }),
      );

      const before = new Date();

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
      expect(result.current.lastSavedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  // ----- queueSave (debounced) -----
  describe('queueSave — debounced save', () => {
    it('does not save immediately when queueSave is called', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 1000 }),
      );

      act(() => {
        result.current.queueSave(sampleContent);
      });

      // Don't advance timers yet
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('saves after debounce period elapses', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 1000 }),
      );

      act(() => {
        result.current.queueSave(sampleContent);
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(mockFrom).toHaveBeenCalledWith('vb_records');
    });

    it('resets debounce timer on each call (only saves once)', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 1000 }),
      );

      act(() => {
        result.current.queueSave({ type: 'doc', content: [{ type: 'text', text: 'a' }] });
      });

      // Advance 500ms, then queue again
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      act(() => {
        result.current.queueSave({ type: 'doc', content: [{ type: 'text', text: 'ab' }] });
      });

      // Advance another 500ms — first debounce would have fired but was reset
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Should not have saved yet (only 500ms since last queue)
      expect(mockFrom).not.toHaveBeenCalled();

      // Advance the remaining 500ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // Now it should have saved
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });
  });

  // ----- Retry Logic -----
  describe('retry on failure', () => {
    it('retries on supabase error with exponential backoff', async () => {
      // Fail first two times, succeed on third
      setupSupabaseError();
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', maxRetries: 3 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0); // attempt 0 fires
      });

      // Should be retrying after first failure
      // Advance 1s for first retry (2^0 * 1000)
      setupSupabaseError(); // still failing
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.saveState).toBe('retrying');
      expect(result.current.retryCount).toBe(1);

      // Advance 2s for second retry (2^1 * 1000)
      setupSupabaseSuccess(); // now succeeds
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.saveState).toBe('saved');
      expect(result.current.retryCount).toBe(0);
    });

    it('retries on RLS block (0 rows returned)', async () => {
      setupSupabaseRLSBlock();
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', maxRetries: 3 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      // After first failure, wait for retry
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.saveState).toBe('retrying');
    });
  });

  // ----- Offline Fallback -----
  describe('offline fallback', () => {
    it('saves to offline queue after all retries are exhausted', async () => {
      setupSupabaseError();
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', maxRetries: 2 }),
      );

      // Attempt 0
      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      // Retry 1 (after 1s)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(0);
      });

      // Retry 2 (after 2s)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockSaveToOfflineQueue).toHaveBeenCalledWith('rec-1', sampleContent);
      expect(result.current.saveState).toBe('error');
    });

    it('saves to offline queue immediately when navigator is offline', async () => {
      setupSupabaseError();
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });

      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', maxRetries: 3 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockSaveToOfflineQueue).toHaveBeenCalledWith('rec-1', sampleContent);
      expect(result.current.saveState).toBe('offline');
      // Should NOT have attempted retries
      expect(result.current.retryCount).toBe(0);
    });
  });

  // ----- Edge Cases -----
  describe('edge cases', () => {
    it('does not save when recordId is empty', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: '', debounceMs: 100 }),
      );

      await act(async () => {
        result.current.saveNow(sampleContent);
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('saveNow cancels pending debounced save', async () => {
      const useAutoSave = await importHook();
      const { result } = renderHook(() =>
        useAutoSave({ recordId: 'rec-1', debounceMs: 5000 }),
      );

      const content1: JSONContent = { type: 'doc', content: [{ type: 'text', text: 'debounced' }] };
      const content2: JSONContent = { type: 'doc', content: [{ type: 'text', text: 'immediate' }] };

      // Queue a debounced save
      act(() => {
        result.current.queueSave(content1);
      });

      // Immediately save with different content
      await act(async () => {
        result.current.saveNow(content2);
        await vi.advanceTimersByTimeAsync(0);
      });

      // The update call should have used content2
      expect(mockUpdate).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateCallArg = (mockUpdate.mock.calls as any)[0]?.[0];
      expect(updateCallArg?.content).toEqual(content2);

      // Advance past the original debounce — should NOT trigger another save
      mockFrom.mockClear();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });

      // mockFrom should not have been called again
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
