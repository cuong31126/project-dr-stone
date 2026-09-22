// js/daily-gacha.js — Thí Nghiệm Hồi Sinh Tượng Đá Mỗi Ngày (Daily Depetrification Gacha)
// Tác giả: Antigravity | Dự án: Dr. Stone Fan Website
// Đột phá: 
// 1. Cơ chế hồi sinh tượng đá bằng Nital (Chạm giữ 1 giây -> nứt toác -> thẻ bài 3D).
// 2. Bộ sưu tập 12 Cư Dân Kỷ Nguyên 5738 (Cấp SSR, SR, R) lưu LocalStorage & Cloud.
// 3. Mini TikTok BGM Player phát file assets/audio/bgm-breath.mp3 với đĩa than xoay & sóng âm.
// 4. Mobile-first: Hỗ trợ haptic vibration, giao diện chạm mượt mà 60 FPS, không ép login.

'use strict';

// Dữ liệu 12 nhân vật hồi sinh chuẩn Dr. Stone
const GACHA_CHARACTERS = [
  // ── CẤP SSR (Huyền thoại · Viền Vàng Kim Óng Ánh) ──
  {
    id: 'senku-ishigami',
    name: 'Senku Ishigami',
    title: 'Nhà Khoa Học Thiên Tài',
    tier: 'SSR',
    tierColor: '#ffd700',
    thumb: 'assets/images/characters/portraits/senku-ishigami.png',
    quote: '10 tỷ phần trăm tao sẽ dùng khoa học cứu rỗi toàn bộ nhân loại!',
    sp: 100
  },
  {
    id: 'tsukasa-shishio',
    name: 'Tsukasa Shishio',
    title: 'Linh Trưởng Mạnh Nhất',
    tier: 'SSR',
    tierColor: '#ffd700',
    thumb: 'assets/images/characters/portraits/tsukasa-shishio.png',
    quote: 'Trong thế giới đá thuần khiết này, ta sẽ thanh tẩy tất cả kẻ tham lam!',
    sp: 100
  },
  {
    id: 'ryusui-nanami',
    name: 'Ryusui Nanami',
    title: 'Thuyền Trưởng Của Lòng Tham',
    tier: 'SSR',
    tierColor: '#ffd700',
    thumb: 'assets/images/characters/portraits/ryusui-nanami.png',
    quote: 'Haha! Ta muốn tất cả mọi thứ trên thế gian này!',
    sp: 90
  },

  // ── CẤP SR (Hiếm · Viền Xanh Neon Cyan) ──
  {
    id: 'gen-asagiri',
    name: 'Gen Asagiri',
    title: 'Ảo Thuật Gia Tâm Lý',
    tier: 'SR',
    tierColor: '#00d4ff',
    thumb: 'assets/images/characters/portraits/gen-asagiri.png',
    quote: 'Kẻ nông cạn nhất thế giới chỉ muốn đứng về phía kẻ chiến thắng mà thôi~',
    sp: 60
  },
  {
    id: 'chrome',
    name: 'Chrome',
    title: 'Phù Thủy Khoa Học',
    tier: 'SR',
    tierColor: '#00d4ff',
    thumb: 'assets/images/characters/portraits/chrome.png',
    quote: 'Cực kỳ tột độ! Khoa học chính là điều kỳ diệu nhất thế giới!',
    sp: 60
  },
  {
    id: 'kohaku',
    name: 'Kohaku',
    title: 'Chiến Binh Mắt Thần 11/10',
    tier: 'SR',
    tierColor: '#00d4ff',
    thumb: 'assets/images/characters/portraits/kohaku.png',
    quote: 'Ta không phải khỉ đột! Ta là nữ chiến binh mạnh nhất Làng Ishigami!',
    sp: 60
  },
  {
    id: 'ukyo-saionji',
    name: 'Ukyo Saionji',
    title: 'Cung Thủ Thính Giác Vô Song',
    tier: 'SR',
    tierColor: '#00d4ff',
    thumb: 'assets/images/characters/portraits/ukyo-saionji.png',
    quote: 'Một thế giới không đổ máu — đó là điều kiện duy nhất của tôi.',
    sp: 55
  },
  {
    id: 'xeno-houston-wingfield',
    name: 'Dr. Xeno',
    title: 'Nhà Khoa Học Quân Sự NASA',
    tier: 'SR',
    tierColor: '#00d4ff',
    thumb: 'assets/images/characters/portraits/xeno-houston-wingfield.png',
    quote: 'Khoa học là sức mạnh thống trị thanh lịch và tuyệt đối nhất.',
    sp: 70
  },

  // ── CẤP R (Phổ biến · Viền Lục Bảo Emerald) ──
  {
    id: 'suika',
    name: 'Suika',
    title: 'Trinh Sát Vỏ Dưa Bé Nhỏ',
    tier: 'R',
    tierColor: '#39ff14',
    thumb: 'assets/images/characters/portraits/suika.png',
    quote: 'Suika tuy nhỏ bé nhưng luôn muốn giúp ích cho mọi người!',
    sp: 40
  },
  {
    id: 'taiju-oki',
    name: 'Taiju Oki',
    title: 'Cỗ Máy Thể Lực Vô Tận',
    tier: 'R',
    tierColor: '#39ff14',
    thumb: 'assets/images/characters/portraits/taiju-oki.png',
    quote: 'Dù 3.700 năm trôi qua, lời tỏ tình của tao vẫn chưa nói ra!',
    sp: 40
  },
  {
    id: 'yuzuriha-ogawa',
    name: 'Yuzuriha Ogawa',
    title: 'Bậc Thầy Thủ Công Tinh Xảo',
    tier: 'R',
    tierColor: '#39ff14',
    thumb: 'assets/images/characters/portraits/yuzuriha-ogawa.png',
    quote: 'Từng mảnh đá vỡ nát, tớ sẽ chắp nối lại tất cả nguyên vẹn!',
    sp: 40
  },
  {
    id: 'kaseki',
    name: 'Kaseki',
    title: 'Nghệ Nhân Chế Tác Thần Thánh',
    tier: 'R',
    tierColor: '#39ff14',
    thumb: 'assets/images/characters/portraits/kaseki.png',
    quote: 'Ngọn lửa nhiệt huyết của người thợ thủ công này đang bùng cháy dữ dội!',
    sp: 45
  }
];

