import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
