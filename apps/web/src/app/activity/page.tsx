import { Metadata } from 'next';
import ActivityClient from './ActivityClient';

export const metadata: Metadata = {
  title: 'Activity Feed',
  description: 'Keep track of all missions, join requests, and live activity across your drops.',
  openGraph: {
    title: 'Activity Feed | TapOK',
    description: 'Keep track of all missions, join requests, and live activity across your drops.',
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

export default function ActivityPage() {
  return <ActivityClient />;
}
