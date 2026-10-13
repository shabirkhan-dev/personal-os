import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	outputFileTracingRoot: path.join(__dirname, "../.."),
	transpilePackages: ["@personal-os/tokens"],
};

export default nextConfig;
