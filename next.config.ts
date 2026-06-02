import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // All business logic in API routes, not RSC data fetching
  // (keeps the architecture native-app-ready per PRD §11)
};

export default nextConfig;