class DailyGachaSystem {
  constructor() {
    this.storageKey = 'drstone_awakened_characters';
    this.unlockedIds = this.loadUnlockedIds();
    this.isAwakening = false;
    this.holdTimer = null;
    this.holdProgress = 0;

    // Khởi tạo Audio BGM Player
    this.bgmAudio = new Audio('assets/audio/bgm-breath.mp3');
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.45;
    this.isPlayingBgm = false;

    this.initUI();
    this.initBGMPlayer();
    this.renderCollectionGrid();
    this.bindEvents();
  }

  loadUnlockedIds() {
    const defaultFour = ['senku-ishigami', 'taiju-oki', 'yuzuriha-ogawa', 'chrome'];
    const versionKey = 'drstone_gacha_v3_default4';
    try {
      // Đảm bảo mọi thiết bị/trình duyệt bắt đầu đúng với 4 nhân vật mặc định
      if (localStorage.getItem(versionKey) !== 'true') {
        localStorage.setItem(this.storageKey, JSON.stringify(defaultFour));
        localStorage.setItem(versionKey, 'true');
        return [...defaultFour];
      }
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        defaultFour.forEach(id => {
          if (!parsed.includes(id)) parsed.push(id);
        });
        return parsed;
      }
      return [...defaultFour];
    } catch {
      return [...defaultFour];
    }
  }

  saveUnlockedIds() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.unlockedIds));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  initUI() {
    this.triggerBtn = document.getElementById('btn-hold-depetrify');
    this.progressBar = document.getElementById('nital-charge-bar');
    this.stonePreview = document.getElementById('mystery-stone-statue');
    this.resultModal = document.getElementById('gacha-result-modal');
    this.collectionCountEl = document.getElementById('gacha-unlocked-count');
    this.collectionGridEl = document.getElementById('gacha-collection-grid');
    this.btnTestAgain = document.getElementById('btn-gacha-test-again');
  }

  // 🎵 TIKTOK MINI BGM PLAYER (ĐĨA THAN XOAY + SÓNG ÂM)
  initBGMPlayer() {
    this.bgmBtn = document.getElementById('btn-tiktok-bgm-toggle');
    this.bgmDisc = document.getElementById('tiktok-bgm-disc');
    this.bgmWaves = document.getElementById('tiktok-bgm-waves');

    if (this.bgmBtn) {
      this.bgmBtn.addEventListener('click', () => {
        this.toggleBGM();
      });
    }

    // Tự động khôi phục trạng thái BGM nếu user từng bật
    const savedState = localStorage.getItem('drstone_bgm_enabled');
    if (savedState === 'true') {
      // Chờ tương tác đầu tiên của người dùng để tránh bị trình duyệt chặn Autoplay
      const startBgmOnce = () => {
        this.playBGM();
        window.removeEventListener('click', startBgmOnce);
        window.removeEventListener('touchstart', startBgmOnce);
      };
      window.addEventListener('click', startBgmOnce, { once: true });
      window.addEventListener('touchstart', startBgmOnce, { once: true });
    }
  }

  toggleBGM() {
    if (this.isPlayingBgm) {
      this.pauseBGM();
    } else {
      this.playBGM();
    }
  }

  playBGM() {
    this.bgmAudio.play().then(() => {
      this.isPlayingBgm = true;
      localStorage.setItem('drstone_bgm_enabled', 'true');
      if (this.bgmDisc) this.bgmDisc.classList.add('animate-spin-slow', 'shadow-[0_0_20px_#00d4ff]');
      if (this.bgmWaves) this.bgmWaves.classList.remove('hidden');
    }).catch(err => {
      console.warn('Audio play request blocked:', err);
    });
  }

  pauseBGM() {
    this.bgmAudio.pause();
    this.isPlayingBgm = false;
    localStorage.setItem('drstone_bgm_enabled', 'false');
    if (this.bgmDisc) this.bgmDisc.classList.remove('animate-spin-slow', 'shadow-[0_0_20px_#00d4ff]');
    if (this.bgmWaves) this.bgmWaves.classList.add('hidden');
  }

  // 🗿 HIỂN THỊ LƯỚI 12 TƯỢNG ĐÁ TRONG BỘ SƯU TẬP
  renderCollectionGrid() {
    if (!this.collectionGridEl) return;

    if (this.collectionCountEl) {
      this.collectionCountEl.textContent = `${this.unlockedIds.length} / ${GACHA_CHARACTERS.length}`;
    }

    this.collectionGridEl.innerHTML = '';

    GACHA_CHARACTERS.forEach(char => {
      const isUnlocked = this.unlockedIds.includes(char.id);
      const card = document.createElement('div');
      card.className = `relative rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all duration-300 border ${
        isUnlocked 
          ? 'bg-white/[0.04] border-[#00d4ff]/30 shadow-[0_4px_20px_rgba(0,212,255,0.15)] hover:scale-105' 
          : 'bg-black/50 border-white/5 opacity-60'
      }`;

      card.innerHTML = `
        <div class="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border ${isUnlocked ? 'border-[#00d4ff]/40' : 'border-white/10'}">
          <img src="${char.thumb}" alt="${isUnlocked ? char.name : 'Tượng Đá Chưa Hồi Sinh'}" 
            class="w-full h-full object-cover transition-all duration-500 ${isUnlocked ? '' : 'filter grayscale contrast-150 brightness-25 blur-[1px]'}" />
          ${!isUnlocked ? '<div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-[0.65rem] text-[#8fa0ba] font-bold"><span>🔒</span><span>ẨN</span></div>' : ''}
          <span class="absolute top-1 left-1 text-[0.55rem] font-['Orbitron'] font-black px-1.5 py-0.5 rounded ${
            char.tier === 'SSR' ? 'bg-amber-500/80 text-white shadow-[0_0_8px_#ffd700]' :
            char.tier === 'SR' ? 'bg-cyan-500/80 text-white shadow-[0_0_8px_#00d4ff]' : 'bg-emerald-500/80 text-white'
          }">${char.tier}</span>
        </div>
        <span class="text-[0.72rem] font-['Rajdhani'] font-bold text-center line-clamp-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}">
          ${isUnlocked ? char.name : '??? (Hóa Đá)'}
        </span>
      `;
      this.collectionGridEl.appendChild(card);
    });
  }

  // 🧪 LOGIC CHẠM & GIỮ ĐỂ ĐỔ DUNG DỊCH NITAL
  bindEvents() {
    if (!this.triggerBtn) return;

    const startCharge = (e) => {
      e.preventDefault();
      if (this.isAwakening) return;
      this.holdProgress = 0;
      this.triggerBtn.classList.add('scale-95');

      // Rung nhẹ haptic trên điện thoại nếu được hỗ trợ
      if (navigator.vibrate) navigator.vibrate(25);

      this.holdTimer = setInterval(() => {
        this.holdProgress += 4;
        if (this.progressBar) {
          this.progressBar.style.width = `${Math.min(100, this.holdProgress)}%`;
        }

        // Đổ đầy sau ~800ms
        if (this.holdProgress >= 100) {
          clearInterval(this.holdTimer);
          this.executeDepetrification();
        }
      }, 30);
    };

    const cancelCharge = () => {
      if (this.isAwakening) return;
      clearInterval(this.holdTimer);
      this.holdProgress = 0;
      if (this.progressBar) this.progressBar.style.width = '0%';
      this.triggerBtn.classList.remove('scale-95');
    };

    this.triggerBtn.addEventListener('mousedown', startCharge);
    this.triggerBtn.addEventListener('mouseup', cancelCharge);
    this.triggerBtn.addEventListener('mouseleave', cancelCharge);

    this.triggerBtn.addEventListener('touchstart', startCharge, { passive: false });
    this.triggerBtn.addEventListener('touchend', cancelCharge);
    this.triggerBtn.addEventListener('touchcancel', cancelCharge);

    // Nút đóng modal kết quả
    const closeBtn = document.getElementById('btn-close-gacha-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.resultModal) this.resultModal.classList.add('hidden');
      });
    }

    if (this.btnTestAgain) {
      this.btnTestAgain.addEventListener('click', () => {
        if (this.resultModal) this.resultModal.classList.add('hidden');
        this.resetStatuePreview();
      });
    }
  }

  // 💥 KÍCH HOẠT HIỆU ỨNG TƯỢNG ĐÁ NỨT VỠ VÀ HÉ LỘ NHÂN VẬT
  executeDepetrification() {
    this.isAwakening = true;
    if (navigator.vibrate) navigator.vibrate([40, 60, 100]);

    // 1. Hiệu ứng tượng đá nứt toác phát sáng tia sét
    if (this.stonePreview) {
      this.stonePreview.classList.add('animate-depetrify-break');
    }

    setTimeout(() => {
      // 2. Thuật toán Random Gacha (Tỉ lệ: SSR 15%, SR 35%, R 50%)
      const rand = Math.random() * 100;
      let pool = [];

      if (rand < 18) {
        pool = GACHA_CHARACTERS.filter(c => c.tier === 'SSR');
      } else if (rand < 55) {
        pool = GACHA_CHARACTERS.filter(c => c.tier === 'SR');
      } else {
        pool = GACHA_CHARACTERS.filter(c => c.tier === 'R');
      }

      // Ưu tiên nhân vật chưa mở để user không bị nản lòng
      const unobtainedInPool = pool.filter(c => !this.unlockedIds.includes(c.id));
      const chosen = (unobtainedInPool.length > 0) 
        ? unobtainedInPool[Math.floor(Math.random() * unobtainedInPool.length)]
        : pool[Math.floor(Math.random() * pool.length)];

      // Lưu vào danh sách đã mở
      if (!this.unlockedIds.includes(chosen.id)) {
        this.unlockedIds.push(chosen.id);
        this.saveUnlockedIds();
      }

      // Thưởng Science Points vào Citizen Pass
      if (window.CitizenPass && typeof window.CitizenPass.addSciencePoints === 'function') {
        window.CitizenPass.addSciencePoints(chosen.sp, `Hồi sinh thành công: ${chosen.name} (${chosen.tier})`);
      }

      // Cập nhật lại lưới bộ sưu tập
      this.renderCollectionGrid();

      // Hiển thị Popup chúc mừng
      this.showResultModal(chosen);

      this.isAwakening = false;
      if (this.progressBar) this.progressBar.style.width = '0%';
      this.triggerBtn.classList.remove('scale-95');
    }, 900);
  }

  showResultModal(char) {
    if (!this.resultModal) return;

    const imgEl = document.getElementById('gacha-result-img');
    const nameEl = document.getElementById('gacha-result-name');
    const titleEl = document.getElementById('gacha-result-title');
    const tierEl = document.getElementById('gacha-result-tier');
    const quoteEl = document.getElementById('gacha-result-quote');
    const spEl = document.getElementById('gacha-result-sp');

    if (imgEl) imgEl.src = char.thumb;
    if (nameEl) nameEl.textContent = char.name;
    if (titleEl) titleEl.textContent = char.title;
    if (quoteEl) quoteEl.textContent = `"${char.quote}"`;
    if (spEl) spEl.textContent = `+${char.sp} SP`;

    if (tierEl) {
      tierEl.textContent = char.tier;
      tierEl.style.backgroundColor = char.tierColor;
      tierEl.style.color = '#000';
    }

    this.resultModal.classList.remove('hidden');
  }

  resetStatuePreview() {
    if (this.stonePreview) {
      this.stonePreview.classList.remove('animate-depetrify-break');
    }
  }
}

// Khởi chạy khi DOM tải xong
function initDailyGacha() {
  if (!window.dailyGachaSystem) {
    window.dailyGachaSystem = new DailyGachaSystem();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDailyGacha);
} else {
  initDailyGacha();
}

export default DailyGachaSystem;
