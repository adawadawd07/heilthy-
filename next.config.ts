import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Without this Next walks up to the home directory looking for a lockfile.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
