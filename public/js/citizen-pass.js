/**
 * js/citizen-pass.js
 * Hệ Thống Thẻ Căn Cước Vương Quốc Khoa Học 3D (Kingdom of Science Citizen Pass)
 * Quản lý danh tính cư dân, 3D Hologram Card, điểm khoa học (SP), và xuất ảnh thẻ PNG
 * Bản quyền: Dr. Stone Fan Website
 */

'use strict';

const CITIZEN_CONFIG = {
  STORAGE_KEY: 'drstone_citizen_profile',
  FACTIONS: {
    science: {
      id: 'science',
      name: 'Vương Quốc Khoa Học',
      japanese: '科学王国',
      leader: 'Senku Ishigami',
      color: '#00d4ff',
      accentColor: '#39ff14',
      badge: '🧪',
      tagline: 'Khôi phục nền văn minh bằng 2 triệu năm tri thức loài người',
      gradient: 'from-[#00d4ff] to-[#39ff14]'
    },
    might: {
      id: 'might',
      name: 'Đế Quốc Sức Mạnh',
      japanese: '武力帝国',
      leader: 'Tsukasa Shishio',
      color: '#ef4444',
      accentColor: '#f97316',
      badge: '👊',
      tagline: 'Xây dựng thế giới nguyên sơ thuần khiết của những người trẻ tuổi',
      gradient: 'from-[#ef4444] to-[#f97316]'
    },
    village: {
      id: 'village',
      name: 'Làng Ishigami',
      japanese: '石神村',
      leader: 'Chrome & Kohaku',
      color: '#ffd700',
      accentColor: '#f59e0b',
      badge: '🛡️',
      tagline: 'Những hậu duệ kiên cường lưu giữ hy vọng suốt 3.700 năm',
      gradient: 'from-[#ffd700] to-[#f59e0b]'
    }
  },
  ROLES: {
    alchemist: {
      id: 'alchemist',
      title: 'Nhà Giả Kim Tinh Hoa',
      icon: '🧪',
      desc: 'Bào chế hóa chất, thuốc Sulfa, thuốc súng & dung dịch Nital'
    },
    craftsman: {
      id: 'craftsman',
      title: 'Thợ Thủ Công Đại Tài',
      icon: '🔨',
      desc: 'Thổi thủy tinh, chế tạo bánh răng, ống chân không & máy phát điện'
    },
    scout: {
      id: 'scout',
      title: 'Trinh Sát Thần Tốc',
      icon: '🏹',
      desc: 'Do thám địa hình, thu thập quặng khoáng sản & dược thảo quý'
    },
    warrior: {
      id: 'warrior',
      title: 'Chiến Binh Cảm Tử',
      icon: '⚔️',
      desc: 'Sức mạnh thể lực phi thường, bảo vệ an toàn cho viện nghiên cứu'
    },
    navigator: {
      id: 'navigator',
      title: 'Hàng Hải & Phi Công',
      icon: '⛵',
      desc: 'Lèo lái chiến thuyền Perseus, định vị tọa độ hải trình & khinh khí cầu'
    }
  },
  DEFAULT_AVATARS: [
    { name: 'Senku Ishigami', path: 'assets/images/characters/hd/senku.png' },
    { name: 'Chrome', path: 'assets/images/characters/hd/chrome.png' },
    { name: 'Kohaku', path: 'assets/images/characters/hd/kohaku.png' },
    { name: 'Gen Asagiri', path: 'assets/images/characters/hd/gen.png' },
    { name: 'Ryusui Nanami', path: 'assets/images/characters/hd/ryusui.png' },
    { name: 'Suika', path: 'assets/images/characters/hd/suika.png' },
    { name: 'Kaseki', path: 'assets/images/characters/hd/kaseki.png' },
    { name: 'Tsukasa Shishio', path: 'assets/images/characters/hd/tsukasa.png' },
    { name: 'Taiju Oki', path: 'assets/images/characters/hd/taiju.png' },
    { name: 'Francois', path: 'assets/images/characters/hd/francois.png' },
    { name: 'Ukyo Saionji', path: 'assets/images/characters/hd/ukyo.png' },
    { name: 'Byakuya Ishigami', path: 'assets/images/characters/hd/byakuya.png' }
  ],
  RANKS: [
    { minPoints: 0, title: 'Cư Dân Tập Sự', badge: '🗿', color: 'text-gray-400' },
    { minPoints: 150, title: 'Học Giả Làng Ishigami', badge: '🏹', color: 'text-[#ffd700]' },
    { minPoints: 400, title: 'Nhà Thám Hiểm Perseus', badge: '🚢', color: 'text-[#38bdf8]' },
    { minPoints: 800, title: 'Chuyên Gia Viện Khoa Học', badge: '⚡', color: 'text-[#00d4ff]' },
    { minPoints: 1500, title: 'Thiên Tài 10 Tỷ % · Kế Tục Senku', badge: '👑', color: 'text-[#39ff14]' }
  ]
};

