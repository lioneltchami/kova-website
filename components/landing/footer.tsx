const links = {
	Product: [
		{ label: "Docs", href: "/docs" },
		{ label: "GitHub", href: "https://github.com/lioneltchami/kova-cli" },
		{ label: "npm", href: "https://www.npmjs.com/package/kova-cli" },
	],
	Resources: [
		{ label: "Getting Started", href: "/docs/getting-started/installation" },
		{ label: "Commands", href: "/docs/commands/init" },
		{ label: "Guides", href: "/docs/guides/plan-templates" },
	],
	Community: [
		{
			label: "GitHub Discussions",
			href: "https://github.com/lioneltchami/kova-cli/discussions",
		},
		{
			label: "Report Issue",
			href: "https://github.com/lioneltchami/kova-cli/issues",
		},
	],
};

export function Footer() {
	return (
		<footer className="border-t border-white/10 bg-[#0d0d0d] py-16 px-4">
			<div className="mx-auto max-w-6xl">
				<div className="mb-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
					<div className="lg:col-span-1">
						<div className="mb-3 flex items-center gap-2">
							<span className="text-lg font-bold text-white">Kova</span>
						</div>
						<p className="text-sm leading-relaxed text-[#C0C0C8]/60">
							Plan the hunt. Run the pack.
						</p>
						<p className="mt-4 text-xs text-[#C0C0C8]/40">
							Multi-agent AI orchestration for your codebase.
						</p>
					</div>

					{Object.entries(links).map(([group, items]) => (
						<div key={group}>
							<h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#C0C0C8]/60">
								{group}
							</h3>
							<ul className="space-y-3">
								{items.map((item) => (
									<li key={item.label}>
										<a
											href={item.href}
											className="text-sm text-[#C0C0C8]/70 transition-colors hover:text-white"
										>
											{item.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
					<p className="text-xs text-[#C0C0C8]/40">
						MIT License | Built with Next.js
					</p>
					<p className="text-xs text-[#C0C0C8]/40">
						&copy; {new Date().getFullYear()} Kova. Open source and free
						forever.
					</p>
				</div>
			</div>
		</footer>
	);
}
