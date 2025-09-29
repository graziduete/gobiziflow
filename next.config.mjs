/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    reactCompiler: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': 'react',
      'react-dom': 'react-dom',
    }
    return config
  },
}

export default nextConfig
