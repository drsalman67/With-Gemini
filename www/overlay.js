(function () {
  'use strict';
  const btn = document.getElementById('floating-btn');
  const menu = document.getElementById('action-menu');
  const timerStrip = document.getElementById('timer-strip');
  let isMenuOpen = false;

  // --- TIMER LOGIC ---
  let timerInterval = null;
  let timerMs = 0;
  let isTimerRunning = false;

  function updateTimerDisplay() {
    let mins = Math.floor(timerMs / 60000);
    let secs = Math.floor((timerMs % 60000) / 1000);
    let ms = Math.floor((timerMs % 1000) / 10);
    timerStrip.textContent = 
      (mins < 10 ? "0" : "") + mins + ":" + 
      (secs < 10 ? "0" : "") + secs + "." + 
      (ms < 10 ? "0" : "") + ms;
  }

  // --- BATTERY RADAR RECEIVER ---
  window.updateBattery = function(pct, isCharging) {
    btn.className = 'floating-btn'; // Reset
    if (isCharging) {
      btn.classList.add('aura-charging');
    } else if (pct <= 20) {
      btn.classList.add('aura-red');
    } else if (pct <= 50) {
      btn.classList.add('aura-yellow');
    } else {
      btn.classList.add('aura-green');
    }
  };

  // --- NOTIFICATION PULSE RECEIVER ---
  window.triggerPulse = function() {
    btn.classList.add('pulse-anim');
    setTimeout(() => { btn.classList.remove('pulse-anim'); }, 1500);
  };

  // --- MENU LOGIC ---
  btn.addEventListener('click', function() {
    isMenuOpen ? closeMenu() : openMenu();
  });

  function openMenu() {
    isMenuOpen = true; menu.classList.add('visible');
    var items = menu.querySelectorAll('.menu-item'), count = items.length;
    var spreadAngle = 200, startAngle = -180; // Spread around the button
    for (var i = 0; i < count; i++) {
      var rad = (startAngle + (spreadAngle / (count - 1)) * i) * (Math.PI / 180);
      items[i].style.left = (Math.cos(rad) * 75) + 'px';
      items[i].style.top = (Math.sin(rad) * 75) + 'px';
    }
  }

  function closeMenu() {
    isMenuOpen = false; menu.classList.remove('visible');
  }

  menu.addEventListener('click', function (e) {
    var item = e.target.closest('.menu-item'); if (!item) return;
    var action = item.getAttribute('data-action'); closeMenu();
    
    if (action === "timer") {
      // Gym Timer Toggle Logic
      if (!timerStrip.classList.contains('open')) {
        timerStrip.classList.add('open');
        timerMs = 0; isTimerRunning = true; updateTimerDisplay();
        timerInterval = setInterval(() => { timerMs += 10; updateTimerDisplay(); }, 10);
      } else {
        clearInterval(timerInterval); timerStrip.classList.remove('open'); isTimerRunning = false;
      }
    } else if (action === "shortcut") {
      // Launch saved app
      let targetPkg = localStorage.getItem('akira_shortcut_pkg') || "com.whatsapp";
      if (window.NativeBridge) window.NativeBridge.launchApp(targetPkg);
    } else {
      // Standard Actions
      if (window.NativeBridge) window.NativeBridge.performAction(action);
    }
  });
})();
