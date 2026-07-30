// Vercel serverless function для отправки данных админу
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, user_id, username, data, admin_ids } = req.body;

    if (!bot_token || !user_id || !data || !admin_ids) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Формируем сообщение для админа
    const messageText = `📋 Новая заявка от @${username || 'unknown'}\nID: ${user_id}\n\n📝 Анкета:\n▫️ ФИО: ${data.fio}\n▫️ Возраст: ${data.age}\n▫️ Опыт работы: ${data.experience}\n▫️ Причина: ${data.reason}`;

    // Создаем inline клавиатуру с кнопками
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Одобрить', callback_data: `approve_${user_id}` },
          { text: '✅ Одобрить без подписи', callback_data: `approve_nosign_${user_id}` },
          { text: '❌ Отклонить', callback_data: `reject_${user_id}` }
        ]
      ]
    };

    // Отправляем сообщение всем админам
    const adminIds = admin_ids.split(',').map(id => id.trim());
    let successCount = 0;

    for (const adminId of adminIds) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${bot_token}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: adminId,
              text: messageText,
              reply_markup: keyboard,
            }),
          }
        );

        const telegramData = await telegramResponse.json();

        if (telegramData.ok) {
          successCount++;
        } else {
          console.error('Failed to send to admin', adminId, telegramData);
        }
      } catch (error) {
        console.error('Error sending to admin', adminId, error);
      }
    }

    if (successCount === 0) {
      return res.status(500).json({ error: 'Failed to send to any admin' });
    }

    return res.status(200).json({ success: true, sent_to: successCount });
  } catch (error) {
    console.error('Error in send-anketa:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
