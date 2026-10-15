const API_URL = '/api/products';

const PROMO_CODE = 'GROWTASK2026';
const PROMO_DISCOUNT = 0.1;

const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Аудиокассета', price: 490.0, old_price: 690.0, image: 'https://growtask.ru/assets/img/products/cassette.png', sku: 'RT-CAS-001', quantity: 120 },
  { id: 2, name: 'Видеомагнитофон', price: 12990.0, old_price: 15990.0, image: 'https://growtask.ru/assets/img/products/multimedia.png', sku: 'RT-VCR-002', quantity: 0 },
  { id: 3, name: 'Кассетный плеер', price: 7490.0, old_price: null, image: 'https://growtask.ru/assets/img/products/player.png', sku: 'RT-PLR-003', quantity: 14 },
  { id: 4, name: 'Радиоприёмник', price: 3990.0, old_price: 4990.0, image: 'https://growtask.ru/assets/img/products/radio.png', sku: 'RT-RAD-004', quantity: 9 },
  { id: 5, name: 'Проигрыватель винила', price: 18990.0, old_price: null, image: 'https://growtask.ru/assets/img/products/record-player.png', sku: 'RT-VNL-005', quantity: 0 },
  { id: 6, name: 'Катушечный магнитофон', price: 24990.0, old_price: 29990.0, image: 'https://growtask.ru/assets/img/products/tape-recorder.png', sku: 'RT-TAP-006', quantity: 3 },
  { id: 7, name: 'Видеокамера', price: 15990.0, old_price: null, image: 'https://growtask.ru/assets/img/products/video-cam.png', sku: 'RT-CAM-007', quantity: 0 },
  { id: 8, name: 'Диктофон', price: 2490.0, old_price: 2990.0, image: 'https://growtask.ru/assets/img/products/voice-recorder.png', sku: 'RT-DCT-008', quantity: 27 }
];

const DOM = {
  products: document.getElementById('products'),
  countBadge: document.getElementById('products-count'),
  selectAll: document.getElementById('select-all'),
  clearCart: document.getElementById('clear-cart'),
  summaryCount: document.getElementById('summary-count'),
  summaryPrice: document.getElementById('summary-price'),
  summaryDiscount: document.getElementById('summary-discount'),
  summaryTotal: document.getElementById('summary-total'),
  promoInput: document.getElementById('promo-input'),
  promoApply: document.getElementById('promo-apply'),
  promoClear: document.getElementById('promo-clear'),
  headerPrice: document.getElementById('header-cart-price'),
  headerCount: document.getElementById('header-cart-count')
};

let cartState = [];
let promoDiscount = 0;

const formatPrice = (value) => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
};

const fetchProducts = async () => {
  try {
    const response = await fetch(API_URL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error('Неверный формат ответа API');
    }

    console.log('Товары получены с API');
    return result.data;
  } catch (error) {
    console.warn('API недоступен, используем fallback:', error.message);
    return FALLBACK_PRODUCTS;
  }
};

const loadState = (products) => {
  let saved = null;
  let savedPromo = null;

  try {
    saved = localStorage.getItem('cartState');
    savedPromo = localStorage.getItem('promoDiscount');
  } catch (e) {
    console.warn('localStorage недоступен');
  }

  if (saved) {
    const savedState = JSON.parse(saved);
    cartState = products.map(product => {
      const savedItem = savedState.find(s => s.id === product.id);
      return {
        ...product,
        count: savedItem ? savedItem.count : (product.quantity > 0 ? 1 : 0),
        selected: savedItem ? savedItem.selected : (product.quantity > 0)
      };
    });
  } else {
    cartState = products.map(product => ({
      ...product,
      count: product.quantity > 0 ? 1 : 0,
      selected: product.quantity > 0
    }));
  }

  if (savedPromo) {
    promoDiscount = parseFloat(savedPromo) || 0;
  }
};

const saveState = () => {
  try {
    localStorage.setItem('cartState', JSON.stringify(cartState));
    localStorage.setItem('promoDiscount', String(promoDiscount));
  } catch (e) {
    console.warn('Не удалось сохранить состояние');
  }
};

const getSelectedItems = () => cartState.filter(item => item.selected && item.count > 0);

