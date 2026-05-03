import { Metadata } from 'next';
import { absoluteUrlForMetadata, getApiUrl } from '@/lib/config';
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    // We use a direct fetch here to avoid axios issues in server components if any,
    // and to benefit from Next.js fetch caching.
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/drops/${id}`, { next: { revalidate: 60 } });

    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      return {};
    }

    const drop = await res.json();
    const ogImage = absoluteUrlForMetadata(drop.coverPhoto || '/tapok.png');

    return {
      title: `${drop.name} | TapOK`,
      description: drop.overview || `Join ${drop.name} on TapOK. Orchestrated by ${drop.organiser?.firstName} ${drop.organiser?.lastName}.`,
      openGraph: {
        title: drop.name,
        description: drop.overview || `Join the crew for ${drop.name}.`,
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
        title: drop.name,
        description: drop.overview || `Join the crew for ${drop.name}.`,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for drop:', error);
    return {};
  }
}

export default function DropLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
