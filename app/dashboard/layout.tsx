import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, plan, username")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-kova-charcoal">
      <Sidebar
        email={profile?.email ?? user.email ?? ""}
        plan={profile?.plan ?? "free"}
      />
      <main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
    </div>
  );
}
