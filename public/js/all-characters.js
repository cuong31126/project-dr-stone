/**
 * all-characters.js - Logic cho trang Bách Khoa Toàn Thư 109 Nhân Vật Dr. Stone
 */

let allCharacters = [];
let filteredCharacters = [];
let currentFilter = 'all';
let currentSearch = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 24;
let showAll = false;

// Color and badge mapping for factions
const FACTION_MAP = {
  science: {
    name: 'Vương Quốc Khoa Học',
    badge: 'bg-[#00e5ff]/15 text-[#00e5ff] border-[#00e5ff]/30',
    border: 'border-[#00e5ff]/20 hover:border-[#00e5ff]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]',
    accent: '#00e5ff'
  },
  village: {
    name: 'Làng Ishigami',
    badge: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/30',
    border: 'border-[#fbbf24]/20 hover:border-[#fbbf24]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    accent: '#fbbf24'
  },
  might: {
    name: 'Đế Quốc Sức Mạnh',
    badge: 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30',
    border: 'border-[#ef4444]/20 hover:border-[#ef4444]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    accent: '#ef4444'
  },
  petrification: {
    name: 'Vương Quốc Hóa Đá',
    badge: 'bg-[#a855f7]/15 text-[#a855f7] border-[#a855f7]/30',
    border: 'border-[#a855f7]/20 hover:border-[#a855f7]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    accent: '#a855f7'
  },
  american: {
    name: 'Thuộc Địa Mỹ Dr. Xeno',
    badge: 'bg-[#f97316]/15 text-[#f97316] border-[#f97316]/30',
    border: 'border-[#f97316]/20 hover:border-[#f97316]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.2)]',
    accent: '#f97316'
  },
  astronaut: {
    name: 'Phi Hành Gia ISS',
    badge: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30',
    border: 'border-[#38bdf8]/20 hover:border-[#38bdf8]/60',
    glow: 'hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]',
    accent: '#38bdf8'
  }
};

async function init() {
  const loadingEl = document.getElementById('loading-spinner');
  try {
    const res = await fetch('data/all_characters.json');
    if (!res.ok) throw new Error('Không thể nạp dữ liệu');
    allCharacters = await res.json();
    filteredCharacters = [...allCharacters];

    if (loadingEl) loadingEl.style.display = 'none';

    setupEventListeners();
    applyFilterAndRender();
  } catch (err) {
    console.error('Error loading characters:', err);
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div class="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          <p class="font-bold">Lỗi tải dữ liệu nhân vật.</p>
          <p class="text-xs text-gray-400 mt-1">Vui lòng tải lại trang hoặc kiểm tra kết nối mạng.</p>
        </div>`;
    }
  }
}

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim().toLowerCase();
      currentPage = 1;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearch ? 'block' : 'none';
      }
      applyFilterAndRender();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.style.display = 'none';
        currentPage = 1;
        applyFilterAndRender();
      }
    });
  }

  // Faction filter buttons
  document.querySelectorAll('.faction-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.faction-tab-btn').forEach(b => {
        b.classList.remove('active', 'border-[#00d4ff]', 'bg-[#00d4ff]/15', 'text-[#00d4ff]');
        b.classList.add('border-white/10', 'bg-white/5', 'text-gray-400');
      });

      btn.classList.add('active', 'border-[#00d4ff]', 'bg-[#00d4ff]/15', 'text-[#00d4ff]');
      btn.classList.remove('border-white/10', 'bg-white/5', 'text-gray-400');

      currentFilter = btn.dataset.faction;
      currentPage = 1;
      applyFilterAndRender();
    });
  });

  // Toggle show all
  const toggleShowAllBtn = document.getElementById('toggle-show-all');
  if (toggleShowAllBtn) {
    toggleShowAllBtn.addEventListener('click', () => {
      showAll = !showAll;
      toggleShowAllBtn.textContent = showAll ? 'Phân Trang (24/Trang)' : 'Hiển Thị Tất Cả';
      renderGrid();
      renderPagination();
    });
  }
}

function applyFilterAndRender() {
  filteredCharacters = allCharacters.filter(c => {
    const matchFaction = currentFilter === 'all' || c.faction === currentFilter;
    const matchSearch = !currentSearch ||
      c.name.toLowerCase().includes(currentSearch) ||
      (c.role && c.role.toLowerCase().includes(currentSearch)) ||
      (c.factionName && c.factionName.toLowerCase().includes(currentSearch));
    return matchFaction && matchSearch;
  });

  // Update counter
  const counterEl = document.getElementById('result-count');
  if (counterEl) {
    counterEl.textContent = `Hiển thị ${filteredCharacters.length} / ${allCharacters.length} nhân vật`;
  }

  renderGrid();
  renderPagination();
}

function renderGrid() {
  const grid = document.getElementById('all-char-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  if (filteredCharacters.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  let displayList = filteredCharacters;
  if (!showAll) {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    displayList = filteredCharacters.slice(start, end);
  }

  grid.innerHTML = displayList.map(c => {
    const fMeta = FACTION_MAP[c.faction] || FACTION_MAP.science;
    return `
    <div class="group relative rounded-2xl bg-[#0a0f1e]/80 border ${fMeta.border} ${fMeta.glow}
                backdrop-blur-xl p-4 flex flex-col justify-between transition-all duration-300
                hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      
      <div>
        <!-- Faction badge -->
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-[0.62rem] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${fMeta.badge}">
            ${c.factionName}
          </span>
          <span class="text-[0.6rem] font-mono text-gray-500">ID: ${c.id.slice(0, 10)}</span>
        </div>

        <!-- Portrait Image -->
        <div class="w-full h-44 rounded-xl overflow-hidden bg-[#050810] relative mb-3.5 border border-white/5">
          <img src="${c.thumb}" alt="${c.name}" loading="lazy"
               onerror="this.onerror=null; this.src='assets/images/characters/tap7ss3.jpg';"
               class="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent opacity-80"></div>
        </div>

        <!-- Info -->
        <h3 class="font-['Rajdhani'] text-lg font-bold text-white leading-tight group-hover:text-[#00d4ff] transition-colors truncate">
          ${c.name}
        </h3>
        <p class="text-xs text-[#6b7a99] mt-0.5 line-clamp-2">
          ${c.role || 'Cư dân thế giới đá'}
        </p>
      </div>

      <!-- Action Button -->
      <div class="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
        <a href="${c.wiki}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00d4ff] hover:text-white transition-colors">
          <span>Xem Wiki Fandom</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      </div>

    </div>`;
  }).join('');
}

function renderPagination() {
  const pagContainer = document.getElementById('pagination-container');
  if (!pagContainer) return;

  if (showAll || filteredCharacters.length <= ITEMS_PER_PAGE) {
    pagContainer.style.display = 'none';
    return;
  }

  pagContainer.style.display = 'flex';
  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);

  let html = `
    <button class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-300 hover:border-[#00d4ff] hover:text-[#00d4ff] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      &laquo; Trước
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    const active = i === currentPage;
    html += `
      <button class="w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
        active
          ? 'border-[#00d4ff] bg-[#00d4ff]/20 text-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.3)]'
          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/30 hover:text-white'
      }" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-gray-300 hover:border-[#00d4ff] hover:text-[#00d4ff] disabled:opacity-30 disabled:pointer-events-none transition-colors"
            ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      Sau &raquo;
    </button>
  `;

  pagContainer.innerHTML = html;
}

window.changePage = function(page) {
  currentPage = page;
  renderGrid();
  renderPagination();
  window.scrollTo({ top: 380, behavior: 'smooth' });
};

document.addEventListener('DOMContentLoaded', init);
