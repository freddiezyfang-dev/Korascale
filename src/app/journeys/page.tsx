'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { PlanTripModal } from '@/components/modals/PlanTripModal';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import type { JourneyType } from '@/types';

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
		category: "Culture",
		region: "South China",
		place: "Sichuan Basin & Mountains",
		link: "/journeys/chengdu-city-one-day-deep-dive",
    journeyType: "Explore Together"
	},
	{
		id: 2,
		title: "Leshan Giant Buddha Day Trip from Chengdu",
		description: "Visit the world's largest stone Buddha statue, a UNESCO World Heritage Site. Marvel at this 71-meter tall statue carved into the cliff face over 1,200 years ago. Experience the spiritual significance and architectural marvel of ancient Chinese craftsmanship.",
		image: imgJourney2,
		duration: "1 Day",
		price: "From $199",
		category: "Culture",
		region: "South China",
		place: "Sichuan Basin & Mountains",
		link: "/journeys/leshan-giant-buddha",
    journeyType: "Explore Together"
	},
	{
		id: 3,
		title: "Full-Day Tour to the Ancient Dujiangyan Irrigation System",
		description: "Explore one of China&apos;s most remarkable engineering achievements, a 2,000-year-old irrigation system that still functions today. Learn about ancient Chinese water management techniques and their impact on Sichuan&apos;s agriculture.",
		image: imgJourney3,
		duration: "1 Day",
		price: "From $179",
		category: "Culture",
		region: "South China",
		place: "Sichuan Basin & Mountains",
		link: "/journeys/dujiangyan-irrigation",
    journeyType: "Explore Together"
	},
	{
		id: 4,
		title: "Jiuzhaigou Valley Multi-Color Lake Adventure",
		description: "Discover the stunning natural beauty of Jiuzhaigou's crystal-clear lakes, waterfalls, and colorful forests. This UNESCO World Heritage Site offers breathtaking landscapes and unique Tibetan culture experiences.",
		image: imgJourney4,
		duration: "3 Days",
		price: "From $599",
		category: "Nature",
		region: "Northwest China",
		place: "Qinghai–Tibet Plateau",
		link: "/journeys/jiuzhaigou-valley",
    journeyType: "Deep Discovery"
	},
	{
		id: 5,
		title: "Jiuzhaigou & Huanglong National Parks Tour from Chengdu",
		description: "Experience two of China&apos;s most spectacular natural wonders. Visit the colorful travertine pools of Huanglong and the pristine lakes of Jiuzhaigou, both UNESCO World Heritage Sites.",
		image: imgJourney5,
		duration: "4 Days",
		price: "From $799",
		category: "Nature",
		region: "Northwest China",
		place: "Qinghai–Tibet Plateau",
		link: "/journeys/jiuzhaigou-huanglong",
    journeyType: "Deep Discovery"
	},
	{
		id: 6,
		title: "The Cyberpunk City: Chongqing Day Tour",
		description: "See the best of Chongqing's magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning. In the afternoon, experience the Liziba Monorail passing through a residential building, ride the Yangtze River Cableway, and stroll through Longmenhao Old Street. Admire the Hongyadong night view before enjoying a dinner of authentic Chongqing hot pot after a lunch of local noodles. Feel the unique charm of this 8D city.",
		image: imgJourney6,
		duration: "1 Day",
		price: "From $249",
		category: "City",
		region: "South China",
		place: "Chongqing & Three Gorges",
		link: "/journeys/chongqing-city-highlights",
    journeyType: "Explore Together"
	},
	{
		id: 7,
		title: "Chongqing and Wulong Karst National Park 2-Day Adventure",
		description: "Explore the dramatic karst landscapes of Wulong, famous for its natural bridges and limestone formations. Experience the Three Natural Bridges and Furong Cave, showcasing millions of years of geological evolution.",
		image: imgJourney7,
		duration: "2 Days",
		price: "From $399",
		category: "Nature",
		region: "South China",
		place: "Chongqing & Three Gorges",
		link: "/journeys/chongqing-wulong-karst",
    journeyType: "Signature Journeys"
	}
];

