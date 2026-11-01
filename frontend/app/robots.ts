import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/folder/',
          '/dashboard',
          '/login',
          '/register',
          '/verify-email',
          '/forgot-password',
          '/reset-password',
          '/claim/verify',
        ],
      },
    ],
    sitemap: 'https://www.bizprimehub.com/sitemap.xml',
  };
}
