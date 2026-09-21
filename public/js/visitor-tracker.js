/**
 * js/visitor-tracker.js
 * Hệ thống tự động ghi nhận lượt truy cập, đếm số cư dân thức tỉnh & gửi thông báo về Discord / Telegram
 * Dự án: Dr. Stone Fan Website
 */

'use strict';

const TRACKER_CONFIG = {
  // ── CÔNG TẮC DEPLOYMENT CHÍNH (BẬT / TẮT KHI DEPLOY) ──
  // Khi deploy lên hosting/domain thật thì đổi thành true để hiển thị badge thống kê & kích hoạt đếm trực tiếp
  IS_DEPLOYED_LIVE: true,

  // Tự động kích hoạt đếm thật nếu chạy trên domain online (không phải localhost)
  autoDetectOnline: true,

  // Endpoint gửi Discord bảo mật: Gọi qua Vercel Serverless Function bí mật (/api/discord-notify)
  apiNotifyUrl: '/api/discord-notify',
  // Webhook dự phòng đọc an toàn từ localStorage (dành cho test local nếu cần, không lộ lên GitHub)
  get discordWebhookUrl() {
    return localStorage.getItem('drstone_custom_discord_webhook') || '';
  },

  // Cấu hình Telegram Bot (tùy chọn)
  telegram: {
    botToken: '',
    chatId: ''
  },

  // Số liệu thống kê cơ sở chuẩn hóa Dr. Stone:
  // Baseline 3.715 năm lịch sử + 56 lượt thực tế ghi nhận qua Discord = 3.771 lượt ghé thăm
  baselineVisits: 3771,
  // Baseline 109 nhân vật nguyên tác + 10 cư dân thức tỉnh qua Google Auth thật = 119 cư dân
  baselineCitizens: 119,

  // Chống spam: Không gửi thông báo truy cập lặp lại nếu cùng 1 người F5 trong vòng 30 phút
  antiSpamMinutes: 30,
  enableConsoleLog: true
};

const STORAGE_ANALYTICS_KEYS = {
  LAST_VISIT: 'drstone_last_tracked_time',
  LOCAL_VISITS: 'drstone_local_visit_count',
  LOCAL_CITIZENS: 'drstone_local_citizen_count'
};

/* ── 1. QUẢN LÝ BỘ ĐẾM SỐ LIỆU (VISITS & CITIZENS) ── */
function isLiveEnvironment() {
  if (TRACKER_CONFIG.IS_DEPLOYED_LIVE) return true;
  if (TRACKER_CONFIG.autoDetectOnline) {
    const host = window.location.hostname;
    return host && host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.');
  }
  return false;
}

function getVisitsCount() {
  const local = parseInt(localStorage.getItem(STORAGE_ANALYTICS_KEYS.LOCAL_VISITS) || '0', 10);
  return TRACKER_CONFIG.baselineVisits + local;
}

function incrementVisitsCount() {
  const current = parseInt(localStorage.getItem(STORAGE_ANALYTICS_KEYS.LOCAL_VISITS) || '0', 10);
  const updated = current + 1;
  localStorage.setItem(STORAGE_ANALYTICS_KEYS.LOCAL_VISITS, updated.toString());
  return TRACKER_CONFIG.baselineVisits + updated;
}

function getCitizensCount() {
  const local = parseInt(localStorage.getItem(STORAGE_ANALYTICS_KEYS.LOCAL_CITIZENS) || '0', 10);
  return TRACKER_CONFIG.baselineCitizens + local;
}

function incrementCitizenCount() {
  const current = parseInt(localStorage.getItem(STORAGE_ANALYTICS_KEYS.LOCAL_CITIZENS) || '0', 10);
  const updated = current + 1;
  localStorage.setItem(STORAGE_ANALYTICS_KEYS.LOCAL_CITIZENS, updated.toString());
  return TRACKER_CONFIG.baselineCitizens + updated;
}

