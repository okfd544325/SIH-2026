/* MediSwift full-stack bridge.
   Loaded after script.js. It keeps the existing UI but makes cart and order history use the backend. */
(function () {
  'use strict';

  var cartId = localStorage.getItem('mediswiftCartId');
  if (!cartId) {
    cartId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'cart-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    localStorage.setItem('mediswiftCartId', cartId);
  }

  async function backend(endpoint, options) {
    options = options || {};
    var headers = Object.assign({
      'Content-Type': 'application/json',
      'X-Cart-Id': cartId
    }, options.headers || {});

    var token = localStorage.getItem('mediswiftToken');
    if (token) headers.Authorization = 'Bearer ' + token;

    var apiBase = (window.location && window.location.protocol === 'file:') ? 'http://localhost:3000/api' : '/api';
    var response = await fetch(apiBase + endpoint, Object.assign({}, options, { headers: headers }));
    var data;
    try { data = await response.json(); }
    catch (_) { data = { success: false, message: 'Invalid server response.' }; }

    if (!response.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

  function medicineFor(id) {
    return medicines.find(function (m) { return m.id === id; });
  }

  function applyServerCart(items) {
    cart.length = 0;
    (items || []).forEach(function (item) {
      var med = medicineFor(item.medicineId);
      if (med) cart.push({ medicine: med, quantity: Math.max(1, Number(item.quantity) || 1) });
    });
    updateCartUI();
    renderCart();
    renderMedicines();
    if (document.getElementById('checkout').style.display !== 'none') renderCheckout();
  }

  async function refreshBackendCart() {
    try {
      if (window.mediswiftMedicinesReady) await window.mediswiftMedicinesReady;
      var data = await backend('/cart');
      applyServerCart(data.items);
    } catch (error) {
      console.error('Could not load backend cart:', error);
    }
  }

  // Replace the original cart actions with backend-backed versions.
  window.addToCart = async function (medId) {
    try {
      var med = medicineFor(medId);
      if (!med || !med.inStock) return;
      var data = await backend('/cart', {
        method: 'POST',
        body: JSON.stringify({ medicineId: medId, quantity: 1 })
      });
      applyServerCart(data.items);
    } catch (error) {
      alert('Could not add item: ' + error.message);
    }
  };

  window.removeFromCart = async function (medId) {
    try {
      var data = await backend('/cart/' + encodeURIComponent(medId), { method: 'DELETE' });
      applyServerCart(data.items);
    } catch (error) {
      alert('Could not remove item: ' + error.message);
    }
  };

  window.updateQuantity = async function (medId, delta) {
    var current = cart.find(function (x) { return x.medicine.id === medId; });
    if (!current) return;
    var next = current.quantity + delta;
    try {
      var data = await backend('/cart/' + encodeURIComponent(medId), {
        method: 'PUT',
        body: JSON.stringify({ quantity: next })
      });
      applyServerCart(data.items);
    } catch (error) {
      alert('Could not update quantity: ' + error.message);
    }
  };

  window.clearCart = async function () {
    try {
      var data = await backend('/cart', { method: 'DELETE' });
      appliedCoupon = null;
      applyServerCart(data.items);
    } catch (error) {
      alert('Could not clear cart: ' + error.message);
    }
  };

  async function refreshOrders() {
    if (!localStorage.getItem('mediswiftToken')) return;
    try {
      var data = await backend('/orders');
      if (!Array.isArray(data.orders)) return;
      orders.length = 0;
      data.orders.slice().reverse().forEach(function (order) { orders.push(order); });
      if (orders.length) selectedOrderId = orders[0].id;
      renderTrackingSafe();
    } catch (error) {
      console.error('Could not load orders:', error);
    }
  }

  function renderTrackingSafe() {
    if (!orders.length) {
      var selector = document.getElementById('orderSelector');
      if (selector) selector.innerHTML = '<span style="color:var(--gray-500)">No orders yet. Place your first order to see tracking here.</span>';
      return;
    }
    renderTracking();
  }

  // Wrap login UI so backend order history is fetched immediately after login.
  var originalLoginUser = window.loginUser;
  if (typeof originalLoginUser === 'function') {
    window.loginUser = function (account) {
      originalLoginUser(account);
      setTimeout(refreshOrders, 0);
    };
  }

  // After checkout succeeds, refresh order tracking from the server.
  var checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function () {
      setTimeout(function () {
        refreshOrders();
        refreshBackendCart();
      }, 1200);
    });
  }

  // Make sure logout always clears UI even if the backend session was restarted.
  var logout = document.getElementById('logoutBtn');
  if (logout) {
    logout.addEventListener('click', function () {
      setTimeout(function () {
        localStorage.removeItem('mediswiftToken');
      }, 0);
    });
  }

  // Start with the real backend cart. Existing frontend sections remain unchanged.
  refreshBackendCart();
  setTimeout(refreshOrders, 200);

  window.mediswiftBackend = {
    refreshCart: refreshBackendCart,
    refreshOrders: refreshOrders,
    request: backend
  };
})();
