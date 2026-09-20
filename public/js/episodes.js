// js/episodes.js — Data fetch, character & episode render, search, bookmark
// Vanilla JS ES6 — no dependencies

'use strict';

/* ──────────────────────────────────────────
   STATE
   ────────────────────────────────────────── */
let APP_DATA      = null;   // full JSON
let currentSeason = 3;
let searchQuery   = '';
const STORAGE_KEYS = {
  BOOKMARKS: 'drstone_bookmarks',   // { s1: [1,2], s2: [], s3: [7] }
  PROGRESS:  'drstone_progress',    // { season: 3, ep: 7 }
};

/* ──────────────────────────────────────────
   INIT
   ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  APP_DATA = await loadData();
  if (!APP_DATA) return;

  renderCharacters(APP_DATA.characters);
  renderEpisodes(currentSeason);
  initSeasonTabs();
  initSearch();
  initCharFilter();
  initScrollReveal();
  initContinueWatching();
  animateStats(APP_DATA);
});

/* ──────────────────────────────────────────
   DATA
   ────────────────────────────────────────── */
async function loadData() {
  try {
    const res  = await fetch('data/episodes.json');
    if (!res.ok) throw new Error('fetch failed');
    return await res.json();
  } catch (e) {
    console.error('❌ Không load được data/episodes.json:', e);
    return null;
  }
}

/* ──────────────────────────────────────────
   STATS COUNTER (hero)
   ────────────────────────────────────────── */
function animateStats(data) {
  const totalSeasons = data?.seasons?.length || 4;
  const totalEps     = data?.seasons ? data.seasons.reduce((s, se) => s + se.totalEpisodes, 0) : 70;
  const totalChars   = 109; // Toàn bộ 109 nhân vật trong Bách Khoa Toàn Thư (characters.html)
  animateCount('stat-seasons', totalSeasons, 800);
  animateCount('stat-eps',     totalEps,     900);
  animateCount('stat-chars',   totalChars,   900);
}

function animateCount(id, target, duration) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent  = Math.round(easeOut(progress) * target);
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/* ──────────────────────────────────────────
   CHARACTER CARDS
   ────────────────────────────────────────── */
function renderCharacters(characters) {
  const grid = document.getElementById('char-grid');
  if (!grid) return;
  grid.innerHTML = '';

  characters.forEach((c, i) => {
    const delay = (i % 4) + 1;
    grid.insertAdjacentHTML('beforeend', characterCard(c, delay));
  });

  // Observe for reveal
  observeReveal(grid.querySelectorAll('.char-card'));
}

