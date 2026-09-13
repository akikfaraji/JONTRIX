import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // `next dev --webpack` (the fallback engine `npm run doctor` tests on
  // Android/Termux, where Turbopack's native bundler is the known trouble
  // spot) does not externalize node builtins on its own — this marks the
  // ones the server code uses as externals. Turbopack ignores this block.
  webpack: (config) => {
    config.externals.push(
      (
        ctx: { request?: string },
        callback: (err: null, result?: string) => void,
      ) => {
        const m = ctx.request?.match(/^(?:node:)?(child_process|crypto|fs|path|util|os|stream)$/)
        if (m) return callback(null, `commonjs node:${m[1]}`)
        callback(null)
      },
    )
    return config
  },
};

export default nextConfig;
