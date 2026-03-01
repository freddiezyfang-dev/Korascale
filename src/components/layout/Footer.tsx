import Link from 'next/link';

const imgLogo = "/logo.png";
const imgMail = "/icons/mail.svg";
const imgInstagram = "/icons/instagram.svg";
const imgTiktok = "/icons/tiktok.svg";
const imgGlobe = "/globe.svg";

export default function Footer() {
	return (
		<footer className="w-full bg-black text-white" data-name="Footer" data-node-id="771:337">
			<style dangerouslySetInnerHTML={{__html: `
				footer[data-name="Footer"] a {
					color: #FFFFFF !important;
				}
				footer[data-name="Footer"] a:hover {
					color: rgba(255, 255, 255, 0.8) !important;
				}
			`}} />
			<div className="mx-auto flex flex-col lg:flex-row max-w-screen-2xl gap-8 lg:gap-[66px] w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-[60px]">
				{/* Left Side */}
				<div className="relative w-full lg:max-w-[705px]">
					<div className="flex flex-col sm:flex-row items-start gap-4 sm:pl-6 lg:pl-[33px] pt-6 sm:pt-10 lg:pt-[55px]">
						{/* Logo 图片 - 响应式尺寸 */}
						<div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-[69px] lg:w-[69px] flex items-center justify-center shrink-0">
							<img 
								src={imgLogo} 
								alt="Korascale Logo"
								className="w-full h-full object-contain"
								style={{ 
									filter: 'brightness(0) invert(1)',
									objectFit: 'contain'
								}}
							/>
						</div>
						{/* 品牌名称和副标题 */}
						<div>
							<Link
								href="/"
								className="text-xl sm:text-2xl font-serif font-bold tracking-widest block"
								style={{ 
									color: '#F5F2E9',
									fontFamily: 'var(--font-playfair), Playfair Display, serif',
									letterSpacing: '0.1em'
								}}
							>
								KORASCALE
							</Link>
							<div className="mt-1 text-sm font-body" style={{ color: '#F5F2E9' }}>craft your own Adventure</div>
						</div>
					</div>
					<div className="mt-6 sm:mt-8 grid grid-cols-2 gap-4 rounded-lg bg-transparent w-full max-w-md lg:max-w-[394px] px-4 sm:px-6 lg:px-[34px] py-5 lg:py-[25px]">
						<input className="min-h-[44px] rounded-[5px] bg-white px-3 text-black text-sm" placeholder="First Name" />
						<input className="min-h-[44px] rounded-[5px] bg-white px-3 text-black text-sm" placeholder="Last Name" />
						<input className="col-span-2 min-h-[44px] rounded-[5px] bg-white px-3 text-black text-sm" placeholder="E-mail Address" />
						<p className="col-span-2 text-[10px] opacity-80">By entering your email, you agree to our Terms of Use and Privacy Policy, including receipt of emails and promotions</p>
						<button className="justify-self-end min-h-[44px] px-6 rounded-[5px] border border-white text-[10px] touch-manipulation">SUBSCRIBE</button>
					</div>
					<div className="mt-6 sm:pl-6 lg:pl-[60px] flex items-center gap-6">
						{/* 邮件图标 */}
						<a 
							href="mailto:customer-service@korascale.com" 
							className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img aria-hidden className="block size-full" src={imgMail} alt="Email" />
						</a>
						{/* Instagram图标 */}
						<a 
							href="https://www.instagram.com/korascaletravel/" 
							className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img aria-hidden className="block size-full" src={imgInstagram} alt="Instagram" />
						</a>
						{/* TikTok图标 */}
						<a 
							href="https://www.tiktok.com/@korascale_" 
							className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer"
							target="_blank"
							rel="noopener noreferrer"
						>
							<img aria-hidden className="block size-full" src={imgTiktok} alt="TikTok" />
						</a>
						{/* 语言图标 */}
						<Link 
							href="/language" 
							className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer"
						>
							<img aria-hidden className="block size-full" src={imgGlobe} alt="Language" />
						</Link>
					</div>
				</div>
				{/* Right Side - 移动端垂直堆叠，桌面端横排 */}
				<div className="flex flex-col sm:flex-row gap-8 sm:gap-12 lg:gap-[66px] w-full lg:w-auto">
					<ul className="px-0 sm:px-4 py-6 sm:py-10 lg:px-[30px] lg:py-[80px] text-sm sm:text-base leading-relaxed font-body space-y-2">
						<li>
							<Link href="/support" className="hover:underline transition-all">
								Support
							</Link>
						</li>
						<li>
							<Link href="/faq" className="hover:underline transition-all">
								FAQ
							</Link>
						</li>
						<li>
							<Link href="/contact" className="hover:underline transition-all">
								Contact
							</Link>
						</li>
						<li>
							<Link href="/terms-and-conditions" className="hover:underline transition-all">
								Terms &amp; Conditions
							</Link>
						</li>
						<li>
							<Link href="/privacy-policy" className="hover:underline transition-all">
								Privacy Policy
							</Link>
						</li>
					</ul>
					<ul className="px-0 py-4 sm:py-10 lg:py-[76px] text-sm sm:text-base leading-relaxed font-body space-y-2">
						<li>
							<Link href="/payment-methods" className="hover:underline transition-all">
								Payment Methods
							</Link>
						</li>
						<li>
							<Link href="/language" className="hover:underline transition-all">
								Language
							</Link>
						</li>
						<li>
							<Link href="/currency" className="hover:underline transition-all">
								Currency
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</footer>
	);
}
