/**
 * js/cinema.js
 * Hệ thống Rạp Chiếu Phim Khoa Học Dr. Stone
 * Chuẩn hóa 5 Phần (95 Tập): Season 1 (24), Season 2 (11), Anime Special Ryusui (1), Season 3 (22), Season 4 (37)
 * Phân trang 12 tập/trang, Nguồn Ani-One (S1) & AnimeVietsub Full HD (Trọn bộ), Watch Tracker + SP CitizenPass
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
    1: (ep) => `https://animevietsub.li/phim/dr-stone-a3374/tap-${ep}.html`,
    2: (ep) => `https://animevietsub.li/phim/dr-stone-stone-wars-a3861/tap-${ep}.html`,
    special: (ep) => `https://animevietsub.li/phim/dr-stone-ryusui-i1-a4285/tap-01-85140.html`,
    3: (ep) => `https://animevietsub.li/phim/dr-stone-new-world-a4674/tap-${ep}.html`,
    4: (ep) => `https://animevietsub.li/phim/dr-stone-4th-season-i4-a5533/xem-phim.html`
  },
  ANIONE_URLS: {
    1: 'https://www.youtube.com/playlist?list=PLOVZwvNm10lXf4AofFk4Jmjp7HvfN67dx'
    // Bỏ link Ani-One từ Season 2 trở đi theo chỉ đạo
  }
};

let cinemaData = null;
let allEpisodes = [];
let currentSeason = 'all'; // 'all' | '1' | '2' | 'special' | '3' | '4'
let currentStatus = 'all'; // 'all' | 'unwatched' | 'watched' | 'bookmarked'
let searchQuery = '';
let currentPage = 1;
let currentModalSeason = null;
let currentModalEp = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initCinema();
});

async function initCinema() {
  cinemaData = await fetchEpisodes();
  if (!cinemaData) return;

  // Làm phẳng toàn bộ danh sách 95 tập (5 Phần theo đúng trình tự thời gian)
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
  initModalListeners();
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
    if (window.CitizenPass) {
      const epLabel = String(seasonId) === 'special' ? 'Anime Special (Ryusui)' : `Tập ${epNum} (Season ${seasonId})`;
      window.CitizenPass.addSciencePoints(25, `Đã đánh dấu hoàn thành ${epLabel}!`);
    }
  }
  setWatchedMap(map);
  updateProgressHUD();
  renderEpisodes();
}

function markWatchedOnPlay(seasonId, epNum, sourceName) {
  const map = getWatchedMap();
  const key = `${seasonId}-${epNum}`;
  const isNew = !map[key];
  map[key] = true;
  setWatchedMap(map);

  if (isNew && window.CitizenPass) {
    const epLabel = String(seasonId) === 'special' ? 'Anime Special (Ryusui)' : `Tập ${epNum} (Season ${seasonId})`;
    window.CitizenPass.addSciencePoints(25, `Khởi động ${epLabel} qua nguồn ${sourceName}!`);
  }

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
    if (window.CitizenPass) {
      const epLabel = String(seasonId) === 'special' ? 'Anime Special (Ryusui)' : `Tập ${epNum} (Season ${seasonId})`;
      window.CitizenPass.addSciencePoints(15, `Đã lưu ${epLabel} vào danh sách xem sau!`);
    }
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
  const totalCount = allEpisodes.length || 95;
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
    tierName = "👑 Thiên Tài 10 Tỷ % · Senku Ishigami (Hoàn thành 100% 95 Tập)";
    tierColor = "text-[#39ff14]";
  } else if (pct >= 75) {
    tierName = "⚡ Bậc Thầy Vương Quốc Khoa Học (Khám phá Tương Lai)";
    tierColor = "text-[#00d4ff]";
  } else if (pct >= 50) {
    tierName = "🚢 Thuyền Trưởng Vượt Đại Dương (Hành trình Perseus)";
    tierColor = "text-[#ffd700]";
  } else if (pct >= 25) {
    tierName = "🏹 Chiến Binh Làng Ishigami (Stone Wars)";
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
    // 1. Lọc Season (chấp nhận cả '1', '2', 'special', '3', '4')
    if (currentSeason !== 'all' && String(ep.seasonId) !== String(currentSeason)) {
      return false;
    }

    // 2. Lọc Trạng thái
    const watched = !!watchedMap[ep.key];
    const bookmarked = isBookmarked(ep.seasonId, ep.ep);

    if (currentStatus === 'watched' && !watched) return false;
    if (currentStatus === 'unwatched' && watched) return false;
    if (currentStatus === 'bookmarked' && !bookmarked) return false;

    // 3. Tìm kiếm linh hoạt
    if (query) {
      const matchTitle = ep.title.toLowerCase().includes(query);
      const matchEpNum = `tập ${ep.ep}`.includes(query) || `ep ${ep.ep}`.includes(query) || `${ep.ep}` === query;
      const matchSeason = `season ${ep.seasonId}`.includes(query) || `s${ep.seasonId}`.includes(query) || (String(ep.seasonId) === 'special' && (query.includes('special') || query.includes('ryusui')));
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

function getEpisodeVietsubUrl(ep) {
  if (ep.vietSubUrl) return ep.vietSubUrl;
  const sId = ep.seasonId;
  const builder = CINEMA_CONFIG.ANIMEVIETSUB_URLS[sId];
  return typeof builder === 'function' ? builder(ep.ep) : 'https://animevietsub.li/';
}

/* ── TẠO HTML CARD TẬP PHIM (CHUẨN 5 PHẦN · NGUỒN CHÍNH XÁC) ── */
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
    if (ep.seasonId === 2) {
      thumb = 'assets/images/episodes/drstone-season-2-stonewars.jpg';
    } else if (String(ep.seasonId) === 'special') {
      thumb = 'assets/images/episodes/tap1ss3.jpg';
    } else if (ep.seasonId === 4) {
      thumb = 'assets/images/episodes/drstone-season-4-sciencefuture.jpg';
    } else if (ep.seasonId === 3) {
      thumb = `assets/images/episodes/tap${ep.ep + 1}ss3.jpg`;
    } else {
      thumb = 'assets/images/episodes/drstone-season-2-stonewars.jpg';
    }
  }

  // URL nguồn xem
  const anioneUrl = ep.youtube || (ep.seasonId === 1 ? CINEMA_CONFIG.ANIONE_URLS[1] : null);
  const animevietsubUrl = getEpisodeVietsubUrl(ep);

  // Huy hiệu mùa & màu sắc chuẩn token
  const seasonColors = {
    1: { badge: 'bg-[#e67e22] text-black', text: 'text-[#e67e22]', label: 'S1' },
    2: { badge: 'bg-[#c0392b] text-white', text: 'text-[#ef4444]', label: 'S2' },
    special: { badge: 'bg-[#ffd700] text-black', text: 'text-[#ffd700]', label: 'SPECIAL' },
    3: { badge: 'bg-[#00d4ff] text-black', text: 'text-[#00d4ff]', label: 'S3' },
    4: { badge: 'bg-[#a855f7] text-white', text: 'text-[#c084fc]', label: 'S4' }
  };
  const color = seasonColors[ep.seasonId] || seasonColors[3];

  const cardBorderClass = watched
    ? 'border-[#00f5a0]/40 shadow-[0_4px_25px_rgba(0,245,160,0.15)]'
    : 'border-white/10 hover:border-[#00d4ff]/40';

  const fallbackCover = String(ep.seasonId) === '4'
    ? 'assets/images/episodes/drstone-season-4-sciencefuture.jpg'
    : 'assets/images/episodes/drstone-season-2-stonewars.jpg';

  const isSpecial = String(ep.seasonId) === 'special';
  const isSeason1 = Number(ep.seasonId) === 1;

  return `
    <div class="group relative rounded-2xl overflow-hidden bg-[#0a0f1e]/90 border ${cardBorderClass} transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
         data-season="${ep.seasonId}" data-ep="${ep.ep}">

      <!-- Thumbnail & Header Badges: Season 1 mở Rạp Chiếu, Season 2+ mở trực tiếp AnimeVietsub -->
      <div class="relative aspect-video overflow-hidden bg-black/60 cursor-pointer"
           onclick="${isSeason1 ? `openCinemaModal('${ep.seasonId}', ${ep.ep})` : `window.open('${animevietsubUrl}', '_blank'); markWatchedOnPlay('${ep.seasonId}', ${ep.ep}, 'AnimeVietsub');`}"
           title="${isSeason1 ? 'Nhấn để mở xem trong Rạp Chiếu Phim' : 'Nhấn để mở xem Full HD trên AnimeVietsub (+25 SP)'}">
        <img src="${thumb}" alt="${ep.title}" loading="lazy"
             onerror="this.onerror=null; this.src='${fallbackCover}';"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">

        <div class="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-black/40"></div>

        <!-- Center Glowing Play Button -->
        <div class="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all pointer-events-none z-10">
          <div class="w-12 h-12 rounded-full bg-black/70 border ${isSeason1 ? 'border-[#00d4ff]/60 text-[#00d4ff]' : 'border-cyan-400/60 text-cyan-300'} backdrop-blur-md flex items-center justify-center text-base font-black shadow-[0_0_20px_rgba(0,212,255,0.4)] group-hover:border-[#39ff14] group-hover:text-[#39ff14] group-hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] transition-all">
            ▶
          </div>
        </div>

        <!-- Badges Top Left -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span class="text-[0.62rem] font-['Orbitron'] font-black px-2 py-0.5 rounded ${color.badge}">
            ${isSpecial ? 'SPECIAL · TẬP 01' : `TẬP ${String(ep.ep).padStart(2, '0')}`}
          </span>
          <span class="text-[0.6rem] font-['Rajdhani'] font-bold px-1.5 py-0.5 rounded bg-black/70 text-gray-300 border border-white/10">
            ${color.label}
          </span>
          ${isSpecial ? `
            <span class="text-[0.58rem] font-black px-1.5 py-0.5 rounded bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] uppercase tracking-wider">
              CHÍNH TRUYỆN
            </span>
          ` : ''}
          ${ep.seasonId === 4 ? `
            <span class="text-[0.58rem] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-[#a855f7] to-[#ec4899] text-white uppercase tracking-wider">
              MỚI (37 TẬP)
            </span>
          ` : ''}
        </div>

        <!-- Bookmark Button (Top Right) -->
        <button type="button"
                onclick="event.stopPropagation(); toggleBookmark('${ep.seasonId}', ${ep.ep})"
                class="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all z-20 ${bookmarked
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
          <h3 class="font-['Rajdhani'] text-base sm:text-lg font-bold text-white leading-tight line-clamp-2 group-hover:text-[#00d4ff] transition-colors cursor-pointer"
              onclick="${isSeason1 ? `openCinemaModal('${ep.seasonId}', ${ep.ep})` : `window.open('${animevietsubUrl}', '_blank'); markWatchedOnPlay('${ep.seasonId}', ${ep.ep}, 'AnimeVietsub');`}">
            ${ep.title}
          </h3>
          ${ep.desc ? `
            <p class="text-xs text-[#8a9bb8] line-clamp-2 mt-1.5 leading-relaxed font-normal">
              ${ep.desc}
            </p>
          ` : ''}
        </div>

        <!-- BỘ ĐIỀU KHIỂN XEM PHIM -->
        <div class="space-y-2 mt-4 pt-3 border-t border-white/5">
          
          ${isSeason1 ? `
            <!-- Season 1: Có Video nhúng YouTube nên có nút Xem Trong Rạp -->
            <button type="button"
                    onclick="openCinemaModal('${ep.seasonId}', ${ep.ep})"
                    class="w-full py-2 px-3 rounded-xl text-xs font-['Rajdhani'] font-black uppercase tracking-wider bg-gradient-to-r from-[#00d4ff]/20 via-[#39ff14]/20 to-[#00d4ff]/20 hover:from-[#00d4ff] hover:to-[#39ff14] text-white hover:text-black border border-[#00d4ff]/40 hover:border-transparent transition-all flex items-center justify-center gap-2 shadow-sm">
              <span>▶ Xem Trong Rạp</span>
              <span class="text-[0.65rem] opacity-75 font-normal">(+25 SP)</span>
            </button>

            <!-- 2 Nguồn Xem Phụ của Season 1 -->
            <div class="grid grid-cols-2 gap-1.5">
              <a href="${anioneUrl}" target="_blank" rel="noopener noreferrer"
                 onclick="markWatchedOnPlay('${ep.seasonId}', ${ep.ep}, 'Ani-One')"
                 class="py-1.5 px-2 rounded-lg text-[0.65rem] font-['Rajdhani'] font-bold uppercase tracking-wider bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/25 transition-all flex items-center justify-center gap-1 text-center truncate"
                 title="Mở trên YouTube Ani-One Vietnam">
                <span>🔴 Ani-One</span>
              </a>

              <a href="${animevietsubUrl}" target="_blank" rel="noopener noreferrer"
                 onclick="markWatchedOnPlay('${ep.seasonId}', ${ep.ep}, 'AnimeVietsub')"
                 class="py-1.5 px-2 rounded-lg text-[0.65rem] font-['Rajdhani'] font-bold uppercase tracking-wider bg-purple-600/10 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/25 transition-all flex items-center justify-center gap-1 text-center truncate"
                 title="Mở trên AnimeVietsub HD">
                <span>🟣 Vietsub HD</span>
              </a>
            </div>
          ` : `
            <!-- Season 2, Special Ryusui, Season 3, Season 4: BỎ nút Xem Trong Rạp, chỉ có nút Xem Full HD AnimeVietsub (Màu Xanh Biển Perseus) -->
            <div>
              <a href="${animevietsubUrl}" target="_blank" rel="noopener noreferrer"
                 onclick="markWatchedOnPlay('${ep.seasonId}', ${ep.ep}, 'AnimeVietsub')"
                 class="w-full py-2.5 px-3 rounded-xl text-xs font-['Rajdhani'] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-600/20 via-blue-600/25 to-cyan-500/20 hover:from-cyan-500 hover:to-blue-600 text-cyan-200 hover:text-white border border-cyan-500/35 hover:border-cyan-400 transition-all flex items-center justify-center gap-2 text-center shadow-[0_4px_15px_rgba(6,182,212,0.15)] hover:shadow-[0_4px_25px_rgba(6,182,212,0.35)]"
                 title="Mở xem bản Full HD trên AnimeVietsub">
                <span>🌊 Xem Phim Full HD</span>
                <span class="text-[0.68rem] opacity-85 text-cyan-300 group-hover:text-white">(+25 SP ↗)</span>
              </a>
            </div>
          `}

          <div class="flex items-center justify-between text-[0.58rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-[#6b7a99] pt-1">
            <span>Tiến độ:</span>
            <button type="button" onclick="toggleWatched('${ep.seasonId}', ${ep.ep})" class="hover:text-[#00f5a0] transition-colors">
              ${watched ? 'Hủy đánh dấu' : 'Đánh dấu đã xem'}
            </button>
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
              class="w-9 h-9 rounded-xl text-xs font-['Orbitron'] font-bold transition-all ${isActive
        ? 'bg-[#00d4ff] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]'
        : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30'
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
  currentPage = page;
  renderEpisodes();
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

/* ══════════════════════════════════════════════════════════
   CINEMA MODAL CONTROLLER (RẠP CHIẾU PHIM SIÊU NHẸ)
   ══════════════════════════════════════════════════════════ */
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:watch\?v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? match[1] : null;
}

function openCinemaModal(seasonId, epNum) {
  const ep = allEpisodes.find(e => String(e.seasonId) === String(seasonId) && e.ep === Number(epNum));
  if (!ep) return;

  currentModalSeason = seasonId;
  currentModalEp = Number(epNum);

  const modal = document.getElementById('cinema-modal');
  const iframe = document.getElementById('cinema-iframe');
  const fallback = document.getElementById('cinema-fallback');
  const titleEl = document.getElementById('cinema-episode-title');
  const badgeEl = document.getElementById('cinema-season-badge');
  const prevBtn = document.getElementById('cinema-prev-btn');
  const nextBtn = document.getElementById('cinema-next-btn');
  const extAniOne = document.getElementById('cinema-ext-anione');
  const extVietsub = document.getElementById('cinema-ext-vietsub');
  const fallbackAniOne = document.getElementById('cinema-fallback-anione');
  const fallbackVietsub = document.getElementById('cinema-fallback-vietsub');

  if (!modal || !iframe) return;

  // 1. Cập nhật tiêu đề & huy hiệu mùa
  const isSpecial = String(ep.seasonId) === 'special';
  const isSeason1 = Number(ep.seasonId) === 1;

  if (titleEl) {
    if (isSpecial) {
      titleEl.textContent = `Anime Special: ${ep.title} (Chính Truyện)`;
    } else {
      titleEl.textContent = `Tập ${ep.ep}: ${ep.title}`;
    }
  }

  if (badgeEl) {
    const badgeColors = {
      1: 'bg-[#e67e22] text-black',
      2: 'bg-[#c0392b] text-white',
      special: 'bg-[#ffd700] text-black',
      3: 'bg-[#00d4ff] text-black',
      4: 'bg-[#a855f7] text-white'
    };

    if (isSpecial) {
      badgeEl.textContent = 'SPECIAL · RYUSUI (CHÍNH TRUYỆN)';
    } else {
      badgeEl.textContent = `S${ep.seasonId} · TẬP ${String(ep.ep).padStart(2, '0')}`;
    }
    badgeEl.className = `text-[0.62rem] sm:text-xs font-['Orbitron'] font-black px-2.5 py-0.5 rounded shadow-sm shrink-0 ${badgeColors[ep.seasonId] || badgeColors[3]}`;
  }

  // 2. Link ngoài: Chỉ hiện Ani-One cho Season 1; từ Season 2 trở đi CHỈ hiện AnimeVietsub
  const anioneUrl = ep.youtube || (isSeason1 ? CINEMA_CONFIG.ANIONE_URLS[1] : null);
  const animevietsubUrl = getEpisodeVietsubUrl(ep);

  if (extAniOne) {
    if (isSeason1 && anioneUrl) {
      extAniOne.href = anioneUrl;
      extAniOne.style.display = 'inline-flex';
    } else {
      extAniOne.style.display = 'none';
    }
  }

  if (extVietsub) {
    extVietsub.href = animevietsubUrl;
    extVietsub.style.display = 'inline-flex';
  }

  if (fallbackAniOne) {
    if (isSeason1 && anioneUrl) {
      fallbackAniOne.href = anioneUrl;
      fallbackAniOne.style.display = 'inline-flex';
    } else {
      fallbackAniOne.style.display = 'none';
    }
  }

  if (fallbackVietsub) {
    fallbackVietsub.href = animevietsubUrl;
    fallbackVietsub.style.display = 'inline-flex';
  }

  // 3. Xử lý Video ID & Lazy Iframe Loading (Siêu nhẹ: chỉ load khi có player)
  const ytId = extractYouTubeId(ep.youtube);
  if (ytId) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
    iframe.classList.remove('hidden');
    if (fallback) fallback.classList.add('hidden');
  } else {
    iframe.src = '';
    iframe.classList.add('hidden');
    if (fallback) {
      fallback.classList.remove('hidden');
      const fbTitle = document.getElementById('cinema-fallback-title');
      const fbDesc = document.getElementById('cinema-fallback-desc');
      if (fbTitle) {
        if (isSpecial) {
          fbTitle.textContent = `Anime Special: ${ep.title} (Chính Truyện)`;
        } else {
          fbTitle.textContent = `${ep.seasonTitle} Tập ${ep.ep}: ${ep.title}`;
        }
      }
      if (fbDesc) {
        if (isSpecial) {
          fbDesc.textContent = 'Tập phim Anime Special thuộc mạch truyện chính kết nối giữa Season 2 và Season 3. Mời bạn bấm mở xem trọn vẹn bản Full HD Vietsub bên dưới!';
        } else if (String(ep.seasonId) === '4') {
          fbDesc.textContent = 'Season 4 (Science Future) trọn bộ 37 tập phát sóng bản quyền. Mời bạn bấm mở xem ngay bản Full HD Vietsub bên dưới!';
        } else {
          fbDesc.textContent = 'Tập phim sẵn sàng để thưởng thức trên nguồn AnimeVietsub Full HD. Mời bạn bấm mở xem ngay bên dưới!';
        }
      }
    }
  }

  // 4. Tự động đánh dấu "Đã xem" + Thưởng +25 SP vào Thẻ Căn Cước Khoa Học 3D
  const watchedMap = getWatchedMap();
  const isAlreadyWatched = !!watchedMap[ep.key];
  if (!isAlreadyWatched) {
    watchedMap[ep.key] = true;
    setWatchedMap(watchedMap);
    if (window.CitizenPass) {
      const epLabel = isSpecial ? 'Anime Special (Ryusui)' : `Tập ${ep.ep} (${ep.seasonTitle})`;
      window.CitizenPass.addSciencePoints(25, `Thưởng xem phim: Đã hoàn thành ${epLabel}!`);
    }
    updateProgressHUD();
    renderEpisodes();
  }

  // Cập nhật trạng thái nút "Đã xem" trong modal
  updateModalWatchedButton();

  // 5. Cập nhật nút Tập Trước / Tập Sau (theo đúng thứ tự 95 tập)
  const curIdx = allEpisodes.findIndex(e => String(e.seasonId) === String(currentModalSeason) && e.ep === currentModalEp);
  if (prevBtn) {
    prevBtn.disabled = curIdx <= 0;
  }
  if (nextBtn) {
    nextBtn.disabled = curIdx === -1 || curIdx >= allEpisodes.length - 1;
  }

  // 6. Mở Modal & Khóa cuộn trang
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCinemaModal() {
  const modal = document.getElementById('cinema-modal');
  const iframe = document.getElementById('cinema-iframe');
  if (iframe) {
    // QUAN TRỌNG: Gán src = '' để ngắt âm thanh video ngay lập tức và giải phóng RAM trình duyệt
    iframe.src = '';
  }
  if (modal) {
    modal.classList.add('hidden');
  }
  document.body.style.overflow = '';
}

function playNextEpisode() {
  const curIdx = allEpisodes.findIndex(e => String(e.seasonId) === String(currentModalSeason) && e.ep === currentModalEp);
  if (curIdx !== -1 && curIdx < allEpisodes.length - 1) {
    const nextEp = allEpisodes[curIdx + 1];
    openCinemaModal(nextEp.seasonId, nextEp.ep);
  }
}

function playPrevEpisode() {
  const curIdx = allEpisodes.findIndex(e => String(e.seasonId) === String(currentModalSeason) && e.ep === currentModalEp);
  if (curIdx > 0) {
    const prevEp = allEpisodes[curIdx - 1];
    openCinemaModal(prevEp.seasonId, prevEp.ep);
  }
}

function updateModalWatchedButton() {
  const watchedBtn = document.getElementById('cinema-toggle-watched-btn');
  if (!watchedBtn || currentModalSeason === null || currentModalEp === null) return;
  const watched = isWatched(currentModalSeason, currentModalEp);
  if (watched) {
    watchedBtn.innerHTML = '<span>✓ Đã cày xong</span>';
    watchedBtn.className = 'px-3 py-1.5 rounded-xl border border-[#00f5a0]/50 bg-[#00f5a0]/15 text-[#00f5a0] transition-all flex items-center gap-1.5 font-bold shadow-sm';
  } else {
    watchedBtn.innerHTML = '<span>○ Chưa cày</span>';
    watchedBtn.className = 'px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 text-gray-400 transition-all flex items-center gap-1.5 font-bold';
  }
}

function initModalListeners() {
  const modal = document.getElementById('cinema-modal');
  const closeBtn = document.getElementById('cinema-close-btn');
  const prevBtn = document.getElementById('cinema-prev-btn');
  const nextBtn = document.getElementById('cinema-next-btn');
  const watchedBtn = document.getElementById('cinema-toggle-watched-btn');

  if (closeBtn) closeBtn.addEventListener('click', closeCinemaModal);
  if (prevBtn) prevBtn.addEventListener('click', playPrevEpisode);
  if (nextBtn) nextBtn.addEventListener('click', playNextEpisode);

  if (watchedBtn) {
    watchedBtn.addEventListener('click', () => {
      if (currentModalSeason !== null && currentModalEp !== null) {
        toggleWatched(currentModalSeason, currentModalEp);
        updateModalWatchedButton();
      }
    });
  }

  // Click ra ngoài modal backdrop để đóng
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCinemaModal();
      }
    });
  }

  // Phím tắt bàn phím: Esc (đóng), Mũi tên trái (tập trước), Mũi tên phải (tập sau)
  document.addEventListener('keydown', (e) => {
    const isModalOpen = modal && !modal.classList.contains('hidden');
    if (!isModalOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeCinemaModal();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      playNextEpisode();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      playPrevEpisode();
    }
  });
}

// Export Cinema Controller to Window
window.openCinemaModal = openCinemaModal;
window.closeCinemaModal = closeCinemaModal;
window.playNextEpisode = playNextEpisode;
window.playPrevEpisode = playPrevEpisode;
