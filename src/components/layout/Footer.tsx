const imgLogo = "/logo.png";
const imgScialMedia = "/icons/social-media.svg";

export default function Footer() {
	return (
		<footer className="w-full bg-black text-white" data-name="Footer" data-node-id="771:337">
			<div className="mx-auto flex max-w-screen-2xl gap-[66px] px-[30px] py-[60px]">
				{/* Left Side */}
				<div className="relative w-[705px]">
					<div className="flex items-start gap-3 pl-[33px] pt-[55px]">
						<div className="h-[69px] w-[88px] bg-center bg-cover bg-no-repeat" style={{ backgroundImage: `url('${imgLogo}')` }} />
						<div>
							<div className="text-[24px]">Korascale</div>
							<div className="mt-1 text-[14px]">craft your own Adventure</div>
						</div>
					</div>
					<div className="mt-8 grid grid-cols-2 gap-4 rounded-[5px] bg-transparent px-[34px] py-[25px] w-[394px]">
						<input className="h-[34px] rounded-[5px] bg-white px-3 text-black" placeholder="First Name" />
						<input className="h-[34px] rounded-[5px] bg-white px-3 text-black" placeholder="Last Name" />
						<input className="col-span-2 h-[35px] rounded-[5px] bg-white px-3 text-black" placeholder="E-mail Address" />
						<p className="col-span-2 text-[10px] opacity-80">By entering your email, you agree to our Terms of Use and Privacy Policy, including receipt of emails and promotions</p>
						<button className="justify-self-end h-[28px] w-[95px] rounded-[5px] border border-white text-[10px]">SUBSCRIBE</button>
					</div>
					<div className="mt-6 pl-[60px]">
						<img src={imgScialMedia} alt="social" className="h-[79px] w-[314px]" />
					</div>
				</div>
				{/* Right Side */}
				<div className="flex gap-[66px]">
					<ul className="px-[30px] py-[80px] text-[24px] leading-[37px]">
						<li>support</li>
						<li>FAQ</li>
						<li>Contact</li>
						<li>Terms &amp; Cond.</li>
						<li>Privacy Policy</li>
					</ul>
					<ul className="px-0 py-[76px] text-[24px] leading-[37px]">
						<li>Payment Methode</li>
						<li>Language</li>
						<li>Currency</li>
					</ul>
				</div>
			</div>
		</footer>
	);
}
