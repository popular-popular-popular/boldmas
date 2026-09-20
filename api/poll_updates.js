const BOT_TOKEN = process.env.BOT_TOKEN || '8775807272:AAGIA8gNoQy2GQqx_Drwj_KEQF8tnkfr3pY';
const API_BASE  = `https://api.telegram.org/bot${BOT_TOKEN}`;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const targetMsgId  = parseInt(req.query.messageid) || 0;
  const targetChatId = String(req.query.chatid || '');

  if (!targetMsgId || !targetChatId) {
    return res.json({ ok: true, action: null });
  }

  try {
    const tgRes = await fetch(
      `${API_BASE}/getUpdates?timeout=0&limit=100&allowed_updates=callback_query`
    );
    const result = await tgRes.json();

    if (!result.ok || !Array.isArray(result.result) || result.result.length === 0) {
      return res.json({ ok: true, action: null });
    }

    for (const update of result.result) {
      const cq = update.callback_query;
      if (!cq) continue;

      const msgId  = cq.message?.message_id;
      const chatId = String(cq.message?.chat?.id ?? '');

      if (msgId !== targetMsgId || chatId !== targetChatId) continue;

      const cbData = String(cq.data || '');
      if (!cbData.startsWith('ACTION:')) continue;

      const action = cbData.slice(7);

      // Dismiss Telegram loading indicator (fire and forget)
      fetch(`${API_BASE}/answerCallbackQuery`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ callback_query_id: cq.id }),
      }).catch(() => {});

      return res.json({ ok: true, action });
    }

    return res.json({ ok: true, action: null });
  } catch (err) {
    return res.status(500).json({ ok: false, action: null });
  }
};
