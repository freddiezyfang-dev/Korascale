'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { PlanningSectionNew } from '@/components/sections';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

// 使用本地图片资源
const imgHeroBanner = "/images/hero/slide5-chongqing.jpg";
const imgJourney1 = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgJourney2 = "/images/journey-cards/leshan-giant-buddha.jpg";
const imgJourney3 = "/images/journey-cards/ancient-dujiangyan-irrigation.jpg";
const imgJourney4 = "/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg";
const imgJourney5 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg";
const imgJourney6 = "/images/journey-cards/chongqing-cyber-city.jpg";
const imgJourney7 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg";

// 旅程数据 - 匹配Figma设计中的6个旅程卡片
const defaultJourneys = [
	{
		id: 1,
		title: "Chengdu Deep Dive",
		description: "Designed for food and culture enthusiasts. Visit the Panda Base in the morning, then head to the Sichuan Cuisine Museum for a hands-on experience with snack making and tasting. In the afternoon, enjoy a face-changing performance of Sichuan Opera. The day concludes with a classic Chengdu hot pot dinner, offering a deep dive into Sichuan's culinary and artistic heritage.",
		image: imgJourney1,
		duration: "1 Day",
		price: "From ¥299",
		category: "Food",
		region: "Sichuan",
		link: "/journeys/chengdu-city-one-day-deep-dive"
	},
	{
		id: 2,
		title: "Leshan Giant Buddha Day Trip from Chengdu",
		description: "Visit the world's largest stone Buddha statue, a UNESCO World Heritage Site. Marvel at this 71-meter tall statue carved into the cliff face over 1,200 years ago. Experience the spiritual significance and architectural marvel of ancient Chinese craftsmanship.",
		image: imgJourney2,
		duration: "1 Day",
		price: "From $199",
		category: "Culture & History",
		region: "Sichuan",
		link: "/journeys/leshan-giant-buddha"
	},
	{
		id: 3,
		title: "Full-Day Tour to the Ancient Dujiangyan Irrigation System",
		description: "Explore one of China&apos;s most remarkable engineering achievements, a 2,000-year-old irrigation system that still functions today. Learn about ancient Chinese water management techniques and their impact on Sichuan&apos;s agriculture.",
		image: imgJourney3,
		duration: "1 Day",
		price: "From $179",
		category: "Culture & History",
		region: "Sichuan",
		link: "/journeys/dujiangyan-irrigation"
	},
	{
		id: 4,
		title: "Jiuzhaigou Valley Multi-Color Lake Adventure",
		description: "Discover the stunning natural beauty of Jiuzhaigou's crystal-clear lakes, waterfalls, and colorful forests. This UNESCO World Heritage Site offers breathtaking landscapes and unique Tibetan culture experiences.",
		image: imgJourney4,
		duration: "3 Days",
		price: "From $599",
		category: "Adventure",
		region: "Sichuan",
		link: "/journeys/jiuzhaigou-valley"
	},
	{
		id: 5,
		title: "Jiuzhaigou & Huanglong National Parks Tour from Chengdu",
		description: "Experience two of China&apos;s most spectacular natural wonders. Visit the colorful travertine pools of Huanglong and the pristine lakes of Jiuzhaigou, both UNESCO World Heritage Sites.",
		image: imgJourney5,
		duration: "4 Days",
		price: "From $799",
		category: "Adventure",
		region: "Sichuan",
		link: "/journeys/jiuzhaigou-huanglong"
	},
	{
		id: 6,
		title: "The Cyberpunk City: Chongqing Day Tour",
		description: "See the best of Chongqing's magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning. In the afternoon, experience the Liziba Monorail passing through a residential building, ride the Yangtze River Cableway, and stroll through Longmenhao Old Street. Admire the Hongyadong night view before enjoying a dinner of authentic Chongqing hot pot after a lunch of local noodles. Feel the unique charm of this 8D city.",
		image: imgJourney6,
		duration: "1 Day",
		price: "From $249",
		category: "City",
		region: "Chongqing",
		link: "/journeys/chongqing-city-highlights"
	},
	{
		id: 7,
		title: "Chongqing and Wulong Karst National Park 2-Day Adventure",
		description: "Explore the dramatic karst landscapes of Wulong, famous for its natural bridges and limestone formations. Experience the Three Natural Bridges and Furong Cave, showcasing millions of years of geological evolution.",
		image: imgJourney7,
		duration: "2 Days",
		price: "From $399",
		category: "Adventure",
		region: "Chongqing",
		link: "/journeys/chongqing-wulong-karst"
	}
];

