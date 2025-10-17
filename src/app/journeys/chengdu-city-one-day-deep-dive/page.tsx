'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { useWishlist } from '@/context/WishlistContext';
import { Heart, MapPin, Clock, Users, Car, Bed, User, Utensils } from 'lucide-react';

// 图片资源 - 使用本地图片
const imgJourneyHeroBanner = "/images/journey-cards/chengdu-daytour/hero-bannner.jpeg";
const imgPandaBase = "/images/journey-cards/chengdu-daytour/panda-base.jpeg";
const imgCuisineMuseum = "/images/journey-cards/chengdu-daytour/cooking-class.jpg";
const imgSichuanOpera = "/images/journey-cards/chengdu-daytour/face-changing-opera.jpg";
const imgCookingClass = "/images/journey-cards/chengdu-daytour/cooking-class.jpg";
const imgTeaCeremony = "/images/journey-cards/chengdu-daytour/face-changing-opera.jpg";
const imgOperaWorkshop = "/images/journey-cards/chengdu-daytour/face-changing-opera.jpg";
const imgHotPot = "/images/journey-cards/chengdu-daytour/hot-pot.png";
const imgItinerary = "/images/journey-cards/chengdu-daytour/itinerary-image.png";
const imgHotel1 = "/images/journey-cards/chengdu-daytour/panda-base.jpeg";
const imgHotel2 = "/images/journey-cards/chengdu-daytour/cooking-class.jpg";
const imgHotel3 = "/images/journey-cards/chengdu-daytour/face-changing-opera.jpg";

// 体验数据
const experiences = [
  {
    id: 'exp-1',
    title: 'Sichuan Cooking Class with Local Market Visit',
    location: 'CHENGDU, SICHUAN',
    image: imgCookingClass,
    price: 'From ¥299',
    duration: '3 Hours',
    description: 'Learn authentic Sichuan cooking techniques from local chefs and visit traditional markets to source fresh ingredients.',
  },
  {
    id: 'exp-2',
    title: 'Traditional Tea Ceremony Experience',
    location: 'CHENGDU, SICHUAN',
    image: imgTeaCeremony,
    price: 'From ¥199',
    duration: '2 Hours',
    description: 'Experience the ancient art of Chinese tea ceremony in a traditional teahouse setting.',
  },
  {
    id: 'exp-3',
    title: 'Sichuan Opera Face-Changing Workshop',
    location: 'CHENGDU, SICHUAN',
    image: imgOperaWorkshop,
    price: 'From ¥399',
    duration: '4 Hours',
    description: 'Learn the secrets of Sichuan opera face-changing technique from professional performers.',
  },
];

// 住宿数据 - 使用真实的成都酒店
const accommodations = [
  {
    id: 'acc-1',
    title: 'Chengdu Tibet Hotel',
    location: 'CHENGDU, SICHUAN',
    image: '/images/hotels/chengdu-tibet-1.png',
    price: 'From ¥899/night',
    rating: 5,
    description: 'Experience traditional Sichuan architecture with modern luxury amenities in the heart of Chengdu.',
  },
  {
    id: 'acc-2',
    title: 'Chengdu Pagoda Hotel',
    location: 'CHENGDU, SICHUAN',
    image: '/images/hotels/chengdu-pagoda-1.png',
    price: 'From ¥599/night',
    rating: 4,
    description: 'A peaceful retreat featuring traditional Chinese gardens and contemporary comfort.',
  },
  {
    id: 'acc-3',
    title: 'Chengdu Wanda Hotel',
    location: 'CHENGDU, SICHUAN',
    image: '/images/hotels/chengdu-wanda-1.png',
    price: 'From ¥399/night',
    rating: 4,
    description: 'Conveniently located with all modern amenities for business and leisure travelers.',
  },
];

