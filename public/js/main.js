// js/main.js — App init: loader, navbar, dark mode, GSAP, Lenis, story counter, modals
// Vanilla JS — GSAP & Lenis loaded as global scripts

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initDarkMode();
  initTrailerModal();
  initStoryCounter();
  initArcFilters();

  // Wait for GSAP/Lenis to be available (they use defer)
  const waitForLibs = setInterval(() => {
    if (typeof gsap !== 'undefined' && typeof Lenis !== 'undefined') {
      clearInterval(waitForLibs);
      initLenis();
      initGSAP();
    }
  }, 50);
});

/* ──────────────────────────────────────────
   LOADER
   ────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;

  // Hide loader after animation completes (~2s)
  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => loader.remove(), 700);
  }, 1800);
}

/* ──────────────────────────────────────────
   NAVBAR
   ────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!navbar) return;

  // Scroll class
  const onScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('!bg-[#050810]/95', '!h-[60px]');
    } else {
      navbar.classList.remove('!bg-[#050810]/95', '!h-[60px]');
    }
    updateScrollProgress();
    updateActiveNavLink();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Hamburger toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden', isOpen);
      mobileMenu.classList.toggle('flex', !isOpen);
      hamburger.setAttribute('aria-expanded', String(!isOpen));

      // Animate hamburger lines
      const lines = hamburger.querySelectorAll('span');
      if (!isOpen) {
        lines[0].style.transform = 'translateY(7px) rotate(45deg)';
        lines[1].style.opacity   = '0';
        lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        lines.forEach(l => { l.style.transform = ''; l.style.opacity = ''; });
      }
    });

    // Close on mobile link click
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        mobileMenu.classList.remove('flex');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.querySelectorAll('span').forEach(l => {
          l.style.transform = ''; l.style.opacity = '';
        });
      });
    });
  }
}

/* ──────────────────────────────────────────
   SCROLL PROGRESS BAR
   ────────────────────────────────────────── */
function updateScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  bar.style.height = `${pct}%`;
}

/* ──────────────────────────────────────────
   ACTIVE NAV LINK (Intersection Observer)
   ────────────────────────────────────────── */
function updateActiveNavLink() {
  const sections  = ['hero', 'story', 'characters', 'episodes', 'trailer'];
  const navLinks  = document.querySelectorAll('.nav-link[data-section]');

  let current = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.scrollY >= el.offsetTop - 120) current = id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.section === current);
    link.classList.toggle('text-[#e8f4f8]', link.dataset.section === current);
    link.classList.toggle('text-[#6b7a99]', link.dataset.section !== current);
  });
}

/* ──────────────────────────────────────────
   DARK / LIGHT MODE
   ────────────────────────────────────────── */
function initDarkMode() {
  const btn  = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Load saved or system preference
  const saved = localStorage.getItem('drstone_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved ?? (prefersDark ? 'dark' : 'light');
  applyTheme(theme);

  btn?.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('drstone_theme', next);
  });
}

function applyTheme(theme) {
  const html = document.documentElement;
  const btn  = document.getElementById('theme-toggle');
  html.setAttribute('data-theme', theme);
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
}

/* ──────────────────────────────────────────
   LENIS SMOOTH SCROLL
   ────────────────────────────────────────── */
function initLenis() {
  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
    syncTouch: false,
  });

  // Sync GSAP ticker with Lenis
  if (typeof gsap !== 'undefined') {
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -70, duration: 1.4 });
      }
    });
  });
}

/* ──────────────────────────────────────────
   GSAP SCROLL ANIMATIONS
   ────────────────────────────────────────── */
function initGSAP() {
  gsap.registerPlugin(ScrollTrigger);

  // Story lines reveal on scroll
  gsap.utils.toArray('[data-story-line]').forEach((line, i) => {
    gsap.to(line, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      delay: i * 0.18,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#story',
        start: 'top 55%',
        once: true,
      }
    });
  });

  // Story counter count-up on scroll
  ScrollTrigger.create({
    trigger: '#story',
    start: 'top 80%',
    once: true,
    onEnter: () => animateStoryCounter(),
  });

  const storyEl = document.getElementById('story');
  if (storyEl && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStoryCounter();
          obs.disconnect();
        }
      });
    }, { threshold: 0.1 });
    obs.observe(storyEl);
  }

  // Characters section: stagger from scroll
  ScrollTrigger.create({
    trigger: '#characters',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.from('#char-grid .char-card', {
        y: 50, opacity: 0, duration: 0.7,
        stagger: { each: 0.1, from: 'start' },
        ease: 'power3.out',
      });
    }
  });

  // Trailer cards
  ScrollTrigger.create({
    trigger: '#trailer',
    start: 'top 70%',
    once: true,
    onEnter: () => {
      gsap.from('.trailer-card', {
        y: 40, opacity: 0, duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }
  });

  // Parallax on hero (subtle)
  gsap.to('#hero h1', {
    y: -40,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });
}

/* ──────────────────────────────────────────
   STORY COUNTER ANIMATION (TÍNH BẰNG GIÂY)
   ────────────────────────────────────────── */
let storyCounterAnimated = false;
function animateStoryCounter() {
  if (storyCounterAnimated) return;
  const el = document.getElementById('story-counter');
  if (!el) return;
  storyCounterAnimated = true;

  // Thời gian Senku đếm: ~3.718 năm hóa đá = 117.354.896.400 giây
  const target   = 117354896400;
  const duration = 2400; // ms
  const start    = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value    = Math.round(easeOutCubic(progress) * target);
    el.textContent = value.toLocaleString('vi-VN');
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toLocaleString('vi-VN');
    }
  };
  requestAnimationFrame(step);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

/* ──────────────────────────────────────────
   TRAILER VIDEO MODAL
   ────────────────────────────────────────── */
function initTrailerModal() {
  const modal  = document.getElementById('trailer-modal');
  const iframe = document.getElementById('modal-iframe');
  const close  = document.getElementById('modal-close');
  if (!modal || !iframe) return;

  // Open on trailer card click
  document.querySelectorAll('.trailer-card').forEach(card => {
    card.addEventListener('click', () => {
      const yt = card.dataset.yt;
      if (!yt) return;
      iframe.src = `${yt}?autoplay=1&rel=0`;
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close
  const closeModal = () => {
    modal.classList.remove('active');
    iframe.src = '';
    document.body.style.overflow = '';
  };

  close?.addEventListener('click', closeModal);

  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ──────────────────────────────────────────
   STORYLINE SEASON FILTER TABS
   ────────────────────────────────────────── */
function initArcFilters() {
  const filterContainer = document.getElementById('arc-season-filters');
  if (!filterContainer) return;

  const buttons = filterContainer.querySelectorAll('.arc-filter-btn');
  const cards = document.querySelectorAll('#arc-cards-container .arc-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active state on buttons
      buttons.forEach(b => {
        b.classList.remove('active', 'bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/50', 'shadow-[0_0_15px_rgba(0,212,255,0.2)]');
        b.classList.add('bg-white/[0.04]', 'text-gray-300', 'border-white/10');
      });
      btn.classList.add('active', 'bg-cyan-500/20', 'text-cyan-400', 'border-cyan-500/50', 'shadow-[0_0_15px_rgba(0,212,255,0.2)]');
      btn.classList.remove('bg-white/[0.04]', 'text-gray-300', 'border-white/10');

      // Filter arc cards
      cards.forEach(card => {
        const season = card.dataset.season;
        if (filter === 'all' || season === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.display = 'none';
        }
      });

      // Refresh ScrollTrigger if available
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    });
  });
}

