/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/ssr', 'lucide-react', 'stream-chat-react']
  },
  images: {
    formats: ['image/avif', 'image/webp']
  }
}

export default nextConfig