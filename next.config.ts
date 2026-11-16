import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.komiku.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.komiku.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "update.komikid.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
