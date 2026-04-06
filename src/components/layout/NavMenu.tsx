 "use client";

import Dropdown, {
	DestinationsDropdown,
	InspirationsDropdown,
	JourneysDropdown,
	SolutionsDropdown,
} from "@/components/ui/Dropdown";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useLoginModal } from "@/context/LoginModalContext";
import { useEffect, useState } from "react";
import NavSidebar from "./NavSidebar";
import { X } from "lucide-react";

const imgVector = "/icons/user.svg";

export default function NavMenu() {
	const { user, logout } = useUser();
	const { openLoginModal } = useLoginModal();
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
				{/*
					布局说明：左侧用 flex-1 min-w-0 承接「汉堡 + 链接」，链接区再 overflow-x-auto。
					避免整行 justify-between 时左侧被压缩导致中间某项（如 Solutions）被裁掉却看不到横向滚动。
				*/}
				<div className="relative flex w-full items-center justify-between gap-3 px-4 sm:px-6 md:px-8 lg:px-[50px] py-0 h-[50px] sm:h-[56px] lg:h-[62px]">
					{/* 左侧：汉堡 + 桌面导航（可占满中间空间并在窄屏下横向滚动链接） */}
					<div className="flex min-w-0 flex-1 items-center gap-5">
						{/* 汉堡按钮：只在小屏显示 */}
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

						{/* 桌面端主导航：仅 lg+；min-w-0 + overflow-x-auto 保证多一项时仍可滚动看到 */}
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
							<Link prefetch={true} href="/accommodations" className="hover:opacity-80 h-[34px] flex items-center">
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
							<button
								type="button"
								onClick={openLoginModal}
								className="text-xs sm:text-sm lg:text-[16px] text-black font-subheading hover:opacity-80 flex-shrink-0 touch-manipulation px-2 py-1 whitespace-nowrap bg-transparent border-0 cursor-pointer"
							>
								<span className="hidden sm:inline">Sign in / </span>Log in
							</button>
						)}
					</div>
				</div>
			</nav>

			{/* 动态侧边栏：主类目 + 子类目，字体与 nav 相同 */}
			<NavSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
		</>
	);
}

