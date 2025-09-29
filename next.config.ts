import type { NextConfig } from "next";
import type { WebpackConfigContext } from 'next/dist/server/config-shared'; // Import WebpackConfigContext

const nextConfig: NextConfig = {
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