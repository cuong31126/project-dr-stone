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

  // Webhook Discord của bạn
  discordWebhookUrl: 'https://discord.com/api/webhooks/1550971150908129390/LxGD0TXI0w3NySw4Rq1x5K0e6cw-YTx1WWOO8F22YEk_aHHFT6gTAiZkIo6uiL-30UQW',

  // Cấu hình Telegram Bot (tùy chọn)
  telegram: {
    botToken: '',
    chatId: ''
  },

  // Số liệu thống kê cơ sở (Bắt đầu từ 0, đếm chuẩn số thực tế)
  baselineVisits: 0,
  baselineCitizens: 0,

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

/* ── 2. CẬP NHẬT GIAO DIỆN THỐNG KÊ (RADAR STATS UI) ── */
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

  try {
    await fetch(TRACKER_CONFIG.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (TRACKER_CONFIG.enableConsoleLog) console.log("✅ [Visitor Tracker] Đã gửi thông báo Discord thành công!");
  } catch (err) {
    console.error("❌ [Visitor Tracker] Lỗi gửi Discord:", err);
  }
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

  try {
    await fetch(TRACKER_CONFIG.discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (TRACKER_CONFIG.enableConsoleLog) {
      console.log(`✅ [Discord Webhook] Đã gửi thông báo cư dân ${profile.nickname} thành công!`);
    }
  } catch (err) {
    console.error("❌ [Discord Webhook] Lỗi gửi thông báo cư dân:", err);
  }
}

// Export ra window toàn cục
window.sendCitizenAwakenToDiscord = sendCitizenAwakenToDiscord;
window.incrementCitizenCount = incrementCitizenCount;
window.getCitizensCount = getCitizensCount;
window.getVisitsCount = getVisitsCount;
window.updateLiveRadarUI = updateLiveRadarUI;
window.TRACKER_CONFIG = TRACKER_CONFIG;

// Khởi chạy khi tải trang
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(trackVisitor, 1200);
});
