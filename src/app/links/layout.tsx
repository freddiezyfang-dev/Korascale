import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KORASCALE | Links & Insights',
  description: 'Discover curated travel insights and featured journeys by Korascale.',
};

export default function LinksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