function characterCard(c, delay) {
  const factionMap = {
    science: {
      name: 'Vương Quốc Khoa Học',
      badge: 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30',
      border: 'border-[#00e5ff]/30 hover:border-[#00e5ff]/60',
      glow: 'bg-[#00e5ff]/5 border-[#00e5ff]/40 shadow-[0_8px_32px_rgba(0,229,255,0.15)]',
      color: '#00e5ff'
    },
    might: {
      name: 'Đế Quốc Sức Mạnh',
      badge: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30',
      border: 'border-[#ef4444]/30 hover:border-[#ef4444]/60',
      glow: 'bg-[#ef4444]/5 border-[#ef4444]/40 shadow-[0_8px_32px_rgba(239,68,68,0.15)]',
      color: '#ef4444'
    },
    village: {
      name: 'Làng Ishigami',
      badge: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30',
      border: 'border-[#fbbf24]/30 hover:border-[#fbbf24]/60',
      glow: 'bg-[#fbbf24]/5 border-[#fbbf24]/40 shadow-[0_8px_32px_rgba(251,191,36,0.15)]',
      color: '#fbbf24'
    },
    astronaut: {
      name: 'Phi Hành Gia ISS',
      badge: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
      border: 'border-[#38bdf8]/30 hover:border-[#38bdf8]/60',
      glow: 'bg-[#38bdf8]/5 border-[#38bdf8]/40 shadow-[0_8px_32px_rgba(56,189,248,0.15)]',
      color: '#38bdf8'
    }
  };

  const faction = factionMap[c.faction] || factionMap.science;
  const iq = c.stats?.iq ?? 70;
  const str = c.stats?.strength ?? 50;
  const agi = c.stats?.agility ?? 75;

  const tags = (c.tags || []).map(t =>
    `<span class="text-[0.58rem] px-2 py-0.5 rounded
      bg-white/5 text-gray-300 border border-white/10 font-medium">${t}</span>`
  ).join('');

  return `
  <div class="char-card flip-card h-[430px] [perspective:1000px] cursor-pointer"
       data-faction="${c.faction || 'science'}" data-reveal data-delay="${delay}">
    <div class="flip-card-inner relative w-full h-full">

      <!-- FRONT -->
      <div class="flip-front absolute inset-0 rounded-2xl overflow-hidden
           bg-[#0a0f1d]/90 backdrop-blur-xl
           border ${faction.border}
           shadow-[0_8px_32px_rgba(0,0,0,0.6)]
           transition-all duration-300">
        
        <!-- Faction Ribbon Top -->
        <div class="absolute top-2.5 right-2.5 z-10">
          <span class="text-[0.6rem] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${faction.badge}">
            ${faction.name}
          </span>
        </div>

        <div class="h-[250px] overflow-hidden relative bg-[#050810]">
          <img src="${c.thumb}" alt="${c.name}" loading="lazy"
               onerror="this.onerror=null; this.src='assets/images/characters/hd/senku.png';"
               class="w-full h-full object-cover object-top
                      transition-transform duration-700 hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t
               from-[#0a0f1d] via-[#0a0f1d]/30 to-transparent"></div>
        </div>

        <div class="p-4">
          <span class="inline-block text-[0.62rem] font-bold tracking-wider uppercase
               px-2.5 py-0.5 rounded border ${faction.badge} mb-1.5 truncate max-w-full block text-center">${c.role}</span>
          <h3 class="font-['Rajdhani'] text-lg font-bold leading-tight truncate text-white">${c.name}</h3>
          <p class="text-xs text-[#6b7a99] mt-0.5 truncate">${c.nameJp}</p>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[0.62rem] text-[#4d6185]">
            <span>Chỉ số: IQ ${iq} · STR ${str}</span>
            <span class="text-[#00d4ff] hover:underline">Xem thẻ ↻</span>
          </div>
        </div>
      </div>

      <!-- BACK -->
      <div class="flip-back absolute inset-0 rounded-2xl p-4 flex flex-col justify-between
           ${faction.glow} backdrop-blur-xl">
        
        <!-- Header -->
        <div>
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="text-[0.58rem] font-bold tracking-widest uppercase ${faction.badge} px-2 py-0.5 rounded">
                ${faction.name}
              </span>
              <h3 class="font-['Rajdhani'] text-lg font-bold text-white mt-1 leading-tight">${c.name}</h3>
              <p class="text-[0.7rem] text-[#6b7a99]">${c.nameJp} · CV: ${c.voice || 'N/A'}</p>
            </div>
          </div>

          <p class="text-[0.74rem] text-gray-300 leading-relaxed mt-2 line-clamp-3">${c.desc}</p>
        </div>

        <!-- Stats Bars -->
        <div class="space-y-1.5 my-2 bg-black/30 p-2.5 rounded-xl border border-white/5">
          <div>
            <div class="flex justify-between text-[0.65rem] font-bold text-gray-300 mb-0.5">
              <span>Trí Tuệ (IQ)</span>
              <span class="text-[#00e5ff] font-mono">${iq}%</span>
            </div>
            <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-[#00e5ff] to-[#3b82f6] h-full rounded-full" style="width: ${iq}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[0.65rem] font-bold text-gray-300 mb-0.5">
              <span>Sức Mạnh (STR)</span>
              <span class="text-[#ef4444] font-mono">${str}%</span>
            </div>
            <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-[#ef4444] to-[#f97316] h-full rounded-full" style="width: ${str}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between text-[0.65rem] font-bold text-gray-300 mb-0.5">
              <span>Nhanh Nhẹn / Khéo (AGI)</span>
              <span class="text-[#fbbf24] font-mono">${agi}%</span>
            </div>
            <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-[#fbbf24] to-[#84cc16] h-full rounded-full" style="width: ${agi}%"></div>
            </div>
          </div>
        </div>

        <!-- Quote & Tags -->
        <div>
          ${c.quote ? `
          <div class="relative pl-2.5 border-l-2 border-white/30 bg-white/[0.02] py-1 pr-1.5 rounded-r mb-2.5">
            <p class="text-[0.68rem] italic text-amber-200/90 leading-tight line-clamp-2">
              “${c.quote}”
            </p>
          </div>
          ` : ''}
          <div class="flex flex-wrap gap-1">${tags}</div>
        </div>

      </div>
    </div>
  </div>`;
}

