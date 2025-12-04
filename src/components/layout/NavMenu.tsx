 "use client";

import Dropdown, { DestinationsDropdown, InspirationsDropdown, JourneysDropdown } from "@/components/ui/Dropdown";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useState } from "react";
import NavSidebar from "./NavSidebar";
import { X } from "lucide-react";

const imgVector = "/icons/user.svg";

export default function NavMenu() {
	const { user, logout } = useUser();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<>
			<nav className="w-full bg-white relative z-40 sticky top-0" data-name="Navi Bar" data-node-id="819:685">
				<div className="relative flex w-full items-center justify-between px-4 sm:px-6 md:px-8 lg:px-[50px] py-0 h-[50px] sm:h-[56px] lg:h-[62px] overflow-x-auto scrollbar-hide">
					{/* 左侧：汉堡 + 桌面导航 */}
					<div className="flex items-center gap-5">
						{/* 汉堡按钮：只在小屏显示 */}
						<button
							type="button"
							className="flex flex-col justify-center gap-1 w-8 h-8"
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

						{/* 桌面端主导航：与之前相同，字体不变，仅 lg 及以上显示 */}
						<div className="hidden lg:flex items-center gap-6 text-sm sm:text-base text-black font-subheading font-semibold shrink-0">
							<Dropdown
								trigger={
									<Link href="/destinations" className="hover:opacity-80 h-[34px] flex items-center">
										Destinations
									</Link>
								}
							>
								<DestinationsDropdown />
							</Dropdown>
							<Dropdown
								trigger={
									<Link href="/journeys" className="hover:opacity-80 h-[34px] flex items-center">
										Journeys
									</Link>
								}
							>
								<JourneysDropdown />
							</Dropdown>
							<Dropdown
								trigger={
									<Link href="/inspirations" className="hover:opacity-80 h-[34px] flex items-center">
										Inspirations
									</Link>
								}
							>
								<InspirationsDropdown />
							</Dropdown>
							<Link href="/accommodations" className="hover:opacity-80 h-[34px] flex items-center">
								Accommodations
							</Link>
						</div>
					</div>

					{/* 右侧用户区域 - 更靠右 */}
					<div className="flex items-center gap-2 sm:gap-3 h-full shrink-0 -mr-2 sm:-mr-4 md:-mr-6 lg:-mr-8">
						<div className="w-3 h-3 sm:w-[14px] sm:h-[14px] flex items-center justify-center flex-shrink-0">
							<img src={imgVector} alt="user icon" className="w-full h-full" />
						</div>
						{user ? (
							<div className="flex items-center gap-2 sm:gap-3 min-w-0">
								<span className="text-xs sm:text-sm lg:text-[16px] text-black font-subheading truncate max-w-[100px] sm:max-w-none">
									<span className="hidden sm:inline">Welcome, </span>{user.name}
								</span>
								<button
									onClick={logout}
									className="text-xs sm:text-sm lg:text-[16px] text-black font-subheading hover:opacity-80 flex-shrink-0 touch-manipulation px-2 py-1"
								>
									Logout
								</button>
							</div>
						) : (
							<Link href="/auth/login" className="text-xs sm:text-sm lg:text-[16px] text-black font-subheading hover:opacity-80 flex-shrink-0 touch-manipulation px-2 py-1 whitespace-nowrap">
								<span className="hidden sm:inline">Sign in / </span>Log in
							</Link>
						)}
					</div>
				</div>
			</nav>

			{/* 动态侧边栏：四个类目 + 子类目，字体与 nav 相同 */}
			<NavSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
		</>
	);
}

