import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Safe columns only — never select whatsapp_token here.
  const { data: dealer } = await supabase
    .from("dealers")
    .select("id, dealer_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      dealerId={user.id}
      dealerName={dealer?.dealer_name ?? "Your Dealership"}
      email={user.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}
