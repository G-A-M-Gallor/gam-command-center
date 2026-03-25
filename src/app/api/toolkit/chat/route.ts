import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Toolkit AI Chat API — /api/toolkit/chat
 *
 * POST — send message to AI for toolkit management
 */

const chatRequestSchema = z.object({
  message: z.string().min(1),
  tools: z.array(z.any()).optional(),
  context: z.literal("toolkit_management").optional()
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, tools = [] } = chatRequestSchema.parse(body);

    // Get current tools from database if not provided
    let currentTools = tools;
    if (currentTools.length === 0) {
      const { data: dbTools } = await supabase
        .from("cc_toolkit")
        .select("*")
        .order("name");
      currentTools = dbTools || [];
    }

    // AI System prompt for toolkit management
    const systemPrompt = `אתה עוזר AI לניהול ארגז הכלים ב-Command Center.
המשתמש יכול לבקש ממך:
1. להוסיף כלי חדש לטבלה
2. לעדכן סטטוס של כלי קיים
3. למחוק כלי
4. להמליץ על כלים
5. לעזור עם התקנה

הכלים הנוכחיים בטבלה:
${currentTools.map(tool =>
  `- ${tool.name} (${tool.category}) - ${tool.status} - ${tool.description || 'ללא תיאור'}`
).join('\n')}

אם המשתמש מבקש לבצע פעולה (הוספה/עדכון/מחיקה), תן תגובה בפורמט הבא:
{
  "response": "תגובה למשתמש בעברית",
  "actions": [
    {
      "type": "add_tool", // או "update_status" או "delete_tool"
      "tool": {
        "name": "שם הכלי",
        "emoji": "🔧",
        "category": "dev",
        "status": "recommended",
        "description": "תיאור הכלי",
        "install_command": "npm install tool-name",
        "link": "https://...",
        "claude_prompt": "prompt for claude",
        "notes": "הערות נוספות"
      }
    }
  ]
}

עבור עדכון סטטוס:
{
  "response": "תגובה למשתמש",
  "actions": [
    {
      "type": "update_status",
      "toolId": "uuid",
      "status": "installed"
    }
  ]
}

עבור מחיקה:
{
  "response": "תגובה למשתמש",
  "actions": [
    {
      "type": "delete_tool",
      "toolId": "uuid"
    }
  ]
}

אם זה רק שאלה או המלצה, תן רק תגובה טקסט פשוטה.

קטגוריות זמינות: download, transcription, ai, dev, media, general
סטטוסים זמינים: installed, recommended, optional

ענה בעברית באופן ידידותי ועוזר.`;

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message
        }
      ]
    });

    let aiResponse = (response.content[0] && 'text' in response.content[0])
      ? response.content[0].text
      : "מצטער, לא הצלחתי לעבד את הבקשה.";
    let actions = [];

    // Try to parse JSON response for actions
    try {
      const parsed = JSON.parse(aiResponse);
      if (parsed.response && parsed.actions) {
        aiResponse = parsed.response;
        actions = parsed.actions;
      }
    } catch {
      // If not JSON, treat as plain text response
    }

    // Execute actions if present
    for (const action of actions) {
      try {
        if (action.type === "add_tool") {
          const { data: newTool, error } = await supabase
            .from("cc_toolkit")
            .insert(action.tool)
            .select()
            .single();

          if (error) {
            console.error("Error creating tool via AI:", error);
            aiResponse += "\n\n⚠️ שגיאה ביצירת הכלי במסד הנתונים.";
          } else {
            aiResponse += `\n\n✅ הכלי "${newTool.name}" נוסף בהצלחה לטבלה.`;
          }
        } else if (action.type === "update_status") {
          const { error } = await supabase
            .from("cc_toolkit")
            .update({ status: action.status, updated_at: new Date().toISOString() })
            .eq("id", action.toolId);

          if (error) {
            console.error("Error updating tool status via AI:", error);
            aiResponse += "\n\n⚠️ שגיאה בעדכון הסטטוס.";
          } else {
            aiResponse += "\n\n✅ הסטטוס עודכן בהצלחה.";
          }
        } else if (action.type === "delete_tool") {
          const { error } = await supabase
            .from("cc_toolkit")
            .delete()
            .eq("id", action.toolId);

          if (error) {
            console.error("Error deleting tool via AI:", error);
            aiResponse += "\n\n⚠️ שגיאה במחיקת הכלי.";
          } else {
            aiResponse += "\n\n✅ הכלי נמחק בהצלחה.";
          }
        }
      } catch (actionError) {
        console.error("Error executing AI action:", actionError);
        aiResponse += "\n\n⚠️ שגיאה בביצוע הפעולה.";
      }
    }

    return NextResponse.json({
      response: aiResponse,
      actions: actions.length > 0 ? actions : undefined
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    console.error("POST /api/toolkit/chat error:", error);
    return NextResponse.json({
      error: "Internal server error",
      response: "מצטער, אירעה שגיאה בשרת. אנא נסה שוב."
    }, { status: 500 });
  }
}