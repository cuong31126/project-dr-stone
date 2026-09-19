# DESIGN.md — Dr. Stone Design System

> Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho
> toàn bộ design system của dự án Dr. Stone fan website.
> **AI agents và developers phải đọc file này trước khi viết bất kỳ CSS/UI nào.**

---

## 🎭 Visual Theme & Atmosphere

**Chủ đề:** Khoa học hậu tận thế — thế giới đá, ánh sáng hy vọng, văn minh tái sinh.

**Cảm giác:** Cinematic, sci-fi, tối nhưng có điểm sáng. Như nhìn vào màn đêm vũ trụ
với tia sáng xanh lục của khoa học xuyên thấu.

**Không phải:** Generic dark mode. Không phải Netflix clone. Không phải template.

**Tham chiếu cảm hứng:**
- Awwwards Three.js winners (scroll storytelling)
- Apple product pages (typography scale)
- IMDb dark mode (episode grid logic)
- Dr. Stone anime visual identity (neon green + stone texture)

---

## 🎨 Color Palette

### Primary Colors
```
--color-bg-deep:    #050810   Background sâu nhất (body)
--color-bg-surface: #0a0f1e   Card/section background
--color-bg-elevated:#0d1420   Input, tooltip background
```

### Brand Colors
```
--color-primary:    #00d4ff   Cyan khoa học — links, borders, glow chính
--color-accent:     #39ff14   Neon green — CTA buttons, badges active, "alive"
--color-gold:       #ffd700   Gold — highlights, star ratings, emphasis
--color-stone:      #8b7355   Stone brown — texture accent, dividers
--color-danger:     #ff4444   Error states, villain highlight (Tsukasa)
```

### Text Colors
```
--color-text-primary: #e8f4f8   Chữ chính (không phải trắng thuần)
--color-text-muted:   #6b7a99   Chữ phụ, placeholder, metadata
--color-text-dim:     #3d4f6e   Chữ rất mờ, disabled state
```

### Glass / Overlay
```
Glass BG:     rgba(255, 255, 255, 0.04)   Nền card glass
Glass Border: rgba(0, 212, 255, 0.15)     Viền card glass
Glass Shadow: 0 8px 32px rgba(0,0,0,0.5) Đổ bóng card
```

---

## ✍️ Typography

### Font Families
```
Title / Logo:  'Orbitron'  — Google Fonts, weight 400/700/900
               Dùng cho: Logo, hero title, section number counter
               Vì: sci-fi feel đặc trưng, không lẫn với site khác

Heading / Nav: 'Rajdhani'  — Google Fonts, weight 500/600/700
               Dùng cho: Navbar links, card titles, buttons, badges
               Vì: Military/technical feel, dễ đọc uppercase

Body / Prose:  'Inter'     — Google Fonts, weight 300/400/500
               Dùng cho: Paragraphs, descriptions, metadata
               Vì: Cực kỳ readable ở mọi size
```

### Type Scale (Tailwind v4)
```
Hero title:  text-[clamp(3.5rem,10vw,9rem)]  — "DR. STONE" 
Counter:     text-[clamp(4rem,12vw,8rem)]    — "3.715"
H2:          text-4xl → text-6xl (clamp)
H3/Card:     text-xl → text-2xl
Body:        text-base (16px)
Caption:     text-sm (14px)
Badge/Label: text-xs (12px) + tracking-widest + uppercase
```

---

## 🧩 Component Rules

### Navbar
- `position: fixed` — sticky top
- Height: `h-[70px]` → `h-[60px]` khi scrolled
- Background: `bg-[#050810]/60 backdrop-blur-xl` — transparent khi top
- Background: `bg-[#050810]/95` — opaque khi đã scroll
- Border bottom: `border-b border-cyan-500/15`
- Logo: Orbitron font, gradient `from-cyan-400 to-green-400`
- Active link: neon green underline `w-3/5 h-0.5`

