import type { Metadata, Viewport } from "next";
import "./globals.css";
import "react-quill-new/dist/quill.snow.css";
import Header from "@/components/layout/Header";
import NavMenu from "@/components/layout/NavMenu";
import NavigationProgress from "@/components/layout/NavigationProgress";
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
import { LoginModalProvider } from "@/context/LoginModalContext";

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

const SITE_URL = "https://www.korascale.com";
const organizationJsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "Korascale",
	url: SITE_URL,
	description:
		"Craft your own adventure in China. Discover authentic travel experiences, curated journeys, and luxury accommodations.",
	sameAs: [],
};
const travelAgencyJsonLd = {
	"@context": "https://schema.org",
	"@type": "TravelAgency",
	name: "Korascale",
	url: SITE_URL,
	description:
		"Korascale designs journeys through a China that is still in motion. Tailored expeditions across borderlands, highlands, and evolving communities.",
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
				<meta
					name="google-site-verification"
					content="3bFOTt6z5dCiVgQPXKRLM87PCf_7rx5jef6XS55MZ4M"
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationJsonLd),
					}}
				/>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(travelAgencyJsonLd),
					}}
				/>
			</head>
			<body className="font-sans antialiased text-gray-900 bg-white">
				<NavigationProgress />
				<UserProvider>
					<OrderManagementProvider>
						<HotelManagementProvider>
							<JourneyManagementProvider>
								<ExperienceManagementProvider>
									<ArticleManagementProvider>
										<WishlistProvider>
											<CartProvider>
												<LoginModalProvider>
													<OrderProvider>
														<Header />
														<NavMenu />
														{children}
														<Footer />
													</OrderProvider>
												</LoginModalProvider>
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
