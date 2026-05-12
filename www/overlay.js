(function () {
    const bridge = window.NativeBridge;
    const btn = document.getElementById('floating-btn');
    const menu = document.getElementById('action-menu');
    const gymPanel = document.getElementById('gym-panel');
    let isMenuOpen = false;
    let isGymOpen = false;

    // Load Size from Settings
    if (bridge) {
        let size = bridge.getSetting('btn_size', '60');
        btn.style.width = size + 'px';
        btn.style.height = size + 'px';
    }

    // --- DYNAMIC RESIZER LOGIC ---
    function updateWindowSize() {
        if (!bridge) return;
        if (isGymOpen) { bridge.resizeWindow(300, 320); } 
        else if (isMenuOpen) { bridge.resizeWindow(240, 240); } 
        else { bridge.resizeWindow(90, 90); } // Sirf button jitni jagah
    }

    // --- MENU LOGIC ---
    btn.addEventListener('click', () => { isMenuOpen ? closeMenu() : openMenu(); });

    function openMenu() {
        isMenuOpen = true; menu.classList.remove('hidden'); menu.classList.add('visible');
        updateWindowSize();
        let items = menu.querySelectorAll('.menu-item');
        
        // 90 degree arc (Bottom Right)
        let radius = 80;
        let startAngle = 0; 
        let spread = 90;
        
        for (let i = 0; i < items.length; i++) {
            let angle = (startAngle + (spread / (items.length - 1)) * i) * (Math.PI / 180);
            items[i].style.setProperty('--x', (Math.cos(angle) * radius) + 'px');
            items[i].style.setProperty('--y', (Math.sin(angle) * radius) + 'px');
        }
        
        // Notification Pulse Kill (Jaise tune kaha tha touch pe band ho)
        btn.classList.remove('pulse-fx');
    }

    function closeMenu() {
        isMenuOpen = false; menu.classList.remove('visible'); menu.classList.add('hidden');
        if (!isGymOpen) updateWindowSize();
    }

    menu.addEventListener('click', (e) => {
        let item = e.target.closest('.menu-item'); if (!item) return;
        let action = item.getAttribute('data-action');
        closeMenu();

        if (action === 'gemini') { if(bridge) bridge.launchGemini(); }
        else if (action === 'shortcut') {
            let pkg = bridge ? bridge.getSetting('shortcut_pkg', '') : '';
            if (pkg && bridge) bridge.launchApp(pkg);
        }
        else if (action === 'gym') {
            isGymOpen = !isGymOpen;
            isGymOpen ? gymPanel.classList.remove('hidden') : gymPanel.classList.add('hidden');
            updateWindowSize();
        }
        else if (bridge) { bridge.performAction(action); }
    });

    // --- BATTERY & NOTIFICATION (Checking Settings) ---
    window.updateBattery = function(pct, isCharging) {
        if (!bridge) return;
        let useBattery = bridge.getSetting('battery_aura', 'true') === 'true';
        let useCharge = bridge.getSetting('charging_fx', 'true') === 'true';
        
        btn.className = 'floating-btn'; // reset
        if(bridge.getSetting('master_switch', 'true') === 'false') return;

        if (useCharge && isCharging) { btn.classList.add('aura-charging'); }
        else if (useBattery) {
            if (pct <= 20) btn.classList.add('aura-red');
            else if (pct <= 50) btn.classList.add('aura-yellow');
            else btn.classList.add('aura-green');
        }
    };

    window.triggerPulse = function() {
        if (bridge && bridge.getSetting('notif_pulse', 'true') === 'true') {
            btn.classList.add('pulse-fx');
        }
    };

    // --- GYM MASTER LOGIC ---
    const tabT = document.getElementById('tab-timer'), tabSw = document.getElementById('tab-sw');
    const viewT = document.getElementById('view-timer'), viewSw = document.getElementById('view-sw');
    
    document.getElementById('close-gym').onclick = () => { isGymOpen = false; gymPanel.classList.add('hidden'); updateWindowSize(); };

    tabT.onclick = () => { tabT.classList.add('active'); tabSw.classList.remove('active'); viewT.classList.add('active'); viewSw.classList.remove('active'); };
    tabSw.onclick = () => { tabSw.classList.add('active'); tabT.classList.remove('active'); viewSw.classList.add('active'); viewSw.classList.remove('active'); };

    // 1. Countdown Logic
    let cdInterval;
    let cdTotalSecs = 0;
    const inH = document.getElementById('t-h'), inM = document.getElementById('t-m'), inS = document.getElementById('t-s');
    
    function formatInput(val) { return val < 10 ? "0"+val : val; }

    document.getElementById('btn-t-play').onclick = () => {
        clearInterval(cdInterval);
        document.body.classList.remove('sos-mode');
        cdTotalSecs = (parseInt(inH.value)*3600) + (parseInt(inM.value)*60) + parseInt(inS.value);
        if(cdTotalSecs <= 0) return;
        
        cdInterval = setInterval(() => {
            cdTotalSecs--;
            inH.value = formatInput(Math.floor(cdTotalSecs / 3600));
            inM.value = formatInput(Math.floor((cdTotalSecs % 3600) / 60));
            inS.value = formatInput(cdTotalSecs % 60);

            if (cdTotalSecs <= 0) {
                clearInterval(cdInterval);
                document.body.classList.add('sos-mode'); // Flash Screen
                if(bridge) bridge.vibrateSOS(); // Vibrate
            }
        }, 1000);
    };
    
    document.getElementById('btn-t-pause').onclick = () => { clearInterval(cdInterval); document.body.classList.remove('sos-mode'); };
    document.getElementById('btn-t-reset').onclick = () => { clearInterval(cdInterval); inH.value="00"; inM.value="00"; inS.value="00"; document.body.classList.remove('sos-mode'); };

    // 2. Stopwatch Logic
    let swInterval;
    let swMs = 0;
    const swDisplay = document.getElementById('sw-display');
    
    document.getElementById('btn-sw-play').onclick = () => {
        clearInterval(swInterval);
        swInterval = setInterval(() => {
            swMs += 10;
            let h = Math.floor(swMs / 3600000);
            let m = Math.floor((swMs % 3600000) / 60000);
            let s = Math.floor((swMs % 60000) / 1000);
            let ms = Math.floor((swMs % 1000) / 10);
            swDisplay.textContent = formatInput(h)+":"+formatInput(m)+":"+formatInput(s)+"."+formatInput(ms);
        }, 10);
    };
    document.getElementById('btn-sw-pause').onclick = () => clearInterval(swInterval);
    document.getElementById('btn-sw-reset').onclick = () => { clearInterval(swInterval); swMs = 0; swDisplay.textContent = "00:00:00.00"; };

    updateWindowSize(); // Init Size
})();
