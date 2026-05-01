import { Metadata } from 'next';
import { getApiUrl } from '@/lib/config';

type Props = {
  params: Promise<{ joinCode: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { joinCode } = await params;

  try {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/drops/join/${joinCode}`, { next: { revalidate: 60 } });

    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      return {};
    }

    const drop = await res.json();
    const ogImage = drop.coverPhoto || '/tapok.png';

    return {
      title: `Invite: ${drop.name} | TapOK`,
      description: `You are invited to join ${drop.name} on TapOK. Taps in required.`,
      openGraph: {
        title: `Join ${drop.name}`,
        description: `Mission Brief: ${drop.overview || 'Tap in to join the crew.'}`,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: drop.name,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `Join ${drop.name}`,
        description: `You are invited to board the crew for ${drop.name}.`,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for join page:', error);
    return {};
  }
}

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
