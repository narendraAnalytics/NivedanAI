import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'pdf-parse', '@google/adk', '@google/genai', '@react-pdf/renderer'],
};

export default nextConfig;
