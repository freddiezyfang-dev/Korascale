 "use client";

import Dropdown, {
	DestinationsDropdown,
	InspirationsDropdown,
	JourneysDropdown,
	SolutionsDropdown,
} from "@/components/ui/Dropdown";
import Link from "next/link";
import { useEffect, useState } from "react";
import NavSidebar from "./NavSidebar";
import { X } from "lucide-react";

export default function NavMenu() {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	// 侧栏打开时：标记 html，供 globals 固定绿色 Header；避免仅依赖 sticky（overflow 锁滚动会破坏 sticky）
	useEffect(() => {
		if (isSidebarOpen) {
			document.documentElement.setAttribute("data-sidebar-open", "true");
		} else {
			document.documentElement.removeAttribute("data-sidebar-open");
		}
		return () => {
			document.documentElement.removeAttribute("data-sidebar-open");
		};
	}, [isSidebarOpen]);

	return (
		<>
			{/* Header 与 Nav 在打开侧栏时改为 fixed，用占位撑开文档流，防止主内容上顶 */}
			{isSidebarOpen && (
				<>
					<div
						className="h-[85px] w-full shrink-0 pointer-events-none"
						aria-hidden
					/>
					<div
						className="h-[50px] w-full shrink-0 sm:h-[56px] lg:h-[62px] pointer-events-none"
						aria-hidden
					/>
				</>
			)}
			<nav
				className={
					isSidebarOpen
						? "fixed left-0 right-0 top-[85px] z-[10001] w-full bg-[#F5F2ED] shadow-sm"
						: "sticky top-0 z-50 w-full bg-[#F5F2ED] shadow-sm"
				}
				data-name="Navi Bar"
				data-node-id="819:685"
			>
				<div className="relative flex w-full items-center gap-3 px-4 sm:px-6 md:px-8 lg:px-[50px] py-0 h-[50px] sm:h-[56px] lg:h-[62px]">
					<div className="flex min-w-0 flex-1 items-center gap-5">
						<button
							type="button"
							className="flex shrink-0 flex-col justify-center gap-1 w-8 h-8"
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							aria-label="Open menu"
						>
							{isSidebarOpen ? (
								<X className="w-5 h-5 text-black transition-transform duration-200" />
							) : (
								<>
									<span className="h-[2px] w-5 bg-black rounded-full transition-all duration-200" />
									<span className="h-[2px] w-5 bg-black rounded-full transition-all duration-200" />
									<span className="h-[2px] w-5 bg-black rounded-full transition-all duration-200" />
								</>
							)}
						</button>

						<div className="hidden min-w-0 flex-1 overflow-x-auto scrollbar-hide lg:flex items-center gap-6 text-sm sm:text-base text-black font-subheading font-semibold">
							<Dropdown
								trigger={
									<Link prefetch={true} href="/destinations" className="hover:opacity-80 h-[34px] flex items-center">
										Destinations
									</Link>
								}
							>
								<DestinationsDropdown />
							</Dropdown>
							<Dropdown
								trigger={
									<Link prefetch={true} href="/journeys" className="hover:opacity-80 h-[34px] flex items-center">
										Journeys
									</Link>
								}
							>
								<JourneysDropdown />
							</Dropdown>
							<Dropdown
								trigger={
									<Link prefetch={true} href="/inspirations" className="hover:opacity-80 h-[34px] flex items-center">
										Inspirations
									</Link>
								}
							>
								<InspirationsDropdown />
							</Dropdown>
							<Dropdown
								trigger={
									<Link prefetch={true} href="/solutions" className="hover:opacity-80 h-[34px] flex items-center">
										Solutions
									</Link>
								}
							>
								<SolutionsDropdown />
							</Dropdown>
						</div>
					</div>
				</div>
			</nav>

			<NavSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
		</>
	);
}