const getCartTotals = () => {
  const selected = getSelectedItems();

  const totalCount = selected.reduce((sum, item) => sum + item.count, 0);
  const totalPrice = selected.reduce((sum, item) => sum + item.price * item.count, 0);
  const totalOldPrice = selected.reduce((sum, item) => {
    const old = item.old_price ?? item.price;
    return sum + old * item.count;
  }, 0);

  const productDiscount = totalOldPrice - totalPrice;
  const promoAmount = totalPrice * promoDiscount;
  const discount = productDiscount + promoAmount;
  const total = totalPrice - promoAmount;

  return { totalCount, totalPrice, totalOldPrice, productDiscount, promoAmount, discount, total };
};

const renderProduct = (product) => {
  const price = formatPrice(product.price);
  const oldPrice = product.old_price
    ? `<span class="product__sale">${formatPrice(product.old_price)}</span>`
    : '';
  const article = product.sku ? `Артикул: ${product.sku}` : '';
  const amount = formatPrice(product.price * product.count);
  const checked = product.selected ? 'checked' : '';
  const isOutOfStock = product.quantity === 0;

  const minusDisabled = isOutOfStock || product.count <= 0 ? 'disabled' : '';
  const plusDisabled = isOutOfStock || product.count >= product.quantity ? 'disabled' : '';

  return `
        <li class="product ${isOutOfStock ? 'product--out-of-stock' : ''}" data-id="${product.id}">
            <div class="product__about">
                <div class="product__image-wrap">
                    <input class="product__checkbox" type="checkbox" aria-label="Выбрать товар" ${checked} ${isOutOfStock ? 'disabled' : ''}>
                    <img class="product__image" src="${product.image}" alt="${product.name}">
                </div>
                <div class="product__info">
                    <span class="product__article">${article}</span>
                    <h2 class="product__name">${product.name}</h2>
                    ${isOutOfStock ? '<span class="product__stock">Нет в наличии</span>' : ''}
                </div>
            </div>

            <div class="product__controls">
                <div class="product__prices">
                    <span class="product__price">${price}</span>
                    ${oldPrice}
                </div>

                <div class="product__actions">
                    <div class="product__quantity">
                        <div class="stepper">
                            <button class="stepper__btn" type="button" data-action="minus" aria-label="Уменьшить" ${minusDisabled}>
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                            <span class="stepper__value">${product.count}</span>
                            <button class="stepper__btn" type="button" data-action="plus" aria-label="Увеличить" ${plusDisabled}>
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                        <span class="product__amount">${amount}</span>
                    </div>

                    <button class="icon-btn" type="button" data-action="remove" aria-label="Удалить товар">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 5C21.5523 5 22 5.44772 22 6C22 6.55228 21.5523 7 21 7H19.9355L19.2969 16.5859C19.2453 17.359 19.2029 17.997 19.127 18.5146C19.0492 19.0444 18.926 19.5293 18.6689 19.9805C18.2688 20.6827 17.6648 21.2471 16.9375 21.5996C16.4703 21.826 15.979 21.9166 15.4453 21.959C14.9238 22.0004 14.2845 22 13.5098 22H10.4902C9.71551 22 9.07621 22.0004 8.55469 21.959C8.02098 21.9166 7.52973 21.826 7.0625 21.5996C6.33518 21.2471 5.7312 20.6827 5.33105 19.9805C5.07401 19.5293 4.95083 19.0444 4.87305 18.5146C4.79705 17.997 4.75466 17.359 4.70312 16.5859L4.06445 7H3C2.44772 7 2 6.55228 2 6C2 5.44772 2.44772 5 3 5H21ZM6.69922 16.4531C6.75287 17.2579 6.78976 17.8037 6.85156 18.2246C6.91159 18.6334 6.98552 18.8431 7.06934 18.9902C7.26941 19.3413 7.57098 19.6236 7.93457 19.7998C8.08696 19.8736 8.30099 19.9331 8.71289 19.9658C9.13698 19.9995 9.68369 20 10.4902 20H13.5098C14.3163 20 14.863 19.9995 15.2871 19.9658C15.699 19.9331 15.913 19.8736 16.0654 19.7998C16.429 19.6236 16.7306 19.3413 16.9307 18.9902C17.0145 18.8431 17.0884 18.6334 17.1484 18.2246C17.2102 17.8037 17.2471 17.2579 17.3008 16.4531L17.9307 7H6.06934L6.69922 16.4531ZM15 2C15.5523 2 16 2.44772 16 3C16 3.55228 15.5523 4 15 4H9C8.44772 4 8 3.55228 8 3C8 2.44772 8.44772 2 9 2H15Z" fill="#2B2B2B"/>
                        </svg>
                    </button>
                </div>
            </div>
        </li>
    `;
};

