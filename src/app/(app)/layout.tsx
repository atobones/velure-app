import { redirect } from "next/navigation";
import { currentGuest } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await currentGuest())) redirect("/witaj");
  return (
    <>
      <div className="pb-nav">{children}</div>
      <BottomNav />
    </>
  );
}
