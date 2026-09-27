import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CLAIMS_DIR } from "@/lib/claims";
import { requireStaff } from "@/lib/staff-api";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireStaff();
  if (s instanceof NextResponse) return s;
  if (s.role !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const row = db().prepare("SELECT photo FROM claims WHERE id = ?").get(Number((await params).id)) as { photo: string } | undefined;
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const file = path.join(CLAIMS_DIR, path.basename(row.photo));
  if (!fs.existsSync(file)) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(fs.readFileSync(file), { headers: { "content-type": MIME[row.photo.split(".").pop() ?? ""] ?? "application/octet-stream", "cache-control": "private, no-store" } });
}
