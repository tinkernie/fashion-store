import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingRoot: path.resolve(__dirname),
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
      {
        source: "/sitemap.xml",
        destination: "http://127.0.0.1:8000/sitemap.xml",
      },
      {
        source: "/robots.txt",
        destination: "http://127.0.0.1:8000/robots.txt",
      },
    ];
  },
};

export default nextConfig;
