/**
 * js/visitor-tracker.js
 * Hệ thống tự động ghi nhận lượt truy cập & gửi thông báo về Telegram / Discord Webhook
 * Dự án: Dr. Stone Fan Website
 */

const TRACKER_CONFIG = {
  // ── 1. ĐIỀN THÔNG TIN CỦA BẠN VÀO ĐÂY ──
  // Lựa chọn A: Dùng Discord Webhook (Đơn giản nhất, copy paste là chạy)
  discordWebhookUrl: 'https://discord.com/api/webhooks/1550971150908129390/LxGD0TXI0w3NySw4Rq1x5K0e6cw-YTx1WWOO8F22YEk_aHHFT6gTAiZkIo6uiL-30UQW', 

  // Lựa chọn B: Dùng Telegram Bot (Nhận tin nhắn qua app Telegram)
  telegram: {
    botToken: '', // Ví dụ: '7123456789:AAHk...' (lấy từ @BotFather)
    chatId: ''    // Ví dụ: '123456789' (lấy từ @userinfobot)
  },

  // Chống spam: Không gửi thông báo lặp lại nếu cùng 1 người F5 trong vòng 30 phút
  antiSpamMinutes: 30,
  enableConsoleLog: true
};

async function trackVisitor() {
  // Kiểm tra chống spam qua sessionStorage / localStorage
  const LAST_VISIT_KEY = 'drstone_last_tracked_time';
  const lastTracked = localStorage.getItem(LAST_VISIT_KEY);
  const now = Date.now();

  if (lastTracked && now - parseInt(lastTracked, 10) < TRACKER_CONFIG.antiSpamMinutes * 60 * 1000) {
    if (TRACKER_CONFIG.enableConsoleLog) {
      console.log('⚡ [Visitor Tracker] Phiên truy cập đã được ghi nhận trước đó (Anti-Spam active).');
    }
    return;
  }

  // Thu thập thông tin thiết bị
  const device = getDeviceInfo();
  const pageUrl = window.location.href;
  const pageTitle = document.title || 'Trang Chủ Dr. Stone';
  const timeString = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  // Lấy vị trí địa lý & IP ẩn danh (qua API công cộng miễn phí)
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
    // Fallback nếu chặn CORS
  }

  // 1. Gửi qua Discord Webhook nếu có cấu hình
  if (TRACKER_CONFIG.discordWebhookUrl) {
    sendToDiscord(geo, device, pageTitle, pageUrl, timeString);
  }

  // 2. Gửi qua Telegram Bot nếu có cấu hình
  if (TRACKER_CONFIG.telegram.botToken && TRACKER_CONFIG.telegram.chatId) {
    sendToTelegram(geo, device, pageTitle, pageUrl, timeString);
  }

  // Cập nhật timestamp chống spam
  localStorage.setItem(LAST_VISIT_KEY, now.toString());
}

/* ── Gửi tin nhắn dạng Embed Card tới Discord ── */
async function sendToDiscord(geo, device, pageTitle, pageUrl, timeString) {
  const payload = {
    username: "Senku Radar 📡",
    avatar_url: "https://static.wikia.nocookie.net/dr-stone/images/8/8b/Senku_Ishigami_Portrait.png",
    embeds: [
      {
        title: "🧪 [DR. STONE] Phát hiện tín hiệu người thức tỉnh mới!",
        description: `Có một khách vừa truy cập website **Vương Quốc Khoa Học**!`,
        color: 54527, // Cyan color code
        fields: [
          { name: "📍 Vị trí", value: `${geo.city}, ${geo.country} (${geo.org})`, inline: true },
          { name: "💻 Thiết bị", value: `${device.os} · ${device.browser}`, inline: true },
          { name: "📱 Màn hình", value: `${window.innerWidth} x ${window.innerHeight} px`, inline: true },
          { name: "📄 Trang đang xem", value: `[${pageTitle}](${pageUrl})`, inline: false },
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

/* ── Gửi tin nhắn dạng HTML tới Telegram ── */
async function sendToTelegram(geo, device, pageTitle, pageUrl, timeString) {
  const text = `
🧪 <b>[DR. STONE] PHÁT HIỆN TÍN HIỆU NGƯỜI THỨC TỈNH!</b>
━━━━━━━━━━━━━━━━━━━━
📍 <b>Vị trí:</b> ${geo.city}, ${geo.country}
🏢 <b>Mạng:</b> ${geo.org}
💻 <b>Thiết bị:</b> ${device.os} (${device.browser})
📐 <b>Màn hình:</b> ${window.innerWidth}x${window.innerHeight} px
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
    if (TRACKER_CONFIG.enableConsoleLog) console.log("✅ [Visitor Tracker] Đã gửi thông báo Telegram thành công!");
  } catch (err) {
    console.error("❌ [Visitor Tracker] Lỗi gửi Telegram:", err);
  }
}

/* ── Helper nhận diện thiết bị & hệ điều hành ── */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let os = "Không rõ";
  let browser = "Trình duyệt khác";

  // OS
  if (/Windows/i.test(ua)) os = "Windows PC";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS (iPhone/iPad)";
  else if (/Android/i.test(ua)) os = "Android Mobile";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser
  if (/Edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = "Google Chrome";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Apple Safari";
  else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";

  return { os, browser };
}

// Khởi chạy khi tài liệu tải xong (trì hoãn 1.5s để không ảnh hưởng tốc độ load web)
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(trackVisitor, 1500);
});
