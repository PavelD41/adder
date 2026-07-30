// Vercel serverless function для отправки данных в Telegram
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, user_id, data } = req.body;

    if (!bot_token || !user_id || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Формируем сообщение для бота
    const messageText = `📋 Новая заявка\n\nФИО: ${data.fio}\nВозраст: ${data.age}\nОпыт: ${data.experience}\nПричина: ${data.reason}\n\nUser ID: ${user_id}`;

    // Отправляем сообщение через Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${bot_token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: user_id,
          text: messageText,
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      return res.status(500).json({ error: 'Failed to send to Telegram' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in send-anketa:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
