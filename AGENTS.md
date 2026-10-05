# AGENTS.md — AI Coding Rules for Dr. Stone Project

> File này định nghĩa quy tắc và hành vi cho AI coding assistants
> (Antigravity, GitHub Copilot, Cursor, v.v.) khi làm việc trong dự án này.

## 🤖 Dự Án Là Gì

Website fan anime **Dr. Stone** — được redesign thành portfolio-quality web experience.
Stack: **HTML + Tailwind CSS v4 (CDN) + Three.js + GSAP + Vanilla JS**.

## ✅ Quy Tắc Bắt Buộc

### 1. CSS Framework
- **DÙNG Tailwind CSS v4** qua CDN `@tailwindcss/browser@4`
- **KHÔNG** dùng Bootstrap, Material UI, hay CSS framework nào khác
- **KHÔNG** viết CSS inline style (chỉ dùng Tailwind class hoặc custom.css)
- Custom theme khai báo trong `<style type="text/tailwindcss">` với `@theme { }`

### 2. JavaScript
- **KHÔNG** dùng jQuery hay bất kỳ DOM manipulation library nào
- **CHỈ** dùng Vanilla JS (ES6+)
- **KHÔNG** dùng `var` — chỉ `const` và `let`
- **LUÔN** wrap code trong `DOMContentLoaded` hoặc dùng `defer`
- Data episodes fetch từ `data/episodes.json` — không hardcode trong JS

### 3. HTML Structure
- Mỗi file có **đúng 1** `<!DOCTYPE html>` ở dòng đầu
- Thứ tự: `<!DOCTYPE>` → `<html>` → `<head>` → `<body>` → `</html>`
- `<link>` và `<style>` nằm trong `<head>`
- `<script>` nằm cuối `<body>` (hoặc dùng `defer`)
- Mỗi file phải có `<meta name="description">` cho SEO

### 4. Design System
- **Màu sắc:** CHỈ dùng token trong DESIGN.md — không tự ý thêm màu mới
- **Font:** Orbitron (title) + Rajdhani (heading/nav) + Inter (body)
- **Cards:** LUÔN dùng glassmorphism pattern (`bg-white/[0.04] backdrop-blur-xl border border-cyan-500/20`)
- **Xem DESIGN.md** trước khi viết bất kỳ UI nào

### 5. Components
- **Xem COMPONENTS.md** trước khi tạo component mới
- Nếu component đã có trong COMPONENTS.md → dùng đúng pattern đó
- Nếu tạo mới → cập nhật COMPONENTS.md sau

### 6. File Naming
```
index.html      ✅ (không phải trangchu.html)
nhanvat.html    ✅ (không phải tongquannhanvat.html)
tapphim.html    ✅ (không phải cactapphim.html)
custom.css      ✅ (chỉ animation keyframes)
main.js         ✅ (app init)
episodes.js     ✅ (data + render)
particles.js    ✅ (Three.js)
```

### 7. Links
- Internal links dùng `href="index.html"` — KHÔNG phải `trangchu.html`
- Ảnh dùng path từ `assets/images/` — KHÔNG phải `cactapss3/`
- YouTube links phải là URL thực — KHÔNG dùng `example.com`

## ⚠️ Anti-Patterns Cần Tránh

```
❌ <body style="background: #000;">    → dùng Tailwind class
❌ href="trangchu.html"               → sửa thành index.html
❌ src="cactapss3/tap1ss3.jpg"        → sửa thành assets/images/episodes/
❌ var x = ...                        → dùng const/let
❌ document.write()                   → không dùng
❌ !important (ngoại trừ canvas)      → refactor CSS
❌ Thêm màu hex không trong palette   → dùng token
❌ Generic button styling             → dùng COMPONENTS.md pattern
```

## 📁 Thư Mục & Skills

Khi cần help về:
- **UI / Design** → kích hoạt skill `drstone-ui`
- **Bug / Debug** → kích hoạt skill `drstone-debug`
- **Tính năng mới** → kích hoạt skill `drstone-feature`

## 🔒 BẢO MẬT & QUY TẮC CHỐNG LỘ THÔNG TIN (CRITICAL SECURITY)

> ⚠️ **BẮT BUỘC CHO AI:** Mỗi khi hoàn thành bất kỳ tác vụ nào hoặc chuẩn bị hướng dẫn/thực hiện commit & push lên GitHub, AI PHẢI tự động kiểm tra và đảm bảo 100% không bị lộ bất kỳ thông tin cá nhân, API keys, webhook hay credentials nhạy cảm nào.

### 1. Danh Sách Thông Tin Nhạy Cảm TUYỆT ĐỐI KHÔNG Được Commit Lên GitHub:
- ❌ **Discord Webhook URLs:** Tuyệt đối không hardcode link `https://discord.com/api/webhooks/...` trong file client-side (`js/`, `*.html`). Mọi webhook phải được gọi qua Serverless API backend (`/api/discord-notify.js`) và đọc từ biến môi trường `process.env.DISCORD_WEBHOOK_URL`.
- ❌ **Telegram Bot Tokens & Chat IDs:** Không hardcode bot token dạng `123456:ABC-DEF1234ghIkl-...`.
- ❌ **Firebase Admin Private Keys / Service Account Credentials.**
- ❌ **Mật khẩu, Private Keys, OAuth Secrets, JWT Tokens, Access Tokens.**
- ❌ **Thông tin cá nhân nhạy cảm:** Email cá nhân, số điện thoại riêng tư, CMND/CCCD, đường dẫn ổ đĩa tuyệt đối cục bộ chứa tên user máy tính (như `C:\Users\Quoc Cuong\...`).
- ❌ **File môi trường:** `.env`, `.env.local`, `.env.*.local` (Phải luôn nằm trong `.gitignore`).

### 2. Quy Trình Kiểm Tra Bảo Mật Tự Động Trước Khi Push (Pre-Push Security Checklist):
Trước khi xác nhận commit / push, AI phải tự rà soát:
```markdown
□ Đã kiểm tra git status và git diff xem có file .env hay secret key nào bị thêm vào không.
□ Không có webhook / API key nào bị hardcode trong source code frontend (HTML/CSS/JS).
□ File `.env` và `.env.local` đã được liệt kê trong `.gitignore`.
□ Các API gọi Discord/Telegram đều đi qua backend proxy (/api/*) an toàn.
□ Không có đường dẫn local cứng hoặc thông tin nhạy cảm của tác giả trong code public.
```

---

## 🏃 Test Commands

```bash
# Mở local (XAMPP)
http://localhost/unitop.vn/front-end/lesson/duan-drstone/

# Validate HTML (online)
https://validator.w3.org/nu/ → Paste HTML

# Check performance
F12 DevTools → Lighthouse → Generate report
Target: Performance ≥ 70, Accessibility ≥ 90, SEO ≥ 90
```

## 📝 Commit Convention (Nếu Dùng Git)

```
feat:  Thêm tính năng mới
fix:   Sửa bug
style: Thay đổi UI/CSS không ảnh hưởng logic
refactor: Tái cấu trúc code
docs:  Cập nhật documentation
security: Tối ưu bảo mật, chặn lộ key
```
