import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { NEWS_DIR } from "@/lib/content";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const row = db().prepare("SELECT photo FROM news WHERE id = ?").get(Number((await params).id)) as { photo: string } | undefined;
  if (!row) return new Response("Not found", { status: 404 });
  const file = path.join(NEWS_DIR, path.basename(row.photo));
  if (!fs.existsSync(file)) return new Response("Not found", { status: 404 });
  return new Response(fs.readFileSync(file), {
    headers: { "content-type": MIME[row.photo.split(".").pop() ?? ""] ?? "application/octet-stream", "cache-control": "public, max-age=86400, immutable" },
  });
}
