# COMPONENTS.md — Dr. Stone Component Library

> Tài liệu chi tiết từng component: HTML structure, Tailwind classes,
> JavaScript behavior, và accessibility notes.
> Cập nhật mỗi khi thêm component mới.

---

## 📋 Index

1. [Navbar](#1-navbar)
2. [Hero Section](#2-hero-section)
3. [Glass Card](#3-glass-card-base)
4. [Character Flip Card](#4-character-flip-card)
5. [Episode Card](#5-episode-card)
6. [Season Tab Switcher](#6-season-tab-switcher)
7. [Search Box](#7-search-box)
8. [Video Modal](#8-video-modal)
9. [Buttons](#9-buttons)
10. [Section Header](#10-section-header)

---

## 1. Navbar

**File:** `index.html` — `<nav class="navbar">`
**Behavior:** Sticky fixed, đổi opacity khi scroll > 50px, hamburger mobile

```html
<nav id="navbar" class="fixed top-0 inset-x-0 z-50 h-[70px] flex items-center
     justify-between px-8 border-b border-cyan-500/15
     bg-[#050810]/60 backdrop-blur-xl transition-all duration-300">

  <!-- Logo -->
  <a href="#hero" class="font-['Orbitron'] text-xl font-black tracking-wider
     bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
    DR.STONE
  </a>

  <!-- Nav Links (desktop) -->
  <ul class="hidden md:flex items-center gap-1">
    <li><a href="#hero"       class="nav-link" data-section="hero">Trang Chủ</a></li>
    <li><a href="#characters" class="nav-link" data-section="characters">Nhân Vật</a></li>
    <li><a href="#episodes"   class="nav-link" data-section="episodes">Tập Phim</a></li>
    <li><a href="#trailer"    class="nav-link" data-section="trailer">Trailer</a></li>
  </ul>

  <!-- Actions -->
  <div class="flex items-center gap-3">
    <button id="theme-toggle" aria-label="Toggle dark mode">🌙</button>
    <a href="dangnhap.html" class="btn-ghost">Đăng Nhập</a>
    <a href="dangnhap.html" class="btn-primary">Đăng Ký</a>
    <button id="hamburger" class="md:hidden" aria-label="Menu">☰</button>
  </div>
</nav>
```

**JS trigger:** `navbar.scrolled` class khi `window.scrollY > 50`
**Accessible:** `aria-label` trên icon buttons, `aria-current="page"` trên active link

---

## 2. Hero Section

**File:** `index.html` — `<section id="hero">`
**Behavior:** Full viewport, Three.js canvas behind, particle float, fade-in on load

```html
<section id="hero" class="relative min-h-screen flex flex-col items-center
     justify-center text-center px-8 overflow-hidden">

  <!-- Badge -->
  <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
       border border-cyan-500/30 bg-white/5 backdrop-blur-sm
       text-xs font-bold tracking-[0.2em] uppercase text-cyan-400
       mb-6 animate-fade-in-up [animation-delay:0.2s]">
    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
    Season 3 — New World
  </span>

  <!-- Title -->
  <h1 class="font-['Orbitron'] font-black leading-[0.9] mb-4
       animate-fade-in-up [animation-delay:0.4s]">
    <span class="block text-[clamp(3.5rem,10vw,9rem)]
         bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
      DR.
    </span>
    <span class="block text-[clamp(3.5rem,10vw,9rem)]
         bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent
         relative" data-text="STONE">
      STONE
    </span>
  </h1>

  <!-- Subtitle -->
  <p class="font-['Rajdhani'] text-[clamp(1rem,2.5vw,1.3rem)] font-medium
     uppercase tracking-[0.1em] text-gray-400 mb-10
     animate-fade-in-up [animation-delay:0.6s]">
    3,715 years to rebuild civilization
  </p>

  <!-- CTAs -->
  <div class="flex gap-4 flex-wrap justify-center
       animate-fade-in-up [animation-delay:0.8s]">
    <a href="#episodes" class="btn-hero-primary">▶ Xem Phim Ngay</a>
    <a href="#characters" class="btn-hero-secondary">⚡ Nhân Vật</a>
  </div>

  <!-- Stats -->
  <div class="flex gap-12 mt-12 animate-fade-in-up [animation-delay:1s]">
    <div class="text-center">
      <span class="block font-['Orbitron'] text-3xl font-black text-cyan-400">3</span>
      <span class="text-[0.65rem] tracking-[0.2em] uppercase text-gray-500">Seasons</span>
    </div>
    <div class="w-px bg-white/10"></div>
    <div class="text-center">
      <span class="block font-['Orbitron'] text-3xl font-black text-cyan-400">58</span>
      <span class="text-[0.65rem] tracking-[0.2em] uppercase text-gray-500">Tập Phim</span>
    </div>
    <div class="w-px bg-white/10"></div>
    <div class="text-center">
      <span class="block font-['Orbitron'] text-3xl font-black text-cyan-400">8</span>
      <span class="text-[0.65rem] tracking-[0.2em] uppercase text-gray-500">Nhân Vật</span>
    </div>
  </div>

  <!-- Scroll Hint -->
  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col
       items-center gap-2 text-[0.6rem] tracking-[0.3em] uppercase text-gray-600
       animate-bounce">
    <div class="w-px h-10 bg-gradient-to-b from-transparent to-cyan-500"></div>
    scroll
  </div>
</section>
```

---

## 3. Glass Card (Base)

**Tái sử dụng làm base cho tất cả cards.**

```html
<!-- Base glass card classes -->
<div class="bg-white/[0.04] backdrop-blur-xl
     border border-cyan-500/20 rounded-2xl
     shadow-[0_8px_32px_rgba(0,0,0,0.5)]
     transition-all duration-300 cursor-pointer
     hover:border-cyan-400/40 hover:-translate-y-1.5
     hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(0,212,255,0.15)]">
  <!-- content -->
</div>
```

---

## 4. Character Flip Card

**Behavior:** Hover → rotateY(180deg) hiện mô tả
**Size:** `h-[380px]`

```html
<div class="group h-[380px] [perspective:1000px]
     opacity-0 translate-y-8 transition-all duration-500 data-reveal"
     data-group="[main|village]">

  <div class="relative w-full h-full [transform-style:preserve-3d]
       transition-transform duration-700 ease-out
       group-hover:[transform:rotateY(180deg)]">

    <!-- FRONT -->
    <div class="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden
         border border-cyan-500/20 bg-white/[0.04] backdrop-blur-xl">
      <div class="h-[240px] overflow-hidden relative">
        <img src="[THUMB]" alt="[NAME]" loading="lazy"
             class="w-full h-full object-cover transition-transform duration-500
                    group-hover:scale-110">
        <div class="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent"></div>
      </div>
      <div class="p-5">
        <span class="inline-block text-[0.65rem] font-bold tracking-[0.2em] uppercase
             px-3 py-1 rounded-full bg-green-400/15 text-green-400
             border border-green-400/30 mb-2">[ROLE]</span>
        <h3 class="font-['Rajdhani'] text-xl font-bold">[NAME]</h3>
        <p class="text-xs text-gray-500 mt-0.5">[NAME_JP]</p>
      </div>
    </div>

    <!-- BACK -->
    <div class="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]
         rounded-2xl p-6 flex flex-col justify-center
         border border-cyan-400/40 bg-cyan-400/5 backdrop-blur-xl">
      <h3 class="font-['Rajdhani'] text-lg font-bold text-cyan-400 mb-3">[NAME]</h3>
      <p class="text-sm text-gray-400 leading-relaxed">[DESC]</p>
      <div class="flex flex-wrap gap-1.5 mt-4">
        <!-- Tags: vòng lặp -->
        <span class="text-[0.6rem] px-2 py-0.5 rounded bg-cyan-400/10
             text-cyan-400 border border-cyan-400/20 font-semibold">[TAG]</span>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Episode Card

**Behavior:** Click → mở YouTube. Bookmark → lưu localStorage.

```html
<a href="[YOUTUBE_URL]" target="_blank" rel="noopener"
   class="ep-card group block rounded-xl overflow-hidden
          border border-cyan-500/20 bg-white/[0.04] backdrop-blur-lg
          transition-all duration-300
          hover:border-cyan-400/40 hover:-translate-y-1.5
          opacity-0 translate-y-6 [data-reveal]"
   data-ep="[EP_NUM]" data-season="[SEASON]">

  <!-- Thumbnail -->
  <div class="relative aspect-video overflow-hidden bg-[#0a0f1e]">
    <img src="[THUMB]" alt="Tập [EP]" loading="lazy"
         class="w-full h-full object-cover transition-transform duration-500
                group-hover:scale-110">
    <!-- Overlay play -->
    <div class="absolute inset-0 flex items-center justify-center
         bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div class="w-12 h-12 rounded-full bg-cyan-400 flex items-center justify-center
           text-black font-bold scale-75 group-hover:scale-100 transition-transform duration-300">
        ▶
      </div>
    </div>
    <!-- Badge số tập -->
    <span class="absolute top-2 left-2 bg-green-400 text-black text-[0.6rem]
         font-black px-2 py-0.5 rounded tracking-wider">TẬP [EP]</span>
    <!-- Watched badge -->
    <span class="ep-watched absolute top-2 right-2 w-5 h-5 rounded-full
         bg-green-400/90 text-black text-[0.6rem] items-center justify-center hidden">✓</span>
  </div>

  <!-- Info -->
  <div class="p-3">
    <p class="text-[0.6rem] text-cyan-400 font-bold tracking-wider uppercase mb-1">
      Season [S] — Tập [EP]
    </p>
    <h4 class="font-['Rajdhani'] text-sm font-bold leading-snug text-gray-100">[TITLE]</h4>
  </div>

  <!-- Actions -->
  <div class="px-3 pb-3 flex gap-2">
    <span class="flex-1 text-center py-1.5 rounded text-xs font-semibold
         bg-cyan-400/10 border border-cyan-400/20 text-cyan-400
         hover:bg-cyan-400 hover:text-black transition-colors duration-200">
      Xem
    </span>
    <button class="bookmark-btn w-8 h-8 rounded border border-white/10 flex items-center
         justify-center text-gray-400 text-sm
         hover:border-yellow-400 hover:text-yellow-400 transition-colors duration-200"
         data-season="[S]" data-ep="[EP]" aria-label="Bookmark tập [EP]">
      🔖
    </button>
  </div>
</a>
```

---

## 6. Season Tab Switcher

```html
<div class="flex justify-center mb-6">
  <div class="flex gap-1 p-1 rounded-xl border border-cyan-500/20 bg-white/[0.04]">
    <button class="season-tab active" data-season="3">Season 3 ●</button>
    <button class="season-tab" data-season="2">Season 2</button>
    <button class="season-tab" data-season="1">Season 1</button>
  </div>
</div>
```

```css
/* Tailwind @apply */
.season-tab {
  @apply font-['Rajdhani'] text-sm font-bold uppercase tracking-wider
         px-5 py-2 rounded-lg text-gray-400 transition-all duration-200;
}
.season-tab.active {
  @apply bg-gradient-to-r from-cyan-500 to-cyan-600 text-black;
}
```

**JS:** Click → `renderEpisodes(seasonId)` từ `episodes.js`

---

## 7. Search Box

```html
<div class="relative max-w-sm ml-auto mb-8">
  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
  <input id="ep-search" type="text"
         placeholder="Tìm tên tập phim..."
         class="w-full pl-9 pr-8 py-2.5 rounded-full
                bg-white/[0.04] border border-cyan-500/20
                text-gray-200 text-sm placeholder-gray-600
                focus:outline-none focus:border-cyan-400
                focus:ring-2 focus:ring-cyan-400/20
                transition-all duration-200">
  <button id="search-clear" class="absolute right-3 top-1/2 -translate-y-1/2
          text-gray-500 hover:text-gray-300 hidden" aria-label="Xóa tìm kiếm">✕</button>
</div>
```

**JS:** `input` event với debounce 300ms → filter `.ep-card` elements

---

## 8. Video Modal

```html
<div id="trailer-modal" class="fixed inset-0 z-[9999] flex items-center justify-center
     p-8 bg-black/85 backdrop-blur-md
     opacity-0 pointer-events-none transition-opacity duration-300"
     role="dialog" aria-modal="true" aria-label="Video trailer">

  <div class="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden
       shadow-[0_32px_80px_rgba(0,0,0,0.8)]
       scale-90 transition-transform duration-300" id="modal-inner">

    <iframe id="modal-iframe" src="" allow="autoplay; encrypted-media"
            class="w-full h-full border-0" title="Dr. Stone Trailer"></iframe>

    <button id="modal-close" class="absolute -top-12 right-0 w-10 h-10 rounded-full
            bg-white/15 hover:bg-white/30 flex items-center justify-center
            text-white text-xl transition-colors duration-200"
            aria-label="Đóng video">✕</button>
  </div>
</div>
```

**JS Pattern:**
```js
// Mở
modal.classList.add('opacity-100', 'pointer-events-auto');
modalInner.classList.replace('scale-90', 'scale-100');
iframe.src = `${youtubeUrl}?autoplay=1`;

// Đóng
modal.classList.remove('opacity-100', 'pointer-events-auto');
modalInner.classList.replace('scale-100', 'scale-90');
iframe.src = ''; // Dừng video
```

---

## 9. Buttons

```html
<!-- Hero Primary -->
<a class="font-['Rajdhani'] text-base font-bold uppercase tracking-widest
    px-9 py-4 rounded-lg bg-[#39ff14] text-black
    shadow-[0_0_20px_rgba(57,255,20,0.3)]
    hover:shadow-[0_0_40px_rgba(57,255,20,0.5)] hover:scale-[1.02]
    transition-all duration-200">

<!-- Hero Secondary -->
<a class="font-['Rajdhani'] text-base font-bold uppercase tracking-widest
    px-9 py-4 rounded-lg border border-cyan-500/30 bg-white/5
    text-gray-100 backdrop-blur-sm
    hover:border-cyan-400 hover:bg-cyan-400/10
    transition-all duration-200">

<!-- Navbar Ghost -->
<a class="font-['Rajdhani'] text-sm font-semibold uppercase tracking-wider
    px-5 py-2 rounded border border-white/10 text-gray-400
    hover:border-cyan-500 hover:text-cyan-400
    transition-all duration-200">

<!-- Navbar Primary -->
<a class="font-['Rajdhani'] text-sm font-bold uppercase tracking-wider
    px-5 py-2 rounded bg-gradient-to-r from-cyan-500 to-cyan-600 text-black
    hover:shadow-[0_4px_20px_rgba(0,212,255,0.4)] hover:-translate-y-0.5
    transition-all duration-200">
```

---

## 10. Section Header

```html
<div class="text-center mb-16">
  <span class="block text-[0.72rem] font-['Rajdhani'] font-bold
       tracking-[0.35em] uppercase text-cyan-400 mb-3">
    ● [SECTION LABEL]
  </span>
  <h2 class="font-['Orbitron'] text-[clamp(2rem,4vw,3.5rem)] font-bold mb-3">
    [SECTION TITLE]
  </h2>
  <div class="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400 mx-auto rounded"></div>
</div>
```
