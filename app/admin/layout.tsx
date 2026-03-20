"use client";

import {
	Building2,
	LayoutDashboard,
	Menu,
	Users,
	Webhook,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WolfLogo } from "@/components/landing/wolf-logo";

const ADMIN_NAV = [
	{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
	{ href: "/admin/users", label: "Users", icon: Users, exact: false },
	{ href: "/admin/orgs", label: "Orgs", icon: Building2, exact: false },
	{ href: "/admin/webhooks", label: "Webhooks", icon: Webhook, exact: false },
];

function AdminSidebar() {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	function isActive(href: string, exact: boolean) {
		if (exact) return pathname === href;
		return pathname.startsWith(href);
	}

	const sidebarContent = (
		<div className="flex flex-col h-full">
			<div className="flex items-center gap-3 px-5 py-5 border-b border-kova-border">
				<WolfLogo size={24} />
				<div className="flex flex-col leading-none">
					<span className="text-sm font-bold text-white tracking-widest">
						KOVA
					</span>
					<span className="text-[10px] text-red-400 tracking-wider uppercase font-semibold">
						Admin
					</span>
				</div>
			</div>

			<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{ADMIN_NAV.map(({ href, label, icon: Icon, exact }) => {
					const active = isActive(href, exact);
					return (
						<Link
							key={href}
							href={href}
							onClick={() => setMobileOpen(false)}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
								active
									? "bg-kova-charcoal-light text-kova-blue"
									: "text-kova-silver-dim hover:text-kova-silver hover:bg-kova-charcoal-light/50"
							}`}
						>
							<Icon size={16} />
							{label}
						</Link>
					);
				})}
			</nav>

			<div className="px-4 py-4 border-t border-kova-border">
				<Link
					href="/dashboard"
					className="text-xs text-kova-silver-dim hover:text-kova-silver transition-colors"
				>
					Back to Dashboard
				</Link>
			</div>
		</div>
	);

	return (
		<>
			<button
				className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-kova-surface border border-kova-border text-kova-silver"
				onClick={() => setMobileOpen((v) => !v)}
				aria-label="Toggle admin sidebar"
			>
				{mobileOpen ? <X size={18} /> : <Menu size={18} />}
			</button>

			{mobileOpen && (
				<div
					className="md:hidden fixed inset-0 z-40 bg-black/60"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			<aside
				className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-kova-surface border-r border-kova-border transform transition-transform duration-200 ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{sidebarContent}
			</aside>

			<aside className="hidden md:flex flex-col w-64 bg-kova-surface border-r border-kova-border min-h-screen flex-shrink-0">
				{sidebarContent}
			</aside>
		</>
	);
}

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen bg-kova-charcoal">
			<AdminSidebar />
			<main className="flex-1 p-6 md:p-8 overflow-auto">{children}</main>
		</div>
	);
}
