import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ignore Emacs lock symlinks (.#filename) that can appear in the project root
  outputFileTracingExcludes: {
    '*': ['.#*'],
  },
};

export default nextConfig;
