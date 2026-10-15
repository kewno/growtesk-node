const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

const API_URL = 'https://growtask.ru/test-front/api/products';

app.get('/api/products', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    console.log('Запрос к growtask.ru...');

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API вернул ${response.status}`);
    }

    const data = await response.json();
    console.log('Получено товаров:', data.data.length);

    res.json(data);
  } catch (error) {
    console.error('Ошибка:', error.message);
    res.status(500).json({ error: 'Не удалось загрузить товары' });
  }
});

app.use(express.static(path.join(__dirname), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));

app.listen(PORT, () => {
  console.log('Сервер запущен');
  console.log(`http://localhost:${PORT}/`);
  console.log(`http://localhost:${PORT}/checkout.html`);
  console.log(`http://localhost:${PORT}/success.html`);
  console.log(`API: http://localhost:${PORT}/api/products`);
});