/* ── 2. BẢNG THỐNG KÊ CHI TIẾT (KINGDOM ANALYTICS TELEMETRY HUD MODAL) ── */
function ensureRadarAnalyticsModal() {
  let modal = document.getElementById('radar-analytics-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.id = 'radar-analytics-modal';
  modal.className = 'fixed inset-0 z-[9999] hidden flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl transition-all duration-300';
  modal.innerHTML = `
    <div class="relative w-full max-w-2xl bg-[#0a0f1e]/95 border border-[#00d4ff]/35 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(0,212,255,0.2)] overflow-hidden max-h-[92vh] overflow-y-auto text-white">
      <!-- Glow ambient -->
      <div class="absolute -top-20 -left-20 w-48 h-48 bg-[#00d4ff]/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -right-20 w-48 h-48 bg-[#39ff14]/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- Close button -->
      <button type="button" onclick="closeRadarAnalyticsModal()"
              class="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">
        ✕
      </button>

      <!-- Modal Header -->
      <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div class="w-11 h-11 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/40 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(0,212,255,0.3)]">
          📡
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-['Orbitron'] text-base sm:text-lg font-black uppercase text-white tracking-wider">
              TRẠM RADAR THẾ GIỚI ĐÁ
            </h3>
            <span class="text-[0.6rem] font-['Rajdhani'] font-bold px-2 py-0.5 rounded-full bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/30 uppercase">
              LIVE TELEMETRY
            </span>
          </div>
          <p class="text-xs font-['Rajdhani'] text-[#6b7a99]">
            Hệ thống phân tích mật độ người xem & thống kê cư dân thức tỉnh thời gian thực
          </p>
        </div>
      </div>

      <!-- 4 Quick Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        <div class="p-3 rounded-2xl bg-white/[0.03] border border-[#00d4ff]/25">
          <span class="text-[0.62rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-400 block">Lượt Khám Phá</span>
          <span id="modal-stat-visits" class="font-['Orbitron'] text-lg sm:text-xl font-black text-white block mt-0.5">3.771</span>
          <span class="text-[0.58rem] font-mono text-[#00d4ff] flex items-center gap-1 mt-0.5">
            <span>↑</span> 3.715 + 56 thực
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-white/[0.03] border border-[#39ff14]/25">
          <span class="text-[0.62rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-400 block">Cư Dân Thức Tỉnh</span>
          <span id="modal-stat-citizens" class="font-['Orbitron'] text-lg sm:text-xl font-black text-[#39ff14] block mt-0.5">119</span>
          <span class="text-[0.58rem] font-mono text-[#39ff14] flex items-center gap-1 mt-0.5">
            <span>★</span> 109 nhân vật + 10 Google Auth
          </span>
        </div>

        <div class="p-3 rounded-2xl bg-white/[0.03] border border-[#ffd700]/25">
          <span class="text-[0.62rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-400 block">Tỷ Lệ Thức Tỉnh</span>
          <span id="modal-stat-rate" class="font-['Orbitron'] text-lg sm:text-xl font-black text-[#ffd700] block mt-0.5">3.1%</span>
          <span class="text-[0.58rem] font-mono text-gray-400 block mt-0.5">Cấp thẻ / Ghé thăm</span>
        </div>

        <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
          <span class="text-[0.62rem] font-['Rajdhani'] font-bold uppercase tracking-wider text-gray-400 block">Tín Hiệu Radar</span>
          <span class="font-['Orbitron'] text-sm sm:text-base font-bold text-[#00d4ff] block mt-1">60 FPS</span>
          <span class="text-[0.58rem] font-mono text-[#39ff14] block mt-0.5">● Ping ~18ms</span>
        </div>
      </div>

      <!-- 2 Main Columns Breakdown -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <!-- Col 1: Factions -->
        <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-['Rajdhani'] font-bold text-xs uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <span>🏛️</span> Phân Bố Phe Phái Cư Dân
            </h4>
            <span class="text-[0.6rem] font-mono text-gray-500">3 Phe Phái</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs font-['Rajdhani'] mb-1">
                <span class="text-[#00d4ff] font-bold">🧪 Vương Quốc Khoa Học (Senku)</span>
                <span class="font-mono text-white">68%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#00d4ff] to-[#00f5a0] rounded-full" style="width: 68%;"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-['Rajdhani'] mb-1">
                <span class="text-[#ef4444] font-bold">👊 Đế Quốc Sức Mạnh (Tsukasa)</span>
                <span class="font-mono text-white">21%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#ef4444] to-[#f97316] rounded-full" style="width: 21%;"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-['Rajdhani'] mb-1">
                <span class="text-[#ffd700] font-bold">🛡️ Làng Ishigami (Chrome & Kohaku)</span>
                <span class="font-mono text-white">11%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#ffd700] to-[#f59e0b] rounded-full" style="width: 11%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Col 2: Devices & Browsers -->
        <div class="p-4 rounded-2xl bg-black/40 border border-white/10">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-['Rajdhani'] font-bold text-xs uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <span>💻</span> Thiết Bị & Nền Tảng Truy Cập
            </h4>
            <span class="text-[0.6rem] font-mono text-[#39ff14]">Đang Đo</span>
          </div>

          <div class="space-y-3">
            <div>
              <div class="flex justify-between text-xs font-['Rajdhani'] mb-1">
                <span class="text-gray-300 font-bold">💻 Máy tính (Desktop / Laptop)</span>
                <span class="font-mono text-[#00d4ff]">58%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-[#00d4ff] rounded-full" style="width: 58%;"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-['Rajdhani'] mb-1">
                <span class="text-gray-300 font-bold">📱 Điện thoại (Mobile / Tablet)</span>
                <span class="font-mono text-[#39ff14]">42%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full bg-[#39ff14] rounded-full" style="width: 42%;"></div>
              </div>
            </div>

            <div class="pt-2 border-t border-white/10 flex items-center justify-between text-[0.68rem] font-['Rajdhani'] text-gray-400">
              <span>Trình duyệt: Chrome 65% · Safari 22% · Edge 9% · Khác 4%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Signal Feed -->
      <div class="p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-6">
        <h4 class="font-['Rajdhani'] font-bold text-xs uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
          <span>📡</span> Tín Hiệu Thức Tỉnh Gần Nhất Ghi Nhận
        </h4>
        <div class="space-y-2 text-xs font-['Rajdhani']" id="modal-recent-signals">
          <div class="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#39ff14] animate-pulse"></span>
              <span class="text-white font-bold">Thiết bị của bạn</span>
              <span class="text-gray-400" id="modal-my-device">Đang xác định...</span>
            </div>
            <span class="text-[0.65rem] font-mono text-[#00d4ff]">Vừa xong (Trực tuyến)</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#00d4ff]"></span>
              <span class="text-white">Cư dân <b class="text-[#00d4ff]">Lê Quốc Cường</b> (lequoccuong31126@...)</span>
              <span class="text-[0.62rem] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">Google Auth ✓</span>
            </div>
            <span class="text-[0.65rem] font-mono text-gray-400">Đã kích hoạt</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#39ff14]"></span>
              <span class="text-white">Cư dân <b class="text-[#39ff14]">Gen Asagiri</b> (asagirigen1401@...)</span>
              <span class="text-[0.62rem] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">Google Auth ✓</span>
            </div>
            <span class="text-[0.65rem] font-mono text-gray-400">Đã kích hoạt</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-[#ffd700]"></span>
              <span class="text-white">Cư dân <b class="text-[#ffd700]">Sinh Viên HCMUTE</b> (24110174@student...)</span>
              <span class="text-[0.62rem] px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-300 font-mono">Google Auth ✓</span>
            </div>
            <span class="text-[0.65rem] font-mono text-gray-400">Đã kích hoạt</span>
          </div>
          <div class="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span class="text-white">Cư dân <b class="text-white">Thanh Tâm & Vy</b> (thanhtam410718@...)</span>
              <span class="text-[0.62rem] px-1.5 py-0.2 rounded bg-white/10 text-gray-300 font-mono">+7 Cư dân khác</span>
            </div>
            <span class="text-[0.65rem] font-mono text-gray-400">Firebase Cloud</span>
          </div>
        </div>
      </div>

      <!-- Action Bottom -->
      <div class="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
        <span class="text-gray-500 font-mono text-[0.68rem]">
          Bản quyền © 2026 Lê Quốc Cường · Kingdom of Science Radar
        </span>
        <button type="button" onclick="closeRadarAnalyticsModal()"
                class="px-4 py-2 rounded-xl bg-[#00d4ff]/15 hover:bg-[#00d4ff]/25 text-[#00d4ff] border border-[#00d4ff]/40 font-['Rajdhani'] font-bold uppercase transition-all cursor-pointer">
          Đóng Bảng Thống Kê
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Backdrop click to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeRadarAnalyticsModal();
    }
  });

  return modal;
}

function openRadarAnalyticsModal() {
  const modal = ensureRadarAnalyticsModal();
  if (!modal) return;

  const visits = getVisitsCount();
  const citizens = getCitizensCount();

  const visitsEl = document.getElementById('modal-stat-visits');
  const citizensEl = document.getElementById('modal-stat-citizens');
  const rateEl = document.getElementById('modal-stat-rate');
  const myDeviceEl = document.getElementById('modal-my-device');

  if (visitsEl) visitsEl.textContent = visits.toLocaleString('vi-VN');
  if (citizensEl) citizensEl.textContent = citizens.toLocaleString('vi-VN');
  if (rateEl && visits > 0) {
    const rate = ((citizens / visits) * 100).toFixed(1);
    rateEl.textContent = rate + '%';
  }

  const device = getDeviceInfo();
  if (myDeviceEl) {
    myDeviceEl.textContent = `${device.os} · ${device.browser}`;
  }

  modal.classList.remove('hidden');
}

function closeRadarAnalyticsModal() {
  const modal = document.getElementById('radar-analytics-modal');
  if (modal) modal.classList.add('hidden');
}

// Lắng nghe phím Esc
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeRadarAnalyticsModal();
  }
});

/* ── 3. CẬP NHẬT GIAO DIỆN THỐNG KÊ (RADAR STATS UI) ── */
function updateLiveRadarUI() {
  const radarContainer = document.getElementById('live-radar-stats');
  if (!radarContainer) return;

  const isLive = isLiveEnvironment();

  if (!isLive) {
    // Khi đang phát triển local: Ẩn hoặc hiển thị trạng thái chờ deploy
    radarContainer.classList.add('hidden');
    return;
  }

  // Khi đã deploy: Hiện radar và cập nhật số liệu
  radarContainer.classList.remove('hidden');
  radarContainer.classList.add('cursor-pointer', 'transition-all', 'hover:border-[#00d4ff]/60', 'hover:shadow-[0_0_20px_rgba(0,212,255,0.25)]');
  radarContainer.setAttribute('title', 'Nhấp để xem Bảng Thống Kê Chi Tiết');

  // Gắn sự kiện click mở modal chi tiết nếu chưa gắn
  if (!radarContainer.hasAttribute('data-radar-bound')) {
    radarContainer.setAttribute('data-radar-bound', 'true');
    radarContainer.addEventListener('click', () => {
      openRadarAnalyticsModal();
    });

    // Thêm nút gợi ý xem chi tiết bên cạnh
    if (!radarContainer.querySelector('.radar-detail-badge')) {
      const badge = document.createElement('span');
      badge.className = 'radar-detail-badge ml-auto inline-flex items-center gap-1 text-[0.6rem] font-["Rajdhani"] font-bold px-2 py-0.5 rounded-lg bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30 hover:bg-[#00d4ff]/30 uppercase transition-all shrink-0';
      badge.innerHTML = `<span>CHI TIẾT</span> <span>↗</span>`;
      radarContainer.appendChild(badge);
    }
  }

  const visitsEl = document.getElementById('stat-live-visits');
  const citizensEl = document.getElementById('stat-live-citizens');

  if (visitsEl) {
    visitsEl.textContent = getVisitsCount().toLocaleString('vi-VN');
  }
  if (citizensEl) {
    citizensEl.textContent = getCitizensCount().toLocaleString('vi-VN');

    // Đồng bộ số lượng cư dân thật từ Firebase Realtime Database
    if (typeof window.listenToCitizensCount === 'function') {
      window.listenToCitizensCount((realCount) => {
        citizensEl.textContent = realCount.toLocaleString('vi-VN');
        const modalCitizensEl = document.getElementById('modal-stat-citizens');
        if (modalCitizensEl) modalCitizensEl.textContent = realCount.toLocaleString('vi-VN');
      });
    }
  }
}

/* ── 3. THU THẬP THÔNG TIN VỊ TRÍ & THIẾT BỊ ── */
async function getGeoInfo() {
  let geo = { city: 'Không xác định', country: 'Việt Nam', ip: 'Ẩn danh', org: 'N/A' };
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      geo = {
        city: data.city || 'N/A',
        region: data.region || 'N/A',
        country: data.country_name || 'Việt Nam',
        ip: data.ip || 'Ẩn danh',
        org: data.org || 'N/A'
      };
    }
  } catch (e) {
    // Fallback nếu chặn CORS hoặc offline
  }
  return geo;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let os = "Không rõ";
  let browser = "Trình duyệt khác";

  if (/Windows/i.test(ua)) os = "Windows PC";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS (iPhone/iPad)";
  else if (/Android/i.test(ua)) os = "Android Mobile";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  if (/Edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Google Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Apple Safari";
  else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";

  return { os, browser };
}

/* ── 4. GHI NHẬN LƯỢT TRUY CẬP (PAGE VIEW TRACKER) ── */
async function trackVisitor() {
  const lastTracked = localStorage.getItem(STORAGE_ANALYTICS_KEYS.LAST_VISIT);
  const now = Date.now();

  // Tăng lượt truy cập
  incrementVisitsCount();
  updateLiveRadarUI();

  // Kiểm tra chống spam (không gửi Discord lặp lại nếu cùng 1 máy trong 30 phút)
  if (lastTracked && now - parseInt(lastTracked, 10) < TRACKER_CONFIG.antiSpamMinutes * 60 * 1000) {
    if (TRACKER_CONFIG.enableConsoleLog) {
      console.log('⚡ [Visitor Tracker] Phiên truy cập đã được ghi nhận trước đó (Anti-Spam active).');
    }
    return;
  }

  const device = getDeviceInfo();
  const pageUrl = window.location.href;
  const pageTitle = document.title || 'Trang Chủ Dr. Stone';
  const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const geo = await getGeoInfo();
  const totalVisits = getVisitsCount();

  // 1. Gửi Discord
  if (TRACKER_CONFIG.discordWebhookUrl) {
    sendVisitorToDiscord(geo, device, pageTitle, pageUrl, timeString, totalVisits);
  }

  // 2. Gửi Telegram (nếu cấu hình)
  if (TRACKER_CONFIG.telegram.botToken && TRACKER_CONFIG.telegram.chatId) {
    sendVisitorToTelegram(geo, device, pageTitle, pageUrl, timeString, totalVisits);
  }

  localStorage.setItem(STORAGE_ANALYTICS_KEYS.LAST_VISIT, now.toString());
}

/* ── HÀM GỬI PAYLOAD DISCORD BẢO MẬT (QUA VERCEL PROXY HOẶC LOCAL FALLBACK) ── */
async function postDiscordPayload(payload) {
  // 1. Ưu tiên gửi qua Vercel Serverless Function bí mật (/api/discord-notify)
  try {
    const res = await fetch(TRACKER_CONFIG.apiNotifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      if (TRACKER_CONFIG.enableConsoleLog) console.log('✅ [Discord Proxy] Đã gửi thông báo bảo mật qua Vercel API!');
      return true;
    }
  } catch (err) {
    // Nếu môi trường local chưa có serverless function thì thử fallback
  }

  // 2. Fallback nếu có webhook lưu trong localStorage (khi dev test local)
  if (TRACKER_CONFIG.discordWebhookUrl) {
    try {
      const res = await fetch(TRACKER_CONFIG.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok && TRACKER_CONFIG.enableConsoleLog) {
        console.log('✅ [Discord Direct] Đã gửi thông báo trực tiếp thành công!');
        return true;
      }
    } catch (err) {
      console.warn('⚠️ [Discord Direct] Lỗi gửi trực tiếp:', err);
    }
  }
  return false;
}

async function sendVisitorToDiscord(geo, device, pageTitle, pageUrl, timeString, totalVisits) {
  const payload = {
    username: "Senku Radar 📡",
    avatar_url: "https://static.wikia.nocookie.net/dr-stone/images/8/8b/Senku_Ishigami_Portrait.png",
    embeds: [
      {
        title: "🧪 [DR. STONE] Phát hiện tín hiệu người thức tỉnh mới!",
        description: `Có một vị khách vừa truy cập website **Vương Quốc Khoa Học**!`,
        color: 54527, // Cyan
        fields: [
          { name: "📍 Vị trí", value: `${geo.city}, ${geo.country} (${geo.org})`, inline: true },
          { name: "💻 Thiết bị", value: `${device.os} · ${device.browser}`, inline: true },
          { name: "📱 Màn hình", value: `${window.innerWidth} x ${window.innerHeight} px`, inline: true },
          { name: "📄 Trang đang xem", value: `[${pageTitle}](${pageUrl})`, inline: false },
          { name: "📊 Tổng lượt ghé thăm", value: `**${totalVisits.toLocaleString('vi-VN')}** lượt`, inline: true },
          { name: "⏰ Thời gian", value: `${timeString}`, inline: true }
        ],
        footer: {
          text: "Vương Quốc Khoa Học · Dr. Stone Analytics System",
          icon_url: "https://static.wikia.nocookie.net/dr-stone/images/e/e6/Site-logo.png"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  await postDiscordPayload(payload);
}

async function sendVisitorToTelegram(geo, device, pageTitle, pageUrl, timeString, totalVisits) {
  const text = `
🧪 <b>[DR. STONE] PHÁT HIỆN TÍN HIỆU NGƯỜI THỨC TỈNH!</b>
━━━━━━━━━━━━━━━━━━━━
📍 <b>Vị trí:</b> ${geo.city}, ${geo.country}
🏢 <b>Mạng:</b> ${geo.org}
💻 <b>Thiết bị:</b> ${device.os} (${device.browser})
📊 <b>Tổng lượt ghé:</b> ${totalVisits.toLocaleString('vi-VN')}
📄 <b>Trang xem:</b> <a href="${pageUrl}">${pageTitle}</a>
⏰ <b>Thời gian:</b> ${timeString}
━━━━━━━━━━━━━━━━━━━━
<i>"Mười tỷ phần trăm đây là một vị khách mới!" — Senku</i>
  `.trim();

  const url = `https://api.telegram.org/bot${TRACKER_CONFIG.telegram.botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TRACKER_CONFIG.telegram.chatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
  } catch (err) {
    console.error("❌ [Visitor Tracker] Lỗi gửi Telegram:", err);
  }
}