class CitizenPassController {
  constructor() {
    this.profile = this.getProfile();
    this.isCardFlipped = false;
    this.photoBoothState = {
      image: null,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      crack: 'senku',
      overlay: 'none',
      filter: 'none',
      crackOpacity: 0.95
    };
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.renderNavbarState();
      this.injectModals();
      this.bindGlobalEvents();
    });
  }

  /* ── 1. QUẢN LÝ DỮ LIỆU LOCALSTORAGE ── */
  getProfile() {
    try {
      const data = localStorage.getItem(CITIZEN_CONFIG.STORAGE_KEY);
      if (!data) return null;
      const profile = JSON.parse(data);

      // BẮT BUỘC: Thẻ Căn Cước phải có UID từ Google OAuth
      if (!profile || !profile.uid) {
        console.warn('⚠️ Phát hiện tài khoản cũ chưa xác thực qua Google. Yêu cầu đăng nhập Google.');
        localStorage.removeItem(CITIZEN_CONFIG.STORAGE_KEY);
        return null;
      }
      return profile;
    } catch (err) {
      console.error('❌ Lỗi đọc thẻ căn cước từ localStorage:', err);
      return null;
    }
  }

  saveProfile(profile) {
    try {
      this.profile = profile;
      localStorage.setItem(CITIZEN_CONFIG.STORAGE_KEY, JSON.stringify(profile));
      window.dispatchEvent(new CustomEvent('citizenProfileUpdated', { detail: profile }));
      this.renderNavbarState();

      // Đồng bộ lên Firebase Cloud nếu đã đăng nhập Google
      if (typeof window.syncProfileToCloud === 'function' && profile && profile.uid) {
        window.syncProfileToCloud(profile);
      }
    } catch (err) {
      console.error('❌ Lỗi lưu thẻ căn cước vào localStorage:', err);
    }
  }

  createProfile({ nickname, factionKey, roleKey, avatarUrl, customQuote }) {
    const faction = CITIZEN_CONFIG.FACTIONS[factionKey] || CITIZEN_CONFIG.FACTIONS.science;
    const role = CITIZEN_CONFIG.ROLES[roleKey] || CITIZEN_CONFIG.ROLES.alchemist;
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const citizenId = `KOS-5738-${randomHex}`;
    const today = new Date().toLocaleDateString('vi-VN');

    const newProfile = {
      id: citizenId,
      nickname: nickname.trim(),
      faction: faction.id,
      factionName: faction.name,
      role: role.id,
      roleTitle: role.title,
      avatarUrl: avatarUrl || CITIZEN_CONFIG.DEFAULT_AVATARS[0].path,
      joinedDate: today,
      petrificationYears: 3719,
      sciencePoints: 100, // Điểm thưởng khi thức tỉnh
      customQuote: customQuote.trim() || '10 tỷ phần trăm tôi sẽ phục hưng nền văn minh!'
    };

    this.saveProfile(newProfile);
    this.showToast('🧪 CHÚC MỪNG!', `Cư dân <b>${newProfile.nickname}</b> vừa thức tỉnh thành công! (+100 SP)`, 'emerald');

    // Gửi thông báo cư dân thức tỉnh về Discord
    if (typeof window.sendCitizenAwakenToDiscord === 'function') {
      window.sendCitizenAwakenToDiscord(newProfile);
    }

    return newProfile;
  }

  getRank(points) {
    let currentRank = CITIZEN_CONFIG.RANKS[0];
    for (const r of CITIZEN_CONFIG.RANKS) {
      if (points >= r.minPoints) {
        currentRank = r;
      }
    }
    return currentRank;
  }

  addSciencePoints(points, reason = '') {
    if (!this.profile) return;
    const oldRank = this.getRank(this.profile.sciencePoints);
    this.profile.sciencePoints = (this.profile.sciencePoints || 0) + points;
    const newRank = this.getRank(this.profile.sciencePoints);

    this.saveProfile(this.profile);

    const reasonText = reason ? `<span class="block text-xs opacity-80 mt-0.5">${reason}</span>` : '';
    this.showToast(`🧪 +${points} ĐIỂM KHOA HỌC!`, `Tổng điểm hiện tại: <b>${this.profile.sciencePoints} SP</b>${reasonText}`, 'cyan');

    // Kiểm tra thăng cấp
    if (newRank.title !== oldRank.title) {
      setTimeout(() => {
        this.showToast('👑 THĂNG CẤP KHOA HỌC!', `Bạn vừa đạt danh hiệu <b>${newRank.title}</b> ${newRank.badge}`, 'emerald');
      }, 1000);
    }
  }

  logout() {
    if (confirm('Bạn có chắc chắn muốn đóng băng thẻ căn cước và rời khỏi Vương Quốc Khoa Học không?')) {
      if (typeof window.logoutGoogle === 'function') {
        window.logoutGoogle();
      }
      localStorage.removeItem(CITIZEN_CONFIG.STORAGE_KEY);
      this.profile = null;
      this.renderNavbarState();
      this.closeModal('citizen-card-modal');
      this.showToast('🗿 ĐÃ ĐÓNG BĂNG', 'Hồ sơ thẻ căn cước đã được xóa khỏi trình duyệt.', 'stone');
    }
  }

  /* ── 2. ĐIỀU KHIỂN GIAO DIỆN NAVBAR ── */
  renderNavbarState() {
    const authContainer = document.getElementById('navbar-auth-container');
    if (!authContainer) return;

    if (!this.profile) {
      // Trạng thái chưa có thẻ
      authContainer.innerHTML = `
        <button type="button" onclick="if(typeof window.loginWithGoogle === 'function') { window.loginWithGoogle(); } else { CitizenPass.openRegistrationModal(); }"
                class="group relative inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl font-['Rajdhani'] text-xs sm:text-sm font-bold uppercase tracking-wider bg-white hover:bg-gray-100 text-gray-900 border border-white/20 transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.6)] cursor-pointer hover:scale-105">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Đăng Nhập Google</span>
        </button>
      `;
    } else {
      // Trạng thái đã thức tỉnh
      const faction = CITIZEN_CONFIG.FACTIONS[this.profile.faction] || CITIZEN_CONFIG.FACTIONS.science;
      const rank = this.getRank(this.profile.sciencePoints);

      authContainer.innerHTML = `
        <div class="relative">
          <button type="button" id="citizen-nav-btn" onclick="CitizenPass.toggleDropdown()"
                  class="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-[${faction.color}]/40 transition-all duration-200">
            <div class="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-black/50 border border-[${faction.color}] shadow-sm flex-shrink-0">
              <img src="${this.profile.avatarUrl}" alt="${this.profile.nickname}" class="w-full h-full object-cover">
            </div>
            <div class="hidden md:flex flex-col items-start text-left leading-tight">
              <div class="flex items-center gap-1">
                <span class="font-['Rajdhani'] font-bold text-xs text-white max-w-[100px] truncate">${this.profile.nickname}</span>
                <span class="text-[0.6rem]">${faction.badge}</span>
              </div>
              <span class="text-[0.62rem] font-['Orbitron'] font-bold text-[${faction.color}]">${this.profile.sciencePoints} SP</span>
            </div>
            <span class="text-[0.65rem] text-[#6b7a99] ml-0.5">▼</span>
          </button>

          <!-- Dropdown Menu -->
          <div id="citizen-dropdown-menu" class="hidden absolute right-0 mt-2 w-64 rounded-2xl bg-[#0a0f1e]/95 backdrop-blur-2xl border border-[${faction.color}]/30 shadow-[0_15px_35px_rgba(0,0,0,0.8)] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="flex items-center gap-3 pb-3 border-b border-white/10 mb-2">
              <div class="w-11 h-11 rounded-xl overflow-hidden bg-black/60 border border-[${faction.color}]/50 flex-shrink-0">
                <img src="${this.profile.avatarUrl}" class="w-full h-full object-cover">
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-['Rajdhani'] font-bold text-sm text-white truncate">${this.profile.nickname}</h4>
                <p class="text-[0.65rem] font-['Rajdhani'] text-[${faction.color}] font-semibold truncate">${faction.name}</p>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[0.62rem] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-gray-300 font-mono">${this.profile.id}</span>
                </div>
              </div>
            </div>

            <!-- Rank & SP display -->
            <div class="p-2 rounded-xl bg-black/40 border border-white/5 mb-3 flex items-center justify-between">
              <div>
                <span class="text-[0.6rem] font-['Rajdhani'] font-bold text-gray-400 uppercase tracking-wider block">Cấp bậc</span>
                <span class="text-xs font-['Rajdhani'] font-bold ${rank.color} flex items-center gap-1">
                  ${rank.badge} ${rank.title}
                </span>
              </div>
              <div class="text-right">
                <span class="text-[0.6rem] font-['Rajdhani'] font-bold text-gray-400 uppercase tracking-wider block">Khoa học</span>
                <span class="font-['Orbitron'] font-black text-xs text-[#00d4ff]">${this.profile.sciencePoints} SP</span>
              </div>
            </div>

            <!-- Menu Actions -->
            <div class="space-y-1">
              <button type="button" onclick="CitizenPass.openPassModal(); CitizenPass.toggleDropdown(false);"
                      class="w-full text-left px-3 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold text-white hover:bg-[${faction.color}]/15 hover:text-[${faction.color}] transition-all flex items-center gap-2">
                <span>🪪</span> Xem Thẻ Căn Cước 3D
              </button>
              <button type="button" onclick="CitizenPass.openRegistrationModal(true); CitizenPass.toggleDropdown(false);"
                      class="w-full text-left px-3 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">
                <span>✏️</span> Chỉnh Sửa Danh Tính
              </button>
              <button type="button" onclick="CitizenPass.openPhotoBooth(); CitizenPass.toggleDropdown(false);"
                      class="w-full text-left px-3 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold text-[#00d4ff] hover:bg-[#00d4ff]/15 transition-all flex items-center gap-2">
                <span>📸</span> Chế Ảnh Hóa Thạch (Suika Lens)
              </button>
              <a href="cactapphim.html" class="block w-full text-left px-3 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2">
                <span>🔖</span> Tập Phim Đã Lưu
              </a>
              <div class="pt-1 border-t border-white/5 mt-1">
                <button type="button" onclick="CitizenPass.logout(); CitizenPass.toggleDropdown(false);"
                        class="w-full text-left px-3 py-2 rounded-xl text-xs font-['Rajdhani'] font-bold text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2">
                  <span>🚪</span> Đóng Băng / Rời Vương Quốc
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  toggleDropdown(forceState) {
    const menu = document.getElementById('citizen-dropdown-menu');
    if (!menu) return;
    if (typeof forceState === 'boolean') {
      menu.classList.toggle('hidden', !forceState);
    } else {
      menu.classList.toggle('hidden');
    }
  }

  /* ── 3. KHỞI TẠO MODAL HTML VÀO CUỐI TRANG ── */
  injectModals() {
    if (document.getElementById('citizen-modals-container')) return;

    const container = document.createElement('div');
    container.id = 'citizen-modals-container';
    container.innerHTML = `
      <!-- ═══════════════════════════════════════════
           MODAL 1: ĐĂNG KÝ (GOOGLE BẮT BUỘC) / TÙY CHỈNH HỒ SƠ
           ═══════════════════════════════════════════ -->
      <div id="citizen-reg-modal" class="fixed inset-0 z-[9990] hidden flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <div class="relative w-full max-w-xl bg-[#0a0f1e]/95 border border-[#00d4ff]/30 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(0,212,255,0.15)] overflow-hidden max-h-[92vh] overflow-y-auto">
          <!-- Ambient lighting -->
          <div class="absolute -top-24 -left-24 w-56 h-56 bg-[#00d4ff]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-24 -right-24 w-56 h-56 bg-[#39ff14]/15 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Close button -->
          <button type="button" onclick="CitizenPass.closeModal('citizen-reg-modal')"
                  class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
            ✕
          </button>

          <!-- KHỐI 1: BẮT BUỘC ĐĂNG NHẬP GOOGLE (Hiển thị khi CHƯA đăng nhập Google) -->
          <div id="citizen-google-gate" class="text-center py-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-['Orbitron'] font-bold tracking-widest uppercase bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 mb-3">
              <span>🔒</span> YÊU CẦU XÁC MINH CƯ DÂN
            </span>
            <h2 class="font-['Orbitron'] text-xl sm:text-2xl font-black text-white uppercase tracking-wide mb-2">
              Cổng Thức Tỉnh Google
            </h2>
            <p class="text-xs sm:text-sm font-['Inter'] text-gray-300 max-w-md mx-auto mb-6 leading-relaxed">
              Để bảo tồn danh tính cư dân thật và chống spam trong Vương Quốc Khoa Học, <b class="text-[#00d4ff]">bắt buộc phải đăng ký / đăng nhập bằng tài khoản Google</b> để khởi tạo Thẻ Căn Cước.
            </p>

            <!-- Lợi ích khi đăng nhập Google -->
            <div class="space-y-2.5 max-w-md mx-auto mb-6 text-left">
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span class="text-xl">⚡</span>
                <div>
                  <h5 class="text-xs font-['Rajdhani'] font-bold text-white uppercase tracking-wider">Thưởng Ngay +100 Điểm SP</h5>
                  <p class="text-[0.7rem] text-gray-400">Nhận ngay 100 Điểm Khoa Học (SP) để nâng hạng thẻ căn cước</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span class="text-xl">☁️</span>
                <div>
                  <h5 class="text-xs font-['Rajdhani'] font-bold text-white uppercase tracking-wider">Lưu Trữ Đám Mây Vĩnh Viễn</h5>
                  <p class="text-[0.7rem] text-gray-400">Thẻ Căn Cước, danh hiệu và thành tựu tự động đồng bộ qua Firebase</p>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <span class="text-xl">🪪</span>
                <div>
                  <h5 class="text-xs font-['Rajdhani'] font-bold text-white uppercase tracking-wider">Cấp Mã Định Danh Độc Quyền</h5>
                  <p class="text-[0.7rem] text-gray-400">Khắc mã ID dạng KOS-5738-xxxx và ảnh thẻ 3D Hologram xuất PNG</p>
                </div>
              </div>
            </div>

            <!-- Nút đăng nhập Google chính thức -->
            <button type="button" id="btn-google-login-gate" onclick="if(typeof window.loginWithGoogle === 'function') { window.loginWithGoogle(); } else { alert('Đang tải Firebase SDK, vui lòng thử lại sau 2 giây!'); }"
                    class="w-full max-w-md mx-auto py-3.5 px-6 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-['Rajdhani'] font-bold text-base uppercase tracking-wider shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:shadow-[0_0_35px_rgba(0,212,255,0.5)] transition-all flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Đăng Nhập Bằng Google Để Thức Tỉnh</span>
            </button>
            <p class="text-[0.65rem] text-gray-500 font-mono mt-3">
              Bảo mật 100% qua Google OAuth 2.0 & Firebase Realtime Database
            </p>
          </div>

          <!-- KHỐI 2: FORM TÙY CHỈNH DANH TÍNH (Chỉ hiển thị khi ĐÃ đăng nhập Google) -->
          <div id="citizen-profile-form-wrap" class="hidden">
            <!-- Header Form -->
            <div class="text-center mb-6">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-['Orbitron'] font-bold tracking-widest uppercase bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 mb-2">
                <span>⚙️</span> THẺ CĂN CƯỚC KHOA HỌC
              </span>
              <h2 id="reg-modal-title" class="font-['Orbitron'] text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                Tùy Chỉnh Thẻ Căn Cước
              </h2>
              <p id="reg-modal-desc" class="text-xs font-['Rajdhani'] font-medium text-[#6b7a99] mt-1">
                Tùy biến phe phái, vai trò và châm ngôn khoa học của bạn
              </p>
            </div>

            <!-- Card thông tin Google đã xác thực -->
            <div id="google-verified-badge" class="flex items-center gap-3 p-3 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 mb-5">
              <img id="verified-google-avatar" src="assets/images/characters/hd/senku.png" class="w-10 h-10 rounded-full border border-[#00d4ff] object-cover flex-shrink-0">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span id="verified-google-name" class="font-['Rajdhani'] font-bold text-sm text-white truncate">Google User</span>
                  <span class="text-[0.6rem] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">✓ Đã xác thực</span>
                </div>
                <p id="verified-google-email" class="text-[0.68rem] text-gray-400 truncate font-mono">email@gmail.com</p>
              </div>
            </div>

            <!-- Form tùy chỉnh -->
            <form id="citizen-reg-form" onsubmit="CitizenPass.handleRegistrationSubmit(event)" class="space-y-5">
              <!-- 1. Nickname -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Biệt danh / Danh Xưng Cư Dân <span class="text-[#00d4ff]">*</span>
                </label>
                <input type="text" id="reg-nickname" required minlength="2" maxlength="24"
                       placeholder="Ví dụ: Bác Học Điên, Chrome, Kohaku..."
                       class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#00d4ff] text-white text-sm outline-none transition-colors font-['Inter']">
              </div>

              <!-- 2. Factions (Radio Cards) -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Chọn Phe Phái Thức Tỉnh <span class="text-[#00d4ff]">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5" id="faction-selector-group">
                  <!-- Option 1: Science -->
                  <label class="relative cursor-pointer">
                    <input type="radio" name="reg-faction" value="science" checked class="peer sr-only">
                    <div class="p-3 rounded-2xl bg-black/50 border border-white/10 peer-checked:border-[#00d4ff] peer-checked:bg-[#00d4ff]/10 peer-checked:shadow-[0_0_15px_rgba(0,212,255,0.25)] transition-all h-full flex flex-col justify-between">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xl">🧪</span>
                        <span class="text-[0.6rem] font-['Orbitron'] font-bold text-[#00d4ff]">SENKU</span>
                      </div>
                      <div>
                        <h4 class="font-['Rajdhani'] font-bold text-xs text-white">V.Q Khoa Học</h4>
                        <p class="text-[0.6rem] text-gray-400 leading-tight mt-0.5">Tri thức & Phát minh</p>
                      </div>
                    </div>
                  </label>

                  <!-- Option 2: Might -->
                  <label class="relative cursor-pointer">
                    <input type="radio" name="reg-faction" value="might" class="peer sr-only">
                    <div class="p-3 rounded-2xl bg-black/50 border border-white/10 peer-checked:border-[#ef4444] peer-checked:bg-[#ef4444]/10 peer-checked:shadow-[0_0_15px_rgba(239,68,68,0.25)] transition-all h-full flex flex-col justify-between">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xl">👊</span>
                        <span class="text-[0.6rem] font-['Orbitron'] font-bold text-[#ef4444]">TSUKASA</span>
                      </div>
                      <div>
                        <h4 class="font-['Rajdhani'] font-bold text-xs text-white">Đ.Q Sức Mạnh</h4>
                        <p class="text-[0.6rem] text-gray-400 leading-tight mt-0.5">Thể lực & Nguyên sơ</p>
                      </div>
                    </div>
                  </label>

                  <!-- Option 3: Village -->
                  <label class="relative cursor-pointer">
                    <input type="radio" name="reg-faction" value="village" class="peer sr-only">
                    <div class="p-3 rounded-2xl bg-black/50 border border-white/10 peer-checked:border-[#ffd700] peer-checked:bg-[#ffd700]/10 peer-checked:shadow-[0_0_15px_rgba(255,215,0,0.25)] transition-all h-full flex flex-col justify-between">
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xl">🛡️</span>
                        <span class="text-[0.6rem] font-['Orbitron'] font-bold text-[#ffd700]">CHROME</span>
                      </div>
                      <div>
                        <h4 class="font-['Rajdhani'] font-bold text-xs text-white">Làng Ishigami</h4>
                        <p class="text-[0.6rem] text-gray-400 leading-tight mt-0.5">Hậu duệ 3.700 năm</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- 3. Roles -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Vai Trò Chuyên Môn Trong Vương Quốc <span class="text-[#00d4ff]">*</span>
                </label>
                <select id="reg-role" class="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 focus:border-[#00d4ff] text-white text-sm outline-none transition-colors font-['Rajdhani'] font-semibold cursor-pointer">
                  <option value="alchemist">🧪 Nhà Giả Kim Tinh Hoa (Bào chế hóa chất & dược liệu)</option>
                  <option value="craftsman">🔨 Thợ Thủ Công Đại Tài (Thổi thủy tinh & chế tạo cơ khí)</option>
                  <option value="scout">🏹 Trinh Sát Thần Tốc (Do thám & thu thập khoáng thạch)</option>
                  <option value="warrior">⚔️ Chiến Binh Cảm Tử (Sức mạnh thể lực & cận chiến)</option>
                  <option value="navigator">⛵ Hàng Hải & Phi Công (Lèo lái tàu Perseus & khinh khí cầu)</option>
                </select>
              </div>

              <!-- 4. Avatar Grid -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300">
                    Chọn Chân Dung Đại Diện
                  </label>
                  <span class="text-[0.65rem] text-[#00d4ff] font-['Rajdhani']">Bao gồm ảnh Google & Anime HD</span>
                </div>

                <!-- Action Buttons: Custom Upload & Photo Booth Studio -->
                <div class="grid grid-cols-2 gap-2 mb-2.5">
                  <input type="file" id="citizen-avatar-file-input" accept="image/*" class="hidden" onchange="CitizenPass.handlePhotoUpload(event)">
                  <button type="button" onclick="document.getElementById('citizen-avatar-file-input').click()"
                          class="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-['Rajdhani'] font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>📁</span> Tải Ảnh Của Bạn
                  </button>
                  <button type="button" onclick="CitizenPass.openPhotoBooth()"
                          class="py-2 px-3 rounded-xl bg-gradient-to-r from-[#00d4ff]/20 to-[#39ff14]/20 hover:from-[#00d4ff]/30 hover:to-[#39ff14]/30 border border-[#00d4ff]/40 text-xs font-['Rajdhani'] font-bold text-[#00d4ff] hover:text-[#39ff14] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                    <span>📸</span> Suika Lens Studio
                  </button>
                </div>

                <div class="grid grid-cols-6 gap-2 p-2 rounded-2xl bg-black/40 border border-white/10 max-h-36 overflow-y-auto" id="avatar-selector-grid">
                  <!-- Rendered dynamically -->
                </div>
                <input type="hidden" id="reg-avatar-val" value="assets/images/characters/hd/senku.png">
              </div>

              <!-- 5. Custom Quote -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                  Châm Ngôn Khoa Học Tâm Đắc
                </label>
                <input type="text" id="reg-quote" maxlength="60"
                       value="10 tỷ phần trăm tôi sẽ phục hưng nền văn minh!"
                       placeholder="Ví dụ: Khoa học không bao giờ nói dối..."
                       class="w-full px-4 py-2 rounded-xl bg-black/60 border border-white/15 focus:border-[#00d4ff] text-gray-300 text-xs outline-none transition-colors">
              </div>

              <!-- Submit Button -->
              <button type="submit" id="reg-submit-btn"
                      class="w-full py-3.5 rounded-2xl font-['Orbitron'] font-black text-sm uppercase tracking-wider bg-gradient-to-r from-[#00d4ff] via-[#39ff14] to-[#00f5a0] text-black shadow-[0_0_25px_rgba(0,212,255,0.4)] hover:shadow-[0_0_35px_rgba(57,255,20,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer">
                💾 LƯU THAY ĐỔI HỒ SƠ
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           MODAL 2: THẺ CĂN CƯỚC 3D HOLOGRAM VIEWER
           ═══════════════════════════════════════════ -->
      <div id="citizen-card-modal" class="fixed inset-0 z-[9995] hidden flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl">
        <div class="relative w-full max-w-lg flex flex-col items-center">

          <!-- Action buttons top -->
          <div class="w-full flex items-center justify-between mb-4 px-2">
            <span class="text-xs font-['Orbitron'] font-bold text-[#00d4ff] uppercase tracking-wider flex items-center gap-1.5">
              <span>🪪</span> THẺ CĂN CƯỚC 3D HOLOGRAM
            </span>
            <button type="button" onclick="CitizenPass.closeModal('citizen-card-modal')"
                    class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
              ✕
            </button>
          </div>

          <!-- 3D Card Scene Container -->
          <div class="id-card-scene" id="id-card-scene">
            <div class="id-card-3d" id="id-card-3d" onclick="CitizenPass.flipCard()">
              <!-- Front Side -->
              <div class="id-card-face id-card-front" id="id-card-front-content">
                <!-- Injected via renderIDCard() -->
              </div>

              <!-- Back Side -->
              <div class="id-card-face id-card-back" id="id-card-back-content">
                <!-- Injected via renderIDCard() -->
              </div>
            </div>
          </div>

          <!-- Control hints & action bar bottom -->
          <div class="mt-6 flex flex-col items-center gap-3 w-full max-w-sm">
            <p class="text-[0.65rem] font-['Rajdhani'] text-[#6b7a99] uppercase tracking-widest text-center">
              💡 Rê chuột để xoay nghiêng 3D · Nhấp vào thẻ để lật mặt sau
            </p>

            <div class="flex items-center gap-3 w-full">
              <button type="button" onclick="CitizenPass.flipCard()"
                      class="flex-1 py-2.5 rounded-xl text-xs font-['Rajdhani'] font-bold uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center justify-center gap-2">
                <span>🔄</span> Lật Mặt Thẻ
              </button>

              <button type="button" onclick="CitizenPass.exportCardPNG()" id="btn-export-card"
                      class="flex-1 py-2.5 rounded-xl text-xs font-['Rajdhani'] font-bold uppercase tracking-wider bg-gradient-to-r from-[#00d4ff] to-[#39ff14] text-black shadow-[0_0_15px_rgba(0,212,255,0.4)] hover:shadow-[0_0_25px_rgba(57,255,20,0.6)] transition-all flex items-center justify-center gap-2">
                <span>📥</span> Tải Thẻ PNG
              </button>
            </div>

            <button type="button" onclick="CitizenPass.openPhotoBooth(); CitizenPass.closeModal('citizen-card-modal');"
                    class="w-full py-2.5 rounded-xl text-xs font-['Rajdhani'] font-bold uppercase tracking-wider bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.15)]">
              <span>📸</span> Chế Ảnh Hóa Thạch (Suika Lens Studio)
            </button>
          </div>

        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           MODAL 3: MÁY ẢNH KỶ NGUYÊN ĐÁ (SUIKA LENS STUDIO)
           ═══════════════════════════════════════════ -->
      <div id="citizen-photobooth-modal" class="fixed inset-0 z-[9997] hidden flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-2xl">
        <div class="relative w-full max-w-4xl bg-[#080d19]/95 border border-[#00d4ff]/40 rounded-3xl p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(0,212,255,0.2)] overflow-hidden max-h-[95vh] overflow-y-auto">
          
          <!-- Ambient lighting -->
          <div class="absolute -top-32 -left-32 w-72 h-72 bg-[#00d4ff]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-32 -right-32 w-72 h-72 bg-[#39ff14]/20 rounded-full blur-3xl pointer-events-none"></div>

          <!-- Close button -->
          <button type="button" onclick="CitizenPass.closeModal('citizen-photobooth-modal')"
                  class="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer z-10">
            ✕
          </button>

          <!-- Header -->
          <div class="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00d4ff]/20 to-[#39ff14]/20 border border-[#00d4ff]/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              📸
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-['Orbitron'] text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  MÁY ẢNH KỶ NGUYÊN ĐÁ
                </h2>
                <span class="text-[0.6rem] px-2 py-0.5 rounded-full font-['Rajdhani'] font-bold bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30 uppercase">
                  Suika Lens 2.0
                </span>
              </div>
              <p class="text-xs font-['Rajdhani'] text-[#6b7a99]">
                Tạo vết nứt hóa thạch thức tỉnh & gắn phụ kiện anime Dr. Stone lên ảnh của bạn
              </p>
            </div>
          </div>

          <!-- Studio Layout: 2 Columns -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left: Interactive Canvas Preview (col 7) -->
            <div class="lg:col-span-7 flex flex-col items-center">
              <div class="relative w-full aspect-square max-w-[380px] sm:max-w-[420px] rounded-2xl overflow-hidden bg-black/80 border-2 border-[#00d4ff]/40 shadow-[0_0_25px_rgba(0,212,255,0.25)] flex items-center justify-center group cursor-grab active:cursor-grabbing select-none" id="photobooth-canvas-wrap">
                <canvas id="photobooth-canvas" width="600" height="600" class="w-full h-full object-cover"></canvas>
                
                <!-- Center face guideline circle -->
                <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div class="w-48 h-48 sm:w-56 sm:h-56 rounded-full border border-dashed border-[#00d4ff]/30 opacity-40"></div>
                </div>

                <!-- Drag hint indicator -->
                <div class="absolute bottom-3 inset-x-3 py-1 px-2.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-[0.65rem] font-['Rajdhani'] text-gray-300 text-center pointer-events-none">
                  👆 Kéo ảnh để căn chỉnh vị trí · Dùng thanh trượt bên dưới để Zoom
                </div>
              </div>

              <!-- Quick Pan & Zoom Slider -->
              <div class="w-full max-w-[380px] sm:max-w-[420px] mt-3 flex items-center gap-3 px-2">
                <span class="text-xs text-gray-400 font-mono">🔍 −</span>
                <input type="range" id="pb-zoom-slider" min="0.5" max="2.5" step="0.05" value="1.0"
                       oninput="CitizenPass.updatePhotoBoothZoom(this.value)"
                       class="flex-1 accent-[#00d4ff] h-1.5 bg-white/10 rounded-lg cursor-pointer">
                <span class="text-xs text-[#00d4ff] font-mono">＋</span>
                <button type="button" onclick="CitizenPass.resetPhotoBoothTransform()"
                        class="text-[0.65rem] font-['Rajdhani'] font-bold text-gray-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 cursor-pointer">
                  ↺ Căn giữa
                </button>
              </div>
            </div>

            <!-- Right: Options & Effects Palette (col 5) -->
            <div class="lg:col-span-5 space-y-4">
              
              <!-- Action: Choose or Change Photo -->
              <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <div class="min-w-0 pr-2">
                  <span class="text-[0.62rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-400 block">Ảnh Gốc</span>
                  <span id="pb-image-label" class="text-xs font-['Rajdhani'] font-bold text-white truncate block">Chân dung hiện tại</span>
                </div>
                <input type="file" id="pb-file-upload" accept="image/*" class="hidden" onchange="CitizenPass.handlePhotoUpload(event)">
                <button type="button" onclick="document.getElementById('pb-file-upload').click()"
                        class="px-3 py-1.5 rounded-xl bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 border border-[#00d4ff]/40 text-xs font-['Rajdhani'] font-bold text-[#00d4ff] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0">
                  <span>📁</span> Đổi Ảnh Khác
                </button>
              </div>

              <!-- 1. Vết Nứt Hóa Thạch (Petrification Cracks) -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>⚡ Vết Nứt Hóa Thạch</span>
                  <span class="text-[0.62rem] text-[#39ff14] font-mono font-normal">Nital Cracks</span>
                </label>
                <div class="grid grid-cols-4 gap-1.5" id="pb-cracks-group">
                  <button type="button" onclick="CitizenPass.setPhotoBoothCrack('none', this)" class="pb-crack-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    ✕ Không
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothCrack('senku', this)" class="pb-crack-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-['Rajdhani'] font-bold text-[#00d4ff] transition-all cursor-pointer">
                    🧪 Senku
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothCrack('gen', this)" class="pb-crack-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🃏 Gen
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothCrack('tsukasa', this)" class="pb-crack-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    👊 Tsukasa
                  </button>
                </div>
              </div>

              <!-- 2. Phụ Kiện Kỷ Nguyên Đá (Overlays) -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>🍉 Phụ Kiện Nhân Vật</span>
                  <span class="text-[0.62rem] text-[#ffd700] font-mono font-normal">Cosplay Props</span>
                </label>
                <div class="grid grid-cols-4 gap-1.5" id="pb-overlays-group">
                  <button type="button" onclick="CitizenPass.setPhotoBoothOverlay('none', this)" class="pb-overlay-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-['Rajdhani'] font-bold text-[#00d4ff] transition-all cursor-pointer">
                    ✕ Không
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothOverlay('suika', this)" class="pb-overlay-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🍉 Mũ Suika
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothOverlay('goggles', this)" class="pb-overlay-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🥽 Kính Senku
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothOverlay('emblem', this)" class="pb-overlay-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🛡️ Huy Hiệu
                  </button>
                </div>
              </div>

              <!-- 3. Bộ Lọc Màu Kỷ Nguyên Đá (Color Filter) -->
              <div>
                <label class="block text-xs font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>🎨 Bộ Lọc Tone Màu</span>
                  <span class="text-[0.62rem] text-gray-400 font-mono font-normal">Color Filter</span>
                </label>
                <div class="grid grid-cols-4 gap-1.5" id="pb-filters-group">
                  <button type="button" onclick="CitizenPass.setPhotoBoothFilter('none', this)" class="pb-filter-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-['Rajdhani'] font-bold text-[#00d4ff] transition-all cursor-pointer">
                    Tự Nhiên
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothFilter('stone', this)" class="pb-filter-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🗿 Hóa Thạch
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothFilter('nital', this)" class="pb-filter-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    🧪 Nital Acid
                  </button>
                  <button type="button" onclick="CitizenPass.setPhotoBoothFilter('vintage', this)" class="pb-filter-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-['Rajdhani'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                    📜 Cổ Điển
                  </button>
                </div>
              </div>

              <!-- Action Outputs -->
              <div class="pt-3 border-t border-white/10 space-y-2.5">
                <button type="button" onclick="CitizenPass.applyPhotoBoothAvatar()" id="btn-apply-pb-avatar"
                        class="w-full py-3 px-4 rounded-2xl font-['Orbitron'] font-black text-xs uppercase tracking-wider bg-gradient-to-r from-[#00d4ff] via-[#39ff14] to-[#00f5a0] text-black shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2">
                  <span>🪪</span> ĐẶT LÀM AVATAR THẺ CĂN CƯỚC 3D
                </button>

                <button type="button" onclick="CitizenPass.downloadPhotoBoothPNG()"
                        class="w-full py-2.5 px-4 rounded-2xl font-['Rajdhani'] font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/30 transition-all cursor-pointer flex items-center justify-center gap-2">
                  <span>📥</span> Tải Ảnh Avatar HD (PNG 600x600)
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           TOAST NOTIFICATION CONTAINER
           ═══════════════════════════════════════════ -->
      <div id="citizen-toast-container" class="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"></div>
    `;

    document.body.appendChild(container);
    this.renderAvatarSelector();
    this.initCard3DTilt();
  }

  renderAvatarSelector() {
    const grid = document.getElementById('avatar-selector-grid');
    if (!grid) return;

    let avatars = [...CITIZEN_CONFIG.DEFAULT_AVATARS];

    const currentVal = document.getElementById('reg-avatar-val')?.value;
    const profileAvatar = this.profile?.avatarUrl;
    const activeAvatar = currentVal || profileAvatar || avatars[0].path;

    // Nếu có ảnh tự tải / ảnh chế Photo Booth (data URL)
    if (activeAvatar && activeAvatar.startsWith('data:')) {
      avatars.unshift({
        name: 'Ảnh Chế Hóa Thạch (Suika Lens)',
        path: activeAvatar,
        isCustom: true
      });
    }

    // Nếu có ảnh Google
    const googlePhoto = this.profile?.googlePhotoURL || (profileAvatar && profileAvatar.startsWith('http') && !profileAvatar.includes('assets/') ? profileAvatar : null);
    if (googlePhoto && !avatars.some(a => a.path === googlePhoto)) {
      avatars.unshift({
        name: 'Ảnh đại diện Google',
        path: googlePhoto,
        isGoogle: true
      });
    }

    document.getElementById('reg-avatar-val').value = activeAvatar;

    grid.innerHTML = avatars.map((av, idx) => `
      <button type="button" onclick="CitizenPass.selectAvatar('${av.path}', this)"
              class="avatar-pick-btn relative aspect-square rounded-xl overflow-hidden bg-black/60 border ${activeAvatar === av.path ? 'border-[#00d4ff] ring-2 ring-[#00d4ff]/40' : 'border-white/10 hover:border-white/40'} transition-all cursor-pointer"
              title="${av.name}">
        <img src="${av.path}" alt="${av.name}" class="w-full h-full object-cover">
        ${av.isCustom ? '<span class="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[0.45rem] font-bold text-white text-center py-0.5 uppercase tracking-tighter">Suika Lens</span>' : ''}
        ${av.isGoogle ? '<span class="absolute bottom-0 inset-x-0 bg-blue-600/90 text-[0.45rem] font-bold text-white text-center py-0.5 uppercase tracking-tighter">Google</span>' : ''}
      </button>
    `).join('');
  }

  selectAvatar(path, btnEl) {
    document.getElementById('reg-avatar-val').value = path;
    document.querySelectorAll('.avatar-pick-btn').forEach(b => {
      b.classList.remove('border-[#00d4ff]', 'ring-2', 'ring-[#00d4ff]/40');
      b.classList.add('border-white/10');
    });
    if (btnEl) {
      btnEl.classList.remove('border-white/10');
      btnEl.classList.add('border-[#00d4ff]', 'ring-2', 'ring-[#00d4ff]/40');
    }
  }

  /* ── 4. RENDER THẺ CĂN CƯỚC 3D (FRONT & BACK) ── */
  renderIDCard() {
    if (!this.profile) return;
    const faction = CITIZEN_CONFIG.FACTIONS[this.profile.faction] || CITIZEN_CONFIG.FACTIONS.science;
    const role = CITIZEN_CONFIG.ROLES[this.profile.role] || CITIZEN_CONFIG.ROLES.alchemist;
    const rank = this.getRank(this.profile.sciencePoints);

    const frontEl = document.getElementById('id-card-front-content');
    const backEl = document.getElementById('id-card-back-content');
    if (!frontEl || !backEl) return;

    // FRONT
    frontEl.innerHTML = `
      <div class="hologram-glare"></div>
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-[${faction.color}]/30 pb-2 mb-3">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-[${faction.color}]/20 border border-[${faction.color}]/50 flex items-center justify-center text-sm shadow-[0_0_8px_${faction.color}40]">
            ${faction.badge}
          </div>
          <div>
            <h3 class="font-['Orbitron'] text-[0.72rem] font-black text-white tracking-widest uppercase">
              KINGDOM OF SCIENCE
            </h3>
            <p class="text-[0.52rem] font-['Rajdhani'] font-bold text-[${faction.color}] uppercase tracking-widest">
              CITIZEN PASS · ${faction.name}
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[0.5rem] font-mono text-gray-400 block">NĂM 5738</span>
          <span class="text-[0.62rem] font-['Orbitron'] font-black text-[#39ff14]">${this.profile.sciencePoints} SP</span>
        </div>
      </div>

      <!-- Body: Avatar + Details -->
      <div class="flex gap-3.5 items-center mb-3">
        <!-- Portrait Frame -->
        <div class="relative w-24 h-28 rounded-xl overflow-hidden bg-black/70 border-2 border-[${faction.color}]/60 shadow-[0_0_15px_${faction.color}30] flex-shrink-0">
          <img src="${this.profile.avatarUrl}" alt="${this.profile.nickname}" class="w-full h-full object-cover">
          <div class="laser-scanner"></div>
          <div class="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[0.5rem] font-mono text-[#00f5a0] border border-[#00f5a0]/40">
            SECURE
          </div>
        </div>

        <!-- Info Column -->
        <div class="flex-1 min-w-0 space-y-1">
          <div>
            <span class="text-[0.52rem] font-['Rajdhani'] font-bold text-gray-400 uppercase tracking-wider block">Tên cư dân</span>
            <h2 class="font-['Rajdhani'] text-base font-black text-white leading-tight truncate drop-shadow">
              ${this.profile.nickname}
            </h2>
          </div>

          <div class="grid grid-cols-2 gap-1 text-[0.62rem] font-['Rajdhani']">
            <div>
              <span class="text-[0.5rem] text-gray-400 uppercase tracking-wider block">Vai trò</span>
              <span class="font-bold text-[${faction.color}] truncate block">${role.title}</span>
            </div>
            <div>
              <span class="text-[0.5rem] text-gray-400 uppercase tracking-wider block">Cấp bậc</span>
              <span class="font-bold text-white truncate block">${rank.title}</span>
            </div>
          </div>

          <div class="pt-1 border-t border-white/10 flex items-center justify-between text-[0.58rem] font-mono">
            <span class="text-gray-400">MÃ ĐỊNH DANH:</span>
            <span class="font-bold text-[#00d4ff]">${this.profile.id}</span>
          </div>
        </div>
      </div>

      <!-- Footer: Chip + Barcode + Security Hologram -->
      <div class="flex items-center justify-between pt-2 border-t border-[${faction.color}]/25">
        <!-- Nano Chip -->
        <div class="w-7 h-5 rounded bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 border border-yellow-200/50 shadow-inner relative flex items-center justify-center">
          <div class="w-4 h-2 border border-black/30 rounded-sm"></div>
        </div>

        <!-- Fake Barcode -->
        <div class="flex flex-col items-center">
          <div class="barcode-lines"></div>
          <span class="text-[0.45rem] font-mono tracking-widest text-gray-400 mt-0.5">${this.profile.id}</span>
        </div>

        <!-- Iridescent Stamp -->
        <div class="hologram-stamp">
          <span>KOS</span>
        </div>
      </div>
    `;

    // BACK
    backEl.innerHTML = `
      <div class="hologram-glare"></div>

      <!-- Magnetic Strip -->
      <div class="w-full h-8 bg-[#03060c] border-y border-white/10 mb-3 shadow-inner"></div>

      <!-- Quote -->
      <div class="px-3 mb-4">
        <p class="text-[0.6rem] font-['Rajdhani'] font-bold text-gray-400 uppercase tracking-widest mb-1">
          Châm ngôn cư dân:
        </p>
        <blockquote class="italic text-[0.68rem] text-white/90 border-l-2 border-[${faction.color}] pl-2 leading-relaxed font-['Inter']">
          "${this.profile.customQuote}"
        </blockquote>
      </div>

      <!-- Rules & Sign -->
      <div class="px-3 flex-1 flex flex-col justify-between">
        <p class="text-[0.52rem] text-gray-400 leading-tight">
          "Thẻ này chứng nhận tư cách công dân hợp pháp của Vương Quốc Khoa Học. Bất kỳ ai sở hữu tri thức khoa học đều có nghĩa vụ dùng nó để cứu vớt mọi sinh mệnh bị hóa đá."
        </p>

        <div class="flex items-end justify-between pt-2 border-t border-white/10">
          <div>
            <span class="text-[0.48rem] text-gray-500 block font-mono">NGÀY CẤP: ${this.profile.joinedDate}</span>
            <span class="text-[0.48rem] text-[#39ff14] font-mono">XÁC THỰC: THÀNH CÔNG (10 TỶ %)</span>
          </div>
          <div class="text-right">
            <span class="text-[0.48rem] text-gray-400 block">CHỮ KÝ TRƯỞNG VIỆN:</span>
            <span class="font-['Orbitron'] text-xs font-black text-[#00d4ff] italic">Ishigami Senku</span>
          </div>
        </div>
      </div>
    `;
  }

  /* ── 5. HIỆU ỨNG 3D TILT KHI RÊ CHUỘT ── */
  initCard3DTilt() {
    const card = document.getElementById('id-card-3d');
    const scene = document.getElementById('id-card-scene');
    if (!card || !scene) return;

    scene.addEventListener('mousemove', (e) => {
      const rect = scene.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = (-y / (rect.height / 2)) * 16;
      const rotateY = (x / (rect.width / 2)) * 16;

      const flipBonus = this.isCardFlipped ? 180 : 0;
      card.style.transform = `rotateY(${rotateY + flipBonus}deg) rotateX(${rotateX}deg)`;

      // Cập nhật vị trí vệt sáng phản quang (Glare)
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--glare-x', `${px}%`);
      card.style.setProperty('--glare-y', `${py}%`);
    });

    scene.addEventListener('mouseleave', () => {
      const flipBonus = this.isCardFlipped ? 180 : 0;
      card.style.transform = `rotateY(${flipBonus}deg) rotateX(0deg)`;
      card.style.transition = 'transform 0.5s ease-out';
      setTimeout(() => {
        card.style.transition = '';
      }, 500);
    });
  }

  flipCard() {
    this.isCardFlipped = !this.isCardFlipped;
    const card = document.getElementById('id-card-3d');
    if (!card) return;
    const flipAngle = this.isCardFlipped ? 180 : 0;
    card.style.transform = `rotateY(${flipAngle}deg)`;
  }

  /* ── 6. ĐIỀU KHIỂN POPUP & FORM ── */
  openRegistrationModal(isEditMode = false, isFirstTime = false) {
    const modal = document.getElementById('citizen-reg-modal');
    if (!modal) return;

    const gateEl = document.getElementById('citizen-google-gate');
    const formWrapEl = document.getElementById('citizen-profile-form-wrap');
    const titleEl = document.getElementById('reg-modal-title');
    const descEl = document.getElementById('reg-modal-desc');
    const submitBtn = document.getElementById('reg-submit-btn');

    // NẾU CHƯA CÓ GOOGLE UID -> BẮT BUỘC ĐĂNG NHẬP GOOGLE
    if (!this.profile || !this.profile.uid) {
      if (gateEl) gateEl.classList.remove('hidden');
      if (formWrapEl) formWrapEl.classList.add('hidden');
      modal.classList.remove('hidden');
      return;
    }

    // ĐÃ CÓ TÀI KHOẢN GOOGLE -> HIỂN THỊ FORM TÙY CHỈNH
    if (gateEl) gateEl.classList.add('hidden');
    if (formWrapEl) formWrapEl.classList.remove('hidden');

    // Cập nhật thông tin tài khoản Google đã xác thực
    const googleNameEl = document.getElementById('verified-google-name');
    const googleEmailEl = document.getElementById('verified-google-email');
    const googleAvatarEl = document.getElementById('verified-google-avatar');

    if (googleNameEl) googleNameEl.textContent = this.profile.nickname || 'Cư Dân Google';
    if (googleEmailEl) googleEmailEl.textContent = this.profile.email || 'Đã liên kết Google Account';
    if (googleAvatarEl) googleAvatarEl.src = this.profile.googlePhotoURL || this.profile.avatarUrl;

    if (isFirstTime) {
      if (titleEl) titleEl.textContent = '⚙️ Tùy Chỉnh Thẻ Căn Cước';
      if (descEl) descEl.textContent = 'Thức tỉnh thành công! Hãy chọn Phe Phái & Vai Trò chuyên môn của bạn.';
      if (submitBtn) submitBtn.textContent = '🚀 KÍCH HOẠT THẺ 3D (+100 SP)';
    } else {
      if (titleEl) titleEl.textContent = '✏️ Chỉnh Sửa Danh Tính';
      if (descEl) descEl.textContent = 'Cập nhật thông tin thẻ căn cước cư dân trên Firebase Cloud';
      if (submitBtn) submitBtn.textContent = '💾 LƯU THAY ĐỔI HỒ SƠ';
    }

    document.getElementById('reg-nickname').value = this.profile.nickname || '';
    document.getElementById('reg-quote').value = this.profile.customQuote || '';
    document.getElementById('reg-role').value = this.profile.role || 'alchemist';

    const radio = document.querySelector(`input[name="reg-faction"][value="${this.profile.faction || 'science'}"]`);
    if (radio) radio.checked = true;

    this.renderAvatarSelector();
    this.selectAvatar(this.profile.avatarUrl);

    modal.classList.remove('hidden');
  }

  openPassModal() {
    if (!this.profile || !this.profile.uid) {
      this.openRegistrationModal();
      return;
    }
    const modal = document.getElementById('citizen-card-modal');
    if (!modal) return;
    this.isCardFlipped = false;
    this.renderIDCard();
    modal.classList.remove('hidden');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  }

  handleRegistrationSubmit(e) {
    e.preventDefault();
    if (!this.profile || !this.profile.uid) {
      alert('⚠️ Bắt buộc phải đăng nhập Google để kích hoạt thẻ căn cước!');
      if (typeof window.loginWithGoogle === 'function') {
        window.loginWithGoogle();
      }
      return;
    }

    const nickname = document.getElementById('reg-nickname').value;
    const factionKey = document.querySelector('input[name="reg-faction"]:checked')?.value || 'science';
    const roleKey = document.getElementById('reg-role').value;
    const avatarUrl = document.getElementById('reg-avatar-val').value;
    const customQuote = document.getElementById('reg-quote').value;

    if (!nickname.trim()) return;

    this.profile.nickname = nickname.trim();
    this.profile.faction = factionKey;
    this.profile.factionName = CITIZEN_CONFIG.FACTIONS[factionKey].name;
    this.profile.role = roleKey;
    this.profile.roleTitle = CITIZEN_CONFIG.ROLES[roleKey].title;
    this.profile.avatarUrl = avatarUrl;
    this.profile.customQuote = customQuote.trim();

    this.saveProfile(this.profile);
    this.showToast('✅ ĐÃ ĐỒNG BỘ CLOUD', 'Hồ sơ Thẻ Căn Cước đã lưu thành công lên Firebase!', 'cyan');

    this.closeModal('citizen-reg-modal');
    setTimeout(() => {
      this.openPassModal();
    }, 300);
  }

  /* ── 7. XUẤT ẢNH THẺ PNG (html2canvas) ── */
  async exportCardPNG() {
    const cardFace = this.isCardFlipped
      ? document.getElementById('id-card-back-content')
      : document.getElementById('id-card-front-content');

    const btn = document.getElementById('btn-export-card');
    if (!cardFace || !btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<span>⏳ Đang in thẻ...</span>';
    btn.disabled = true;

    try {
      // Nạp html2canvas nếu chưa có
      if (typeof html2canvas === 'undefined') {
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      }

      const canvas = await html2canvas(cardFace, {
        scale: 3, // Xuất độ phân giải cao 3x
        backgroundColor: '#070b14',
        useCORS: true,
        logging: false
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `The-Can-Cuoc-${this.profile.nickname || 'Citizen'}-${this.isCardFlipped ? 'Back' : 'Front'}.png`;
      link.href = dataUrl;
      link.click();

      this.showToast('📥 ĐÃ XUẤT ẢNH', 'Thẻ Căn Cước chất lượng cao đã được tải về máy của bạn!', 'emerald');
    } catch (err) {
      console.error('❌ Lỗi khi tải ảnh thẻ:', err);
      this.showToast('⚠️ LỖI XUẤT ẢNH', 'Không thể kết xuất thẻ ảnh. Vui lòng thử lại!', 'stone');
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /* ── 8. TOAST NOTIFICATION THỜI GIAN THỰC ── */
  showToast(title, message, theme = 'cyan') {
    const container = document.getElementById('citizen-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const borderColors = {
      cyan: 'border-[#00d4ff]/40 bg-[#0a1428]/95 shadow-[0_4px_25px_rgba(0,212,255,0.25)] text-[#00d4ff]',
      emerald: 'border-[#39ff14]/40 bg-[#081a14]/95 shadow-[0_4px_25px_rgba(57,255,20,0.25)] text-[#39ff14]',
      stone: 'border-white/20 bg-[#12141c]/95 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-gray-300'
    };

    toast.className = `p-3.5 rounded-2xl border ${borderColors[theme] || borderColors.cyan} backdrop-blur-xl max-w-sm pointer-events-auto transition-all duration-300 transform translate-x-10 opacity-0`;
    toast.innerHTML = `
      <div class="flex items-start gap-2.5">
        <div class="flex-1">
          <h5 class="font-['Orbitron'] text-xs font-black tracking-wider uppercase">${title}</h5>
          <p class="font-['Rajdhani'] text-xs text-white/90 mt-0.5 leading-snug">${message}</p>
        </div>
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-xs text-gray-400 hover:text-white">✕</button>
      </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-10', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-x-10', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  /* ── 9. MÁY ẢNH KỶ NGUYÊN ĐÁ (SUIKA LENS / PHOTO BOOTH) ── */
  openPhotoBooth(imageSrc = null) {
    const modal = document.getElementById('citizen-photobooth-modal');
    if (!modal) return;

    // Ảnh khởi tạo: Ảnh truyền vào -> Avatar hiện tại -> Senku mặc định
    let targetSrc = imageSrc || this.profile?.avatarUrl || 'assets/images/characters/hd/senku.png';
    this.photoBoothState = {
      image: null,
      zoom: 1.0,
      panX: 0,
      panY: 0,
      isDragging: false,
      startX: 0,
      startY: 0,
      crack: 'senku',
      overlay: 'none',
      filter: 'none',
      crackOpacity: 0.95
    };

    const slider = document.getElementById('pb-zoom-slider');
    if (slider) slider.value = '1.0';

    this.loadPhotoBoothImage(targetSrc);
    this.initPhotoBoothCanvas();
    modal.classList.remove('hidden');
  }

  loadPhotoBoothImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.photoBoothState.image = img;
      this.drawPhotoBooth();
      const label = document.getElementById('pb-image-label');
      if (label) {
        label.textContent = src.startsWith('data:') ? 'Ảnh vừa tải lên' : 'Chân dung cư dân';
      }
    };
    img.onerror = () => {
      console.warn('Không thể nạp ảnh vào PhotoBooth, chuyển về Senku');
      if (src !== 'assets/images/characters/hd/senku.png') {
        this.loadPhotoBoothImage('assets/images/characters/hd/senku.png');
      }
    };
    img.src = src;
  }

  handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (JPG, PNG, WebP)!');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 10MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      this.openPhotoBooth(dataUrl);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  initPhotoBoothCanvas() {
    const canvas = document.getElementById('photobooth-canvas');
    const wrap = document.getElementById('photobooth-canvas-wrap');
    if (!canvas || !wrap) return;

    if (canvas._hasEvents) return;
    canvas._hasEvents = true;

    // Mouse drag
    canvas.addEventListener('mousedown', (e) => {
      this.photoBoothState.isDragging = true;
      this.photoBoothState.startX = e.clientX - this.photoBoothState.panX;
      this.photoBoothState.startY = e.clientY - this.photoBoothState.panY;
      wrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.photoBoothState.isDragging) return;
      this.photoBoothState.panX = e.clientX - this.photoBoothState.startX;
      this.photoBoothState.panY = e.clientY - this.photoBoothState.startY;
      this.drawPhotoBooth();
    });

    window.addEventListener('mouseup', () => {
      this.photoBoothState.isDragging = false;
      if (wrap) wrap.style.cursor = 'grab';
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.photoBoothState.isDragging = true;
        this.photoBoothState.startX = e.touches[0].clientX - this.photoBoothState.panX;
        this.photoBoothState.startY = e.touches[0].clientY - this.photoBoothState.panY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.photoBoothState.isDragging || e.touches.length !== 1) return;
      this.photoBoothState.panX = e.touches[0].clientX - this.photoBoothState.startX;
      this.photoBoothState.panY = e.touches[0].clientY - this.photoBoothState.startY;
      this.drawPhotoBooth();
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.photoBoothState.isDragging = false;
    });

    // Wheel zoom
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      const newZoom = Math.min(Math.max(this.photoBoothState.zoom + delta, 0.5), 2.8);
      this.photoBoothState.zoom = newZoom;
      const slider = document.getElementById('pb-zoom-slider');
      if (slider) slider.value = newZoom.toFixed(2);
      this.drawPhotoBooth();
    }, { passive: false });
  }

  drawPhotoBooth() {
    const canvas = document.getElementById('photobooth-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Nền tối
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, width, height);

    // 2. Vẽ ảnh người dùng kèm pan, zoom, filter
    const state = this.photoBoothState;
    if (state.image) {
      ctx.save();
      if (state.filter === 'stone') {
        ctx.filter = 'grayscale(100%) contrast(125%) brightness(90%)';
      } else if (state.filter === 'nital') {
        ctx.filter = 'contrast(120%) saturate(150%) hue-rotate(45deg)';
      } else if (state.filter === 'vintage') {
        ctx.filter = 'sepia(80%) contrast(110%) brightness(95%)';
      } else {
        ctx.filter = 'none';
      }

      ctx.translate(width / 2 + state.panX, height / 2 + state.panY);
      ctx.scale(state.zoom, state.zoom);

      const img = state.image;
      const aspect = img.width / img.height;
      let drawW, drawH;
      if (aspect > 1) {
        drawH = height;
        drawW = height * aspect;
      } else {
        drawW = width;
        drawH = width / aspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Hiệu ứng hạt đá nếu là filter stone
      if (state.filter === 'stone') {
        this.drawStoneNoise(ctx, width, height);
      }
    }

    // 3. Vẽ Vết Nứt Hóa Thạch (Petrification Cracks)
    if (state.crack !== 'none') {
      ctx.save();
      this.drawPetrificationCrack(ctx, state.crack, state.crackOpacity);
      ctx.restore();
    }

    // 4. Vẽ Phụ Kiện Kỷ Nguyên Đá (Overlays)
    if (state.overlay !== 'none') {
      ctx.save();
      this.drawOverlayProp(ctx, state.overlay);
      ctx.restore();
    }

    // 5. Viền hiệu ứng Sci-Fi
    this.drawCanvasVignette(ctx, width, height);
  }

  drawStoneNoise(ctx, width, height) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const rs = Math.random() * 2 + 1;
      ctx.fillRect(rx, ry, rs, rs);
    }
    ctx.restore();
  }

  drawPetrificationCrack(ctx, crackType, opacity = 0.95) {
    if (crackType === 'senku') {
      this.drawCrackSenku(ctx, opacity);
    } else if (crackType === 'gen') {
      this.drawCrackGen(ctx, opacity);
    } else if (crackType === 'tsukasa') {
      this.drawCrackTsukasa(ctx, opacity);
    }
  }

  drawCrackSenku(ctx, opacity = 0.95) {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Outer glow / Nital aura
    ctx.shadowColor = 'rgba(57, 255, 20, 0.7)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#05070a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';

    // Crack Branch 1 (Mắt phải)
    ctx.beginPath();
    ctx.moveTo(380, 50);
    ctx.lineTo(395, 105);
    ctx.lineTo(375, 155);
    ctx.lineTo(390, 210);
    ctx.lineTo(365, 275);
    ctx.lineTo(385, 340);
    ctx.lineTo(370, 420);
    ctx.stroke();

    // Nhánh phụ mắt phải
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(375, 155);
    ctx.lineTo(345, 180);
    ctx.moveTo(365, 275);
    ctx.lineTo(340, 290);
    ctx.moveTo(385, 340);
    ctx.lineTo(415, 360);
    ctx.stroke();

    // Crack Branch 2 (Mắt trái)
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 95);
    ctx.lineTo(275, 160);
    ctx.lineTo(290, 220);
    ctx.lineTo(255, 295);
    ctx.lineTo(270, 365);
    ctx.stroke();

    // Nhánh phụ mắt trái
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(275, 160);
    ctx.lineTo(240, 175);
    ctx.moveTo(255, 295);
    ctx.lineTo(225, 320);
    ctx.stroke();

    // Lõi phát sáng Nital
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#39ff14';
    ctx.strokeStyle = '#39ff14';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(380, 50);
    ctx.lineTo(395, 105);
    ctx.lineTo(375, 155);
    ctx.lineTo(390, 210);
    ctx.lineTo(365, 275);
    ctx.moveTo(300, 95);
    ctx.lineTo(275, 160);
    ctx.lineTo(290, 220);
    ctx.stroke();

    ctx.restore();
  }

  drawCrackGen(ctx, opacity = 0.95) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = 'rgba(0, 212, 255, 0.7)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#05070a';
    ctx.lineCap = 'round';

    // Vết sẹo má trái Gen
    ctx.beginPath();
    ctx.moveTo(220, 210);
    ctx.lineTo(245, 260);
    ctx.lineTo(225, 315);
    ctx.lineTo(250, 375);
    ctx.lineTo(230, 435);
    ctx.lineTo(245, 490);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(245, 260);
    ctx.lineTo(270, 275);
    ctx.moveTo(225, 315);
    ctx.lineTo(195, 335);
    ctx.moveTo(250, 375);
    ctx.lineTo(280, 395);
    ctx.stroke();

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(220, 210);
    ctx.lineTo(245, 260);
    ctx.lineTo(225, 315);
    ctx.lineTo(250, 375);
    ctx.stroke();

    ctx.restore();
  }

  drawCrackTsukasa(ctx, opacity = 0.95) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#05070a';
    ctx.lineCap = 'round';

    // Vết sẹo ngang sống mũi Tsukasa
    ctx.beginPath();
    ctx.moveTo(150, 285);
    ctx.lineTo(205, 265);
    ctx.lineTo(260, 290);
    ctx.lineTo(315, 265);
    ctx.lineTo(370, 285);
    ctx.lineTo(430, 270);
    ctx.lineTo(475, 295);
    ctx.stroke();

    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(205, 265);
    ctx.lineTo(185, 235);
    ctx.moveTo(315, 265);
    ctx.lineTo(330, 230);
    ctx.moveTo(370, 285);
    ctx.lineTo(395, 320);
    ctx.stroke();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(150, 285);
    ctx.lineTo(205, 265);
    ctx.lineTo(260, 290);
    ctx.lineTo(315, 265);
    ctx.lineTo(370, 285);
    ctx.stroke();

    ctx.restore();
  }

  drawOverlayProp(ctx, propType) {
    if (propType === 'suika') {
      this.drawSuikaHelmet(ctx);
    } else if (propType === 'goggles') {
      this.drawSenkuGoggles(ctx);
    } else if (propType === 'emblem') {
      this.drawKingdomEmblem(ctx);
    }
  }

  drawSuikaHelmet(ctx) {
    ctx.save();
    // 1. Vỏ dưa hấu
    ctx.beginPath();
    ctx.arc(300, 175, 175, Math.PI * 0.95, Math.PI * 0.05, false);
    ctx.fillStyle = '#16a34a';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#14532d';
    ctx.stroke();

    // 2. Sọc dưa hấu
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(300, 10);
    ctx.quadraticCurveTo(240, 90, 220, 180);
    ctx.moveTo(300, 10);
    ctx.quadraticCurveTo(360, 90, 380, 180);
    ctx.moveTo(300, 10);
    ctx.quadraticCurveTo(170, 90, 150, 175);
    ctx.moveTo(300, 10);
    ctx.quadraticCurveTo(430, 90, 450, 175);
    ctx.stroke();

    // 3. Cuống dưa hấu
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.ellipse(300, 15, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f6212';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(300, 15);
    ctx.quadraticCurveTo(310, -5, 325, 0);
    ctx.stroke();

    // 4. Hai lỗ mắt hoa hướng dương đặc trưng
    const drawEyehole = (cx, cy) => {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ca8a04';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    };

    drawEyehole(230, 195);
    drawEyehole(370, 195);

    ctx.restore();
  }

  drawSenkuGoggles(ctx) {
    ctx.save();
    // 1. Quai da
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(40, 260);
    ctx.lineTo(560, 260);
    ctx.stroke();

    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(40, 260);
    ctx.lineTo(560, 260);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Khớp nối mũi
    ctx.fillStyle = '#92400e';
    ctx.fillRect(275, 252, 50, 16);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(275, 252, 50, 16);

    // 3. Hai tròng kính đồng thau
    const drawLens = (cx, cy) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fillStyle = '#b45309';
      ctx.fill();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#67e8f9';
      ctx.stroke();

      // Vệt chóa sáng
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(cx - 35, cy - 45);
      ctx.lineTo(cx - 15, cy - 45);
      ctx.lineTo(cx + 10, cy + 45);
      ctx.lineTo(cx - 10, cy + 45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    drawLens(215, 260);
    drawLens(385, 260);

    ctx.restore();
  }

  drawKingdomEmblem(ctx) {
    ctx.save();
    ctx.translate(450, 470);
    ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 135, 115, 16);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧪', 67, 42);

    ctx.fillStyle = '#00d4ff';
    ctx.font = 'bold 9px Orbitron, sans-serif';
    ctx.fillText('DR. STONE', 67, 65);

    ctx.fillStyle = '#39ff14';
    ctx.font = 'bold 8px Rajdhani, sans-serif';
    ctx.fillText('KINGDOM OF SCIENCE', 67, 80);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '7px monospace';
    ctx.fillText('YEAR 5738 · 10B%', 67, 95);

    ctx.restore();
  }

  drawCanvasVignette(ctx, width, height) {
    ctx.save();
    const grad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.52);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle sci-fi border
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.restore();
  }

  setPhotoBoothCrack(crack, btnEl) {
    this.photoBoothState.crack = crack;
    document.querySelectorAll('.pb-crack-btn').forEach(b => {
      b.className = 'pb-crack-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-[\'Rajdhani\'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer';
    });
    if (btnEl) {
      btnEl.className = 'pb-crack-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-[\'Rajdhani\'] font-bold text-[#00d4ff] transition-all cursor-pointer';
    }
    this.drawPhotoBooth();
  }

  setPhotoBoothOverlay(overlay, btnEl) {
    this.photoBoothState.overlay = overlay;
    document.querySelectorAll('.pb-overlay-btn').forEach(b => {
      b.className = 'pb-overlay-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-[\'Rajdhani\'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer';
    });
    if (btnEl) {
      btnEl.className = 'pb-overlay-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-[\'Rajdhani\'] font-bold text-[#00d4ff] transition-all cursor-pointer';
    }
    this.drawPhotoBooth();
  }

  setPhotoBoothFilter(filter, btnEl) {
    this.photoBoothState.filter = filter;
    document.querySelectorAll('.pb-filter-btn').forEach(b => {
      b.className = 'pb-filter-btn p-2 rounded-xl bg-black/40 border border-white/10 text-center text-xs font-[\'Rajdhani\'] font-bold text-gray-400 hover:text-white transition-all cursor-pointer';
    });
    if (btnEl) {
      btnEl.className = 'pb-filter-btn p-2 rounded-xl bg-[#00d4ff]/15 border border-[#00d4ff] ring-1 ring-[#00d4ff]/40 text-center text-xs font-[\'Rajdhani\'] font-bold text-[#00d4ff] transition-all cursor-pointer';
    }
    this.drawPhotoBooth();
  }

  updatePhotoBoothZoom(val) {
    this.photoBoothState.zoom = parseFloat(val) || 1.0;
    this.drawPhotoBooth();
  }

  resetPhotoBoothTransform() {
    this.photoBoothState.zoom = 1.0;
    this.photoBoothState.panX = 0;
    this.photoBoothState.panY = 0;
    const slider = document.getElementById('pb-zoom-slider');
    if (slider) slider.value = '1.0';
    this.drawPhotoBooth();
  }

  applyPhotoBoothAvatar() {
    const canvas = document.getElementById('photobooth-canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/webp', 0.88);

    // Cập nhật input ẩn trong form
    const avatarInput = document.getElementById('reg-avatar-val');
    if (avatarInput) avatarInput.value = dataUrl;

    // Cập nhật profile nếu đã đăng nhập
    if (this.profile) {
      this.profile.avatarUrl = dataUrl;
      this.saveProfile(this.profile);
      this.showToast('🧪 THỨC TỈNH AVATAR!', 'Đã áp dụng ảnh hóa thạch mới vào Thẻ Căn Cước 3D!', 'emerald');
    } else {
      this.showToast('✅ ĐÃ CHỌN ẢNH', 'Ảnh đại diện hóa thạch đã được chọn cho Thẻ Căn Cước!', 'cyan');
    }

    // Làm mới avatar picker
    this.renderAvatarSelector();

    // Đóng Photo Booth modal
    this.closeModal('citizen-photobooth-modal');

    // Mở xem lại thẻ 3D nếu đã có profile
    if (this.profile) {
      setTimeout(() => {
        this.openPassModal();
      }, 300);
    }
  }

  downloadPhotoBoothPNG() {
    const canvas = document.getElementById('photobooth-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    const name = this.profile?.nickname || 'DrStone-Citizen';
    link.download = `Avatar-Hoa-Thach-${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('📥 ĐÃ TẢI ẢNH', 'Ảnh avatar kỷ nguyên đá HD đã được lưu về máy!', 'cyan');
  }

  bindGlobalEvents() {
    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
      const btn = document.getElementById('citizen-nav-btn');
      const menu = document.getElementById('citizen-dropdown-menu');
      if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
          menu.classList.add('hidden');
        }
      }
    });

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal('citizen-reg-modal');
        this.closeModal('citizen-card-modal');
        this.closeModal('citizen-photobooth-modal');
      }
    });
  }
}

// Khởi tạo Singleton
const CitizenPass = new CitizenPassController();
window.CitizenPass = CitizenPass;
