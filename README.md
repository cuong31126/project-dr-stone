# Dr. Stone Fan Website

> 🔬 Website fan anime Dr. Stone — portfolio-quality với Three.js, GSAP ScrollTrigger & Tailwind CSS v4

![Status](https://img.shields.io/badge/status-in--development-yellow)
![CSS](https://img.shields.io/badge/CSS-Tailwind_v4-38BDF8)
![3D](https://img.shields.io/badge/3D-Three.js-black)
![Animation](https://img.shields.io/badge/Animation-GSAP-88CE02)

## ✨ Tính Năng

- 🌌 Three.js particle background (stone crumble effect)
- 📜 GSAP ScrollTrigger scroll storytelling
- 🪟 Dark mode glassmorphism UI
- 👤 Flip card 3D cho nhân vật
- 📺 3 Season episodes với search & bookmark
- 🎬 Trailer video modal
- 🌙 Dark / Light mode toggle
- 📱 Fully responsive

## 🛠️ Stack

| Layer | Technology |
|-------|-----------|
| Markup | HTML5 Semantic |
| Styling | **Tailwind CSS v4** (CDN) + Vanilla CSS animations |
| 3D | **Three.js r158** + GLTFLoader |
| Animation | **GSAP 3** + ScrollTrigger + Lenis |
| Data | JSON (data/episodes.json) |

## 📁 Cấu Trúc

```
duan-drstone/
├── index.html              ← Single page chính
├── nhanvat.html            ← Trang nhân vật
├── tapphim.html            ← Trang tập phim
├── danhgia.html            ← Form đánh giá
├── dangnhap.html           ← Đăng nhập
│
├── css/
│   ├── style.css           ← Design tokens (legacy, đang migrate Tailwind)
│   └── custom.css          ← Canvas, keyframes, Three.js specific
│
├── js/
│   ├── main.js             ← App init, dark mode, navbar, scroll
│   ├── particles.js        ← Three.js scene + GLB model loader
│   └── episodes.js         ← Data fetch, render, search, bookmark
│
├── assets/
│   ├── images/
│   │   ├── characters/     ← Ảnh nhân vật (8 files)
│   │   └── episodes/       ← Thumbnail tập phim
│   └── models/
│       └── senku.glb       ← ⏳ Tải từ Sketchfab (pending)
│
├── data/
│   └── episodes.json       ← Data S1(24) + S2(11) + S3(23) episodes
│
├── doc/                    ← Prompt chains
│   ├── ui.txt
│   ├── feature.txt
│   └── debug.txt
│
├── .agents/                ← AI coding skills
│   └── skills/
│       ├── drstone-ui/     ← UI rules & design system
│       ├── drstone-debug/  ← Known bugs & debug checklist
│       └── drstone-feature/← Feature roadmap & data schema
│
├── DESIGN.md               ← Design system document
├── COMPONENTS.md           ← Component library docs
├── AGENTS.md               ← AI agent rules
└── README.md               ← This file
```

## 🚀 Chạy Local

Dùng XAMPP (đã cấu hình):
```
http://localhost/unitop.vn/front-end/lesson/duan-drstone/
```

## 📋 Roadmap

- [x] Cấu trúc thư mục & design system
- [x] Data JSON (S1/S2/S3 episodes + characters)
- [x] Three.js particle engine skeleton
- [ ] index.html viết lại hoàn chỉnh
- [ ] GSAP scroll animations
- [ ] Tailwind v4 migration
- [ ] Senku.glb 3D model
- [ ] Deploy GitHub Pages

## 📸 Screenshots

> Xem mockup tại [DESIGN.md](DESIGN.md)

## 👤 Author

**Lê Quốc Cường** — unitop.vn
NGÂN HÀNG MB BANK: 0969839241
