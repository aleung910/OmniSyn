import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', 
  serverExternalPackages: ['@prisma/client', 'tesseract.js', 'sharp'],
};

export default nextConfig;