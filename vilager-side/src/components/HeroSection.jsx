import BackgroundImage from "../assets/hero-forest-BOHvI7_8.jpg";
export function HeroSection() {
	return (
		<section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
			{/* Background Image */}
			<img
				src={BackgroundImage} // 2. เรียกใช้ตัวแปรที่ Import เข้ามา
				alt="ผืนป่าเขียวขจี"
				className="absolute inset-0 w-full h-full object-cover"
				width="1920"
				height="1080"
			/>

			{/* Gradient Overlay (มืดลงนิดหน่อยเพื่อให้ตัวหนังสืออ่านง่าย) */}
			<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

			{/* Content Container */}
			<div className="relative z-10 text-center px-4 max-w-3xl mx-auto flex flex-col items-center">
				{/* Badge สื่อการเรียนรู้ */}
				<div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-md">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-4 w-4 text-green-400"
					>
						<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
						<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
					</svg>
					<span className="text-sm font-medium text-green-100 tracking-wide">
						สื่อการเรียนรู้เพื่อผืนป่าไทย
					</span>
				</div>

				{/* Main Headline */}
				<h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg animate-fade-in-up">
					เรียนรู้ป่า <br className="block sm:hidden" />
					<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300">
						ปกป้องธรรมชาติ
					</span>
				</h1>

				{/* Subtitle */}
				<p
					className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl mx-auto leading-relaxed drop-shadow animate-fade-in-up"
					style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
				>
					แหล่งความรู้เรื่องป่าไม้ ระบบนิเวศ และการอนุรักษ์
					พร้อมระบบแจ้งเตือนภัยพิบัติทางธรรมชาติ
				</p>

				{/* Action Buttons */}
				<div
					className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto animate-fade-in-up"
					style={{ animationDelay: "0.4s", animationFillMode: "forwards" }}
				>
					{/* Primary Button */}
					<a href="#articles" className="w-full sm:w-auto">
						<button className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold px-8 shadow-lg shadow-green-900/50 hover:-translate-y-1 transition-all duration-300">
							อ่านบทความ
						</button>
					</a>

					{/* Alert Button */}
					<a
						href="#alert"
						className="relative flex items-center justify-center group w-full sm:w-auto"
					>
						<span className="absolute inset-0 w-full h-full rounded-full bg-red-500 group-hover:opacity-60 group-hover:animate-ping transition-opacity duration-300"></span>

						<button className="relative w-full inline-flex items-center justify-center gap-2 h-12 rounded-full border-2 border-red-500 bg-black/40 backdrop-blur-sm text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 font-bold px-8 transition-all duration-300">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-4 shrink-0"
							>
								<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
								<path d="M12 9v4"></path>
								<path d="M12 17h.01"></path>
							</svg>
							แจ้งภัยป่า
						</button>
					</a>
				</div>
			</div>

			{/* Scroll Down Indicator */}
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="h-6 w-6 text-white/50 hover:text-white transition-colors cursor-pointer"
				>
					<path d="M12 5v14"></path>
					<path d="m19 12-7 7-7-7"></path>
				</svg>
			</div>
		</section>
	)
}