export default function ChengduCityOneDayDeepDive() {
  const { toggleWishlist, items } = useWishlist();
  const router = useRouter();
  
  // 酒店详情弹窗状态
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 处理酒店点击
  const handleHotelClick = (accommodation: any) => {
    console.log('Hotel clicked in journey page:', accommodation);
    
    // 转换为HotelDetailModal期望的格式
    const hotelForModal = {
      id: accommodation.id,
      name: accommodation.title,
      location: accommodation.location,
      description: accommodation.description,
      rating: accommodation.rating.toString(),
      images: [accommodation.image],
      roomTypes: [
        {
          name: 'Standard Room',
          description: 'Comfortable room with modern amenities',
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
          price: accommodation.price || '500'
        }
      ]
    };
    
    console.log('Hotel for modal:', hotelForModal);
    setSelectedHotel(hotelForModal);
    setIsModalOpen(true);
  };

  // 关闭酒店详情弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Wishlist Sidebar */}
      <WishlistSidebar />

      {/* Hero Banner */}
      <section className="relative h-[722px] overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${imgJourneyHeroBanner}')` }}
        />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <Heading 
              level={1} 
              className="text-5xl md:text-6xl font-bold mb-6"
              style={{ color: '#ffffff' }}
            >
              Chengdu City One Day Deep Dive
            </Heading>
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center" style={{ color: '#ffffff' }}>
                <div className="text-4xl font-bold">1</div>
                <div className="text-sm">DAYS</div>
              </div>
              <div className="text-center" style={{ color: '#ffffff' }}>
                <div className="text-4xl font-bold">4</div>
                <div className="text-sm">DESTINATIONS</div>
              </div>
              <div className="text-center" style={{ color: '#ffffff' }}>
                <div className="text-4xl font-bold">16</div>
                <div className="text-sm">GUESTS MAX</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wishlist Button - 固定定位跟随屏幕 */}
        <div className="fixed top-6 right-6 z-40">
          <Button
            variant="secondary"
            onClick={toggleWishlist}
            className="flex items-center gap-2 bg-white text-tertiary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Heart className="w-5 h-5" />
            Wishlist ({items.length})
          </Button>
        </div>
      </section>

      {/* Navigation */}
      <nav className="bg-tertiary py-4">
        <Container size="xl">
          <div className="flex justify-center gap-8">
            {[
              { name: 'Overview', href: '#overview' },
              { name: 'Itinerary', href: '#itinerary' },
              { name: 'Stays', href: '#stays' },
              { name: 'Details', href: '#details' }
            ].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-accent transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </Container>
      </nav>

      {/* Journey Overview */}
      <Section id="overview" background="secondary" padding="xl">
        <Container size="xl">
          <div className="flex gap-8 lg:flex-row md:flex-col">
            {/* 左侧内容 */}
            <div className="flex-1">
              {/* 面包屑导航 */}
              <nav className="flex items-center gap-2 text-lg mb-8">
                <Link href="/" className="hover:opacity-80">Home</Link>
                <span>/</span>
                <Link href="/journeys" className="hover:opacity-80">Journey</Link>
                <span>/</span>
                <span>Group Journey</span>
                <span>/</span>
                <span>Chengdu One Day Deep Dive</span>
              </nav>

              {/* 概述文本 */}
              <Text size="xl" className="mb-8 leading-relaxed">
                This one-day tour is specially designed for travelers who wish to deeply experience Chengdu&apos;s culinary charm and traditional culture. The tour combines adorable giant pandas, interactive food experiences, and captivating Sichuan opera, offering a perfect blend of nature, flavor, and art—all in a single fulfilling day.
              </Text>

              {/* 特色亮点 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🐼</span>
                  <div>
                    <Text className="font-medium">Meet the Giant Pandas</Text>
                    <Text size="sm" className="text-gray-600">
                      Get up close with China&apos;s national treasure at the Chengdu Research Base of Giant Panda Breeding.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🥢</span>
                  <div>
                    <Text className="font-medium">Interactive Food Experience</Text>
                    <Text size="sm" className="text-gray-600">
                      Visit the Sichuan Cuisine Museum, where you can learn about and even try making classic local snacks.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <Text className="font-medium">Traditional Sichuan Opera</Text>
                    <Text size="sm" className="text-gray-600">
                      Enjoy an authentic performance featuring face-changing, fire-spitting, and folk music.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🍲</span>
                  <div>
                    <Text className="font-medium">Authentic Hot Pot Dinner</Text>
                    <Text size="sm" className="text-gray-600">
                      Savor a classic Chengdu hot pot meal—a must-try culinary experience.
                    </Text>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👨‍🍳</span>
                  <div>
                    <Text className="font-medium">Hands-On Cultural Activities</Text>
                    <Text size="sm" className="text-gray-600">
                      Engage in workshops such as snack preparation and spice blending for a deeper understanding of Sichuan food culture.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧内容 */}
            <div className="lg:w-96 md:w-full space-y-6">
              {/* Dates and Price */}
              <Card className="p-6">
                <Heading level={3} className="text-lg font-semibold mb-4">
                  Dates & Price
                </Heading>
                
                {/* 发团日期 */}
                <div className="mb-4">
                  <Text className="font-medium text-gray-700 mb-2">Departure Dates</Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <Text size="sm">March 15, 2024</Text>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Available</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <Text size="sm">March 22, 2024</Text>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Available</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <Text size="sm">March 29, 2024</Text>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Fully Booked</span>
                    </div>
                    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                      <Text size="sm">April 5, 2024</Text>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Available</span>
                    </div>
                  </div>
                </div>

                {/* 价格信息 */}
                <div className="mb-4">
                  <Text className="font-medium text-gray-700 mb-2">Price per Person</Text>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Text size="sm">Adult (12+)</Text>
                      <Text className="font-semibold text-primary-600">¥899</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm">Child (3-11)</Text>
                      <Text className="font-semibold text-primary-600">¥599</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm">Infant (0-2)</Text>
                      <Text className="font-semibold text-primary-600">Free</Text>
                    </div>
                  </div>
                </div>

                {/* 包含内容 */}
                <div className="mb-4">
                  <Text className="font-medium text-gray-700 mb-2">What's Included</Text>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Professional English-speaking guide</li>
                    <li>• All entrance fees</li>
                    <li>• Transportation</li>
                    <li>• Lunch and dinner</li>
                    <li>• All activities and materials</li>
                  </ul>
                </div>

                {/* 预订按钮 */}
                <Button 
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white"
                  onClick={() => router.push('/booking/chengdu-deep-dive')}
                >
                  Book Now
                </Button>
              </Card>

              {/* 右侧图片 */}
              <div
                className="h-[400px] lg:h-[600px] bg-center bg-cover bg-no-repeat rounded-lg"
                style={{ backgroundImage: `url('${imgItinerary}')` }}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Itinerary */}
      <Section id="itinerary" background="secondary" padding="xl">
        <Container size="xl">
          <Heading level={2} align="center" className="mb-12">
            Daily Itinerary
          </Heading>

          <div className="space-y-8">
            {/* Day 1 - Morning */}
            <div className="bg-tertiary rounded-lg p-6">
              <div className="flex gap-6 lg:flex-row md:flex-col">
                <div className="flex-1">
                  <Heading level={3} className="text-white mb-4">
                    Visit Chengdu Panda Base
                  </Heading>
                  <Text className="text-gray-300 leading-relaxed">
                    Spend the morning at the world-famous Chengdu Research Base of Giant Panda Breeding. Walk through lush bamboo forests and observe giant pandas and red pandas in habitats designed to mimic their natural environment. Learn about conservation efforts and watch these charismatic animals eat, play, and relax. Don&apos;t miss the chance to take photos and visit the panda nursery if available.
                  </Text>
                </div>
                <div
                  className="w-80 h-48 lg:w-96 lg:h-64 bg-center bg-cover bg-no-repeat rounded-lg flex-shrink-0"
                  style={{ backgroundImage: `url('${imgPandaBase}')` }}
                />
              </div>
            </div>

            {/* Day 1 - Afternoon */}
            <div className="bg-tertiary rounded-lg p-6">
              <div className="flex gap-6 lg:flex-row md:flex-col">
                <div className="flex-1">
                  <Heading level={3} className="text-white mb-4">
                    Explore Sichuan Cuisine Museum + snack tasting & DIY experience
                  </Heading>
                  <Text className="text-gray-300 leading-relaxed">
                    Explore the only museum in the world dedicated to Sichuan cuisine. Participate in interactive exhibits where you can learn about the history, ingredients, and techniques of one of China&apos;s most beloved culinary traditions. Under the guidance of expert chefs, try your hand at making classic snacks such as dandan noodles or spicy wontons. Enjoy tastings of various local flavors and bring home recipes to impress your friends.
                  </Text>
                </div>
                <div
                  className="w-80 h-48 lg:w-96 lg:h-64 bg-center bg-cover bg-no-repeat rounded-lg flex-shrink-0"
                  style={{ backgroundImage: `url('${imgHotPot}')` }}
                />
              </div>
            </div>

            {/* Day 1 - Evening */}
            <div className="bg-tertiary rounded-lg p-6">
              <div className="flex gap-6 lg:flex-row md:flex-col">
                <div className="flex-1">
                  <Heading level={3} className="text-white mb-4">
                    Sichuan Opera Performance at Shufeng Yayuan Theatre
                  </Heading>
                  <Text className="text-gray-300 leading-relaxed">
                    Experience the magic of traditional Sichuan opera, an art form dating back over 300 years. Be amazed by the rapid &quot;face-changing&quot; (bian lian) performance, where performers change colorful masks in the blink of an eye. The show also includes folk music, comedy acts, acrobatics, and fire-spitting. Seating is in first-class section for optimal viewing and cultural immersion.
                  </Text>
                </div>
                <div
                  className="w-80 h-48 lg:w-96 lg:h-64 bg-center bg-cover bg-no-repeat rounded-lg flex-shrink-0"
                  style={{ backgroundImage: `url('${imgSichuanOpera}')` }}
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Add Experiences */}
      <Section background="secondary" padding="xl">
        <Container size="xl">
          <Heading level={2} align="center" className="mb-4">
            ENHANCE YOUR JOURNEY WITH ADD-ON EXPERIENCES
          </Heading>
          <Text align="center" size="lg" className="mb-12 max-w-4xl mx-auto">
            Don&apos;t let any unforgettable moments pass you by—explore all the incredible add-on experiences available for your entire journey. Whether you&apos;re looking to revisit a missed adventure or want a convenient overview of every offering, this is your chance to ensure your trip is packed with every amazing experience possible.
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.id} {...experience} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Add Stay Options */}
      <Section id="stays" background="tertiary" padding="xl">
        <Container size="xl">
          <Heading level={2} align="center" className="mb-4 text-white" style={{ color: '#ffffff' }}>
            YOUR STAY OPTIONS
          </Heading>
          <Text align="center" size="lg" className="mb-12 text-white max-w-4xl mx-auto" style={{ color: '#ffffff' }}>
            Hand Selected for an Unmatched Experience
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {accommodations.map((accommodation) => (
              <AccommodationCard 
                key={accommodation.id} 
                {...accommodation} 
                onClick={() => handleHotelClick(accommodation)}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/accommodations">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-tertiary">
                View More
              </Button>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Inclusions & Offers */}
      <Section id="details" background="secondary" padding="xl">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Inclusions */}
            <div>
              <Heading level={3} className="mb-8">
                Inclusions & Offers
              </Heading>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Car className="w-10 h-10 text-primary-500 flex-shrink-0" />
                  <div>
                    <Text className="font-medium mb-2">Transportation</Text>
                    <Text size="sm" className="text-gray-600">
                      Transportation throughout in private bus. The departure time and meeting point will be arranged by our staff based on your hotel location and schedule.
                    </Text>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Bed className="w-10 h-10 text-primary-500 flex-shrink-0" />
                  <div>
                    <Text className="font-medium mb-2">Accommodation</Text>
                    <Text size="sm" className="text-gray-600">
                      Accommodation is not included in this trip.
                    </Text>
                  </div>
                </div>

                <div className="flex gap-4">
                  <User className="w-10 h-10 text-primary-500 flex-shrink-0" />
                  <div>
                    <Text className="font-medium mb-2">Guide</Text>
                    <Text size="sm" className="text-gray-600">
                      Multilingual local guides are available to serve you.
                    </Text>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Utensils className="w-10 h-10 text-primary-500 flex-shrink-0" />
                  <div>
                    <Text className="font-medium mb-2">Meals</Text>
                    <Text size="sm" className="text-gray-600">
                      Authentic Sichuan cuisine experiences included.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Prices */}
            <div>
              <Heading level={3} className="mb-8">
                Dates & Prices
              </Heading>
              
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center">
                  <Text className="text-2xl font-bold text-primary-600 mb-2">
                    From ¥1,299
                  </Text>
                  <Text className="text-gray-600 mb-4">per person</Text>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <Text>March 2024</Text>
                      <Text className="font-medium">¥1,299</Text>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <Text>April 2024</Text>
                      <Text className="font-medium">¥1,399</Text>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <Text>May 2024</Text>
                      <Text className="font-medium">¥1,499</Text>
                    </div>
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full mt-6"
                    onClick={() => router.push('/booking/chengdu-deep-dive')}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Trips */}
      <Section background="accent" padding="xl">
        <Container size="xl">
          <Heading level={2} align="center" className="mb-12">
            More Sichuan Adventures
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Leshan Giant Buddha Day Trip from Chengdu',
                duration: '1 Day',
                price: 'From ¥599',
                image: '/images/journey-cards/leshan-giant-buddha.jpg',
              },
              {
                title: 'Full-Day Tour to the Ancient Dujiangyan Irrigation System',
                duration: '1 Day',
                price: 'From ¥699',
                image: '/images/journey-cards/ancient-dujiangyan-irrigation.jpg',
              },
              {
                title: 'Jiuzhaigou Valley Multi-Color Lake Adventure',
                duration: '3 Days',
                price: 'From ¥2,999',
                image: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
              },
              {
                title: 'The Cyberpunk City: Chongqing Day Tour',
                duration: '1 Day',
                price: 'From ¥799',
                image: '/images/journey-cards/chongqing-cyber-city.jpg',
              },
            ].map((trip, index) => (
              <Card key={index} className="overflow-hidden p-0 hover:shadow-lg transition-shadow duration-300">
                <div
                  className="h-48 bg-center bg-cover bg-no-repeat"
                  style={{ backgroundImage: `url('${trip.image}')` }}
                />
                <div className="p-4 bg-white">
                  <Text className="font-medium mb-2 line-clamp-2 text-gray-900">
                    {trip.title}
                  </Text>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{trip.duration}</span>
                    <span className="font-medium text-primary-600">{trip.price}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* 酒店详情弹窗 */}
      <HotelDetailModal
        hotel={selectedHotel}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
