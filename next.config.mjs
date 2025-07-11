/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/ssr', 'lucide-react']
  }
}

export default nextConfig