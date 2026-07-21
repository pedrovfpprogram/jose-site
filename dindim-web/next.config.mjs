// dindim-web/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ajuste para Next.js 15/16+: Encapsular em 'experimental'
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000', 
        'potential-barnacle-5gwrpw7jq7r6cv64v-3000.app.github.dev',
        '*.app.github.dev'
      ]
    }
  },
  
  // Headers de Segurança (Hardening) mantidos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  }
};

export default nextConfig;