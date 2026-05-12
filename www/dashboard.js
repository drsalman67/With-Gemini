(function () {
    const bridge = window.NativeBridge;
    const masterSwitch = document.getElementById('master-switch');
    const batteryAura = document.getElementById('battery-aura');
    const chargingFx = document.getElementById('charging-fx');
    const notifPulse = document.getElementById('notif-pulse');
    const appSelector = document.getElementById('app-selector');

    function loadSetting(key, defaultVal, element) {
        let val = defaultVal;
        if (bridge) val = bridge.getSetting(key, defaultVal);
        element.checked = (val === 'true');
    }

    function saveSetting(key, value) {
        if (bridge) bridge.saveSetting(key, value.toString());
    }

    loadSetting('master_switch', 'true', masterSwitch);
    loadSetting('battery_aura', 'true', batteryAura);
    loadSetting('charging_fx', 'true', chargingFx);
    loadSetting('notif_pulse', 'true', notifPulse);

    // Ultra-Safe App Fetcher
    if (bridge) {
        setTimeout(() => {
            let appsStr = bridge.getApps();
            if(appsStr) {
                let appsList = JSON.parse(appsStr);
                appsList.sort((a, b) => a.name.localeCompare(b.name));
                appSelector.innerHTML = '<option value="">-- Select an App --</option>';
                appsList.forEach(app => {
                    let opt = document.createElement('option');
                    opt.value = app.pkg;
                    opt.textContent = app.name;
                    appSelector.appendChild(opt);
                });
                let savedPkg = bridge.getSetting('shortcut_pkg', '');
                if (savedPkg) appSelector.value = savedPkg;
            }
        }, 500); // Thoda delay taake Java bridge ready ho jaye
    }

    masterSwitch.addEventListener('change', (e) => {
        if(!e.target.checked && bridge) {
            bridge.killService(); // PREMIUM JUGAAD: Instantly marde overlay ko!
        } else if (e.target.checked && bridge) {
            saveSetting('master_switch', 'true');
            alert("Turned ON. Re-open the app to start the overlay!");
        }
    });

    batteryAura.addEventListener('change', (e) => saveSetting('battery_aura', e.target.checked));
    chargingFx.addEventListener('change', (e) => saveSetting('charging_fx', e.target.checked));
    notifPulse.addEventListener('change', (e) => saveSetting('notif_pulse', e.target.checked));
    
    appSelector.addEventListener('change', (e) => {
        if(e.target.value) {
            saveSetting('shortcut_pkg', e.target.value);
            alert("App Locked! 🔒");
        }
    });
})();
