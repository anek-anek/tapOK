import { Metadata } from 'next';
import DropsClient from './DropsClient';

export const metadata: Metadata = {
  title: 'Your Drops',
  description: 'Manage your drops, join a crew, and keep the log in one place.',
  openGraph: {
    title: 'Your Drops | TapOK',
    description: 'Manage your drops, join a crew, and keep the log in one place.',
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

export default function DropsPage() {
  return <DropsClient />;
}
