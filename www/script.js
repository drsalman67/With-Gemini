(function () {
  'use strict';
  const btn = document.getElementById('floating-btn');
  const menu = document.getElementById('action-menu');
  const toastEl = document.getElementById('toast');
  let isMenuOpen = false;

  function showToast(msg) {
    toastEl.textContent = msg; toastEl.classList.remove('hidden'); toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, 2000);
  }

  btn.addEventListener('click', function() {
    isMenuOpen ? closeMenu() : openMenu();
  });

  function openMenu() {
    isMenuOpen = true;
    menu.classList.remove('hidden'); menu.classList.add('visible');
    var items = menu.querySelectorAll('.menu-item'), count = items.length;
    var spreadAngle = 140, startAngle = -90 - spreadAngle / 2;
    for (var i = 0; i < count; i++) {
      var rad = (startAngle + (spreadAngle / (count - 1)) * i) * (Math.PI / 180);
      items[i].style.left = (Math.cos(rad) * 80) + 'px';
      items[i].style.top = (Math.sin(rad) * 80) + 'px';
    }
  }

  function closeMenu() {
    isMenuOpen = false; menu.classList.remove('visible'); menu.classList.add('hidden');
  }

  menu.addEventListener('click', function (e) {
    var item = e.target.closest('.menu-item'); if (!item) return;
    var action = item.getAttribute('data-action'); closeMenu();
    showToast(action + ' Triggered');
    
    // YAHAN HUA ASLI JAADU: Call Native Bridge
    if (window.NativeBridge) {
        window.NativeBridge.performAction(action);
    }
  });
})();
