import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutSuccessToast } from "@/components/dashboard/checkout-success-toast";
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-kova-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
      >
        Skip to content
      </a>
      <Sidebar
        email={profile?.email ?? user.email ?? ""}
        plan={profile?.plan ?? "free"}
      />
      <main id="main-content" className="flex-1 p-6 md:p-8 overflow-auto">
        {children}
      </main>
      <Suspense fallback={null}>
        <CheckoutSuccessToast />
      </Suspense>
    </div>
  );
}
