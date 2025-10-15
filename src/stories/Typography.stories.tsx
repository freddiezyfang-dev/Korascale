import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading, Text } from '@/components/common';

const meta: Meta<typeof Heading> = {
  title: 'Design System/Typography',
  component: Heading,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'body', 'bodyLarge', 'bodySmall',
        'label', 'button', 'link', 'breadcrumb',
        'caption', 'overline'
      ],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'inverse', 'accent', 'success', 'warning', 'error'],
    },
    align: {
      control: { type: 'select' },
      options: ['left', 'center', 'right', 'justify'],
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 标题层级
export const Headings: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h1">Heading 1 - Stay Extraordinary</Typography>
      <Typography variant="h2">Heading 2 - Discover Amazing Places</Typography>
      <Typography variant="h3">Heading 3 - Explore the World</Typography>
      <Typography variant="h4">Heading 4 - Adventure Awaits</Typography>
      <Typography variant="h5">Heading 5 - Travel Guide</Typography>
      <Typography variant="h6">Heading 6 - Quick Tips</Typography>
    </div>
  ),
};

// 正文样式
export const BodyText: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="bodyLarge">
        Large body text - This is perfect for important descriptions and introductory content.
      </Typography>
      <Typography variant="body">
        Regular body text - This is the standard text size for most content on the website.
      </Typography>
      <Typography variant="bodySmall">
        Small body text - This is used for captions, metadata, and secondary information.
      </Typography>
    </div>
  ),
};

// 特殊用途文本
export const SpecialText: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="label">Label Text</Typography>
      <Typography variant="button">Button Text</Typography>
      <Typography variant="link">Link Text</Typography>
      <Typography variant="breadcrumb">Home / Accommodation</Typography>
      <Typography variant="caption">Caption text for images</Typography>
      <Typography variant="overline">OVERLINE TEXT</Typography>
    </div>
  ),
};

// 颜色变体
export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h3" color="primary">Primary Color</Typography>
      <Typography variant="h3" color="secondary">Secondary Color</Typography>
      <Typography variant="h3" color="tertiary">Tertiary Color</Typography>
      <Typography variant="h3" color="accent">Accent Color</Typography>
      <Typography variant="h3" color="success">Success Color</Typography>
      <Typography variant="h3" color="warning">Warning Color</Typography>
      <Typography variant="h3" color="error">Error Color</Typography>
    </div>
  ),
};

// 对齐方式
export const Alignment: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h3" align="left">Left Aligned</Typography>
      <Typography variant="h3" align="center">Center Aligned</Typography>
      <Typography variant="h3" align="right">Right Aligned</Typography>
      <Typography variant="body" align="justify">
        Justified text - Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
        Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
        Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
      </Typography>
    </div>
  ),
};

// 字重
export const FontWeights: Story = {
  render: () => (
    <div className="space-y-4">
      <Typography variant="h3" weight="normal">Normal Weight</Typography>
      <Typography variant="h3" weight="medium">Medium Weight</Typography>
      <Typography variant="h3" weight="semibold">Semibold Weight</Typography>
      <Typography variant="h3" weight="bold">Bold Weight</Typography>
    </div>
  ),
};

// 实际使用示例
export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-4xl space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <Typography variant="h1">Stay Extraordinary</Typography>
        <Typography variant="bodyLarge" color="secondary">
          Discover our curated collection of hotels and guesthouses
        </Typography>
      </div>

      {/* Card Content */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <Typography variant="h3">Chengdu City: One-Day Food & Culture Deep Dive</Typography>
        <Typography variant="body" color="secondary">
          Designed for food and culture enthusiasts. Visit the Panda Base in the morning, 
          then head to the Sichuan Cuisine Museum for a hands-on experience with snack 
          making and tasting. In the afternoon, enjoy a face-changing performance of 
          Sichuan Opera.
        </Typography>
        <div className="flex items-center justify-between">
          <Typography variant="label" color="accent">$299 per night</Typography>
          <Typography variant="button">View Details</Typography>
        </div>
      </div>

      {/* Breadcrumb */}
      <Typography variant="breadcrumb">
        Home / Accommodation / Chengdu
      </Typography>
    </div>
  ),
};




















