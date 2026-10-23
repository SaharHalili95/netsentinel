/** @type {import('next').NextConfig} */
const isDemo = process.env.NEXT_PUBLIC_DEMO === "1";

// The demo is exported as static files for GitHub Pages; the normal build proxies /api to FastAPI.
const nextConfig = isDemo
  ? {
      output: "export",
      basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      async rewrites() {
        return [{ source: "/api/:path*", destination: "http://localhost:8000/api/:path*" }];
      },
    };

module.exports = nextConfig;
