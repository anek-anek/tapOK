import { Metadata } from 'next';
import DiscoverClient from './DiscoverClient';

export const metadata: Metadata = {
  title: 'Discover Missions',
  description: 'Explore the latest public missions, hangouts, and parties across the TapOK grid.',
  openGraph: {
    title: 'Discover Missions | TapOK',
    description: 'Explore the latest public missions, hangouts, and parties across the TapOK grid.',
    images: [
      {
        url: '/tapok-brand.png',
        width: 1200,
        height: 630,
        alt: 'TapOK',
      },
    ],
  },
};

export default function DiscoverPage() {
  return <DiscoverClient />;
}
