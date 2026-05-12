(function () {
    const bridge = window.NativeBridge;
    
    // UI Elements
    const masterSwitch = document.getElementById('master-switch');
    const sizeSlider = document.getElementById('btn-size');
    const sizeVal = document.getElementById('size-val');
    const batteryAura = document.getElementById('battery-aura');
    const chargingFx = document.getElementById('charging-fx');
    const notifPulse = document.getElementById('notif-pulse');
    const appSelector = document.getElementById('app-selector');

    // Load Settings Helper
    function loadSetting(key, defaultVal, element, isCheckbox) {
        let val = defaultVal;
        if (bridge) val = bridge.getSetting(key, defaultVal);
        if (isCheckbox) {
            element.checked = (val === 'true');
        } else {
            element.value = val;
        }
    }

    // Save Settings Helper
    function saveSetting(key, value) {
        if (bridge) bridge.saveSetting(key, value.toString());
    }

    // Initialize all settings
    loadSetting('master_switch', 'true', masterSwitch, true);
    loadSetting('btn_size', '60', sizeSlider, false);
    sizeVal.innerText = sizeSlider.value;
    loadSetting('battery_aura', 'true', batteryAura, true);
    loadSetting('charging_fx', 'true', chargingFx, true);
    loadSetting('notif_pulse', 'true', notifPulse, true);

    // Fetch Installed Apps (The Real Deal)
    if (bridge) {
        try {
            let appsStr = bridge.getApps();
            let appsList = JSON.parse(appsStr);
            
            // Sort alphabetically
            appsList.sort((a, b) => a.name.localeCompare(b.name));
            
            appSelector.innerHTML = '<option value="">-- Select an App --</option>';
            appsList.forEach(app => {
                let opt = document.createElement('option');
                opt.value = app.pkg;
                opt.textContent = app.name;
                appSelector.appendChild(opt);
            });

            // Set previously saved app
            let savedPkg = bridge.getSetting('shortcut_pkg', '');
            if (savedPkg) appSelector.value = savedPkg;

        } catch (e) {
            appSelector.innerHTML = '<option value="">Error loading apps</option>';
        }
    }

    // Event Listeners for Saving
    masterSwitch.addEventListener('change', (e) => {
        saveSetting('master_switch', e.target.checked);
        if(!e.target.checked && bridge) {
            alert("Overlay Power Disabled. It will stay off on next launch. Closing current overlay...");
            bridge.closeOverlay();
        }
    });

    sizeSlider.addEventListener('input', (e) => {
        sizeVal.innerText = e.target.value;
        saveSetting('btn_size', e.target.value);
    });

    batteryAura.addEventListener('change', (e) => saveSetting('battery_aura', e.target.checked));
    chargingFx.addEventListener('change', (e) => saveSetting('charging_fx', e.target.checked));
    notifPulse.addEventListener('change', (e) => saveSetting('notif_pulse', e.target.checked));
    
    appSelector.addEventListener('change', (e) => {
        if(e.target.value) {
            saveSetting('shortcut_pkg', e.target.value);
            alert("App Locked! Float [+] button will now launch this app.");
        }
    });

})();
