import { NextResponse } from "next/server";

/**
 * MCP Resources API — /api/mcp/list-resources
 * Returns mock MCP resources for discovery - in real implementation this would call MCP servers
 */

export async function POST() {
  try {
    // Mock MCP resources based on available servers
    const resources = [
      // Firebase
      { name: "app_id_guide", server: "firebase", uri: "firebase://guides/app_id" },
      { name: "crashlytics_guide", server: "firebase", uri: "firebase://guides/crashlytics" },

      // NotebookLM
      { name: "notebook_library", server: "notebooklm", uri: "notebooklm://library" },

      // Claude.ai servers
      { name: "sheet_music_ui", server: "claude.ai Play Sheet Music", uri: "ui://sheet-music/mcp-app.html" },
      { name: "mermaid_widget", server: "claude.ai Mermaid Chart", uri: "ui://widget/claude-e9f9.html" },
      { name: "make_guidelines", server: "claude.ai Make", uri: "file://static/modules-as-tools-usage-guidelines.md" },
      { name: "canva_search", server: "claude.ai Canva", uri: "ui://canva/search-designs" },
      { name: "canva_generate", server: "claude.ai Canva", uri: "ui://canva/generate-designs" }
    ];

    return NextResponse.json(resources);
  } catch (error) {
    console.error("MCP resources error:", error);
    return NextResponse.json({ error: "Failed to fetch MCP resources" }, { status: 500 });
  }
}