const renderProducts = () => {
  if (!cartState.length) {
    DOM.products.innerHTML = '<li class="products__empty">Корзина пуста</li>';
    return;
  }
  DOM.products.innerHTML = cartState.map(renderProduct).join('');
};

const renderSummary = () => {
  const { totalCount, totalOldPrice, discount, total } = getCartTotals();

  DOM.countBadge.textContent = `${cartState.filter(item => item.count > 0).length} шт.`;
  DOM.summaryCount.textContent = `${totalCount} товаров:`;
  DOM.summaryPrice.textContent = formatPrice(totalOldPrice);
  DOM.summaryDiscount.textContent = formatPrice(discount > 0 ? discount : 0);
  DOM.summaryTotal.textContent = formatPrice(total);

  DOM.headerPrice.textContent = formatPrice(total);
  DOM.headerCount.textContent = totalCount;

  const availableItems = cartState.filter(item => item.quantity > 0);
  const allSelected = availableItems.length > 0 && availableItems.every(item => item.selected);
  DOM.selectAll.checked = allSelected;
};

const renderPromo = () => {
  if (!DOM.promoInput || !DOM.promoApply) return;

  if (promoDiscount > 0) {
    DOM.promoInput.value = PROMO_CODE;
    DOM.promoInput.disabled = true;
    DOM.promoApply.disabled = true;
    DOM.promoApply.textContent = 'Применён';
  } else {
    DOM.promoInput.value = '';
    DOM.promoInput.disabled = false;
    DOM.promoApply.disabled = false;
    DOM.promoApply.textContent = 'Применить';
  }
};

const render = () => {
  renderProducts();
  renderSummary();
  renderPromo();
  saveState();
};

const updateCount = (id, delta) => {
  const item = cartState.find(product => product.id === id);
  if (!item) return;
  if (item.quantity === 0) return;

  const newCount = item.count + delta;
  if (newCount < 0) return;
  if (newCount > item.quantity) return;

  item.count = newCount;
  item.selected = newCount > 0;
  render();
};

const removeItem = (id) => {
  cartState = cartState.filter(product => product.id !== id);
  render();
};

const toggleSelect = (id, selected) => {
  const item = cartState.find(product => product.id === id);
  if (!item) return;

  item.selected = selected;
  render();
};

const toggleAll = (selected) => {
  cartState.forEach(item => {
    if (item.quantity > 0) item.selected = selected;
  });
  render();
};

const clearCart = () => {
  cartState = [];
  render();
};

const applyPromo = () => {
  const value = DOM.promoInput.value.trim().toUpperCase();

  if (value === PROMO_CODE) {
    promoDiscount = PROMO_DISCOUNT;
  } else {
    promoDiscount = 0;
  }

  render();
};

const resetPromo = () => {
  promoDiscount = 0;
  render();
};

const initHandlers = () => {
  DOM.products.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target || target.disabled) return;

    const product = target.closest('.product');
    const id = Number(product.dataset.id);
    const action = target.dataset.action;

    if (action === 'plus') updateCount(id, 1);
    if (action === 'minus') updateCount(id, -1);
    if (action === 'remove') removeItem(id);
  });

  DOM.products.addEventListener('change', (e) => {
    if (!e.target.classList.contains('product__checkbox')) return;

    const product = e.target.closest('.product');
    const id = Number(product.dataset.id);
    toggleSelect(id, e.target.checked);
  });

  DOM.selectAll.addEventListener('change', (e) => {
    toggleAll(e.target.checked);
  });

  DOM.clearCart.addEventListener('click', clearCart);

  if (DOM.promoApply) {
    DOM.promoApply.addEventListener('click', (e) => {
      e.preventDefault();
      applyPromo();
    });
  }

  if (DOM.promoClear) {
    DOM.promoClear.addEventListener('click', (e) => {
      e.preventDefault();
      resetPromo();
    });
  }
};

const initCart = async () => {
  try {
    const products = await fetchProducts();
    loadState(products);
    render();
    initHandlers();
  } catch (error) {
    console.error('Ошибка инициализации:', error.message);
  }
};

initCart();