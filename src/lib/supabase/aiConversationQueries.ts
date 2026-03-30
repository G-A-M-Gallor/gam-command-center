import { _createClient } from "@/lib/supabase/client";

export interface AIConversation {
  id: string;
  project_id?: string | null;
  model: string;
  mode: string;
  messages: { role: "user" | "assistant"; content: string; timestamp: number }[];
  title?: string | null;
  total_tokens_input: number;
  total_tokens_output: number;
  created_at: string;
  updated_at: string;
}

export async function saveConversation(conversation: {
  id: string;
  mode: string;
  messages: { role: "_user" | "assistant"; content: string; timestamp: number }[];
  title?: string;
  total_tokens_input?: number;
  total_tokens_output?: number;
}): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("ai_conversations")
      .upsert({
        id: conversation.id,
        mode: conversation.mode,
        messages: conversation.messages,
        title: conversation.title || null,
        total_tokens_input: conversation.total_tokens_input || 0,
        total_tokens_output: conversation.total_tokens_output || 0,
      }, { onConflict: "id" });

    return !error;
  } catch {
    return false;
  }
}

export async function loadConversations(): Promise<AIConversation[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as AIConversation[];
  } catch {
    return [];
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("ai_conversations")
      .delete()
      .eq("id", id);

    return !error;
  } catch {
    return false;
  }
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<AIConversation, "messages" | "title" | "total_tokens_input" | "total_tokens_output">>
): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("ai_conversations")
      .update({
        ...updates,
      })
      .eq("id", id);

    return !error;
  } catch {
    return false;
  }
}
