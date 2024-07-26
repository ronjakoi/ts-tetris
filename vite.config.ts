import { defineConfig } from 'vite'

export default defineConfig({
    root: "src/",
    base: "/tetris/",
    build: {
        outDir: "../dist/",
        emptyOutDir: true
    }
});
