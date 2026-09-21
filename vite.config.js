import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Thư mục root chứa index.html
    root: '.',

    // Thư mục chứa static assets (ảnh, model GLB, v.v.)
    publicDir: 'public',

    plugins: [
      {
        name: 'discord-proxy-middleware',
        configureServer(server) {
          server.middlewares.use('/api/discord-notify', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              const webhookUrl = env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
              if (!webhookUrl) {
                res.statusCode = 200;
                res.end(JSON.stringify({ warning: 'No webhook configured locally' }));
                return;
              }
              try {
                const response = await fetch(webhookUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body
                });
                res.statusCode = response.ok ? 200 : response.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: response.ok }));
              } catch (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        }
      }
    ],

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
  };
});
