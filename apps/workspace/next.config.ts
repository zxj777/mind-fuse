import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@mind-fuse/editor',
    '@mind-fuse/ai-sdk',
    '@mind-fuse/collaboration-core',
    '@mind-fuse/investigation',
    '@mind-fuse/schema',
    '@mind-fuse/store',
    '@mind-fuse/types',
    '@mind-fuse/validate',
  ],
}

export default nextConfig
