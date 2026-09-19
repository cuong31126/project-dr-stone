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
```
