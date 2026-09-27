import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth";
import Tresci from "./Tresci";

export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await currentStaff();
  if (!s) redirect("/kasa/login");
  if (s.role !== "owner") redirect("/kasa");
  return <Tresci me={s} />;
}