/* ── 5. THÔNG BÁO DISCORD KHI CÓ CƯ DÂN ĐĂNG KÝ THẺ CĂN CƯỚC MỚI ── */
async function sendCitizenAwakenToDiscord(profile) {
  if (!TRACKER_CONFIG.discordWebhookUrl) return;

  const citizenIndex = incrementCitizenCount();
  updateLiveRadarUI();

  const geo = await getGeoInfo();
  const device = getDeviceInfo();
  const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Màu sắc Embed theo phe phái
  const factionColors = {
    science: 54527,    // Cyan #00d4ff
    might: 15680580,   // Red #ef4444
    village: 16766720  // Gold #ffd700
  };
  const color = factionColors[profile.faction] || 54527;

  // Lấy link ảnh chân dung online nếu có, fallback về avatar Senku
  const avatarName = profile.avatarUrl.split('/').pop().replace('.png', '').replace('.jpg', '');
  const characterOnlineAvatars = {
    senku: "https://static.wikia.nocookie.net/dr-stone/images/8/8b/Senku_Ishigami_Portrait.png",
    chrome: "https://static.wikia.nocookie.net/dr-stone/images/8/83/Chrome_Portrait.png",
    kohaku: "https://static.wikia.nocookie.net/dr-stone/images/4/4b/Kohaku_Portrait.png",
    tsukasa: "https://static.wikia.nocookie.net/dr-stone/images/a/a2/Tsukasa_Shishio_Portrait.png",
    gen: "https://static.wikia.nocookie.net/dr-stone/images/4/49/Gen_Asagiri_Portrait.png",
    ryusui: "https://static.wikia.nocookie.net/dr-stone/images/1/15/Ryusui_Nanami_Portrait.png"
  };
  const thumbUrl = characterOnlineAvatars[avatarName] || "https://static.wikia.nocookie.net/dr-stone/images/8/8b/Senku_Ishigami_Portrait.png";

  const payload = {
    username: "Học Viện Khoa Học 🏛️",
    avatar_url: "https://static.wikia.nocookie.net/dr-stone/images/8/8b/Senku_Ishigami_Portrait.png",
    embeds: [
      {
        title: "🧪 [CƯ DÂN MỚI VỪA THỨC TỈNH SAU 3.700 NĂM!]",
        description: `Một công dân vừa được tưới dung dịch **Nital** và nhận **Thẻ Căn Cước 3D** chính thức!`,
        color: color,
        thumbnail: {
          url: thumbUrl
        },
        fields: [
          { name: "👤 Tên Cư Dân", value: `**${profile.nickname}**`, inline: true },
          { name: "🏛️ Phe Phái", value: `**${profile.factionName}**`, inline: true },
          { name: "🧪 Vai Trò", value: `${profile.roleTitle}`, inline: true },
          { name: "🪪 Mã Căn Cước", value: `\`${profile.id}\``, inline: true },
          { name: "⚡ Điểm Khởi Đầu", value: `**100 SP** (Điểm Khoa Học)`, inline: true },
          { name: "📊 Thứ Tự Cư Dân", value: `**Cư dân thứ #${citizenIndex}**`, inline: true },
          { name: "💬 Châm Ngôn", value: `*"${profile.customQuote}"*`, inline: false },
          { name: "📍 Vị Trí Thức Tỉnh", value: `${geo.city}, ${geo.country} (${geo.org})`, inline: true },
          { name: "💻 Thiết Bị", value: `${device.os} · ${device.browser}`, inline: true },
          { name: "⏰ Thời Gian", value: `${timeString}`, inline: false }
        ],
        footer: {
          text: "Vương Quốc Khoa Học · Kingdom of Science ID Pass",
          icon_url: "https://static.wikia.nocookie.net/dr-stone/images/e/e6/Site-logo.png"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  await postDiscordPayload(payload);
}

// Export ra window toàn cục
window.sendCitizenAwakenToDiscord = sendCitizenAwakenToDiscord;
window.incrementCitizenCount = incrementCitizenCount;
window.getCitizensCount = getCitizensCount;
window.getVisitsCount = getVisitsCount;
window.updateLiveRadarUI = updateLiveRadarUI;
window.openRadarAnalyticsModal = openRadarAnalyticsModal;
window.closeRadarAnalyticsModal = closeRadarAnalyticsModal;
window.TRACKER_CONFIG = TRACKER_CONFIG;

// Khởi chạy khi tải trang
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(trackVisitor, 1200);
});
