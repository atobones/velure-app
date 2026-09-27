import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth";
import KasaApp from "./KasaApp";

export const dynamic = "force-dynamic";

export default async function Kasa() {
  const s = await currentStaff();
  if (!s) redirect("/kasa/login");
  return <KasaApp me={s} />;
}
