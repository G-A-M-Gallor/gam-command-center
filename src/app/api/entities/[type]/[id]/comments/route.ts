import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { commentCreateSchema, commentUpdateSchema, reactionSchema } from "@/lib/api/schemas";
import { logActivityServer } from "@/lib/supabase/activityLogger";
import { notifyUser } from "@/lib/supabase/notifyUser";

/**
 * Entity Comments API — /api/entities/[type]/[id]/comments
 *
 * GET    — list comments for a record (flat list, client builds tree)
 * POST   — create a comment
 * PATCH  — edit comment or add/remove reaction
 * DELETE — soft-delete a comment (author only)
 */

interface RouteContext {
  params: Promise<{ type: string; id: string }>;
}

// ─── GET ──────────────────────────────────────────────────────

export async function GET(_request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recordId } = await context.params;

    const { data, error } = await supabase
      .from("entity_comments")
      .select("*")
      .eq("record_id", recordId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── POST ─────────────────────────────────────────────────────

export async function POST(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, id: recordId } = await context.params;
    const body = await request.json();
    const parsed = commentCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { content, parentId, mentions } = parsed.data;

    // If replying, resolve to root parent (1-level nesting)
    let resolvedParentId = parentId || null;
    if (parentId) {
      const { data: parent } = await supabase
        .from("entity_comments")
        .select("parent_id")
        .eq("id", parentId)
        .single();
      if (parent?.parent_id) {
        resolvedParentId = parent.parent_id; // nest under root
      }
    }

    const { data, error } = await supabase
      .from("entity_comments")
      .insert({
        entity_type: type,
        record_id: recordId,
        user_id: user.id,
        content,
        parent_id: resolvedParentId,
        mentions: mentions || [],
        reactions: {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log to activity feed (fire-and-forget)
    logActivityServer(recordId, 'comment', {
      actorId: user.id,
      noteText: content.slice(0, 200),
    }).catch(() => {});

    // Notify @mentioned users (fire-and-forget)
    if (mentions && mentions.length > 0) {
      const actionUrl = `/dashboard/entities/${type}/${recordId}`;
      Promise.all(
        mentions.map(mentionedUserId =>
          notifyUser({
            userId: mentionedUserId,
            type: 'mention',
            titleHe: `אזכור חדש בתגובה`,
            titleEn: `New mention in a comment`,
            titleRu: `Новое упоминание в комментарии`,
            actionUrl,
          })
        )
      ).catch(() => {});
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── PATCH ────────────────────────────────────────────────────

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await context.params; // consume params
    const body = await request.json();
    const commentId = body.commentId as string;
    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    // Edit comment content
    if (body.content !== undefined) {
      const parsed = commentUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Validation failed" },
          { status: 400 }
        );
      }

      // Only author can edit
      const { data: existing } = await supabase
        .from("entity_comments")
        .select("user_id")
        .eq("id", commentId)
        .single();

      if (!existing || existing.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const { data, error } = await supabase
        .from("entity_comments")
        .update({
          content: parsed.data.content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    // Add/remove reaction
    if (body.emoji !== undefined) {
      const parsed = reactionSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Validation failed" },
          { status: 400 }
        );
      }

      const { emoji, action } = parsed.data;

      const { data: comment } = await supabase
        .from("entity_comments")
        .select("reactions")
        .eq("id", commentId)
        .single();

      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      const reactions = (comment.reactions || {}) as Record<string, string[]>;
      const users = reactions[emoji] || [];

      if (action === "add" && !users.includes(user.id)) {
        reactions[emoji] = [...users, user.id];
      } else if (action === "remove") {
        reactions[emoji] = users.filter(u => u !== user.id);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      }

      const { data, error } = await supabase
        .from("entity_comments")
        .update({ reactions })
        .eq("id", commentId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await context.params; // consume params
    const body = await request.json();
    const commentId = body.commentId as string;
    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    // Only author can delete
    const { data: existing } = await supabase
      .from("entity_comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("entity_comments")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", commentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
