"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const checkout = searchParams.get("checkout");
  const plan = searchParams.get("plan") ?? "Pro";

  const [visible, setVisible] = useState(checkout === "success");

  useEffect(() => {
    if (checkout !== "success") return;

    setVisible(true);

    const timer = setTimeout(() => {
      dismiss();
    }, 6000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout]);

  function dismiss() {
    setVisible(false);
    // Strip checkout and plan query params without a full navigation
    const params = new URLSearchParams(searchParams.toString());
    params.delete("checkout");
    params.delete("plan");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex items-start gap-3 bg-emerald-600/90 text-white rounded-xl px-6 py-4 shadow-xl max-w-sm"
    >
      <p className="text-sm font-medium leading-snug flex-1">
        Welcome to Kova {plan}! Your subscription is now active.
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="mt-0.5 flex-shrink-0 text-white/70 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
