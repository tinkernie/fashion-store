import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/media_libm/:path*",
        destination: "http://127.0.0.1:8000/media_libm/:path*",
      },
    ];
  },
};

export default nextConfig;
