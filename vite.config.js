import { defineConfig } from 'vite';

export default defineConfig({
  // Thư mục root chứa index.html
  root: '.',

  // Thư mục chứa static assets (ảnh, model GLB, v.v.)
  // Vite sẽ serve trực tiếp mà không process — đặt assets vào public/
  publicDir: 'public',

  server: {
    port: 5173,
    open: true,          // Tự mở browser khi npm run dev
    host: true,          // Cho phép truy cập từ LAN (điện thoại, tablet)
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      // Nếu sau này thêm nhiều trang
      input: {
        main:            'index.html',
        characters:      'characters.html',
        cactapphim:      'cactapphim.html',
        danhgia:         'danhgia.html',
        dangnhap:        'dangnhap.html',
        tongquannhanvat: 'tongquannhanvat.html',
        loitrian:        'loitrian.html',
        khoahoc3d:       'khoahoc3d.html',
      }
    }
  },

  // Tối ưu Three.js — externalize để dùng CDN importmap
  // (Three.js vẫn load từ CDN, không bundle vào build)
  optimizeDeps: {
    exclude: ['three'],
  },
});
