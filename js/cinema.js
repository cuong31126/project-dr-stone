/**
 * js/cinema.js
 * Hệ thống Rạp Chiếu Phim Khoa Học Dr. Stone
 * Hỗ trợ 70 tập (Season 1, 2, 3, 4), Phân trang nhẹ 12 tập/trang, Nguồn đôi Ani-One & AnimeVietsub, Watch Tracker
 */

'use strict';

const CINEMA_CONFIG = {
  PAGE_SIZE: 12,
  STORAGE_KEYS: {
    WATCHED: 'drstone_watched_episodes',
    BOOKMARKS: 'drstone_bookmarks',
    LAST_WATCHED: 'drstone_last_watched_info'
  },
  ANIMEVIETSUB_URLS: {
    1: (ep) => `https://animevietsub.tv/phim/dr-stone-a3374/tap-${ep}.html`,
    2: (ep) => `https://animevietsub.tv/phim/dr-stone-stone-wars-a3861/tap-${ep}.html`,
    3: (ep) => `https://animevietsub.tv/phim/dr-stone-new-world-a4674/tap-${ep}.html`,
    4: (ep) => `https://animevietsub.tv/phim/dr-stone-science-future-a5214/tap-${ep}.html`
  },
  ANIONE_URLS: {
    1: 'https://www.youtube.com/playlist?list=PLOVZwvNm10lXf4AofFk4Jmjp7HvfN67dx',
    2: 'https://www.youtube.com/playlist?list=PLxSscENEp7Jjd9DclPvIJd8fmLnYFiA-c',
    3: 'https://www.youtube.com/playlist?list=PLOVZwvNm10lXwY00kVyHn3aF5o4LMsL47',
    4: 'https://www.youtube.com/results?search_query=Ani-One+Vietnam+Dr+Stone+Science+Future'
  }
};

let cinemaData = null;
let allEpisodes = [];
let currentSeason = 'all'; // 'all' | 1 | 2 | 3 | 4
let currentStatus = 'all'; // 'all' | 'unwatched' | 'watched' | 'bookmarked'
let searchQuery = '';
let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  await initCinema();
});

async function initCinema() {
  cinemaData = await fetchEpisodes();
  if (!cinemaData) return;

  // Làm phẳng toàn bộ danh sách 70 tập
  allEpisodes = [];
  cinemaData.seasons.forEach(s => {
    s.episodes.forEach(e => {
      allEpisodes.push({
        ...e,
        seasonId: s.id,
        seasonTitle: s.title,
        seasonSubtitle: s.subtitle,
        seasonYear: s.year,
        key: `${s.id}-${e.ep}`
      });
    });
  });

  initFilters();
  initSearch();
  updateProgressHUD();
  renderEpisodes();
}

async function fetchEpisodes() {
  try {
    const res = await fetch('data/episodes.json');
    if (!res.ok) throw new Error('Failed to load data/episodes.json');
    return await res.json();
  } catch (err) {
    console.error('❌ Lỗi tải dữ liệu tập phim:', err);
    return null;
  }
}

/* ── QUẢN LÝ TIẾN ĐỘ & LOCALSTORAGE ── */
function getWatchedMap() {
  try {
    return JSON.parse(localStorage.getItem(CINEMA_CONFIG.STORAGE_KEYS.WATCHED)) || {};
  } catch {
    return {};
  }
}

function setWatchedMap(map) {
  localStorage.setItem(CINEMA_CONFIG.STORAGE_KEYS.WATCHED, JSON.stringify(map));
}

function isWatched(seasonId, epNum) {
  const map = getWatchedMap();
  return !!map[`${seasonId}-${epNum}`];
}

function toggleWatched(seasonId, epNum) {
  const map = getWatchedMap();
  const key = `${seasonId}-${epNum}`;
  if (map[key]) {
    delete map[key];
  } else {
    map[key] = true;
  }
  setWatchedMap(map);
  updateProgressHUD();
  renderEpisodes();
}

function markWatchedOnPlay(seasonId, epNum, sourceName) {
  const map = getWatchedMap();
  const key = `${seasonId}-${epNum}`;
  map[key] = true;
  setWatchedMap(map);

  localStorage.setItem(
    CINEMA_CONFIG.STORAGE_KEYS.LAST_WATCHED,
    JSON.stringify({ season: seasonId, ep: epNum, source: sourceName, time: Date.now() })
  );

  updateProgressHUD();
  renderEpisodes();
}

function getBookmarksMap() {
  try {
    return JSON.parse(localStorage.getItem(CINEMA_CONFIG.STORAGE_KEYS.BOOKMARKS)) || {};
  } catch {
    return {};
  }
}

function setBookmarksMap(bm) {
  localStorage.setItem(CINEMA_CONFIG.STORAGE_KEYS.BOOKMARKS, JSON.stringify(bm));
}