### Cards (Glass)
```html
<div class="bg-white/[0.04] backdrop-blur-xl border border-cyan-500/20
            rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]
            transition-all duration-300
            hover:border-cyan-400/40 hover:-translate-y-1.5
            hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(0,212,255,0.15)]">
```

### Buttons
```
Primary CTA:  bg-[#39ff14] text-black font-bold — neon green fill
              hover: shadow-[0_0_30px_rgba(57,255,20,0.5)] scale-[1.02]

Secondary:    border border-cyan-500/30 bg-white/5 text-cyan-400
              hover: border-cyan-400 bg-cyan-400/10

Ghost:        border border-white/10 text-gray-400
              hover: border-cyan-500 text-white
```

### Badges / Pills
```
Season badge: bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30
              font-bold uppercase text-xs tracking-widest rounded-full

Role badge:   bg-cyan-400/15 text-cyan-400 border border-cyan-400/30
```

### Flip Cards (Characters)
```
height: 380px | perspective: 1000px
Front: character image + name + role badge
Back: full description + tags
Trigger: :hover → rotateY(180deg) | transition: 0.7s cubic-bezier
```

---

## 📐 Layout & Spacing

### Grid Systems
```
Characters: grid-cols-1 → grid-cols-2 → grid-cols-4 (sm/md/xl)
Episodes:   grid-cols-2 → grid-cols-3 → grid-cols-5 (sm/md/xl)
Trailer:    grid-cols-1 → grid-cols-3 (md)
```

### Spacing Scale
```
Section padding: py-24 (6rem top/bottom)
Container max:   max-w-7xl mx-auto px-4
Card gap:        gap-5 (1.25rem)
Section gap:     gap-8 (2rem)
```

### Breakpoints (Tailwind defaults)
```
sm:  640px   — Mobile landscape
md:  768px   — Tablet
lg:  1024px  — Desktop small
xl:  1280px  — Desktop
2xl: 1536px  — Wide screen
```

---

## 🎬 Animation Principles

### Scroll Reveal (Intersection Observer)
```
opacity: 0 → 1
transform: translateY(32px) → translateY(0)
duration: 600-800ms
easing: cubic-bezier(0.4, 0, 0.2, 1)
stagger: 100ms giữa các items
```

### GSAP ScrollTrigger Patterns
```
Story counter: scrub: true, start: "top center", end: "bottom center"
Section pin: pin: true, duration: 1.5 viewport heights
Text reveal: stagger: { each: 0.15, from: "start" }
```

### Hover Effects
```
Cards: translateY(-6px) + glow shadow — duration 300ms
Buttons: scale(1.02) + shadow boost — duration 200ms
Nav links: width expand underline — duration 200ms
Images in cards: scale(1.08) — duration 500ms
```

### Three.js Animations
```
Particles: slow rotation y: 0.04rad/s, x: sin wave
Camera: mouse parallax, lerp 0.05
Scroll: camera.position.z += scrollY * 0.003
Model (Senku): auto-rotate + float bob (sin wave)
```

---

## ✅ Do's & ❌ Don'ts

### ✅ DO
- Dùng CSS variables (`--color-primary`) qua Tailwind `@theme`
- Clamp font sizes cho fluid typography
- Dùng `backdrop-filter: blur` cho glass effect
- Thêm `loading="lazy"` vào mọi `<img>`
- Kiểm tra contrast ratio ≥ 4.5:1 cho text
- Comment section rõ ràng trong HTML

### ❌ DON'T
- Không hardcode màu hex trong component (dùng token)
- Không dùng Bootstrap (đã loại khỏi dự án)
- Không dùng `!important` ngoại trừ Three.js canvas z-index
- Không để CSS trong `<style>` tag trong `<body>`
- Không tạo gradient tím/hồng/cam không liên quan đến palette
- Không animation với `transition: all` trên toàn bộ element (chậm)
