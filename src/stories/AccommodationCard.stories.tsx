import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AccommodationCard } from '@/components/cards/AccommodationCard';

const meta: Meta<typeof AccommodationCard> = {
  title: 'Design System/AccommodationCard',
  component: AccommodationCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    rating: {
      control: { type: 'number', min: 0, max: 5, step: 0.1 },
    },
    featured: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基础卡片
export const Default: Story = {
  args: {
    id: '1',
    title: 'Chengdu City: One-Day Food & Culture Deep Dive',
    location: 'Chengdu, Sichuan',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center',
    price: '$299/night',
    rating: 4.8,
    description: 'Designed for food and culture enthusiasts. Visit the Panda Base in the morning, then head to the Sichuan Cuisine Museum for a hands-on experience with snack making and tasting.',
  },
};

// 高评分
export const HighRating: Story = {
  args: {
    ...Default.args,
    rating: 4.9,
    featured: true,
  },
};

// 无价格
export const WithoutPrice: Story = {
  args: {
    id: '2',
    title: 'Chongqing City Highlights Day Tour',
    location: 'Chongqing',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center',
    rating: 4.5,
    description: 'See the best of Chongqing\'s magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning.',
  },
};

// 卡片网格
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AccommodationCard
        id="1"
        title="Chengdu Deep Dive"
        location="Chengdu, Sichuan"
        image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center"
        price="$299/night"
        rating={4.8}
        description="Experience the authentic culture and cuisine of Chengdu."
      />
      <AccommodationCard
        id="2"
        title="Chongqing City Highlights"
        location="Chongqing"
        image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center"
        price="$199/night"
        rating={4.5}
        description="Discover the cyberpunk city with its unique architecture."
      />
      <AccommodationCard
        id="3"
        title="Jiuzhaigou Adventure"
        location="Jiuzhaigou, Sichuan"
        image="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&crop=center"
        price="$399/night"
        rating={4.9}
        description="Explore the stunning natural beauty of Jiuzhaigou Valley."
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};




















