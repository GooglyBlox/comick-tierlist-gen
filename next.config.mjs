/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'meo.comick.pictures',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };
  
  export default nextConfig;