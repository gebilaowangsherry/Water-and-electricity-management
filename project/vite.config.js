import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: "brotliCompress", // 使用Brotli而非gzip
      ext: ".br",
      threshold: 1024, // 1KB以上的文件都压缩
      filter: /\.(js|mjs|json|css|html|svg|txt|xml|wasm)$/i, // 压缩更多文件类型
      deleteOriginFile: false,
      compressionOptions: {
        level: 11, // Brotli最高压缩级别
      },
    }),
    viteCompression({
      algorithm: "gzip", // 同时提供gzip作为后备
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  build: {
    outDir: "dist",
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 更安全的手动分块策略
          if (id.includes("node_modules")) {
            if (id.includes("element-plus")) {
              return "element-plus";
            }
            if (id.includes("echarts")) {
              return "echarts";
            }
            // 不要单独拆分vue运行时，保持在一起
            return "vendor";
          }
        },
        chunkFileNames: "js/[name]-[hash].js",
      },
    },
  },
});
