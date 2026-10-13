import path from "node:path";
import type { NextConfig } from "next";

/** Static export for Cloudflare Pages: `next build` writes plain HTML/CSS/JS to `out/`. */
const nextConfig: NextConfig = {
	output: "export",
	images: { unoptimized: true },
	outputFileTracingRoot: path.join(__dirname, "../.."),
	transpilePackages: ["@personal-os/tokens"],
};

export default nextConfig;
