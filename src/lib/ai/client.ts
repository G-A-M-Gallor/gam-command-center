import type { AIMode } from "./prompts";

interface StreamChatOptions {
  messages: { role: "user" | "assistant"; content: string; images?: { base64: string; mediaType: string }[] }[];
  mode: AIMode;
  contexts?: string[];
  token?: string;
  onToken: (text: string) => void;
  onDone: (usage: { input_tokens: number; output_tokens: number }) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

interface StreamWorkManagerOptions {
  messages: { role: "user" | "assistant"; content: string }[];
  session_id: string;
  user_id: string;
  current_view?: { page: string; open_tasks?: string[]; time_in_view?: string };
  token?: string;
  onToken: (text: string) => void;
  onAgent?: (agent: string) => void;
  onDone: (usage: { input_tokens: number; output_tokens: number }) => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamChat({
  messages,
  mode,
  contexts = [],
  token,
  onToken,
  onDone,
  onError,
  signal,
}: StreamChatOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/ai/chat", {
      method: "POST",
      _headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, mode, contexts }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!response.ok) {
    try {
      const data = await response.json();
      onError(data.error || `HTTP ${response.status}`);
    } catch {
      onError(`HTTP ${response.status}`);
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === "text") {
            onToken(data.text);
          } else if (data.type === "done") {
            onDone(data.usage);
          } else if (data.type === "error") {
            onError(data.error);
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Stream read error");
  } finally {
    reader.releaseLock();
  }
}

export async function streamWorkManager({
  messages,
  session_id,
  user_id,
  current_view,
  token,
  onToken,
  onAgent,
  onDone,
  onError,
  signal,
}: StreamWorkManagerOptions): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/work-manager", {
      method: "POST",
      _headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, session_id, user_id, current_view }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!response.ok) {
    try {
      const data = await response.json();
      onError(data.error || `HTTP ${response.status}`);
    } catch {
      onError(`HTTP ${response.status}`);
    }
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("No response body");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.type === "agent") {
            onAgent?.(data.agent);
          } else if (data.type === "text") {
            onToken(data.text);
          } else if (data.type === "done") {
            onDone(data.usage);
          } else if (data.type === "error") {
            onError(data.error);
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  } catch (err) {
    if (signal?.aborted) return;
    onError(err instanceof Error ? err.message : "Stream read error");
  } finally {
    reader.releaseLock();
  }
}