function isBookmarked(seasonId, epNum) {
  const bm = getBookmarksMap();
  const list = bm[`s${seasonId}`] || [];
  return list.includes(epNum);
}

function toggleBookmark(seasonId, epNum) {
  const bm = getBookmarksMap();
  const key = `s${seasonId}`;
  bm[key] = bm[key] || [];

  const idx = bm[key].indexOf(epNum);
  if (idx === -1) {
    bm[key].push(epNum);
  } else {
    bm[key].splice(idx, 1);
  }
  setBookmarksMap(bm);
  renderEpisodes();
}

/* ── CẬP NHẬT THANH TIẾN ĐỘ WATCH TRACKER ── */
function updateProgressHUD() {
  const watchedMap = getWatchedMap();
  const watchedCount = Object.keys(watchedMap).length;
  const totalCount = allEpisodes.length || 70;
  const pct = Math.min(100, Math.round((watchedCount / totalCount) * 100));

  const countEl = document.getElementById('hud-watched-count');
  const percentEl = document.getElementById('hud-watched-percent');
  const barEl = document.getElementById('hud-progress-bar');
  const tierEl = document.getElementById('hud-fan-tier');

  if (countEl) countEl.textContent = `${watchedCount}/${totalCount} tập`;
  if (percentEl) percentEl.textContent = `(${pct}%)`;
  if (barEl) barEl.style.width = `${pct}%`;

  let tierName = "🗿 Cư Dân Hóa Thạch (Chưa cày)";
  let tierColor = "text-[#6b7a99]";

  if (pct === 100) {
    tierName = "👑 Thiên Tài 10 Tỷ % · Senku Ishigami (Hoàn thành 100%)";
    tierColor = "text-[#39ff14]";
  } else if (pct >= 75) {
    tierName = "⚡ Bậc Thầy Vương Quốc Khoa Học";
    tierColor = "text-[#00d4ff]";
  } else if (pct >= 50) {
    tierName = "🚢 Nhà Thám Hiểm Thuyền Perseus";
    tierColor = "text-[#ffd700]";
  } else if (pct >= 25) {
    tierName = "🏹 Chiến Binh Làng Ishigami";
    tierColor = "text-[#f97316]";
  } else if (pct > 0) {
    tierName = "🧪 Tập Sự Giả Kim Chrome";
    tierColor = "text-[#38bdf8]";
  }

  if (tierEl) {
    tierEl.textContent = tierName;
    tierEl.className = `text-xs font-['Rajdhani'] font-bold uppercase tracking-wider ${tierColor}`;
  }
}

/* ── LỌC & PHÂN TRANG DANH SÁCH TẬP ── */
function getFilteredEpisodes() {
  const watchedMap = getWatchedMap();
  const query = searchQuery.trim().toLowerCase();

  return allEpisodes.filter(ep => {
    // 1. Lọc Season
    if (currentSeason !== 'all' && ep.seasonId !== Number(currentSeason)) {
      return false;
    }

    // 2. Lọc Trạng thái
    const watched = !!watchedMap[ep.key];
    const bookmarked = isBookmarked(ep.seasonId, ep.ep);

    if (currentStatus === 'watched' && !watched) return false;
    if (currentStatus === 'unwatched' && watched) return false;
    if (currentStatus === 'bookmarked' && !bookmarked) return false;

    // 3. Tìm kiếm
    if (query) {
      const matchTitle = ep.title.toLowerCase().includes(query);
      const matchEpNum = `tập ${ep.ep}`.includes(query) || `ep ${ep.ep}`.includes(query) || `${ep.ep}` === query;
      const matchSeason = `season ${ep.seasonId}`.includes(query) || `s${ep.seasonId}`.includes(query);
      if (!matchTitle && !matchEpNum && !matchSeason) return false;
    }

    return true;
  });
}

function renderEpisodes() {
  const grid = document.getElementById('episodes-grid');
  const emptyState = document.getElementById('episodes-empty');
  const countBadge = document.getElementById('filtered-count-badge');
  const paginationContainer = document.getElementById('pagination-container');
  if (!grid) return;

  const filtered = getFilteredEpisodes();
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / CINEMA_CONFIG.PAGE_SIZE) || 1;

  if (currentPage > totalPages) currentPage = 1;

  if (countBadge) {
    countBadge.textContent = `${totalItems} tập`;
  }

  if (totalItems === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Cắt tập phim cho trang hiện tại
  const startIndex = (currentPage - 1) * CINEMA_CONFIG.PAGE_SIZE;
  const pageEpisodes = filtered.slice(startIndex, startIndex + CINEMA_CONFIG.PAGE_SIZE);

  grid.innerHTML = pageEpisodes.map(ep => createEpisodeCardHTML(ep)).join('');

  renderPagination(totalPages);
}

