import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/drops`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
