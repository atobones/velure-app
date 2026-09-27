import { NextResponse } from "next/server";
import { publicContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const lang = new URL(req.url).searchParams.get("lang") === "en" ? "en" : "pl";
  return NextResponse.json(publicContent(lang));
}
