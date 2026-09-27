import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth";
import Settings from "./Settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await currentStaff();
  if (!s) redirect("/kasa/login");
  if (s.role !== "owner") redirect("/kasa");
  return <Settings me={s} />;
}
