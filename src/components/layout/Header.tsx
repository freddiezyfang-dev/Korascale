'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { LoginModal } from '@/components/modals/LoginModal';
import Dropdown from '@/components/ui/Dropdown';
import { UserDropdown } from '@/components/ui/UserDropdown';

// 使用本地图片资源 - 你的logo图片
const imgLogo = "/logo.png"; // 使用你的logo文件
const imgMail = "/icons/mail.svg";
const imgMessageCircle = "/icons/message.svg";
const imgInstagram = "/icons/instagram.svg";
const imgFacebook = "/icons/facebook.svg";
const imgGlobe = "/globe.svg";
const imgSearchOutlined = "/icons/search.svg";
const imgUser = "/icons/user.svg";

function HeaderLeft() {
	return (
		<Link href="/" className="flex items-center gap-2 lg:gap-[19px] h-[85px] overflow-hidden px-px shrink-0 hover:opacity-80 transition-opacity" data-name="Logo" data-node-id="770:178">
			<div className="shrink-0 size-12 lg:size-[80px] flex items-center justify-center" data-name="Logo" data-node-id="770:179">
				<img 
					src={imgLogo} 
					alt="Korascale Logo" 
					className="w-full h-full object-contain"
					style={{ width: '100%', height: '100%', objectFit: 'contain' }}
				/>
			</div>
			<div className="not-italic text-lg lg:text-[24px] !text-white w-[100px] lg:w-[135px] leading-none font-subheading shrink-0" data-node-id="770:180" style={{ color: 'white !important' }}>
				<p className="leading-normal" style={{ color: 'white !important' }}>Korascale</p>
			</div>
		</Link>
	);
}

function UserSection() {
  const { user, logout } = useUser();
  const { addLoginRecord, updateLogoutRecord } = useOrderManagement();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    // 记录登录信息
    if (user) {
      addLoginRecord({
        userId: user.id,
        userEmail: user.email,
        loginAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });
    }
  };

  const handleLogout = () => {
    if (user) {
      updateLogoutRecord(user.id);
    }
    logout();
  };

	return (
		<>
			<div className="flex items-center gap-4">
				{user ? (
					<div className="flex items-center gap-3">
						<Dropdown
							trigger={
								<div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
									<img 
										src={imgUser} 
										alt="User" 
										className="w-5 h-5"
									/>
									<span className="text-white text-sm hidden lg:block">
										{user.name}
									</span>
								</div>
							}
							className="right-0"
						>
							<UserDropdown />
						</Dropdown>
						{user.email === 'admin@korascale.com' && (
							<Link 
								href="/admin"
								className="text-white text-sm hover:text-gray-300 transition-colors bg-white bg-opacity-20 px-3 py-1 rounded"
							>
								Admin
							</Link>
						)}
					</div>
				) : (
					<button
						onClick={() => setIsLoginModalOpen(true)}
						className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
					>
						<img 
							src={imgUser} 
							alt="Login" 
							className="w-5 h-5"
						/>
						<span className="text-sm">Login</span>
					</button>
				)}
			</div>

			<LoginModal
				isOpen={isLoginModalOpen}
				onClose={() => setIsLoginModalOpen(false)}
				onLoginSuccess={handleLoginSuccess}
			/>
		</>
	);
}

function SocialAndSearch() {
	return (
		<div className="flex items-center justify-center gap-4 lg:gap-[35px] overflow-hidden px-4 lg:px-16 py-[25px] shrink-0" data-name="Scial Media" data-node-id="770:181">
			{/* Social Media Icons - Hidden on mobile, visible on desktop */}
			<div className="hidden lg:flex items-center gap-6">
				<div className="shrink-0 size-6" data-name="mail" data-node-id="770:182">
					<img aria-hidden className="block size-full" src={imgMail} alt="Email" />
				</div>
				<div className="shrink-0 size-6" data-name="message-circle" data-node-id="770:185">
					<img aria-hidden className="block size-full" src={imgMessageCircle} alt="Message" />
				</div>
				<div className="shrink-0 size-6" data-name="instagram" data-node-id="770:187">
					<img aria-hidden className="block size-full" src={imgInstagram} alt="Instagram" />
				</div>
				<div className="shrink-0 size-6" data-name="facebook" data-node-id="770:191">
					<img aria-hidden className="block size-full" src={imgFacebook} alt="Facebook" />
				</div>
				<div className="shrink-0 size-6" data-name="globe" data-node-id="770:193">
					<img aria-hidden className="block size-full" src={imgGlobe} alt="Language" />
				</div>
			</div>
			{/* Search Section */}
			<div className="bg-[#1e3b32] flex items-center justify-center overflow-hidden px-4 lg:px-[51px] py-[14px] shrink-0" data-name="Language" data-node-id="770:192">
				<div className="shrink-0 size-6" data-name="SearchOutlined" data-node-id="771:244">
					<img aria-hidden className="block size-full" src={imgSearchOutlined} alt="Search" />
				</div>
				<div className="bg-[#d9d9d9] h-[26px] rounded-[20px] shrink-0 w-[80px] lg:w-[115px]" data-name="Search" data-node-id="770:197" />
			</div>
		</div>
	);
}

export default function Header() {
	return (
		<header className="w-full bg-[#1e3b32] text-white relative z-50" data-name="Header/Main" data-node-id="771:249">
			<div className="flex items-center justify-between lg:gap-[600px] gap-4 px-4 lg:px-[50px] py-0">
				<HeaderLeft />
				<div className="flex items-center gap-4">
					<SocialAndSearch />
					<UserSection />
				</div>
			</div>
		</header>
	);
}
