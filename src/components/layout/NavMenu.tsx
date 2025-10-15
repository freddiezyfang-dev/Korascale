"use client";

import Dropdown, { DestinationsDropdown, InspirationsDropdown } from "@/components/ui/Dropdown";
import { useUser } from "@/context/UserContext";

const imgVector = "/icons/user.svg";

export default function NavMenu() {
	const { user, logout } = useUser();
	
	return (
		<nav className="w-full bg-[#f5f1e6] relative z-40" data-name="Navi Bar" data-node-id="819:685">
			<div className="relative mx-auto flex max-w-screen-2xl items-center justify-between px-[50px] py-0 h-[62px]">
				{/* 左侧导航菜单 */}
				<div className="flex items-center gap-[26px] text-[16px] text-black font-[Inknut_Antiqua]">
					<Dropdown
						trigger={
							<a href="/destinations" className="hover:opacity-80 h-[34px] flex items-center">
								Destinations
							</a>
						}
					>
						<DestinationsDropdown />
					</Dropdown>
					<a href="/journeys" className="hover:opacity-80 h-[34px] flex items-center">
						Journeys
					</a>
					<Dropdown
						trigger={
							<a href="/inspirations" className="hover:opacity-80 h-[34px] flex items-center">
								Inspirations
							</a>
						}
					>
						<InspirationsDropdown />
					</Dropdown>
					<a href="/accommodations" className="hover:opacity-80 h-[34px] flex items-center">
						Accommodations
					</a>

				</div>

				{/* 右侧用户区域 */}
				<div className="flex items-center gap-3 h-[52px]">
					<div className="w-[14px] h-[14px] flex items-center justify-center">
						<img src={imgVector} alt="user icon" className="w-full h-full" />
					</div>
					{user ? (
						<div className="flex items-center gap-3">
							<span className="text-[16px] text-black font-[Inknut_Antiqua]">
								Welcome, {user.name}
							</span>
							<button 
								onClick={logout}
								className="text-[16px] text-black font-[Inknut_Antiqua] hover:opacity-80"
							>
								Logout
							</button>
						</div>
					) : (
						<a href="/auth/login" className="text-[16px] text-black font-[Inknut_Antiqua] hover:opacity-80">
							Sign in / Log in
						</a>
					)}
				</div>
			</div>
		</nav>
	);
}
