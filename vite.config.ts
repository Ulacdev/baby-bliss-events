import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '/api' }, // Keep the /api path as-is
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Pass Authorization header
            const auth = req.headers.authorization || req.headers.Authorization;
            if (auth) {
              proxyReq.setHeader('Authorization', auth);
            }
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', req.url, proxyRes.statusCode);
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err.message, 'for', req.url);
          });
        },
      },
      '/uploads': {
        target: 'http://localhost',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
