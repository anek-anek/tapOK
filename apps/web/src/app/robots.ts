import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/profile/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
