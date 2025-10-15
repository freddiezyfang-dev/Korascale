import type { Meta, StoryObj } from '@storybook/nextjs';
import { AccommodationCard } from '@/components/cards/AccommodationCard';

const meta: Meta<typeof AccommodationCard> = {
  title: 'Design System/AccommodationCard',
  component: AccommodationCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical', 'grid'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
    hover: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基础卡片
export const Default: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center',
    imageAlt: 'Chengdu Hotel',
    title: 'Chengdu City: One-Day Food & Culture Deep Dive',
    description: 'Designed for food and culture enthusiasts. Visit the Panda Base in the morning, then head to the Sichuan Cuisine Museum for a hands-on experience with snack making and tasting.',
    price: {
      amount: '$299',
      period: 'per night'
    },
    tags: ['Luxury', 'City Center'],
    rating: 4.8,
    location: 'Chengdu, Sichuan',
    actions: {
      primary: {
        label: 'Book Now',
        href: '/book'
      },
      secondary: {
        label: 'View Details',
        href: '/details'
      }
    }
  },
};

// 水平布局
export const Horizontal: Story = {
  args: {
    ...Default.args,
    variant: 'horizontal',
    size: 'full',
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// 垂直布局
export const Vertical: Story = {
  args: {
    ...Default.args,
    variant: 'vertical',
    size: 'md',
  },
};

// 网格布局
export const Grid: Story = {
  args: {
    ...Default.args,
    variant: 'grid',
    size: 'md',
  },
};

// 不同尺寸
export const Small: Story = {
  args: {
    ...Default.args,
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'lg',
  },
};

// 带悬停效果
export const WithHover: Story = {
  args: {
    ...Default.args,
    hover: true,
  },
};

// 无操作按钮
export const WithoutActions: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center',
    imageAlt: 'Chongqing Hotel',
    title: 'Chongqing City Highlights Day Tour',
    description: 'See the best of Chongqing\'s magical and retro vibes in one day. Explore the ancient Ciqikou Old Town in the morning.',
    price: {
      amount: '$199',
      period: 'per night'
    },
    tags: ['Budget', 'Historic'],
    rating: 4.5,
    location: 'Chongqing',
  },
};

// 无价格信息
export const WithoutPrice: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&crop=center',
    imageAlt: 'Jiuzhaigou Hotel',
    title: 'Jiuzhaigou, Panda & Zhongzhagou 4-Days In-Depth Tour',
    description: 'A 4-day deep dive into Jiuzhaigou and its surrounding secrets. Beyond the main parks, this tour includes a visit to the Jiawu Hai Panda Garden.',
    tags: ['Adventure', 'Nature'],
    rating: 4.9,
    location: 'Jiuzhaigou, Sichuan',
    actions: {
      primary: {
        label: 'Learn More',
        href: '/learn'
      }
    }
  },
};

// 卡片网格
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AccommodationCard
        variant="grid"
        image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center"
        imageAlt="Chengdu Hotel"
        title="Chengdu Deep Dive"
        description="Experience the authentic culture and cuisine of Chengdu."
        price={{ amount: '$299', period: 'per night' }}
        tags={['Luxury', 'City Center']}
        rating={4.8}
        location="Chengdu, Sichuan"
        actions={{
          primary: { label: 'Book Now', href: '/book' }
        }}
      />
      <AccommodationCard
        variant="grid"
        image="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center"
        imageAlt="Chongqing Hotel"
        title="Chongqing City Highlights"
        description="Discover the cyberpunk city with its unique architecture."
        price={{ amount: '$199', period: 'per night' }}
        tags={['Budget', 'Historic']}
        rating={4.5}
        location="Chongqing"
        actions={{
          primary: { label: 'View Details', href: '/details' }
        }}
      />
      <AccommodationCard
        variant="grid"
        image="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&crop=center"
        imageAlt="Jiuzhaigou Hotel"
        title="Jiuzhaigou Adventure"
        description="Explore the stunning natural beauty of Jiuzhaigou Valley."
        price={{ amount: '$399', period: 'per night' }}
        tags={['Adventure', 'Nature']}
        rating={4.9}
        location="Jiuzhaigou, Sichuan"
        actions={{
          primary: { label: 'Book Now', href: '/book' }
        }}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};




