const journeyTypeOptions: { value: JourneyType; label: string; description: string }[] = [
	{
		value: 'Explore Together',
		label: 'Explore Together',
		description: 'Immersive day experiences and micro adventures designed for quick inspiration.'
	},
	{
		value: 'Deep Discovery',
		label: 'Deep Discovery',
		description: 'Multi-day journeys that dive beneath the surface of local culture, nature, and cuisine.'
	},
	{
		value: 'Signature Journeys',
		label: 'Signature Journeys',
		description: 'Premium, curated expeditions with elevated service, exclusive access, and unforgettable moments.'
	}
];

const defaultJourneyType: JourneyType = 'Explore Together';

// Journey Type 到 Slug 的映射
const JourneyTypeToSlug: Record<JourneyType, string> = {
	'Explore Together': 'explore-together',
	'Deep Discovery': 'deep-discovery',
	'Signature Journeys': 'signature-journeys',
	'Group Tours': 'group-tours'
};

// 获取 Journey Type 的 Slug
const getJourneyTypeSlug = (type: JourneyType): string => {
	return JourneyTypeToSlug[type] || 'explore-together';
};

const resolveJourneyType = (journey: any): JourneyType => {
	if ('journeyType' in journey && journey.journeyType) {
		return journey.journeyType as JourneyType;
	}
	return defaultJourneyType;
};

