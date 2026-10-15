# Frontend Growtask Test - Корзина

## Демо

- **GitHub Pages:** https://твой-логин.github.io/репо/cart.html
- **Локально с API:** `npm install && npm start` → http://localhost:3000

## Стек

- HTML5, CSS3 (БЭМ, CSS-переменные), Vanilla JS
- Node.js + Express (для локального прокси)

## Запуск

### Локально с реальным API

```bash
npm install
npm start
```

Открой http://localhost:3000

### Без Node (fallback)

Просто открой `cart.html` в браузере или залей на любой статический хостинг (GH Pages, Netlify). Данные возьмутся из `FALLBACK_PRODUCTS`.

## Особенности

### API и CORS

API `https://growtask.ru/test-front/api/products` **не отдаёт CORS-заголовки**, поэтому браузер блокирует прямые `fetch`-запросы.

**Решение:** локальный Node-прокси (`server.js`):

- Фронт → `localhost:3000/api/products` (тот же origin - CORS не применяется)
- Node → `growtask.ru` (не браузер - CORS не важен)

### Fallback

На GitHub Pages **Node-прокси не работает** (только статика). Поэтому в `js/cart.js` есть `FALLBACK_PRODUCTS` - массив с теми же товарами.

`fetchProducts()`:
1. Пробует `fetch('/api/products')`
2. При ошибке (404, CORS, нет сервера) → **fallback** на массив

В консоли видно, какой источник использован:
- `Товары получены с API`
- `API недоступен, используем fallback`

### Синхронизация cart ↔ checkout

`localStorage`:
- `cartState` - массив товаров с `count` и `selected`
- `promoDiscount` - применённый промокод

`cart.js` - сохраняет, `checkout.js` - читает.

### Промокод

- Код: `GROWTASK2026`
- Скидка: 10%

### Валидация формы

- **Имя, Фамилия:** ≥ 2 букв, только буквы
- **Телефон:** формат `+7 XXX XXX-XX-XX`
- **Почта:** стандартный email
