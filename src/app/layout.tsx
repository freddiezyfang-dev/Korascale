import type { Metadata, Viewport } from "next";
import "./globals.css";
import "react-quill-new/dist/quill.snow.css";
import Header from "@/components/layout/Header";
import NavMenu from "@/components/layout/NavMenu";
import Footer from "@/components/layout/Footer";
import { WishlistProvider } from "@/context/WishlistContext";
import { UserProvider } from "@/context/UserContext";
import { OrderProvider } from "@/context/OrderContext";
import { OrderManagementProvider } from "@/context/OrderManagementContext";
import { HotelManagementProvider } from "@/context/HotelManagementContext";
import { JourneyManagementProvider } from "@/context/JourneyManagementContext";
import { ExperienceManagementProvider } from "@/context/ExperienceManagementContext";
import { ArticleManagementProvider } from "@/context/ArticleManagementContext";
import { CartProvider } from "@/context/CartContext";

// 暂时移除 next/font/google 以避免 Turbopack 兼容性问题
// 字体通过 globals.css 中的 @import 加载
const geistSans = {
	variable: "--font-geist-sans",
};

const geistMono = {
	variable: "--font-geist-mono",
};

export const metadata: Metadata = {
	title: "Korascale - Craft Your Own Adventure",
	description: "Discover authentic travel experiences in China. From luxury accommodations to curated journeys, explore the heart of Chinese culture and landscapes.",
	keywords: "travel, China, accommodations, journeys, destinations, authentic experiences",
	authors: [{ name: "Korascale Team" }],
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head>
				<link
					href="https://api.mapbox.com/mapbox-gl-js/v3.17.0/mapbox-gl.css"
					rel="stylesheet"
				/>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<UserProvider>
					<OrderManagementProvider>
						<HotelManagementProvider>
							<JourneyManagementProvider>
								<ExperienceManagementProvider>
									<ArticleManagementProvider>
										<WishlistProvider>
											<CartProvider>
												<OrderProvider>
													<Header />
													<NavMenu />
													{children}
													<Footer />
												</OrderProvider>
											</CartProvider>
										</WishlistProvider>
									</ArticleManagementProvider>
								</ExperienceManagementProvider>
							</JourneyManagementProvider>
						</HotelManagementProvider>
					</OrderManagementProvider>
				</UserProvider>
			</body>
		</html>
	);
}
