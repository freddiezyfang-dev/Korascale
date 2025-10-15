import React from 'react';
import { 
  HeroBanner, 
  AccommodationCard, 
  Typography, 
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle 
} from '@/design-system';

// 使用设计系统重构的住宿页面示例
export default function AccommodationPageExample() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <HeroBanner
        variant="large"
        backgroundImage="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=728&h=800&fit=crop&crop=center"
        title="Stay Extraordinary"
        subtitle="Discover Amazing Places"
        description="Nestled in the heart of western China, Sichuan is a land of breathtaking landscapes, vibrant traditions, and unforgettable flavors."
        primaryAction={{
          label: "View All Stays",
          href: "#accommodations"
        }}
        breadcrumb={{
          items: [
            { label: "Home", href: "/" },
            { label: "Accommodation" }
          ]
        }}
      />

      {/* Recommended Accommodations */}
      <section id="accommodations" className="bg-[#f5f1e6] py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <Typography variant="h2" className="mb-4">
              Discover our curated collection of hotels and guesthouses
            </Typography>
          </div>
          
          {/* 水平滚动卡片 */}
          <div className="flex gap-8 overflow-x-auto pb-8">
            <AccommodationCard
              variant="horizontal"
              image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center"
              imageAlt="Chengdu Hotel"
              title="Chengdu City: One-Day Food & Culture Deep Dive"
              description="Designed for food and culture enthusiasts. Visit the Panda Base in the morning, then head to the Sichuan Cuisine Museum for a hands-on experience with snack making and tasting. In the afternoon, enjoy a face-changing performance of Sichuan Opera."
              price={{ amount: "$299", period: "per night" }}
              tags={["Luxury", "City Center"]}
              rating={4.8}
              location="Chengdu, Sichuan"
              actions={{
                primary: { label: "Book Now", href: "/book" },
                secondary: { label: "View Details", href: "/details" }
              }}
            />
            
            <AccommodationCard
              variant="horizontal"
              image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center"
              imageAlt="Chongqing Hotel"
              title="Chongqing City Highlights Day Tour"
              description="See the best of Chongqing's magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning. In the afternoon, experience the Liziba Monorail passing through a residential building."
              price={{ amount: "$199", period: "per night" }}
              tags={["Budget", "Historic"]}
              rating={4.5}
              location="Chongqing"
              actions={{
                primary: { label: "Book Now", href: "/book" },
                secondary: { label: "View Details", href: "/details" }
              }}
            />
          </div>

          <div className="text-center mt-16">
            <Typography variant="h3">
              Recommended Accommodations
            </Typography>
          </div>
        </div>
      </section>

      {/* Filter and Results Section */}
      <section className="bg-[#f5f1e6] py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8 lg:flex-row md:flex-col flex-col">
            {/* Filter Sidebar */}
            <Card className="w-[340px] lg:w-[340px] md:w-full w-full">
              <CardHeader>
                <CardTitle>REGIONS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 mb-8">
                  {['Sichuan', 'Chongqing', 'Qinghai', 'Gansu', 'Xinjiang', 'Shaanxi'].map((region) => (
                    <Button
                      key={region}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {region}
                    </Button>
                  ))}
                </div>
                
                <CardTitle>Star Rating</CardTitle>
                <div className="space-y-3 mt-4">
                  {['Luxury', 'Upscale', 'Comfortable', 'Guesthouse'].map((rating) => (
                    <Button
                      key={rating}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Results Grid */}
            <div className="flex-1">
              <Typography variant="h3" className="mb-8">
                See Where We Can Take You
              </Typography>
              
              <div className="grid grid-cols-3 gap-6 lg:grid-cols-3 md:grid-cols-2 grid-cols-1">
                {[
                  { 
                    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=308&h=204&fit=crop&crop=center",
                    title: "Chengdu Deep Dive",
                    days: "1 Day"
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=308&h=204&fit=crop&crop=center",
                    title: "Leshan Giant Buddha Day Trip",
                    days: "1 Day"
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=308&h=204&fit=crop&crop=center",
                    title: "Dujiangyan Irrigation System",
                    days: "1 Day"
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=308&h=204&fit=crop&crop=center",
                    title: "Jiuzhaigou Valley Adventure",
                    days: "3 Days"
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=308&h=204&fit=crop&crop=center",
                    title: "Huanglong National Park",
                    days: "4 Days"
                  },
                  { 
                    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=308&h=204&fit=crop&crop=center",
                    title: "Chongqing Cyberpunk Tour",
                    days: "1 Day"
                  }
                ].map((item, index) => (
                  <AccommodationCard
                    key={index}
                    variant="grid"
                    image={item.img}
                    title={item.title}
                    description="Experience the authentic culture and natural beauty of China."
                    price={{ amount: `$${99 + index * 50}`, period: "per person" }}
                    tags={["Adventure", "Culture"]}
                    rating={4.5 + (index * 0.1)}
                    location="Sichuan, China"
                    actions={{
                      primary: { label: "Book Now", href: "/book" }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}




















