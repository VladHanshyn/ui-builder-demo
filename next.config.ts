import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/phoenix",
        permanent: false,
      },
      {
        source: "/agent",
        destination: "/phoenix",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
