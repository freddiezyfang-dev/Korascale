import { Container, Section, Heading, Text } from '@/components/common';

// 灵感分类数据
const inspirations = [
  {
    id: 1,
    title: "Food Journey",
    image: "/images/journey-cards/food-tour.jpg",
    description: "美食之旅"
  },
  {
    id: 2,
    title: "Great Outdoors",
    image: "/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg",
    description: "户外探险"
  },
  {
    id: 3,
    title: "Spiritual Retreat",
    image: "/images/journey-cards/tibet-buddhist-journey.jpg",
    description: "精神静修"
  }
];

export default function InspirationsSection() {
  return (
    <Section background="secondary" padding="xl" className="py-24">
      <Container size="xl">
        <div className="text-center mb-8">
          <Text className="text-2xl font-body mb-4">Inspirations</Text>
          <Heading level={2} className="text-5xl font-heading">
            How do you want to travel
          </Heading>
        </div>

        <div className="bg-tertiary p-9 rounded-lg">
          <div className="flex gap-9 justify-center">
            {inspirations.map((inspiration) => (
              <div key={inspiration.id} className="relative w-[389px] h-[672px] overflow-hidden rounded-lg group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <img
                  src={inspiration.image}
                  alt={inspiration.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex flex-col justify-end p-8 transition-all duration-300">
                  <Heading 
                    level={3} 
                    className="text-4xl font-subheading text-white text-center mb-8 group-hover:text-yellow-300 transition-colors duration-300" 
                    style={{ color: '#FFFFFF' }}
                  >
                    {inspiration.title}
                  </Heading>
                  <button 
                    className="text-sm font-body text-white underline hover:no-underline mx-auto group-hover:text-yellow-300 transition-colors duration-300" 
                    style={{ color: '#FFFFFF' }}
                  >
                    VIEW MORE
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <button className="text-2xl font-body text-neutral-100 underline hover:no-underline hover:text-white transition-colors duration-300">
              VIEW ALL INSPIRATION
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