export default function JourneysPage() {
	const { journeys: contextJourneys, isLoading, clearStorageAndReload } = useJourneyManagement();
	
	// 优先使用Context中的journeys数据，如果为空则使用默认数据
	const journeys = contextJourneys.length > 0 ? contextJourneys : defaultJourneys;
	const [selectedRegion, setSelectedRegion] = useState('All');
	const [selectedDuration, setSelectedDuration] = useState('All');
	const [selectedInterest, setSelectedInterest] = useState('All');
	const [selectedPlace, setSelectedPlace] = useState('All');
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType | 'All'>('All');
	const [isPlanTripModalOpen, setIsPlanTripModalOpen] = useState(false);

	// Region选项
	const regionOptions = [
		'All',
		'Northwest China',
		'Northwest&Northern Frontier',
		'North China',
		'South China',
		'East&Central China'
	];

	// Places选项
	const placeOptions = [
		'All',
		'Tibetan Plateau & Kham Region',
		'Yunnan–Guizhou Highlands',
		'Sichuan Basin & Mountains',
		'Chongqing & Three Gorges',
		'Zhangjiajie',
		'Silk Road Corridor',
		'Qinghai–Tibet Plateau',
		'Xi\'an',
		'Xinjiang Oases & Deserts',
		'Inner Mongolian Grasslands',
		'Beijing',
		'Loess & Shanxi Heritage',
		'Northeastern Forests',
		'Canton',
		'Guilin',
		'Hakka Fujian',
		'Wuhan',
		'Shanghai',
		'WaterTowns',
		'Hangzhou',
		'Yellow Mountain & Southern Anhui'
	];

	const filteredJourneys = useMemo(() => {
		const filtered = journeys.filter(journey => {
			// 安全地检查 status 属性（默认 journeys 可能没有这个属性）
			const isActive = 'status' in journey ? journey.status === 'active' : true;
			const journeyType = resolveJourneyType(journey);
			const matchesJourneyType = selectedJourneyType === 'All' || journeyType === selectedJourneyType;
			const matchesRegion = selectedRegion === 'All' || journey.region === selectedRegion;
			const matchesDuration = selectedDuration === 'All' || journey.duration === selectedDuration;
			const matchesInterest = selectedInterest === 'All' || journey.category === selectedInterest;
			const matchesPlace = selectedPlace === 'All' || ('place' in journey && journey.place && journey.place === selectedPlace);
			const matchesSearch = journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
								 journey.description.toLowerCase().includes(searchTerm.toLowerCase());
			return isActive && matchesJourneyType && matchesRegion && matchesDuration && matchesInterest && matchesPlace && matchesSearch;
		});
		
		// 调试信息：在开发环境中输出
		if (process.env.NODE_ENV === 'development') {
			console.log('Journeys Page Debug:', {
				totalJourneys: journeys.length,
				filteredCount: filtered.length,
				selectedJourneyType,
				selectedRegion,
				selectedDuration,
				selectedInterest,
				searchTerm,
				journeys: journeys.map(j => ({
					id: j.id,
					title: j.title,
					status: 'status' in j ? j.status : 'undefined',
					journeyType: resolveJourneyType(j),
					region: j.region,
					duration: j.duration,
					category: j.category
				}))
			});
		}
		
		return filtered;
	}, [journeys, selectedJourneyType, selectedRegion, selectedDuration, selectedInterest, selectedPlace, searchTerm]);

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
			{/* Plan Your Trip Hero Section - 与其他页面统一 */}
			<Section background="primary" padding="none" className="relative h-[447px] overflow-hidden">
				<div 
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url('/images/planning/ciqikou.jpg')` }}
				/>
				<div className="absolute inset-0 bg-black/20" />
				<div className="relative z-10 h-full flex items-center justify-end">
					<Container size="xl" className="h-full flex items-center justify-end">
						{/* Breadcrumb Navigation */}
						<div className="absolute top-8 left-0 w-full px-4 md:px-8">
							<Breadcrumb 
								items={[{ label: 'Home', href: '/' }, { label: 'Journeys' }]}
								color="#FFFFFF"
								sizeClassName="text-lg md:text-xl"
							/>
						</div>
						
						{/* Text Box Overlay - Right Side - 与其他页面统一 */}
						<div className="bg-tertiary w-[359px] h-[352px] rounded-lg p-8 flex flex-col justify-center">
							<Heading 
								level={2} 
								className="text-4xl font-heading mb-8" 
								style={{ color: '#FFFFFF' }}
							>
								Plan your trip in China with Korascale
							</Heading>
							<Button 
								variant="primary" 
								size="lg" 
								className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-body text-sm hover:bg-white hover:text-tertiary transition-all duration-300"
								onClick={() => setIsPlanTripModalOpen(true)}
							>
								EXPLORE NOW
							</Button>
						</div>
					</Container>
				</div>
			</Section>

			{/* Journey Categories Grid - 4 Cards Layout - 贴近页面边 */}
			<Section background="secondary" padding="none">
				<Container size="full" padding="none" className="py-16 md:py-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
						{/* Explore Together */}
						<Link
							href="/journeys/explore-together"
							className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl block"
						>
							<div className="relative h-[280px] md:h-[320px] lg:h-[357px] rounded-lg overflow-hidden mb-6">
								<img
									src={imgJourney1}
									alt="Explore Together"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
								/>
							</div>
							<div className="text-center px-4">
								<Heading 
									level={3} 
									className="text-xl md:text-2xl font-subheading mb-4" 
									style={{ color: '#000000', fontFamily: 'Montaga, serif' }}
								>
									Explore Together
								</Heading>
								<Text 
									className="text-sm md:text-base leading-relaxed mb-4" 
									style={{ color: '#000000', fontFamily: 'Monda, sans-serif' }}
								>
									Immersive day experiences and micro adventures designed for quick inspiration.
								</Text>
							</div>
						</Link>

						{/* Deep Discovery */}
						<Link
							href="/journeys/deep-discovery"
							className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl block"
						>
							<div className="relative h-[280px] md:h-[320px] lg:h-[357px] rounded-lg overflow-hidden mb-6">
								<img
									src={imgJourney4}
									alt="Deep Discovery"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
								/>
							</div>
							<div className="text-center px-4">
								<Heading 
									level={3} 
									className="text-xl md:text-2xl font-subheading mb-4" 
									style={{ color: '#000000', fontFamily: 'Montaga, serif' }}
								>
									Deep Discovery
								</Heading>
								<Text 
									className="text-sm md:text-base leading-relaxed mb-4" 
									style={{ color: '#000000', fontFamily: 'Monda, sans-serif' }}
								>
									Multi-day journeys that dive beneath the surface of local culture, nature, and cuisine.
								</Text>
							</div>
						</Link>

						{/* Signature Journeys */}
						<Link
							href="/journeys/signature-journeys"
							className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl block"
						>
							<div className="relative h-[280px] md:h-[320px] lg:h-[357px] rounded-lg overflow-hidden mb-6">
								<img
									src={imgJourney5}
									alt="Signature Journeys"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
								/>
							</div>
							<div className="text-center px-4">
								<Heading 
									level={3} 
									className="text-xl md:text-2xl font-subheading mb-4" 
									style={{ color: '#000000', fontFamily: 'Montaga, serif' }}
								>
									Signature Journeys
								</Heading>
								<Text 
									className="text-sm md:text-base leading-relaxed mb-4" 
									style={{ color: '#000000', fontFamily: 'Monda, sans-serif' }}
								>
									Premium, curated expeditions with elevated service, exclusive access, and unforgettable moments.
								</Text>
							</div>
						</Link>

						{/* Group Tours */}
						<Link
							href="/journeys/group-tours"
							className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl block"
						>
							<div className="relative h-[280px] md:h-[320px] lg:h-[357px] rounded-lg overflow-hidden mb-6">
								<img
									src={imgJourney7 || imgJourney1}
									alt="Group Tours"
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
								/>
							</div>
							<div className="text-center px-4">
								<Heading 
									level={3} 
									className="text-xl md:text-2xl font-subheading mb-4" 
									style={{ color: '#000000', fontFamily: 'Montaga, serif' }}
								>
									Group Tours
								</Heading>
								<Text 
									className="text-sm md:text-base leading-relaxed mb-4" 
									style={{ color: '#000000', fontFamily: 'Monda, sans-serif' }}
								>
									Classic group tour routes designed for overseas teams of 30-50 people with dedicated services.
								</Text>
							</div>
						</Link>
					</div>
				</Container>
			</Section>

			{/* Plan Trip Modal */}
			<PlanTripModal 
				isOpen={isPlanTripModalOpen}
				onClose={() => setIsPlanTripModalOpen(false)}
			/>

			{/* Filter and Results Section */}
			<div className="bg-[#f5f1e6] py-16">
				<Container size="full" padding="none" className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
					<div className="flex gap-8">
						{/* Filter Sidebar */}
						<div className="w-80 flex-shrink-0">
							<div className="bg-white rounded-lg p-6 shadow-lg">
								<h3 className="text-2xl font-['Monda'] font-bold mb-6">Filter</h3>
								
								{/* Journey Type Filter */}
								<div className="mb-8">
									<h4 className="text-base font-['Monda'] font-bold mb-4">JOURNEY TYPE</h4>
									<div className="flex flex-wrap gap-2">
										{['All', ...journeyTypeOptions.map(opt => opt.value)].map((type) => (
											<button
												key={type}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedJourneyType === type ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedJourneyType === type ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedJourneyType(type as JourneyType | 'All')}
											>
												{type}
											</button>
										))}
									</div>
								</div>
								
								{/* Regions Filter */}
								<div className="mb-8">
									<h4 className="text-base font-['Monda'] font-bold mb-4">REGIONS</h4>
									<div className="flex flex-wrap gap-2">
										{regionOptions.map((region) => (
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

								{/* Places Filter */}
								<div className="mb-8">
									<h4 className="text-base font-['Monda'] font-bold mb-4">PLACES</h4>
									<div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
										{placeOptions.map((place) => (
											<button
												key={place}
												className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
													selectedPlace === place ? 'bg-gray-200' : 'bg-white'
												}`}
												style={{
													color: 'black',
													backgroundColor: selectedPlace === place ? '#e5e7eb' : 'white'
												}}
												onClick={() => setSelectedPlace(place)}
											>
												{place}
											</button>
										))}
									</div>
								</div>

								{/* Interests Filter - 对应 Journey.category */}
								<div className="mb-8">
									<h4 className="text-base font-['Monda'] font-bold mb-4">INTERESTS</h4>
									<div className="flex flex-wrap gap-2">
										{['All', 'Nature', 'Culture', 'History', 'City', 'Cruises'].map((interest) => (
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

								{/* Duration Filter */}
								<div className="mb-8">
									<h4 className="text-base font-['Monda'] font-bold mb-4">DURATION</h4>
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
								{filteredJourneys.map((journey) => {
									// 获取 maxGuests
									const maxGuests = ('maxGuests' in journey && journey.maxGuests) 
										? journey.maxGuests 
										: ('maxParticipants' in journey && journey.maxParticipants) 
											? journey.maxParticipants 
											: null;
									// 获取价格
									const price = ('price' in journey && typeof journey.price === 'number')
										? `$${journey.price}`
										: ('price' in journey ? journey.price : 'N/A');
									
									// 详情页链接：优先使用 slug，其次使用自带 link，最后退回 /journeys
									const href =
										'slug' in journey && journey.slug
											? `/journeys/${journey.slug}`
											: 'link' in journey && journey.link
												? journey.link
												: '/journeys';
									
									return (
										<Link key={journey.id} href={href} className="block h-full">
											<Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6] cursor-pointer">
												<div 
													className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
													style={{ backgroundImage: `url('${journey.image}')` }}
												/>
												<div className="p-4 flex flex-col flex-1">
													<h3 
														className="text-lg font-['Montaga'] mb-2 leading-tight flex-shrink-0 font-normal"
														style={{ fontWeight: 400 }}
													>
														{journey.title}
													</h3>
													<Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
														{('shortDescription' in journey && journey.shortDescription) ||
															('description' in journey && journey.description) ||
															''}
													</Text>
													<div className="mt-auto flex flex-col flex-shrink-0">
														{/* 第一行：Duration 和 Max Guests */}
														<Text
															className="text-sm mb-1"
															style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
														>
															{journey.duration || 'N/A'}{maxGuests ? ` • Limited to ${maxGuests} guests` : ''}
														</Text>
														{/* 第二行：价格 */}
														<Text
															className="text-sm"
															style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
														>
															{price !== 'N/A' ? `Priced from ${price}` : ''}
														</Text>
													</div>
												</div>
											</Card>
										</Link>
									);
								})}
							</div>
						</div>
					</div>
				</Container>
			</div>

			{/* Plan Your Journey Section */}
			<Section background="primary" padding="none" className="py-12">
				<Container
					size="xl"
					padding="none"
					className="bg-tertiary mx-4 sm:mx-8 lg:mx-20 rounded-lg p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
				>
					<div>
						<Heading
							level={2}
							className="text-2xl sm:text-3xl mb-4"
							style={{ color: '#FFFFFF', fontFamily: 'Montaga, serif' }}
						>
							Plan your journey in China with Korascale
						</Heading>
						<Text
							className="text-sm sm:text-base"
							style={{ color: '#FFFFFF', fontFamily: 'Monda, sans-serif' }}
						>
							Tell us what you are looking for and our team will craft a tailored itinerary that matches your
							interests, timing and budget.
						</Text>
					</div>
					<Button
						variant="primary"
						size="lg"
						className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-body text-sm hover:bg-white hover:text-tertiary transition-all duration-300"
						onClick={() => setIsPlanTripModalOpen(true)}
					>
						PLAN YOUR JOURNEY
					</Button>
				</Container>

				<PlanTripModal isOpen={isPlanTripModalOpen} onClose={() => setIsPlanTripModalOpen(false)} />
			</Section>
		</div>
	);
}

