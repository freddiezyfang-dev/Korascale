'use client';

import React from 'react';
import { Container, Section, Heading, Text, Button } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
import { useWishlist } from '@/context/WishlistContext';
import { Heart } from 'lucide-react';

// 演示数据
const demoExperiences = [
  {
    id: 'demo-exp-1',
    title: 'Sichuan Cooking Class with Local Market Visit',
    location: 'CHENGDU, SICHUAN',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center',
    price: 'From ¥299',
    duration: '3 Hours',
    description: 'Learn authentic Sichuan cooking techniques from local chefs and visit traditional markets to source fresh ingredients.',
  },
  {
    id: 'demo-exp-2',
    title: 'Traditional Tea Ceremony Experience',
    location: 'CHENGDU, SICHUAN',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center',
    price: 'From ¥199',
    duration: '2 Hours',
    description: 'Experience the ancient art of Chinese tea ceremony in a traditional teahouse setting.',
  },
  {
    id: 'demo-exp-3',
    title: 'Sichuan Opera Face-Changing Workshop',
    location: 'CHENGDU, SICHUAN',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&crop=center',
    price: 'From ¥399',
    duration: '4 Hours',
    description: 'Learn the secrets of Sichuan opera face-changing technique from professional performers.',
  },
];

const demoAccommodations = [
  {
    id: 'demo-acc-1',
    title: 'Luxury Heritage Hotel Chengdu',
    location: 'CHENGDU, SICHUAN',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center',
    price: 'From ¥899/night',
    description: 'Experience traditional Sichuan architecture with modern luxury amenities in the heart of Chengdu.',
  },
  {
    id: 'demo-acc-2',
    title: 'Boutique Garden Hotel',
    location: 'CHENGDU, SICHUAN',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center',
    price: 'From ¥599/night',
    description: 'A peaceful retreat featuring traditional Chinese gardens and contemporary comfort.',
  },
];

export default function WishlistDemoPage() {
  const { toggleWishlist, items } = useWishlist();

  return (
    <div className="min-h-screen bg-white">
      {/* Wishlist Sidebar */}
      <WishlistSidebar />

      {/* Header */}
      <Section background="secondary" padding="lg">
        <Container size="xl">
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="mb-2">
                Wishlist Feature Demo
              </Heading>
              <Text className="text-gray-600">
                Experience adding items to your wishlist
              </Text>
            </div>
            <Button
              variant="secondary"
              onClick={toggleWishlist}
              className="flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              Wishlist ({items.length})
            </Button>
          </div>
        </Container>
      </Section>

      {/* Experiences Section */}
      <Section background="secondary" padding="xl">
        <Container size="xl">
          <Heading level={2} className="mb-8">
            Experience Items
          </Heading>
          <Text className="mb-8 text-gray-600">
            Click &quot;Add to Wishlist&quot; buttons to experience the feature
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoExperiences.map((experience) => (
              <ExperienceCard key={experience.id} {...experience} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Accommodations Section */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          <Heading level={2} className="mb-8 text-white">
            Accommodation Options
          </Heading>
          <Text className="mb-8 text-gray-300">
            Choose your favorite accommodations to add to wishlist
          </Text>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoAccommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} {...accommodation} />
            ))}
          </div>
        </Container>
      </Section>

      {/* Instructions */}
      <Section background="accent" padding="xl">
        <Container size="xl">
          <div className="text-center">
            <Heading level={2} className="mb-6">
              How to Use Wishlist Feature
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">1</span>
                </div>
                <Heading level={3} className="mb-2">Add Items</Heading>
                <Text className="text-gray-600">
                  Click &quot;Add to Wishlist&quot; button on any card
                </Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">2</span>
                </div>
                <Heading level={3} className="mb-2">View List</Heading>
                <Text className="text-gray-600">
                  Click the &quot;Wishlist&quot; button in the top right to open the sidebar
                </Text>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white">3</span>
                </div>
                <Heading level={3} className="mb-2">Manage Items</Heading>
                <Text className="text-gray-600">
                  Remove items or clear the entire list in the sidebar
                </Text>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
