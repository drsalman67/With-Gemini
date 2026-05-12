(function () {
  'use strict';
  const btn = document.getElementById('floating-btn');
  const menu = document.getElementById('action-menu');
  const toastEl = document.getElementById('toast');
  let posX = 16, posY = window.innerHeight / 2;
  let isDragging = false, isMenuOpen = false;
  let dragStartX = 0, dragStartY = 0, dragStartTime = 0;
  let posAtDragStartX = 0, posAtDragStartY = 0;
  let hasMoved = false;
  const TAP_MAX_DIST = 10, TAP_MAX_DURATION = 250, SNAP_MARGIN = 8, BTN_SIZE = 56;

  function initPosition() { posY = Math.round(window.innerHeight / 2); posX = SNAP_MARGIN; applyPosition(); }
  function applyPosition() { btn.style.left = posX + 'px'; btn.style.top = posY + 'px'; }

  let toastTimer = null;
  function showToast(msg, duration = 2000) {
    toastEl.textContent = msg; toastEl.classList.remove('hidden'); toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, duration);
  }

  btn.addEventListener('touchstart', onTouchStart, { passive: false });
  btn.addEventListener('touchmove', onTouchMove, { passive: false });
  btn.addEventListener('touchend', onTouchEnd, { passive: false });

  function onTouchStart(e) {
    if (isMenuOpen) { closeMenu(); e.preventDefault(); return; }
    var touch = e.touches[0];
    dragStartX = touch.clientX; dragStartY = touch.clientY; dragStartTime = Date.now();
    posAtDragStartX = posX; posAtDragStartY = posY; hasMoved = false;
    btn.classList.add('pressed'); e.preventDefault();
  }

  function onTouchMove(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var dx = touch.clientX - dragStartX, dy = touch.clientY - dragStartY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > TAP_MAX_DIST && !isDragging) {
      isDragging = true; btn.classList.remove('pressed'); btn.classList.add('dragging');
      btn.style.transition = 'box-shadow 0.15s ease, transform 0.1s ease';
    }
    if (isDragging) {
      hasMoved = true;
      var newX = posAtDragStartX + dx, newY = posAtDragStartY + dy;
      var maxX = window.innerWidth - BTN_SIZE - SNAP_MARGIN, maxY = window.innerHeight - BTN_SIZE - SNAP_MARGIN;
      posX = Math.max(SNAP_MARGIN, Math.min(maxX, newX)); posY = Math.max(SNAP_MARGIN, Math.min(maxY, newY));
      applyPosition();
    }
  }

  function onTouchEnd(e) {
    e.preventDefault();
    if (isDragging) {
      btn.classList.remove('dragging'); btn.style.transition = ''; snapToEdge(); isDragging = false; return;
    }
    btn.classList.remove('pressed');
    if (!hasMoved && (Date.now() - dragStartTime) < TAP_MAX_DURATION) handleTap();
  }

  function snapToEdge() {
    posX = (posX + BTN_SIZE / 2 < window.innerWidth / 2) ? SNAP_MARGIN : window.innerWidth - BTN_SIZE - SNAP_MARGIN;
    posY = Math.max(SNAP_MARGIN, Math.min(window.innerHeight - BTN_SIZE - SNAP_MARGIN, posY));
    applyPosition();
  }

  function handleTap() { isMenuOpen ? closeMenu() : openMenu(); }

  var MENU_RADIUS = 80;
  function openMenu() {
    isMenuOpen = true;
    menu.style.left = (posX + BTN_SIZE / 2) + 'px'; menu.style.top = (posY + BTN_SIZE / 2) + 'px';
    var items = menu.querySelectorAll('.menu-item'), count = items.length;
    var spreadAngle = 140, startAngle = -90 - spreadAngle / 2;
    for (var i = 0; i < count; i++) {
      var rad = (startAngle + (spreadAngle / (count - 1)) * i) * (Math.PI / 180);
      items[i].style.left = (Math.cos(rad) * MENU_RADIUS) + 'px';
      items[i].style.top = (Math.sin(rad) * MENU_RADIUS) + 'px';
    }
    menu.classList.remove('hidden'); menu.classList.add('visible');
  }

  function closeMenu() {
    isMenuOpen = false; menu.classList.remove('visible'); menu.classList.add('hidden');
  }

  menu.addEventListener('click', function (e) {
    var item = e.target.closest('.menu-item'); if (!item) return;
    var action = item.getAttribute('data-action'); closeMenu();
    switch (action) {
      case 'home': showToast('Going home...'); sendToNative('home'); break;
      case 'search': showToast('Search triggered'); sendToNative('search'); break;
      case 'settings': showToast('Opening settings'); sendToNative('settings'); break;
      case 'close': showToast('Closing overlay'); sendToNative('closeOverlay'); break;
    }
  });

  document.addEventListener('touchstart', function (e) {
    if (!isMenuOpen) return;
    if (btn.contains(e.target) || menu.contains(e.target)) return;
    closeMenu();
  }, { passive: true });

  function sendToNative(action) {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.OverlayPlugin) {
      window.Capacitor.Plugins.OverlayPlugin.performAction({ action: action }).catch(console.warn);
      return;
    }
    console.log('[Overlay] Action (no native bridge):', action);
  }

  window.addEventListener('resize', function () {
    posX = Math.max(SNAP_MARGIN, Math.min(window.innerWidth - BTN_SIZE - SNAP_MARGIN, posX));
    posY = Math.max(SNAP_MARGIN, Math.min(window.innerHeight - BTN_SIZE - SNAP_MARGIN, posY));
    applyPosition(); if (isMenuOpen) closeMenu();
  });

  initPosition();
})();
