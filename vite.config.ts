
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  // Get API key from environment
  const apiKey = env.API_KEY || 'dummy_key';

  return {
    plugins: [react()],
    base: '/', 
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-utils': ['@supabase/supabase-js', 'lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000
    },
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  };
});
