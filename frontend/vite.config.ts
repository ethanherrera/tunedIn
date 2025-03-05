import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: env.VITE_SERVER_HOST || '0.0.0.0',
      port: parseInt(env.VITE_SERVER_PORT || '5137'),
    },
    build: {
      outDir: 'dist',
      sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  };
});