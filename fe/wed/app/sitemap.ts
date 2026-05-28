import type { MetadataRoute } from 'next'

const BASE_URL = 'https://service-marketplace-gold.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ['', '/services', '/privacy', '/terms'].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  return [...routes]
}
