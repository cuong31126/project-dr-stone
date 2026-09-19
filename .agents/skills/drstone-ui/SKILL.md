---
name: drstone-ui
description: >
  Skill hướng dẫn làm UI cho dự án Dr. Stone fan website.
  Khi được kích hoạt, AI sẽ tuân thủ design system, color palette,
  typography và component rules đã định nghĩa — tránh tự ý dùng
  màu/font/layout generic. Kích hoạt khi cần: sửa CSS, thêm component,
  thiết kế section mới, hoặc review giao diện.
---

# 🎨 Dr. Stone UI Skill

## Ngữ Cảnh Dự Án
Website fan anime **Dr. Stone** — redesign thành portfolio-quality experience với:
- Three.js particle background
- GSAP ScrollTrigger scroll animations
- Dark mode glassmorphism UI
- Single-page cuộn dài + trang con

## ⚠️ Quy Tắc Bắt Buộc Khi Làm UI

### 1. CSS Framework
Dự án này dùng **Tailwind CSS v4 (Play CDN)** + **Vanilla CSS** cho custom animations.

```html
<!-- LUÔN có trong <head> -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

<!-- Custom theme trong style block -->
<style type="text/tailwindcss">
  @theme {
    --color-primary: #00d4ff;
    --color-accent:  #39ff14;
    --color-gold:    #ffd700;
    --color-bg:      #050810;
    --color-card:    #0a0f1e;
    --font-title:    'Orbitron', sans-serif;
    --font-body:     'Inter', sans-serif;
    --font-accent:   'Rajdhani', sans-serif;
  }
</style>
```

### 2. Color Palette — KHÔNG được dùng màu ngoài list này

| Token             | Hex       | Dùng cho             |
|-------------------|-----------|----------------------|
| `--color-primary` | `#00d4ff` | Links, border, glow  |
| `--color-accent`  | `#39ff14` | CTA buttons, badges  |
| `--color-gold`    | `#ffd700` | Highlights, ratings  |
| `--color-bg`      | `#050810` | Background chính     |
| `--color-card`    | `#0a0f1e` | Card background      |
| white             | `#e8f4f8` | Text chính           |
| muted             | `#6b7a99` | Text phụ             |

### 3. Typography — KHÔNG được dùng font khác

```
Title/Logo:   Orbitron (Google Fonts) — sci-fi, bold 700/900
Heading:      Rajdhani (Google Fonts) — semi-bold 600/700
Body:         Inter (Google Fonts) — regular 400/500
```

Font size scale: `text-sm` → `text-base` → `text-xl` → `text-4xl` → `text-8xl`

### 4. Glassmorphism Pattern — Dùng khi làm card

```css
/* Tailwind utility classes */
.glass-card {
  @apply bg-white/5 backdrop-blur-xl border border-white/10
         shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl;
}
```

Hoặc inline Tailwind:
```html
<div class="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-2xl shadow-2xl">
```

### 5. Animation Patterns

```css
/* Scroll reveal — thêm class này khi JS detect visible */
.reveal-up {
  @apply opacity-0 translate-y-8 transition-all duration-700;
}
.reveal-up.visible {
  @apply opacity-100 translate-y-0;
}

/* Hover glow */
.hover-glow {
  @apply transition-all duration-300
         hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]
         hover:-translate-y-1;
}
```

### 6. Mockup Tham Khảo (đã approve)
- **Hero**: Logo trái, nav giữa, auth phải | Senku low-poly bên phải | title 2 dòng to
- **Story**: Số "3.715" cỡ cực lớn giữa màn hình | stagger text reveal
- **Characters**: Grid 4 cột | flip card on hover | filter pills
- **Episodes**: Season tabs | search góc phải | grid 5 cột

### 7. Điều KHÔNG được làm
- ❌ KHÔNG dùng màu đỏ/xanh dương/xanh lá cây thông thường (quá generic)
- ❌ KHÔNG dùng font mặc định browser (Arial, sans-serif)
- ❌ KHÔNG tạo card hình chữ nhật đơn giản không có glassmorphism
- ❌ KHÔNG viết CSS inline rải rác (phải dùng Tailwind class hoặc custom file)
- ❌ KHÔNG để `<style>` block nằm trong `<body>`
- ❌ KHÔNG dùng Bootstrap (đã loại bỏ)

## Cấu Trúc File

```
index.html          ← Tailwind + Three.js + GSAP
css/
  custom.css        ← Chỉ animation keyframes & Three.js canvas rules
js/
  main.js           ← App logic
  particles.js      ← Three.js engine
  episodes.js       ← Data render
assets/
  images/
    characters/     ← 8 nhân vật
    episodes/       ← Thumbnail tập phim
  models/           ← senku.glb (pending)
data/
  episodes.json     ← Toàn bộ data S1/S2/S3
```
