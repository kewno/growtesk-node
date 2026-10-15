const PROMO_CODE = 'GROWTASK2026';
const PROMO_DISCOUNT = 0.1;

const DOM = {
  checkoutProducts: document.getElementById('checkout-products'),
  checkoutCount: document.getElementById('checkout-count'),
  summaryCount: document.getElementById('summary-count'),
  summaryPrice: document.getElementById('summary-price'),
  summaryDiscount: document.getElementById('summary-discount'),
  summaryTotal: document.getElementById('summary-total'),
  promoInput: document.getElementById('promo-input'),
  promoApply: document.getElementById('promo-apply'),
  promoClear: document.getElementById('promo-clear'),
  submitOrder: document.getElementById('submit-order'),
  submitOrderAside: document.getElementById('submit-order-aside'),
  submitHint: document.getElementById('submit-hint'),
  headerPrice: document.getElementById('header-cart-price'),
  headerCount: document.getElementById('header-cart-count'),
  fields: {
    name: { input: document.getElementById('input-name'), error: document.getElementById('error-name') },
    surname: { input: document.getElementById('input-surname'), error: document.getElementById('error-surname') },
    phone: { input: document.getElementById('input-phone'), error: document.getElementById('error-phone') },
    email: { input: document.getElementById('input-email'), error: document.getElementById('error-email') }
  }
};

let cartState = [];
let promoDiscount = 0;

const formatPrice = (value) => {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value)) + ' ₽';
};

const loadState = () => {
  try {
    const saved = localStorage.getItem('cartState');
    if (saved) {
      cartState = JSON.parse(saved);
    }
    const savedPromo = localStorage.getItem('promoDiscount');
    if (savedPromo) {
      promoDiscount = parseFloat(savedPromo) || 0;
    }
  } catch (e) {
    console.warn('Не удалось загрузить состояние корзины');
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

const renderCheckoutProduct = (product) => {
  return `
        <li class="checkout-product" data-id="${product.id}">
            <img class="checkout-product__img" src="${product.image}" alt="${product.name}">
            <span class="checkout-product__badge">${product.count}</span>
        </li>
    `;
};

const renderProducts = () => {
  const selected = getSelectedItems();

  if (!selected.length) {
    DOM.checkoutProducts.innerHTML = '';
    DOM.checkoutCount.textContent = '0 товаров';
    return;
  }

  DOM.checkoutProducts.innerHTML = selected.map(renderCheckoutProduct).join('');
  DOM.checkoutCount.textContent = `${selected.length} товаров`;
};

const renderSummary = () => {
  const { totalCount, totalOldPrice, discount, total } = getCartTotals();

  DOM.summaryCount.textContent = `${totalCount} товаров:`;
  DOM.summaryPrice.textContent = formatPrice(totalOldPrice);
  DOM.summaryDiscount.textContent = formatPrice(discount > 0 ? discount : 0);
  DOM.summaryTotal.textContent = formatPrice(total);

  DOM.headerPrice.textContent = formatPrice(total);
  DOM.headerCount.textContent = totalCount;
};

const renderPromo = () => {
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
};

const applyPromo = () => {
  const value = DOM.promoInput.value.trim().toUpperCase();

  if (value === PROMO_CODE) {
    promoDiscount = PROMO_DISCOUNT;
    localStorage.setItem('promoDiscount', String(promoDiscount));
  } else {
    promoDiscount = 0;
    localStorage.setItem('promoDiscount', '0');
  }

  render();
};

const resetPromo = () => {
  promoDiscount = 0;
  localStorage.setItem('promoDiscount', '0');
  render();
};

const validators = {
  name: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Укажите имя';
    if (trimmed.length < 2) return 'Минимум 2 символа';
    if (!/^[А-Яа-яЁёA-Za-z]+$/.test(trimmed)) return 'Только буквы, без цифр';
    return '';
  },
  surname: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Укажите фамилию';
    if (trimmed.length < 2) return 'Минимум 2 символа';
    if (!/^[А-Яа-яЁёA-Za-z]+$/.test(trimmed)) return 'Только буквы, без цифр';
    return '';
  },
  phone: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Укажите телефон';
    if (!/^\+7\s?\d{3}\s?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(trimmed)) {
      return 'Формат: +7 800 555 35 35';
    }
    return '';
  },
  email: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Укажите почту';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Некорректный email';
    return '';
  }
};

const validateField = (fieldName) => {
  const field = DOM.fields[fieldName];
  const value = field.input.value;

  const error = validators[fieldName](value);

  if (error) {
    field.input.classList.add('field__input--error');
    field.error.textContent = error;
    return false;
  } else {
    field.input.classList.remove('field__input--error');
    field.error.textContent = '';
    return true;
  }
};

const validateForm = () => {
  const results = Object.keys(DOM.fields).map(validateField);
  return results.every(Boolean);
};

const updateSubmitState = () => {
  const isValid = validateForm();

  if (DOM.submitHint) {
    DOM.submitHint.classList.toggle('checkout-card__hint--visible', isValid);
  }

  return isValid;
};

const submitOrder = () => {
  if (!updateSubmitState()) {
    return;
  }

  window.location.href = 'success.html';
};

const initHandlers = () => {
  DOM.promoApply.addEventListener('click', (e) => {
    e.preventDefault();
    applyPromo();
  });

  DOM.promoClear.addEventListener('click', (e) => {
    e.preventDefault();
    resetPromo();
  });

  DOM.submitOrder.addEventListener('click', (e) => {
    e.preventDefault();
    submitOrder();
  });

  if (DOM.submitOrderAside) {
    DOM.submitOrderAside.addEventListener('click', (e) => {
      e.preventDefault();
      submitOrder();
    });
  }

  Object.keys(DOM.fields).forEach(fieldName => {
    const field = DOM.fields[fieldName];

    field.input.addEventListener('blur', () => {
      validateField(fieldName);
      updateSubmitState();
    });

    field.input.addEventListener('input', () => {
      if (field.input.classList.contains('field__input--error')) {
        validateField(fieldName);
      }
      updateSubmitState();
    });
  });

  document.querySelectorAll('.field__clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.field__input-wrap').querySelector('.field__input');
      if (!input) return;

      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));

      const fieldName = Object.keys(DOM.fields).find(
        name => DOM.fields[name].input === input
      );

      if (fieldName) {
        DOM.fields[fieldName].error.textContent = '';
        input.classList.remove('field__input--error');
      }

      updateSubmitState();
    });
  });
};

loadState();
render();
initHandlers();
updateSubmitState();