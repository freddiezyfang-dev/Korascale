import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'cream',
          value: '#f5f1e6',
        },
        {
          name: 'dark',
          value: '#1e3b32',
        },
      ],
    },
    docs: {
      toc: true,
    },
  },
  decorators: [
    (Story) => {
      return React.createElement('div', { className: 'min-h-screen bg-white' }, React.createElement(Story));
    },
  ],
};

export default preview;