/* ──────────────────────────────────────────
   CHARACTER FILTER
   ────────────────────────────────────────── */
function initCharFilter() {
  const factionStyles = {
    all: { border: 'border-[#00e5ff]', bg: 'bg-[#00e5ff]/15', text: 'text-[#00e5ff]' },
    science: { border: 'border-[#00e5ff]', bg: 'bg-[#00e5ff]/15', text: 'text-[#00e5ff]' },
    might: { border: 'border-[#ef4444]', bg: 'bg-[#ef4444]/15', text: 'text-[#ef4444]' },
    village: { border: 'border-[#fbbf24]', bg: 'bg-[#fbbf24]/15', text: 'text-[#fbbf24]' },
    astronaut: { border: 'border-[#38bdf8]', bg: 'bg-[#38bdf8]/15', text: 'text-[#38bdf8]' }
  };

  document.querySelectorAll('.char-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Reset all buttons
      document.querySelectorAll('.char-filter-btn').forEach(b => {
        b.classList.remove(
          'active',
          'border-[#00e5ff]', 'bg-[#00e5ff]/15', 'text-[#00e5ff]',
          'border-[#ef4444]', 'bg-[#ef4444]/15', 'text-[#ef4444]',
          'border-[#fbbf24]', 'bg-[#fbbf24]/15', 'text-[#fbbf24]',
          'border-[#38bdf8]', 'bg-[#38bdf8]/15', 'text-[#38bdf8]'
        );
        b.classList.add('border-white/15', 'bg-white/5', 'text-[#6b7a99]');
      });

      // Active state for clicked button
      const style = factionStyles[filter] || factionStyles.all;
      btn.classList.add('active', style.border, style.bg, style.text);
      btn.classList.remove('border-white/15', 'bg-white/5', 'text-[#6b7a99]');

      // Filter character cards
      document.querySelectorAll('.char-card').forEach(card => {
        const show = filter === 'all' || card.dataset.faction === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* ──────────────────────────────────────────
   EPISODE RENDER
   ────────────────────────────────────────── */
function renderEpisodes(seasonId) {
  const grid  = document.getElementById('ep-grid');
  const empty = document.getElementById('ep-empty');
  if (!grid || !APP_DATA) return;

  const season = APP_DATA.seasons.find(s => s.id === Number(seasonId));
  if (!season) return;

  const bookmarks = getBookmarks();
  const bSet      = new Set((bookmarks[`s${seasonId}`] || []).map(Number));

  const query = searchQuery.trim().toLowerCase();
  const eps   = season.episodes.filter(e =>
    !query || e.title.toLowerCase().includes(query)
  );

  grid.innerHTML = '';
  if (eps.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  eps.forEach((ep, i) => {
    const delay      = (i % 5) + 1;
    const isBookmark = bSet.has(ep.ep);
    const thumb      = ep.thumb || `assets/images/episodes/tap${ep.ep}ss${seasonId}.jpg`;
    const hasYt      = ep.youtube && ep.youtube.length > 5;
    grid.insertAdjacentHTML('beforeend', episodeCard(ep, seasonId, delay, isBookmark, thumb, hasYt));
  });

  observeReveal(grid.querySelectorAll('.ep-card'));
}

function episodeCard(ep, season, delay, isBookmark, thumb, hasYt) {
  const seasonColors = { 1: '#e67e22', 2: '#c0392b', 3: '#39ff14' };
  const badgeColor   = seasonColors[season] || '#39ff14';
  const bookmarkCls  = isBookmark
    ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/10'
    : 'border-white/10 text-[#6b7a99] hover:border-[#ffd700] hover:text-[#ffd700]';

  const cardEl = hasYt
    ? `<a href="${ep.youtube}" target="_blank" rel="noopener noreferrer"`
    : `<div`;
  const cardClose = hasYt ? `</a>` : `</div>`;

  return `
  ${cardEl}
    class="ep-card block rounded-xl overflow-hidden cursor-pointer
           bg-white/[0.04] backdrop-blur-lg
           border border-[#00d4ff]/20
           transition-all duration-300
           hover:border-[#00d4ff]/50 hover:-translate-y-1.5
           hover:shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(0,212,255,0.15)]
           opacity-0 translate-y-6 [transition-delay:${delay*0.07}s]"
    data-ep="${ep.ep}" data-season="${season}">

    <!-- Thumbnail -->
    <div class="relative aspect-video overflow-hidden bg-[#0a0f1e]">
      <img src="${thumb}" alt="Tập ${ep.ep}" loading="lazy"
           class="w-full h-full object-cover transition-transform duration-500
                  hover:scale-110">
      <!-- Play overlay -->
      <div class="absolute inset-0 bg-black/30 flex items-center justify-center
           opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div class="play-icon w-11 h-11 rounded-full bg-[#00d4ff] flex items-center
             justify-center text-black text-base font-bold shadow-lg">▶</div>
      </div>
      <!-- Ep badge -->
      <span class="absolute top-2 left-2 text-black text-[0.58rem] font-black
           px-2 py-0.5 rounded tracking-wider"
           style="background: ${badgeColor}">TẬP ${String(ep.ep).padStart(2,'0')}</span>
      ${!hasYt ? `<span class="absolute top-2 right-2 text-[#6b7a99] text-[0.55rem]
           font-bold px-1.5 py-0.5 rounded bg-[#0a0f1e]/80">Sắp có</span>` : ''}
    </div>

    <!-- Info -->
    <div class="p-3 pb-1">
      <p class="text-[0.58rem] text-[#00d4ff] font-bold tracking-wider uppercase mb-1">
        Season ${season} · Tập ${ep.ep}
      </p>
      <h4 class="font-['Rajdhani'] text-sm font-bold leading-snug
           text-[#e8f4f8] line-clamp-2">${ep.title}</h4>
    </div>

    <!-- Actions -->
    <div class="flex gap-2 px-3 pb-3 pt-2">
      <span class="flex-1 text-center py-1.5 rounded text-[0.72rem] font-['Rajdhani'] font-bold
           uppercase tracking-wider
           bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff]
           hover:bg-[#00d4ff] hover:text-black transition-colors duration-200">
        ${hasYt ? 'Xem' : 'Sắp có'}
      </span>
      <button class="bookmark-btn w-8 h-8 rounded border flex items-center justify-center
              text-sm transition-all duration-200 flex-shrink-0 ${bookmarkCls}"
              data-season="${season}" data-ep="${ep.ep}"
              aria-label="Bookmark tập ${ep.ep}"
              onclick="event.preventDefault(); event.stopPropagation(); toggleBookmark(${season}, ${ep.ep}, this)">
        🔖
      </button>
    </div>
  ${cardClose}`;
}

/* ──────────────────────────────────────────
   SEASON TABS
   ────────────────────────────────────────── */
function initSeasonTabs() {
  document.querySelectorAll('.season-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.season-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSeason = Number(btn.dataset.season);
      searchQuery   = '';
      const input   = document.getElementById('ep-search');
      if (input) input.value = '';
      document.getElementById('search-clear')?.classList.add('hidden');
      renderEpisodes(currentSeason);
    });
  });
}

/* ──────────────────────────────────────────
   SEARCH
   ────────────────────────────────────────── */
function initSearch() {
  const input = document.getElementById('ep-search');
  const clear = document.getElementById('search-clear');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value;
      clear?.classList.toggle('hidden', !searchQuery);
      renderEpisodes(currentSeason);
    }, 280);
  });

  clear?.addEventListener('click', () => {
    input.value  = '';
    searchQuery  = '';
    clear.classList.add('hidden');
    renderEpisodes(currentSeason);
  });

  // Shortcut: press "/" to focus
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) {
      e.preventDefault();
      input.focus();
    }
    if (e.key === 'Escape') input.blur();
  });
}

/* ──────────────────────────────────────────
   BOOKMARK
   ────────────────────────────────────────── */
function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS)) || {}; }
  catch { return {}; }
}

function setBookmarks(bm) {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bm));
}

window.toggleBookmark = function(season, ep, btn) {
  const bm  = getBookmarks();
  const key = `s${season}`;
  bm[key]   = bm[key] || [];

  const idx = bm[key].indexOf(ep);
  if (idx === -1) {
    bm[key].push(ep);
    btn.classList.add('border-[#ffd700]', 'text-[#ffd700]', 'bg-[#ffd700]/10');
    btn.classList.remove('border-white/10', 'text-[#6b7a99]');
    if (window.CitizenPass) {
      window.CitizenPass.addSciencePoints(15, `Đã lưu Tập ${ep} (Season ${season}) vào danh bạ khoa học!`);
    }
  } else {
    bm[key].splice(idx, 1);
    btn.classList.remove('border-[#ffd700]', 'text-[#ffd700]', 'bg-[#ffd700]/10');
    btn.classList.add('border-white/10', 'text-[#6b7a99]');
  }
  setBookmarks(bm);

  // Save progress
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({ season, ep }));
};

/* ──────────────────────────────────────────
   CONTINUE WATCHING
   ────────────────────────────────────────── */
function initContinueWatching() {
  const chip  = document.getElementById('continue-chip');
  const title = document.getElementById('continue-title');
  if (!chip || !title || !APP_DATA) return;

  const progress = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS)); }
    catch { return null; }
  })();

  if (!progress) return;

  const season = APP_DATA.seasons.find(s => s.id === Number(progress.season));
  const ep     = season?.episodes.find(e => e.ep === Number(progress.ep));
  if (!ep) return;

  title.textContent = `S${progress.season} · Tập ${ep.ep}: ${ep.title}`;
  chip.classList.remove('hidden');

  // Auto-hide after 8 sec
  setTimeout(() => chip.classList.add('hidden'), 8000);
}

/* ──────────────────────────────────────────
   SCROLL REVEAL (Intersection Observer)
   ────────────────────────────────────────── */
function initScrollReveal() {
  observeReveal(document.querySelectorAll('[data-reveal]'));
  initScienceHUD();
  initCard3DTilt();
}

function observeReveal(elements) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────
   SCIENCE SCROLL HUD ("10 TỶ % KHOA HỌC")
   ────────────────────────────────────────── */
function initScienceHUD() {
  const liquid = document.getElementById('hud-liquid');
  const percent = document.getElementById('hud-percent');
  if (!liquid || !percent) return;

  window.addEventListener('scroll', () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    const pct = Math.round(progress * 100);

    liquid.style.height = `${pct}%`;

    if (progress >= 0.96) {
      percent.textContent = '10 TỶ %';
      percent.classList.add('text-[#39ff14]');
      percent.classList.remove('text-[#00d4ff]');
    } else {
      // Số nhảy khoa học nhân cấp số nhân lên 10 tỷ
      const multiplier = Math.round(progress * 100000000);
      percent.textContent = multiplier > 1000 ? `${(multiplier / 1000000).toFixed(1)}M %` : `${pct}%`;
      percent.classList.add('text-[#00d4ff]');
      percent.classList.remove('text-[#39ff14]');
    }
  }, { passive: true });
}

/* ──────────────────────────────────────────
   3D TILT EFFECT ON CARDS
   ────────────────────────────────────────── */
function initCard3DTilt() {
  const cards = document.querySelectorAll('.char-card, .ep-card, .story-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = (-y / (rect.height / 2)) * 8;
      const rotateY = (x / (rect.width / 2)) * 8;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`;
      card.style.transition = 'none';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease-out';
    });
  });
}
