import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : '*.supabase.co';

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Activity photos no longer travel in the action body (the browser uploads
      // them straight to Storage), but a long Outcomes document still can — and
      // the location-logo / sub-project-hero forms do still post their image
      // here. Next defaults to 1 MB, which silently failed the whole request.
      // 4 MB stays under Vercel's hard 4.5 MB per-request cap.
      bodySizeLimit: '4mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
