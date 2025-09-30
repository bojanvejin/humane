import type { NextConfig } from "next";
import type { WebpackConfigContext } from 'next/dist/server/config-shared';

console.log('Current working directory in apps/web/next.config.ts:', process.cwd());

const nextConfig: NextConfig = {
  // Specify the custom build directory for this Next.js app
  distDir: '../../.next/web', // This tells Next.js to output its build artifacts to .next/web at the monorepo root
  // Temporarily remove 'output: standalone' to debug 'scandir' error
  // output: 'standalone', // This is useful for deploying in containerized environments

  webpack: (config: WebpackConfigContext['webpack'], options: WebpackConfigContext) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: "@dyad-sh/nextjs-webpack-component-tagger",
      });
    }
    return config;
  },
};

export default nextConfig;