import type {NextConfig} from 'next';

const config: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// This is to allow cross-origin requests in the development environment.
// The web editor is on a different origin than the preview server.
export const allowedDevOrigins = [
  'https://*.cluster-mwsteha33jfdowtvzffztbjcj6.cloudworkstations.dev',
];


export default config;
