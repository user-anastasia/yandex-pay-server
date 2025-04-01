const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// 🔐 Вставь свои реальные данные:
const YANDEX_MERCHANT_ID = 'a1ad8071-2729-4c4b-943b-23480738aabe';
const YANDEX_API_KEY = 'a1ad807127294c4b943b23480738aabe.ilHJrVFqTJsOEQnPvZ3CHxUuZuYMs6Cf'; // секретный ключ API
const RETURN_URL = 'https://neon.boutique/success';
const CALLBACK_URL = 'https://neon.boutique/yandexpaycheckout';

app.use(express.json());

// 📦 Обработка POST-запроса от Tilda
app.post('/create-payment', async (req, res) => {
  try {
    const {
      orderid,
      amount,
      email,
      phone,
      name,
      items
    } = req.body;

    const response = await axios.post(
      'https://pay.yandex.ru/api/merchant/v1/payments',
      {
        merchantId: YANDEX_MERCHANT_ID,
        amount: {
          value: (amount / 100).toFixed(2),
          currency: 'RUB'
        },
        metadata: {
          orderid: orderid
        },
        customer: {
          email: email,
          phone: phone,
          name: name
        },
        confirmation: {
          type: 'redirect',
          returnUrl: RETURN_URL
        },
        receipt: {
          items: items.map(item => ({
            description: item.name,
            quantity: item.quantity,
            amount: {
              value: (item.price / 100).toFixed(2),
              currency: 'RUB'
            },
            vatCode: 1 // Без НДС
          }))
        },
        paymentMethod: 'split' // включаем оплату частями
      },
      {
        headers: {
          'Authorization': `Bearer ${YANDEX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const confirmationUrl = response.data.confirmation.confirmationUrl;
    res.json({ redirect: confirmationUrl });

  } catch (error) {
    console.error('Ошибка при создании платежа:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

// ✅ Обработка уведомлений от Яндекс Пэй
app.post('/yandex-pay-callback', (req, res) => {
  const data = req.body;

  console.log('🔔 Callback от Яндекс Пэй:', data);

  if (data.event === 'payment.succeeded') {
    const transactionId = data.id;
    const orderId = data.object?.metadata?.orderid;

    console.log(`✅ Оплата прошла успешно! Заказ: ${orderId}, Транзакция: ${transactionId}`);
    // Здесь можешь обновить статус заказа в БД

    res.send('OK'); // Тильда ожидает именно 'OK'
  } else {
    console.log('⚠️ Неуспешный платёж:', data);
    res.send('OK');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
