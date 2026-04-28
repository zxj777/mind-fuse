import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  transpilePackages: ['@mind-fuse/investigation', '@mind-fuse/schema'],
}

export default nextConfig
