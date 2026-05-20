import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdf-parse', '@google/adk', '@google/genai'],
};

export default nextConfig;
