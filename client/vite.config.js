import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { compression } from 'vite-plugin-compression2';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = (env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  const proxyTarget = apiBase.startsWith('http') ? apiBase.replace(/\/api$/, '') : 'http://localhost:5000';
  const isBuild = command === 'build';

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            // Remove console.log in production
            ...(mode === 'production' ? [['transform-remove-console', { exclude: ['error', 'warn'] }]] : [])
          ]
        }
      }),
      
      // Gzip + Brotli compression for production
      isBuild && compression({
        algorithms: ['gzip', 'brotliCompress'],
        exclude: [/\.map$/, /\.html$/],
        threshold: 1024,
        deleteOriginalAssets: false
      }),
      
      // PWA / Service Worker for offline caching
      isBuild && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'ORDERLY Mens Wear',
          short_name: 'ORDERLY',
          description: 'Premium Menswear - Shirts, Tees, Denim, Blazers',
          theme_color: '#E50914',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'unsplash-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.orderlymenswear\.in\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                networkTimeoutSeconds: 10,
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.orderlymenswear\.in\/uploads\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'uploads-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                cacheableResponse: { statuses: [0, 200] }
              }
            }
          ]
        },
        devOptions: {
          enabled: true
        }
      }),
      
      // Bundle analyzer (run with ANALYZE=true npm run build)
      isBuild && process.env.ANALYZE && visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // Build optimizations
    build: {
      target: 'es2020',
      minify: 'esbuild',
      cssMinify: true,
      cssCodeSplit: true,
      modulePreload: {
        polyfill: false // Modern browsers support modulepreload
      },
      rollupOptions: {
        // Code splitting strategy
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('react-icons') || id.includes('react-toastify')) {
                return 'vendor-ui';
              }
              if (id.includes('swiper')) {
                return 'vendor-carousel';
              }
              if (id.includes('axios')) {
                return 'vendor-utils';
              }
              return 'vendor-other';
            }
            
            // Feature chunks based on file path
            if (id.includes('/components/home/') && (id.includes('HeroCarousel') || id.includes('TrendingArrivals') || id.includes('Lookbook') || id.includes('VideoBanner'))) {
              return 'home-sections';
            }
            if (id.includes('/pages/ProductDetail') || id.includes('/components/product/QuickViewModal') || id.includes('/components/product/ProductCard')) {
              return 'product-features';
            }
            if (id.includes('/pages/Checkout') || id.includes('/pages/OrderSuccess') || id.includes('/pages/OrderFailure')) {
              return 'checkout-flow';
            }
            if (id.includes('/pages/MobileHomepage') || id.includes('/pages/MobileShop') || id.includes('/pages/MobileCombos') || id.includes('/components/home/MobileHero') || id.includes('/components/home/MobileProductGrid')) {
              return 'mobile-views';
            }
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(png|jpe?g|gif|svg|webp|avif|woff2?)$/.test(assetInfo.name)) {
              return `assets/media/[name]-[hash].${ext}`;
            }
            if (/\.css$/.test(assetInfo.name)) {
              return `assets/css/[name]-[hash].${ext}`;
            }
            return `assets/[name]-[hash].${ext}`;
          }
        },
        
        // Externalize large deps if needed
        external: [],
        
        // Tree shaking
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false
        }
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      
      // Source maps for debugging (disable in production for smaller builds)
      sourcemap: mode !== 'production',
      
      // Report compressed sizes
      reportCompressedSize: true,
      
      // Empty out dir
      emptyOutDir: true
    },

    // Development server
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false
        }
      },
      // Enable HMR
      hmr: {
        overlay: true
      }
    },

    // Preview server (production preview)
    preview: {
      port: 4173,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'react-icons/fi',
        'react-icons/fa'
      ],
      exclude: ['framer-motion', 'gsap', '@gsap/react', 'swiper']
    },

    // CSS optimizations
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },

    // Experimental features
    experimental: {
      renderBuiltUrl(filename) {
        return `/${filename}`;
      }
    }
  };
});