/* ── TẠO HTML CARD TẬP PHIM (VỚI 2 NÚT NGUỒN XEM TRỰC TIẾP) ── */
function createEpisodeCardHTML(ep) {
  const watched = isWatched(ep.seasonId, ep.ep);
  const bookmarked = isBookmarked(ep.seasonId, ep.ep);

  // Ảnh thumbnail
  let thumb = ep.thumb;
  if (!thumb && ep.youtube) {
    const idMatch = ep.youtube.match(/(?:watch\?v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (idMatch) {
      thumb = `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`;
    }
  }
  if (!thumb) {
    if (ep.seasonId === 3) {
      thumb = `assets/images/episodes/tap${ep.ep}ss3.jpg`;
    } else {
      thumb = 'assets/images/anh-ngang.jpg';
    }
  }

  // URL nguồn xem
  const anioneUrl = ep.youtube || CINEMA_CONFIG.ANIONE_URLS[ep.seasonId] || CINEMA_CONFIG.ANIONE_URLS[3];
  const animevietsubUrl = CINEMA_CONFIG.ANIMEVIETSUB_URLS[ep.seasonId](ep.ep);

  // Huy hiệu mùa
  const seasonColors = {
    1: { badge: 'bg-[#e67e22] text-black', text: 'text-[#e67e22]' },
    2: { badge: 'bg-[#c0392b] text-white', text: 'text-[#ef4444]' },
    3: { badge: 'bg-[#39ff14] text-black', text: 'text-[#39ff14]' },
    4: { badge: 'bg-[#a855f7] text-white', text: 'text-[#c084fc]' }
  };
  const color = seasonColors[ep.seasonId] || seasonColors[3];

  const cardBorderClass = watched
    ? 'border-[#00f5a0]/40 shadow-[0_4px_25px_rgba(0,245,160,0.15)]'
    : 'border-white/10 hover:border-[#00d4ff]/40';

  return `
    <div class="group relative rounded-2xl overflow-hidden bg-[#0a0f1e]/90 border ${cardBorderClass} transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
         data-season="${ep.seasonId}" data-ep="${ep.ep}">

      <!-- Thumbnail & Header Badges -->
      <div class="relative aspect-video overflow-hidden bg-black/60">
        <img src="${thumb}" alt="${ep.title}" loading="lazy"
             onerror="this.onerror=null; this.src='assets/images/anh-ngang.jpg';"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">

        <div class="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-black/40"></div>

        <!-- Badges Top Left -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span class="text-[0.62rem] font-['Orbitron'] font-black px-2 py-0.5 rounded ${color.badge}">
            TẬP ${String(ep.ep).padStart(2, '0')}
          </span>
          <span class="text-[0.6rem] font-['Rajdhani'] font-bold px-1.5 py-0.5 rounded bg-black/70 text-gray-300 border border-white/10">
            S${ep.seasonId}
          </span>
          ${ep.seasonId === 4 ? `
            <span class="text-[0.58rem] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white uppercase tracking-wider">
              MỚI
            </span>
          ` : ''}
        </div>

        <!-- Bookmark Button (Top Right) -->
        <button type="button"
                onclick="event.stopPropagation(); toggleBookmark(${ep.seasonId}, ${ep.ep})"
                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-10 ${
                  bookmarked
                    ? 'bg-[#ffd700] text-black shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                    : 'bg-black/60 text-gray-400 hover:text-white hover:bg-black/80'
                }"
                title="${bookmarked ? 'Bỏ lưu tập phim' : 'Lưu xem sau'}">
          🔖
        </button>

        <!-- Watched status indicator -->
        ${watched ? `
          <div class="absolute bottom-2 left-2.5 z-10 flex items-center gap-1 text-[0.6rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-[#00f5a0] bg-black/85 px-2.5 py-0.5 rounded-full border border-[#00f5a0]/40">
            <span>✓ Đã cày xong</span>
          </div>
        ` : ''}
      </div>

      <!-- Episode Info -->
      <div class="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-[0.65rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-[#6b7a99] mb-1">
            <span>${ep.seasonTitle} · ${ep.seasonSubtitle}</span>
            <span>${ep.seasonYear}</span>
          </div>
          <h3 class="font-['Rajdhani'] text-base sm:text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-[#00d4ff] transition-colors">
            ${ep.title}
          </h3>
        </div>

        <!-- NGUỒN XEM ĐÔI (DUAL-SOURCE BUTTONS) -->
        <div class="space-y-2 mt-4 pt-3 border-t border-white/5">
          <div class="text-[0.6rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-[#6b7a99] flex items-center justify-between">
            <span>Chọn nguồn xem:</span>
            <button type="button" onclick="toggleWatched(${ep.seasonId}, ${ep.ep})" class="hover:text-[#00f5a0] transition-colors">
              ${watched ? 'Hủy đánh dấu' : 'Đánh dấu đã xem'}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <!-- Nguồn 1: Ani-One / YouTube -->
            <a href="${anioneUrl}" target="_blank" rel="noopener noreferrer"
               onclick="markWatchedOnPlay(${ep.seasonId}, ${ep.ep}, 'Ani-One')"
               class="py-2 px-2.5 rounded-xl text-[0.7rem] font-['Rajdhani'] font-bold uppercase tracking-wider bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 transition-all flex items-center justify-center gap-1.5 text-center shadow-sm">
              <span>🔴 Ani-One (YT)</span>
            </a>

            <!-- Nguồn 2: AnimeVietsub -->
            <a href="${animevietsubUrl}" target="_blank" rel="noopener noreferrer"
               onclick="markWatchedOnPlay(${ep.seasonId}, ${ep.ep}, 'AnimeVietsub')"
               class="py-2 px-2.5 rounded-xl text-[0.7rem] font-['Rajdhani'] font-bold uppercase tracking-wider bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 transition-all flex items-center justify-center gap-1.5 text-center shadow-sm">
              <span>🟣 Vietsub HD</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  `;
}

/* ── PHÂN TRANG (PAGINATION CONTROLS) ── */
function renderPagination(totalPages) {
  const container = document.getElementById('pagination-container');
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = `
    <div class="flex items-center justify-center gap-1.5 py-6">
      <!-- Nút Trước -->
      <button type="button"
              onclick="goToPage(${currentPage - 1})"
              ${currentPage === 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-white/10"'}
              class="px-3.5 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-[#6b7a99] transition-all">
        ◀ Trang trước
      </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `
      <button type="button"
              onclick="goToPage(${i})"
              class="w-9 h-9 rounded-xl text-xs font-['Orbitron'] font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#00d4ff] to-[#39ff14] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
                  : 'bg-white/5 border border-white/10 text-[#6b7a99] hover:text-white hover:border-white/20'
              }">
        ${i}
      </button>
    `;
  }

  html += `
      <!-- Nút Sau -->
      <button type="button"
              onclick="goToPage(${currentPage + 1})"
              ${currentPage === totalPages ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="hover:bg-white/10"'}
              class="px-3.5 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-[#6b7a99] transition-all">
        Trang sau ▶
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  const filtered = getFilteredEpisodes();
  const totalPages = Math.ceil(filtered.length / CINEMA_CONFIG.PAGE_SIZE) || 1;
  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderEpisodes();

  // Cuộn nhẹ về đầu danh sách tập
  const target = document.getElementById('episodes-grid-top');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ── BỘ LỌC MÙA & TRẠNG THÁI ── */
function initFilters() {
  // 1. Season tabs
  document.querySelectorAll('.filter-season-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-season-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#00d4ff]/15', 'text-[#00d4ff]', 'border-[#00d4ff]');
        b.classList.add('bg-white/5', 'text-[#6b7a99]', 'border-white/10');
      });
      btn.classList.add('active', 'bg-[#00d4ff]/15', 'text-[#00d4ff]', 'border-[#00d4ff]');
      btn.classList.remove('bg-white/5', 'text-[#6b7a99]', 'border-white/10');

      currentSeason = btn.dataset.season;
      currentPage = 1;
      renderEpisodes();
    });
  });

  // 2. Status tabs
  document.querySelectorAll('.filter-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-status-btn').forEach(b => {
        b.classList.remove('active', 'bg-[#39ff14]/15', 'text-[#39ff14]', 'border-[#39ff14]');
        b.classList.add('bg-white/5', 'text-[#6b7a99]', 'border-white/10');
      });
      btn.classList.add('active', 'bg-[#39ff14]/15', 'text-[#39ff14]', 'border-[#39ff14]');
      btn.classList.remove('bg-white/5', 'text-[#6b7a99]', 'border-white/10');

      currentStatus = btn.dataset.status;
      currentPage = 1;
      renderEpisodes();
    });
  });
}

/* ── TÌM KIẾM TẬP PHIM ── */
function initSearch() {
  const searchInput = document.getElementById('episode-search-input');
  const clearBtn = document.getElementById('clear-episode-search');
  if (!searchInput) return;

  let timer;
  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = searchInput.value;
      currentPage = 1;
      if (clearBtn) clearBtn.style.display = searchQuery ? 'flex' : 'none';
      renderEpisodes();
    }, 250);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      currentPage = 1;
      clearBtn.style.display = 'none';
      renderEpisodes();
      searchInput.focus();
    });
  }
}

// Export functions to window
window.toggleWatched = toggleWatched;
window.toggleBookmark = toggleBookmark;
window.markWatchedOnPlay = markWatchedOnPlay;
window.goToPage = goToPage;
