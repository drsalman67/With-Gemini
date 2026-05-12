(function () {
    const targetAppName = document.getElementById('target-app-name');
    const selectBtn = document.getElementById('select-app-btn');
    const statusText = document.getElementById('status-text');
    const masterSwitch = document.getElementById('master-switch');

    // Load saved target
    let savedApp = localStorage.getItem('akira_shortcut_pkg') || 'com.whatsapp';
    targetAppName.textContent = savedApp;

    // Boot Sequence Simulation (Neon Effect)
    setTimeout(() => {
        statusText.textContent = 'ONLINE';
        statusText.className = 'online';
        masterSwitch.checked = true;
    }, 800);

    // App Selection Logic
    selectBtn.addEventListener('click', () => {
        let pkg = prompt("Enter App Package ID (e.g., com.whatsapp, com.dts.freefireth, com.zhiliaoapp.musically):", savedApp);
        if(pkg && pkg.trim() !== "") {
            localStorage.setItem('akira_shortcut_pkg', pkg.trim());
            targetAppName.textContent = pkg.trim();
            alert("Target Locked 🔒! Float button [+] will now launch this app.");
        }
    });

    // Master Switch Logic
    masterSwitch.addEventListener('change', (e) => {
        if(!e.target.checked) {
            alert("Warning: To completely kill the overlay, force stop the app from Android Settings.");
            statusText.textContent = 'OFFLINE';
            statusText.className = 'offline';
        } else {
            statusText.textContent = 'ONLINE';
            statusText.className = 'online';
        }
    });
})();
