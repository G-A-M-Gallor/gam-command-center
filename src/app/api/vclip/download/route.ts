import { NextResponse } from "next/server";
import archiver from "archiver";
import path from "path";
import { PassThrough } from "stream";

/**
 * GET /api/vclip/download
 * Generates and serves a ZIP of the vClip Chrome Extension.
 */
export async function GET() {
  try {
    const extensionDir = path.join(process.cwd(), "extensions", "vclip");

    const passThrough = new PassThrough();
    const chunks: Buffer[] = [];

    passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(passThrough);

    // Add all extension files
    archive.directory(extensionDir, "vclip-extension");

    await archive.finalize();

    // Wait for stream to finish
    await new Promise<void>((resolve) => passThrough.on("end", resolve));

    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      _headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=vclip-extension.zip",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    console.error("[vclip/download] Error:", err);
    return NextResponse.json({ error: "Failed to generate ZIP" }, { status: 500 });
  }
}
