import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Served from the root of crimsonlotusld.com, so assets resolve from '/'.
  base: '/',
});
