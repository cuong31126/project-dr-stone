---
name: drstone-feature
description: >
  Skill quản lý roadmap tính năng cho Dr. Stone website. Kích hoạt khi
  thêm tính năng mới: search, bookmark, dark mode, quiz, trailer modal,
  season switcher, hoặc Three.js model. Chứa data schema, API contract,
  và coding conventions cho từng feature.
---

# ⚡ Dr. Stone Feature Skill

## Trạng Thái Tính Năng

| Feature | Trạng thái | File liên quan |
|---------|-----------|----------------|
| Three.js particle background | ✅ Done | js/particles.js |
| Senku 3D model (GLB) | ✅ Done | js/particles.js |
| Dark mode toggle | ✅ Done | js/main.js |
| Season tab switcher | ✅ Done | js/episodes.js |
| Real-time search | ✅ Done | js/episodes.js |
| Bookmark tập phim | ✅ Done | js/episodes.js |
| GSAP scroll reveal | ✅ Done | js/main.js |
| Lenis smooth scroll | ✅ Done | js/main.js |
| Trailer video modal | ✅ Done | js/main.js |
| Flip card nhân vật | ✅ Done | js/episodes.js |
| Story counter anim | ✅ Done | js/main.js |
| Continue watching | ✅ Done | js/episodes.js |
| Quiz Dr. Stone | ⬜ Backlog | js/quiz.js |
| danhgia.html redesign | ⬜ Backlog | danhgia.html |

## Data Schema

### localStorage Keys
```js
const STORAGE = {
  THEME:    'drstone_theme',    // 'dark' | 'light'
  PROGRESS: 'drstone_progress', // { currentSeason, currentEp, watched }
  BOOKMARKS:'drstone_bookmarks' // { s1: [1,2], s2: [], s3: [7,8] }
}
```

### Episode Object (từ data/episodes.json)
```js
{
  ep:      Number,   // số tập
  title:   String,   // tên tiếng Việt
  youtube: String,   // URL YouTube (rỗng nếu chưa có)
  thumb:   String    // path ảnh thumbnail (tương đối từ root)
}
```

## Coding Conventions

### Dark Mode
```js
// Đọc theme
const theme = localStorage.getItem('drstone_theme')
              ?? (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');

// Apply theme (dùng data-theme attribute trên <html>)
document.documentElement.setAttribute('data-theme', theme);

// Tailwind dark variant: dark:bg-gray-900
// Custom CSS: [data-theme="dark"] .card { ... }
```

### Fetch Episodes Data
```js
// Luôn fetch từ data/episodes.json — không hardcode data trong JS
const fetchData = async () => {
  const res  = await fetch('data/episodes.json');
  const data = await res.json();
  return data;
};
```

### Scroll Reveal (Intersection Observer — không dùng thư viện)
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target); // unobserve sau khi reveal
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
```

### Three.js Model Load Pattern
```js
// Kiểm tra trước khi load — nếu file không tồn tại thì dùng placeholder
const MODEL_PATH = 'assets/models/senku.glb';

fetch(MODEL_PATH, { method: 'HEAD' })
  .then(r => r.ok ? bg.loadModel(MODEL_PATH) : bg._createPlaceholderObject())
  .catch(()  => bg._createPlaceholderObject());
```
