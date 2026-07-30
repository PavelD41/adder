// Vercel serverless function для отправки данных админу с JSON
export default async function handler(req, res) {
  console.log('=== send-anketa called ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_token, user_id, username, data, admin_ids } = req.body;

    console.log('Parsed data:', { bot_token: bot_token ? 'present' : 'missing', user_id, username, admin_ids, data });

    if (!bot_token || !user_id || !data || !admin_ids) {
      console.error('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Формируем сообщение для админа с JSON данными
    const jsonData = JSON.stringify({ user_id, ...data });
    const messageText = `📋 Новая заявка от @${username || 'unknown'}\nID: ${user_id}\n\n📝 Анкета:\n▫️ Возраст: ${data.age || 'Не указано'}\n▫️ Как попали на канал: ${data.source}\n▫️ Знает создателя: ${data.knows_creator}\n▫️ Зачем вступить: ${data.reason || 'Не указано'}\n▫️ Согласен с правилами: ${data.agree_rules === 'true' ? '✅' : '❌'}\n▫️ NSFW предупрежден: ${data.nsfw_warning === 'true' ? '✅' : '❌'}\n\n🔐 DATA:${jsonData}`;

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
    console.log('Admin IDs:', adminIds);
    let successCount = 0;

    for (const adminId of adminIds) {
      try {
        console.log('Sending to admin:', adminId);
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
        console.log('Admin response:', telegramData);

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
      console.error('Failed to send to any admin');
      return res.status(500).json({ error: 'Failed to send to any admin' });
    }

    console.log('=== send-anketa completed successfully ===');
    return res.status(200).json({ success: true, sent_to: successCount });
  } catch (error) {
    console.error('Error in send-anketa:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
