import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
                        if (id.includes('firebase/app')) return 'firebase-app';
                        if (id.includes('firebase/auth')) return 'firebase-auth';
                        if (id.includes('firebase/firestore')) return 'firebase-firestore';
                        if (id.includes('firebase/storage')) return 'firebase-storage';
                        if (id.includes('firebase/analytics')) return 'firebase-analytics';
                        if (id.includes('firebase')) return 'firebase';
                        if (id.includes('framer-motion')) return 'motion';
                        if (id.includes('react-router')) return 'router';
                        return 'vendor';
                    }
                    return undefined;
                },
            },
        },
    },
});
