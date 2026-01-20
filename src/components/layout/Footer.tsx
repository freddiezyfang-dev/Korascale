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
			<div className="mx-auto flex max-w-screen-2xl gap-[66px] px-[30px] py-[60px]">
				{/* Left Side */}
				<div className="relative w-[705px]">
					<div className="flex items-start gap-4 pl-[33px] pt-[55px]">
						{/* Logo 图片 - 添加滤镜处理 */}
						<div className="h-[69px] w-[69px] flex items-center justify-center shrink-0">
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
							<div 
								className="text-[24px] font-serif font-bold tracking-widest"
								style={{ 
									color: '#F5F2E9',
									fontFamily: 'Playfair Display, serif',
									letterSpacing: '0.1em'
								}}
							>
								KORASCALE
							</div>
							<div className="mt-1 text-[14px] font-body" style={{ color: '#F5F2E9' }}>craft your own Adventure</div>
						</div>
					</div>
					<div className="mt-8 grid grid-cols-2 gap-4 rounded-[5px] bg-transparent px-[34px] py-[25px] w-[394px]">
						<input className="h-[34px] rounded-[5px] bg-white px-3 text-black" placeholder="First Name" />
						<input className="h-[34px] rounded-[5px] bg-white px-3 text-black" placeholder="Last Name" />
						<input className="col-span-2 h-[35px] rounded-[5px] bg-white px-3 text-black" placeholder="E-mail Address" />
						<p className="col-span-2 text-[10px] opacity-80">By entering your email, you agree to our Terms of Use and Privacy Policy, including receipt of emails and promotions</p>
						<button className="justify-self-end h-[28px] w-[95px] rounded-[5px] border border-white text-[10px]">SUBSCRIBE</button>
					</div>
					<div className="mt-6 pl-[60px] flex items-center gap-6">
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
				{/* Right Side */}
				<div className="flex gap-[66px]">
					<ul className="px-[30px] py-[80px] text-base leading-relaxed font-body space-y-2">
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
					<ul className="px-0 py-[76px] text-base leading-relaxed font-body space-y-2">
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
