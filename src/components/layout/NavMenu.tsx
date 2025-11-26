"use client";

import Dropdown, { DestinationsDropdown, InspirationsDropdown, JourneysDropdown } from "@/components/ui/Dropdown";
import Link from "next/link";
import { useUser } from "@/context/UserContext";

const imgVector = "/icons/user.svg";

export default function NavMenu() {
	const { user, logout } = useUser();
	
	return (
		<nav className="w-full bg-white relative z-40" data-name="Navi Bar" data-node-id="819:685">
			<div className="relative mx-auto flex max-w-screen-2xl items-center justify-between px-4 sm:px-6 md:px-8 lg:px-[50px] py-0 h-[50px] sm:h-[56px] lg:h-[62px] overflow-x-auto scrollbar-hide">
				{/* 左侧导航菜单 */}
				<div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-[26px] text-sm sm:text-base text-black font-subheading shrink-0">
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

				{/* 右侧用户区域 */}
				<div className="flex items-center gap-2 sm:gap-3 h-full shrink-0">
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
	);
}
