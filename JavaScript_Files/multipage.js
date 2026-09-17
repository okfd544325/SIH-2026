/* MediSwift V4.4 Multi-Page Router
   Converts the original one-page scrolling UI into real page navigation.
   Existing sections remain in the DOM so the original JavaScript/backend features keep working.
*/
(function () {
  'use strict';

  var PAGE_FILES = {
    hero: '/',
    home: '/',
    store: '/medicines.html',
    medicines: '/medicines.html',
    doctors: '/appointments.html',
    appointments: '/appointments.html',
    assistant: '/ai-assistant.html',
    upload: '/prescription.html',
    aiAnalysis: '/prescription.html',
    cart: '/cart.html',
    checkout: '/checkout.html',
    tracking: '/tracking.html'
  };

  var PAGE_SECTIONS = {
    home: ['hero','trustStrip','quickActions','mediswiftDeck','features','howItWorks','stats','pharmacies','testimonials','finalCta'],
    medicines: ['store'],
    appointments: ['doctors'],
    assistant: ['assistant'],
    prescription: ['upload','aiAnalysis'],
    cart: ['cart'],
    checkout: ['checkout'],
    tracking: ['tracking']
  };

  function currentPage() {
    return (document.body && document.body.getAttribute('data-page')) || 'home';
  }

  function pageForSection(id) {
    return PAGE_FILES[id] || null;
  }

  function showOnlyCurrentPage() {
    var page = currentPage();
    var allowed = PAGE_SECTIONS[page] || PAGE_SECTIONS.home;
    document.querySelectorAll('main > section').forEach(function (section) {
      if (allowed.indexOf(section.id) === -1) {
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
      } else {
        section.style.display = '';
        section.removeAttribute('aria-hidden');
      }
    });
    window.scrollTo(0, 0);
  }

  // Turn all original #section links into real page navigation.
  document.addEventListener('click', function (event) {
    var a = event.target.closest && event.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (!hash || hash === '#') return; // profile/logout/modal controls stay handled by original JS
    var id = hash.slice(1);
    var target = pageForSection(id);
    if (!target) return; // login/register and other modal anchors keep original behavior

    event.preventDefault();
    event.stopPropagation();
    window.location.assign(target);
  }, true);

  // Original V4.3 has a few JS actions that call scrollIntoView().
  // Redirect those actions to their dedicated page instead of sliding down the long homepage.
  var nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (options) {
    var id = this && this.id;
    var target = id && pageForSection(id);
    if (target) {
      var samePage = (target === '/' && currentPage() === 'home') ||
        (target.indexOf('/medicines') === 0 && currentPage() === 'medicines') ||
        (target.indexOf('/appointments') === 0 && currentPage() === 'appointments') ||
        (target.indexOf('/ai-assistant') === 0 && currentPage() === 'assistant') ||
        (target.indexOf('/prescription') === 0 && currentPage() === 'prescription') ||
        (target.indexOf('/cart') === 0 && currentPage() === 'cart') ||
        (target.indexOf('/checkout') === 0 && currentPage() === 'checkout') ||
        (target.indexOf('/tracking') === 0 && currentPage() === 'tracking');

      if (!samePage) {
        window.location.assign(target);
        return;
      }
      // No smooth sliding on dedicated pages.
      return nativeScrollIntoView.call(this, { behavior: 'auto', block: 'start' });
    }
    return nativeScrollIntoView.call(this, options);
  };

  function addPageNav() {
    var nav = document.getElementById('navLinks');
    if (!nav) return;
    nav.innerHTML =
      '<a href="/medicines.html" class="nav-link">Medicines</a>' +
      '<a href="/appointments.html" class="nav-link">Appointments</a>' +
      '<a href="/ai-assistant.html" class="nav-link">AI Assistant</a>';
  }

  function fixStaticLinks() {
    // Logo always returns to the homepage.
    var logo = document.querySelector('.logo');
    if (logo) logo.setAttribute('href', '/');

    // Cart always has its own page.
    var cart = document.querySelector('.nav-cart-btn');
    if (cart) cart.setAttribute('href', '/cart.html');

    // Mobile menu uses dedicated pages too.
    document.querySelectorAll('.mobile-menu-link').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        var t = pageForSection(href.slice(1));
        if (t) a.setAttribute('href', t);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    showOnlyCurrentPage();
    addPageNav();
    fixStaticLinks();
  });
})();