export default function JourneysPage() {
	const { journeys: contextJourneys, isLoading, clearStorageAndReload } = useJourneyManagement();
	
	// 优先使用Context中的journeys数据，如果为空则使用默认数据
	const journeys = contextJourneys.length > 0 ? contextJourneys : defaultJourneys;
	const [selectedRegion, setSelectedRegion] = useState('All');
	const [selectedDuration, setSelectedDuration] = useState('All');
	const [selectedInterest, setSelectedInterest] = useState('All');
	const [selectedMonth, setSelectedMonth] = useState('All');
	const [searchTerm, setSearchTerm] = useState('');

	const categories = [
		'All', 
		// Regions
		'Sichuan', 'Chongqing', 'Qinghai', 'Gansu', 'Xinjiang', 'Shaanxi',
		// Duration
		'1 Day', '2 Days', '3 Days', '4 Days',
		// Interests
		'City', 'Culture & History', 'Food', 'Adventure',
		// Months
		'January', 'February', 'March', 'April', 'May', 'June', 
		'July', 'August', 'September', 'October', 'November', 'December'
	];

	const filteredJourneys = useMemo(() => {
		return journeys.filter(journey => {
			// 安全地检查 status 属性（默认 journeys 可能没有这个属性）
			const isActive = 'status' in journey ? journey.status === 'active' : true;
			const matchesRegion = selectedRegion === 'All' || journey.region === selectedRegion;
			const matchesDuration = selectedDuration === 'All' || journey.duration === selectedDuration;
			const matchesInterest = selectedInterest === 'All' || journey.category === selectedInterest;
			// Note: Month filtering would need additional data in journey objects
			const matchesMonth = selectedMonth === 'All'; // For now, always true
			const matchesSearch = journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
								 journey.description.toLowerCase().includes(searchTerm.toLowerCase());
			return isActive && matchesRegion && matchesDuration && matchesInterest && matchesMonth && matchesSearch;
		});
	}, [journeys, selectedRegion, selectedDuration, selectedInterest, selectedMonth, searchTerm]);

	// 加载状态
	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<Text className="text-gray-600">Loading journeys...</Text>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Hero Section - Figma Design */}
			<div className="relative h-[800px] flex">
				{/* Left Hero Banner */}
				<div className="w-1/2 relative">
					<div 
						className="absolute inset-0 bg-cover bg-center bg-no-repeat"
						style={{ backgroundImage: `url('${imgHeroBanner}')` }}
					/>
					<div className="relative z-10 h-full flex items-center justify-center">
						<div className="text-center text-white">
							<Heading level={1} className="text-6xl lg:text-8xl font-['Montaga'] mb-8 leading-tight">
								Find Your Journey
							</Heading>
							<Text size="xl" className="text-2xl font-['Monda'] mb-8">
								View All Journeys
							</Text>
						</div>
					</div>
				</div>

				{/* Right Content */}
				<div className="w-1/2 bg-[#f5f1e6] flex items-center">
					<Container size="lg" className="py-16">
                        {/* Breadcrumb Navigation */}
                        <Breadcrumb 
                            items={[{ label: 'Home', href: '/' }, { label: 'Journeys' }]}
                            color="#000000"
                            fontFamily="Montserrat, sans-serif"
                            sizeClassName="text-lg md:text-xl"
                            className="mb-8"
                        />

						{/* Description Text */}
						<Text size="xl" className="text-2xl font-['Montaga'] leading-relaxed tracking-wide">
							Explore our curated collection of journeys across China&apos;s most breathtaking landscapes. 
							Whether you seek cultural immersion, culinary delights, or outdoor adventure, use the 
							filters to discover your dream itinerary. Let your journey of a lifetime start now.
						</Text>
					</Container>
				</div>
			</div>

			{/* Recommended Journeys Section */}
			<div className="bg-[#1e3b32] py-16">
				<Container size="xl">
					<h2 className="text-4xl font-['Montaga'] text-center mb-16" style={{ color: '#ffffff' }}>
						Recommended Journeys
					</h2>
					
					<div className="space-y-8">
						{/* Filter featured journeys - take first 3 featured active journeys */}
						{journeys.filter(j => {
							const isFeatured = 'featured' in j ? j.featured : false;
							const isActive = 'status' in j ? j.status === 'active' : true;
							return isFeatured && isActive;
						}).slice(0, 3).map((journey) => (
							<div key={journey.id} className="bg-white rounded-lg overflow-hidden shadow-lg">
								<div className="flex">
									<div className="w-1/2">
										<div 
											className="h-[400px] bg-cover bg-center bg-no-repeat"
											style={{ backgroundImage: `url('${journey.image}')` }}
										/>
									</div>
									<div className="w-1/2 p-8">
										<h3 className="text-2xl font-['Montaga'] text-black mb-4">
											{journey.title}
										</h3>
										<p className="text-base font-['Monda'] text-black mb-8 leading-relaxed line-clamp-4">
											{('overview' in journey && journey.overview?.description) 
												|| ('shortDescription' in journey && journey.shortDescription) 
												|| journey.description}
										</p>
										<Link href={('slug' in journey && journey.slug) 
											? `/journeys/${journey.slug}` 
											: ('link' in journey && journey.link) 
												? journey.link 
												: '#'}>
											<Button variant="primary" className="text-xl font-['Monda']">
												View Details
											</Button>
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>
				</Container>
			</div>

			{/* Filter and Results Section */}
			<div className="bg-[#f5f1e6] py-16">
				<Container size="xl">
					<div className="flex gap-8">
						{/* Filter Sidebar */}
						<div className="w-80 flex-shrink-0">
							<div className="bg-white rounded-lg p-6 shadow-lg">
								<h3 className="text-2xl font-['Monda'] font-bold mb-6">Filter</h3>
								
								{/* Regions Filter */}
								<div className="mb-8">
									<h4 className="text-xl font-['Monda'] font-bold mb-4">REGIONS</h4>
									<div className="flex flex-wrap gap-2">
										{['All', 'Sichuan', 'Chongqing', 'Qinghai', 'Gansu', 'Xinjiang', 'Shaanxi'].map((region) => (
											<button
												key={region}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedRegion === region ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedRegion === region ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedRegion(region)}
											>
												{region}
											</button>
										))}
									</div>
								</div>

								{/* Duration Filter */}
								<div className="mb-8">
									<h4 className="text-xl font-['Monda'] font-bold mb-4">DURATION</h4>
									<div className="flex flex-wrap gap-2">
										{['All', '1 Day', '2 Days', '3 Days', '4 Days'].map((duration) => (
											<button
												key={duration}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedDuration === duration ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedDuration === duration ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedDuration(duration)}
											>
												{duration}
											</button>
										))}
									</div>
								</div>

								{/* Interests Filter */}
								<div className="mb-8">
									<h4 className="text-xl font-['Monda'] font-bold mb-4">INTERESTS</h4>
									<div className="flex flex-wrap gap-2">
										{['All', 'City', 'Culture & History', 'Food', 'Adventure'].map((interest) => (
											<button
												key={interest}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedInterest === interest ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedInterest === interest ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedInterest(interest)}
											>
												{interest}
											</button>
										))}
									</div>
								</div>

								{/* Months Filter */}
								<div className="mb-8">
									<h4 className="text-xl font-['Monda'] font-bold mb-4">MONTHS</h4>
									<div className="flex flex-wrap gap-2">
										{['All', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month) => (
											<button
												key={month}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedMonth === month ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedMonth === month ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedMonth(month)}
											>
												{month}
											</button>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Results Section */}
						<div className="flex-1">
							<h2 className="text-3xl font-['Montaga'] mb-8">See Where We Can Take You</h2>
							
							{/* Search Bar */}
							<div className="mb-8">
								<input
									type="text"
									placeholder="Search journeys..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>

							{/* Journey Cards Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{filteredJourneys.map((journey) => (
									<Card key={journey.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
										<div 
											className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
											style={{ backgroundImage: `url('${journey.image}')` }}
										/>
										<div className="p-4 bg-[#fff6da] flex flex-col flex-1">
											<h3 className="text-[10px] font-['Montaga'] mb-2 leading-tight flex-shrink-0">
												{journey.title}
											</h3>
											<div className="flex justify-between items-center text-sm text-gray-600 flex-shrink-0">
												<span className="font-['Monda']">{journey.duration}</span>
												<span className="font-['Monda'] font-bold text-primary-600">{journey.price}</span>
											</div>
											<div className="mt-auto pt-3">
												<Link href={`/journeys/${journey.slug}`} className="block">
													<Button variant="outline" size="sm" className="w-full">
														View Details
													</Button>
												</Link>
											</div>
										</div>
									</Card>
								))}
							</div>
						</div>
					</div>
				</Container>
			</div>

			{/* Planning Section */}
			<PlanningSectionNew />
		</div>
	);
}

