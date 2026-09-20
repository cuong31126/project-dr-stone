/**
 * inventions.js — Dr. Stone Inventions Encyclopedia
 * Loads 453+ inventions from data/inventions.json
 * Method 1: Fandom CDN Direct URLs with loading="lazy" and fallback onerror icons
 * Interactive filtering by Category, Search by Name/Formula/Chapter, and 3D Periodic Table Bridge
 */

(function () {
  'use strict';

  let allInventions = [];
  let filteredInventions = [];
  let currentCategory = 'all';
  let currentSearch = '';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 24;

  const categoryIcons = {
    all: '🌌',
    chemistry: '🧪',
    electricity: '⚡',
    communications: '📡',
    vehicles: '🚢',
    weapons: '🏹',
    food: '🍲',
    aerospace: '🚀',
    metallurgy: '⚙️',
    tools: '🪓'
  };

  document.addEventListener('DOMContentLoaded', initInventions);

  async function initInventions() {
    const container = document.getElementById('inventions-grid');
    if (!container) return;

    try {
      const res = await fetch('data/inventions.json');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      allInventions = await res.json();
      filteredInventions = [...allInventions];

      setupControls();
      renderInventions();
    } catch (err) {
      console.warn('Could not load inventions.json, rendering fallback:', err);
    }
  }

  function setupControls() {
    // Search input
    const searchInput = document.getElementById('inv-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          currentSearch = e.target.value.trim().toLowerCase();
          currentPage = 1;
          applyFilters();
        }, 250);
      });
    }

    // Category filter buttons
    const filterBtns = document.querySelectorAll('.inv-cat-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active', 'bg-[#00d4ff]', 'text-black', 'border-[#00d4ff]', 'shadow-[0_0_15px_rgba(0,212,255,0.4)]');
          b.classList.add('text-[#8fa0ba]', 'border-white/10', 'bg-white/[0.04]');
        });

        btn.classList.add('active', 'bg-[#00d4ff]', 'text-black', 'border-[#00d4ff]', 'shadow-[0_0_15px_rgba(0,212,255,0.4)]');
        btn.classList.remove('text-[#8fa0ba]', 'border-white/10', 'bg-white/[0.04]');

        currentCategory = btn.getAttribute('data-category') || 'all';
        currentPage = 1;
        applyFilters();
      });
    });

    // Pagination buttons
    const prevBtn = document.getElementById('inv-prev-page');
    const nextBtn = document.getElementById('inv-next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderInventions();
          scrollToGrid();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredInventions.length / ITEMS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          renderInventions();
          scrollToGrid();
        }
      });
    }
  }

  function applyFilters() {
    filteredInventions = allInventions.filter(item => {
      // Category match
      const catMatch = (currentCategory === 'all' || item.category === currentCategory);
      if (!catMatch) return false;

      // Search match
      if (!currentSearch) return true;
      const matchName = item.name.toLowerCase().includes(currentSearch);
      const matchFormula = item.formula && item.formula.toLowerCase().includes(currentSearch);
      const matchNotes = item.notes && item.notes.toLowerCase().includes(currentSearch);
      const matchChapter = item.chapter && item.chapter.toString().includes(currentSearch);
      const matchElements = item.elements && item.elements.some(el => el.toLowerCase() === currentSearch);

      return matchName || matchFormula || matchNotes || matchChapter || matchElements;
    });

    renderInventions();
  }

  function renderInventions() {
    const container = document.getElementById('inventions-grid');
    const countEl = document.getElementById('inv-total-count');
    const paginationEl = document.getElementById('inv-pagination');
    const pageIndicator = document.getElementById('inv-page-indicator');
    const prevBtn = document.getElementById('inv-prev-page');
    const nextBtn = document.getElementById('inv-next-page');

    if (!container) return;

    if (countEl) {
      countEl.textContent = `${filteredInventions.length} / ${allInventions.length}`;
    }

    if (filteredInventions.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="text-5xl mb-3">🔍</div>
          <h3 class="font-['Orbitron'] font-bold text-lg text-white mb-2">Không tìm thấy phát minh phù hợp</h3>
          <p class="font-['Rajdhani'] text-sm text-[#94a3b8]">Hãy thử tìm kiếm với từ khóa khác như "nital", "iron", "radio", "Fe", "Cu"...</p>
        </div>
      `;
      if (paginationEl) paginationEl.classList.add('hidden');
      return;
    }

    if (paginationEl) paginationEl.classList.remove('hidden');

    const totalPages = Math.ceil(filteredInventions.length / ITEMS_PER_PAGE);
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredInventions.slice(startIdx, startIdx + ITEMS_PER_PAGE);

    if (pageIndicator) {
      pageIndicator.textContent = `Trang ${currentPage} / ${totalPages}`;
    }
    if (prevBtn) prevBtn.disabled = (currentPage === 1);
    if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);

    let html = '';
    paginatedItems.forEach(item => {
      const fallbackIcon = item.icon || categoryIcons[item.category] || '🧪';
      const hasFormula = Boolean(item.formula);
      const hasElements = item.elements && item.elements.length > 0;

      html += `
        <article class="inv-card group relative p-5 rounded-3xl bg-[#0a0f1e]/85 border border-white/10 hover:border-[#00d4ff]/50 hover:shadow-[0_8px_30px_rgba(0,212,255,0.18)] transition-all duration-300 flex flex-col justify-between backdrop-blur-xl">
          
          <!-- Card Header & Image -->
          <div>
            <div class="relative w-full h-44 rounded-2xl overflow-hidden bg-black/40 border border-white/5 mb-4 flex items-center justify-center">
              
              <!-- Fandom Image (Phương Án 1: CDN Trực Tiếp + lazy load + onerror fallback) -->
              <img 
                src="${item.image}" 
                alt="${item.name}"
                loading="lazy"
                class="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';"
              />
              
              <!-- Fallback Icon if CDN fails -->
              <div class="fallback-icon-holder absolute inset-0 hidden items-center justify-center bg-radial from-[#00d4ff]/10 to-[#050814]">
                <span class="text-6xl drop-shadow-[0_0_15px_rgba(0,212,255,0.6)]">${fallbackIcon}</span>
              </div>

              <!-- Category Badge -->
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 border border-white/15 backdrop-blur-md text-[0.65rem] font-['Rajdhani'] font-bold text-[#00d4ff] uppercase tracking-wider flex items-center gap-1.5">
                <span>${fallbackIcon}</span>
                <span>${item.categoryName}</span>
              </span>

              ${item.chapter ? `
                <span class="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-[#39ff14]/15 border border-[#39ff14]/30 text-[0.6rem] font-mono font-bold text-[#39ff14]">
                  Chap ${item.chapter}
                </span>
              ` : ''}
            </div>

            <!-- Title & Formula -->
            <div class="mb-3">
              <h3 class="font-['Orbitron'] font-bold text-base sm:text-lg text-white group-hover:text-[#00d4ff] transition-colors line-clamp-1" title="${item.name}">
                ${item.name}
              </h3>
              ${hasFormula ? `
                <div class="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-[#ffd700]">
                  <span>⚗️</span>
                  <span>${item.formula}</span>
                </div>
              ` : ''}
            </div>

            <!-- Notes / Description -->
            <p class="font-['Rajdhani'] text-xs sm:text-sm text-[#94a3b8] line-clamp-3 mb-4 leading-relaxed">
              ${item.notes || 'Phát minh khoa học ghi dấu trong quá trình tái sinh nền văn minh thời kỳ đồ đá của Senku.'}
            </p>
          </div>

          <!-- Bottom Actions & 3D Periodic Table Bridge -->
          <div class="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            ${hasElements ? `
              <div class="flex flex-wrap items-center gap-1">
                <span class="text-[0.65rem] font-['Rajdhani'] text-[#64748b] uppercase mr-1">Nguyên tố:</span>
                ${item.elements.slice(0, 4).map(el => `
                  <span class="px-1.5 py-0.5 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[0.65rem] font-mono font-bold text-[#00d4ff]">
                    ${el}
                  </span>
                `).join('')}
                ${item.elements.length > 4 ? `
                  <span class="text-[0.65rem] font-mono text-[#64748b]">+${item.elements.length - 4}</span>
                ` : ''}
              </div>
            ` : `
              <span class="text-[0.65rem] font-['Rajdhani'] text-[#64748b]">Dr. Stone Invention</span>
            `}

            <!-- Soi 3D Button -->
            ${hasElements ? `
              <button 
                type="button"
                class="inv-jump-3d-btn px-2.5 py-1 rounded-xl bg-gradient-to-r from-[#00d4ff]/20 to-[#39ff14]/20 border border-[#00d4ff]/40 hover:border-[#00d4ff] text-[0.68rem] font-['Rajdhani'] font-bold text-[#00d4ff] hover:text-white transition-all hover:scale-105 cursor-pointer flex items-center gap-1 whitespace-nowrap"
                data-elements="${item.elements.join(',')}"
                data-name="${item.name}"
                data-formula="${item.formula || ''}"
                title="Soi nguyên tố của phát minh này trên Bảng Tuần Hoàn 3D"
              >
                <span>🔍</span>
                <span>Soi 3D</span>
              </button>
            ` : ''}
          </div>

        </article>
      `;
    });

    container.innerHTML = html;

    // Attach click event for 3D Table Jump
    const jumpBtns = container.querySelectorAll('.inv-jump-3d-btn');
    jumpBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const elements = (btn.getAttribute('data-elements') || '').split(',').filter(Boolean);
        const name = btn.getAttribute('data-name');
        const formula = btn.getAttribute('data-formula');

        if (window.highlightElementsIn3DTable) {
          window.highlightElementsIn3DTable(elements, name, formula);
        } else {
          // Fallback scroll to table
          const ptSection = document.getElementById('pt-container');
          if (ptSection) {
            ptSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      });
    });
  }

  function scrollToGrid() {
    const sec = document.getElementById('inventions-section');
    if (sec) {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

})();
