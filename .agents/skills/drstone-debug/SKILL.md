---
name: drstone-debug
description: >
  Skill debug dành riêng cho dự án Dr. Stone. Kích hoạt khi:
  HTML/CSS bị lỗi, layout vỡ, Three.js không render, GSAP animation
  không chạy, link 404, hoặc console có error. Chứa danh sách bug
  đã biết và checklist kiểm tra.
---

# 🐛 Dr. Stone Debug Skill

## Danh Sách Bug Đã Biết (Legacy Code)

| ID | File | Lỗi | Trạng thái |
|----|------|-----|------------|
| BUG-01 | index.html | `<body>` mở 2 lần, `</html>` đóng 2 lần | ⏳ Pending fix |
| BUG-02 | index.html | `<link>` CSS đặt ngoài `<head>` | ⏳ Pending fix |
| BUG-03 | cactapphim.html | `<!DOCTYPE>` trùng lặp 2 lần | ⏳ Pending fix |
| BUG-04 | cactapphim.html | Tập 14-16 link `example.com` | ⏳ Pending fix |
| BUG-05 | tongquannhanvat.html | link "Lời Tri Ân" thiếu `.html` | ⏳ Pending fix |
| BUG-06 | TẤT CẢ | `href="trangchu.html"` → file không tồn tại (đúng là `index.html`) | ⏳ Pending fix |
| BUG-07 | dangnhap.html | Form không có xử lý thực | Dự kiến sau |

## Checklist Debug HTML

```
□ Mỗi file có đúng 1 <!DOCTYPE html> ở dòng đầu
□ Có 1 <html>, 1 <head>, 1 <body> — đóng đúng thứ tự
□ <link CSS> và <style> nằm trong <head>
□ <script> nằm cuối <body> (hoặc dùng defer)
□ Không có thẻ ngoài <html>...</html>
□ Tất cả href link đến file thực sự tồn tại
□ Ảnh src đúng đường dẫn relative
```

## Checklist Debug Three.js

```
□ THREE object tồn tại (gõ `window.THREE` trong console)
□ Canvas element có id đúng (#bg-canvas)
□ renderer.setSize() được gọi
□ animate() loop có requestAnimationFrame
□ Không có WebGL context error (check console)
□ GLTFLoader import đúng nếu dùng model
□ Model path tương đối đúng từ root dự án
```

## Checklist Debug GSAP

```
□ gsap object tồn tại (gõ `window.gsap` trong console)
□ ScrollTrigger đã register: gsap.registerPlugin(ScrollTrigger)
□ trigger element selector tồn tại trong DOM
□ start/end giá trị hợp lý ("top 80%" không phải "top: 80%")
□ Lenis smooth scroll init trước GSAP ScrollTrigger
```

## Checklist Debug Tailwind v4 CDN

```
□ Script tag: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4">
□ Custom theme dùng <style type="text/tailwindcss"> không phải <style>
□ Class không bị purge (CDN không purge, nhưng đúng syntax)
□ backdrop-blur hoạt động: kiểm tra browser có hỗ trợ backdrop-filter
□ Không mix Tailwind v3 và v4 class syntax
```

## Template Paste Lỗi Vào AI

```
🐛 Vấn đề: [TRIỆU CHỨNG]
📍 File: [TÊN FILE, dòng X]
💻 Code lỗi:
[PASTE CODE]
🔴 Console error:
[PASTE ERROR]
🎯 Mong muốn: [KẾT QUẢ ĐÚng]
```

## Lỗi Thường Gặp Với Three.js + Tailwind

**Vấn đề:** Canvas bị che bởi Tailwind reset
```css
/* Thêm vào custom.css */
#bg-canvas {
  position: fixed !important;
  z-index: 0;
  pointer-events: none;
}
```

**Vấn đề:** backdrop-blur không hiển thị
```html
<!-- Thêm thuộc tính này vào element cha -->
<div class="relative z-10 ...">
  <!-- glass card content -->
</div>
```
