/**
 * api/discord-notify.js
 * Vercel Serverless Function — Bảo mật Webhook Discord không bị lộ ra GitHub / Frontend
 * Dự án: Dr. Stone Fan Website
 */

export default async function handler(req, res) {
  // Chỉ chấp nhận POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Only POST is accepted.' });
  }

  // Lấy link Webhook bảo mật từ Biến Môi Trường (Vercel Environment Variables)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    // Nếu chưa cấu hình biến môi trường trên Vercel
    console.warn('⚠️ [Vercel API] Chưa cấu hình biến môi trường DISCORD_WEBHOOK_URL');
    return res.status(200).json({ 
      warning: 'DISCORD_WEBHOOK_URL is not configured in Vercel Environment Variables.',
      status: 'skipped'
    });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DrStone-KingdomOfScience/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!discordResponse.ok) {
      const errText = await discordResponse.text();
      console.error('❌ [Vercel API] Discord trả về lỗi:', discordResponse.status, errText);
      return res.status(discordResponse.status).json({ error: errText });
    }

    return res.status(200).json({ success: true, message: 'Notification sent to Discord' });
  } catch (err) {
    console.error('❌ [Vercel API] Lỗi gửi Discord qua proxy:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
