"use client";

import {
	BarChart3,
	DollarSign,
	LayoutDashboard,
	List,
	Menu,
	Settings,
	Users,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { WolfLogo } from "@/components/landing/wolf-logo";

interface SidebarProps {
	email: string;
	plan: string;
}

const NAV_LINKS = [
	{ href: "/dashboard", label: "Overview", icon: LayoutDashboard },
	{ href: "/dashboard/usage", label: "Usage", icon: List },
	{ href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/dashboard/budget", label: "Budget", icon: DollarSign },
	{ href: "/dashboard/team", label: "Team", icon: Users },
	{ href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const PLAN_LABELS: Record<string, string> = {
	free: "Free",
	pro: "Pro",
	team: "Team",
	enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
	free: "bg-kova-charcoal-light text-kova-silver-dim",
	pro: "bg-kova-blue/20 text-kova-blue",
	team: "bg-purple-900/30 text-purple-400",
	enterprise: "bg-amber-900/30 text-amber-400",
};

export function Sidebar({ email, plan }: SidebarProps) {
	const pathname = usePathname();
	const [mobileOpen, setMobileOpen] = useState(false);

	function isActive(href: string) {
		if (href === "/dashboard") return pathname === "/dashboard";
		return pathname.startsWith(href);
	}

	const sidebarContent = (
		<div className="flex flex-col h-full">
			{/* Logo */}
			<div className="flex items-center gap-3 px-5 py-5 border-b border-kova-border">
				<WolfLogo size={24} />
				<div className="flex flex-col leading-none">
					<span className="text-sm font-bold text-white tracking-widest">
						KOVA
					</span>
					<span className="text-[10px] text-kova-silver-dim tracking-wider uppercase">
						Dashboard
					</span>
				</div>
			</div>

			{/* Nav */}
			<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{NAV_LINKS.map(({ href, label, icon: Icon }) => {
					const active = isActive(href);
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

			{/* User info */}
			<div className="px-4 py-4 border-t border-kova-border">
				<p className="text-xs text-kova-silver truncate mb-2" title={email}>
					{email}
				</p>
				<span
					className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}
				>
					{PLAN_LABELS[plan] ?? "Free"}
				</span>
			</div>
		</div>
	);

	return (
		<>
			{/* Mobile hamburger */}
			<button
				className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-kova-surface border border-kova-border text-kova-silver"
				onClick={() => setMobileOpen((v) => !v)}
				aria-label="Toggle sidebar"
			>
				{mobileOpen ? <X size={18} /> : <Menu size={18} />}
			</button>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className="md:hidden fixed inset-0 z-40 bg-black/60"
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Mobile sidebar */}
			<aside
				className={`md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-kova-surface border-r border-kova-border transform transition-transform duration-200 ${
					mobileOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{sidebarContent}
			</aside>

			{/* Desktop sidebar */}
			<aside className="hidden md:flex flex-col w-64 bg-kova-surface border-r border-kova-border min-h-screen flex-shrink-0">
				{sidebarContent}
			</aside>
		</>
	);
}
