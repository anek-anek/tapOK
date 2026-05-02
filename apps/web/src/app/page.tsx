import { Metadata } from 'next';
import LandingClient from './LandingClient';

export const metadata: Metadata = {
  title: 'TapOK — Orchestrate Your Mission',
  description: 'TapOk is where a plan becomes real. Orchestrate drops, board your crew, and keep the log in one place.',
  openGraph: {
    title: 'TapOK — Orchestrate Your Mission',
    description: 'TapOk is where a plan becomes real. Orchestrate drops, board your crew, and keep the log in one place.',
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

export default function Home() {
  return <LandingClient />;
}
