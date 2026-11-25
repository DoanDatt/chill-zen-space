/**
 * ZenHaven 2.0 Main Application Controller
 * Handles 4 Scene transitions, Ambient Audio Mixer presets, Zen Tools & Interactivity
 */

// Personal settings. The names are fixed; only the dates can be set (love-config.js, ?since=YYYY-MM-DD&bday=MM-DD, or the Settings button).
(function () {
    const p = new URLSearchParams(location.search);
    const ls = (k) => { try { return localStorage.getItem('zen-' + k) || ''; } catch (_) { return ''; } };
    const valid = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '');
    const since = valid(p.get('since')) || valid(ls('since')) || valid(window.LOVE && window.LOVE.since);
    window.ZEN_CONFIG = {
        for: 'Hạnh',
        nick: 'bé Hạnh',      // used in greetings: "Dành tặng bé Hạnh"
        from: 'Đạt',
        since
    };
    try { const v = valid(p.get('since')); if (v) localStorage.setItem('zen-since', v); } catch (_) { /* ignore */ }
})();

document.addEventListener('DOMContentLoaded', () => {
    const canvasContainer = document.getElementById('canvas-container');
    const scenes = new ZenScenes(canvasContainer);
    const tools = new ZenTools(scenes);

    window.__zen = scenes;   // handy for debugging in the browser console
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Scene Switcher Buttons
    document.querySelectorAll('.scene-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const sceneId = btn.dataset.scene;
            scenes.switchScene(sceneId);

            if (window.zenAudio) {
                window.zenAudio.init();
                if (sceneId === 'rain') {
                    window.zenAudio.startRain();
                    window.zenAudio.startFire();
                    window.zenAudio.startLofi();
                    window.zenAudio.stopOcean();
                    window.zenAudio.stopCrickets();
                    window.zenAudio.stopWind();
                    updateSliderUI('rain', 0.6);
                    updateSliderUI('fire', 0.45);
                    updateSliderUI('ocean', 0.0);
                    updateSliderUI('wind', 0.0);
                } else if (sceneId === 'aurora') {
                    window.zenAudio.startWind();
                    window.zenAudio.startCrickets();
                    window.zenAudio.startLofi();
                    window.zenAudio.stopRain();
                    window.zenAudio.stopFire();
                    window.zenAudio.stopOcean();
                    updateSliderUI('wind', 0.4);
                    updateSliderUI('crickets', 0.35);
                    updateSliderUI('rain', 0.0);
                    updateSliderUI('fire', 0.0);
                } else if (sceneId === 'beach') {
                    window.zenAudio.startOcean();
                    window.zenAudio.startFire();
                    window.zenAudio.startLofi();
                    window.zenAudio.stopRain();
                    window.zenAudio.stopCrickets();
                    window.zenAudio.stopWind();
                    updateSliderUI('ocean', 0.65);
                    updateSliderUI('fire', 0.3);
                    updateSliderUI('rain', 0.0);
                } else if (sceneId === 'sakura') {
                    window.zenAudio.startWind();
                    window.zenAudio.startLofi();
                    window.zenAudio.playWindChimes();
                    window.zenAudio.stopRain();
                    window.zenAudio.stopFire();
                    window.zenAudio.stopOcean();
                    window.zenAudio.stopCrickets();
                    updateSliderUI('wind', 0.35);
                    updateSliderUI('rain', 0.0);
                    updateSliderUI('ocean', 0.0);
                    updateSliderUI('fire', 0.0);
                }
            }
        });
    });

    // Sound Mixer Sliders
    const tracks = ['lofi', 'rain', 'fire', 'ocean', 'wind', 'crickets'];
    tracks.forEach(track => {
        const slider = document.getElementById(`slider-${track}`);
        if (slider) {
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                if (window.zenAudio) {
                    window.zenAudio.init();
                    if (val > 0) {
                        if (track === 'lofi') window.zenAudio.startLofi();
                        if (track === 'rain') window.zenAudio.startRain();
                        if (track === 'fire') window.zenAudio.startFire();
                        if (track === 'ocean') window.zenAudio.startOcean();
                        if (track === 'wind') window.zenAudio.startWind();
                        if (track === 'crickets') window.zenAudio.startCrickets();
                    } else {
                        if (track === 'lofi') window.zenAudio.stopLofi();
                        if (track === 'rain') window.zenAudio.stopRain();
                        if (track === 'fire') window.zenAudio.stopFire();
                        if (track === 'ocean') window.zenAudio.stopOcean();
                        if (track === 'wind') window.zenAudio.stopWind();
                        if (track === 'crickets') window.zenAudio.stopCrickets();
                    }
                    window.zenAudio.setTrackVolume(track, val);
                }
            });
        }
    });

    function updateSliderUI(track, val) {
        const slider = document.getElementById(`slider-${track}`);
        if (slider) slider.value = val;
        if (window.zenAudio) window.zenAudio.setTrackVolume(track, val);
    }

    // Master Sound Toggle
    const btnMute = document.getElementById('btn-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            if (window.zenAudio) {
                window.zenAudio.init();
                const isMuted = window.zenAudio.toggleMute();
                btnMute.textContent = isMuted ? '🔇' : '🔊';
                btnMute.classList.toggle('muted', isMuted);
            }
        });
    }

    // Modal Triggers
    const btnOpenThought = document.getElementById('btn-open-thought');
    const thoughtModal = document.getElementById('thought-modal');
    if (btnOpenThought && thoughtModal) {
        btnOpenThought.addEventListener('click', () => {
            thoughtModal.classList.toggle('active');
        });
    }

    const btnOpenLantern = document.getElementById('btn-open-lantern');
    const lanternModal = document.getElementById('lantern-modal');
    if (btnOpenLantern && lanternModal) {
        btnOpenLantern.addEventListener('click', () => {
            lanternModal.classList.toggle('active');
        });
    }

    const btnOpenTimer = document.getElementById('btn-open-timer');
    const timerModal = document.getElementById('timer-modal');
    if (btnOpenTimer && timerModal) {
        btnOpenTimer.addEventListener('click', () => {
            timerModal.classList.toggle('active');
        });
    }

    // Close buttons for all modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.zen-modal');
            if (modal) modal.classList.remove('active');
        });
    });

    // Click in 3D world to pet cat or start audio
    window.addEventListener('pointerdown', (e) => {
        if (e.target.closest('#ui-overlay') || e.target.closest('.zen-modal')) return;

        // Start default audio on first gesture
        if (window.zenAudio) {
            window.zenAudio.init();
            if (!window.zenAudio.tracks.rain.isPlaying && scenes.currentSceneId === 'rain') {
                window.zenAudio.startRain();
                window.zenAudio.startFire();
                window.zenAudio.startLofi();
            }
        }

        // (petting the cat is handled by a real 3D raycast inside scenes.js)
    });

    // Open a specific scene directly via ?scene=rain|aurora|beach|sakura
    const wanted = new URLSearchParams(location.search).get('scene');
    if (wanted) {
        const b = document.querySelector(`.scene-btn[data-scene="${wanted}"]`);
        if (b) b.click();
    }

    // ================= Dedication, clean mode & welcome screen =================
    const CFG = window.ZEN_CONFIG;
    const daysTogether = () => {
        if (!CFG.since) return 0;
        const d = new Date(CFG.since + 'T00:00:00');
        return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
    };
    function applyName() {
        const label = CFG.nick;
        const t1 = document.getElementById('ded-text');
        const t2 = document.getElementById('intro-name');
        if (t1) t1.textContent = 'Dành tặng ' + label + (CFG.since ? '  ·  💞 ' + daysTogether() + ' ngày bên nhau' : '');
        if (t2) t2.textContent = label;
        document.title = 'Dành tặng ' + label + ' 💗';
        const tag = document.querySelector('.logo-tagline');
        if (tag) tag.textContent = '| Dành tặng ' + label + ' 💗';
    }
    applyName();

    document.body.classList.add('intro-open');
    const intro = document.getElementById('intro');
    function enter() {
        if (!intro || intro.classList.contains('hide')) return;
        intro.classList.add('hide');
        document.body.classList.remove('intro-open');
        if (window.zenAudio) {
            window.zenAudio.init();
            const id = scenes.currentSceneId;
            const btn = document.querySelector('.scene-btn[data-scene="' + id + '"]');
            if (btn) btn.click();      // reuse the preset logic for the current scene's sounds
        }
        showNav();
        setTimeout(() => ZLove.celebrate(), 1400);
        // phones: tilt the device to look around (iOS asks for permission here, on a tap)
        if (scenes.enableTilt && window.matchMedia('(pointer: coarse)').matches) scenes.enableTilt();
    }
    document.getElementById('btn-enter').addEventListener('click', enter);
    window.addEventListener('keydown', (e) => { if (e.key === 'Enter' && intro && !intro.classList.contains('hide')) enter(); });

    // clean mode: hide every tool, only the scene + dedication remain
    function setClean(on) {
        document.body.classList.toggle('clean', on);
        const nav = document.getElementById('mini-nav');
        nav.classList.toggle('always', !on);
        showNav();
        if (on) { toggleMenu(false); document.querySelector('.middle-row').classList.remove('show'); }
        else if (!document.body.classList.contains('focusing')) setTimeout(showQuote, 700);
    }
    document.getElementById('btn-toggle-ui').addEventListener('click', () => setClean(!document.body.classList.contains('clean')));
    document.getElementById('btn-hide-ui').addEventListener('click', () => setClean(true));
    function goScene(id) {
        const b = document.querySelector('.scene-btn[data-scene="' + id + '"]');
        if (b) b.click();
    }
    window.addEventListener('keydown', (e) => {
        if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
        if (e.key === 'h' || e.key === 'H') setClean(!document.body.classList.contains('clean'));
        const order = ['rain', 'aurora', 'beach', 'sakura'];
        const i = order.indexOf(scenes.currentSceneId);
        if (e.key === 'ArrowRight' && !(window.__control && window.__control.active)) goScene(order[(i + 1) % 4]);
        if (e.key === 'ArrowLeft' && !(window.__control && window.__control.active)) goScene(order[(i + 3) % 4]);
    });
    document.querySelectorAll('.mini-btn[data-go]').forEach(b => b.addEventListener('click', () => goScene(b.dataset.go)));
    const syncMini = () => {
        const act = document.querySelector('.scene-btn.active');
        document.querySelectorAll('.mini-btn[data-go]').forEach(b => b.classList.toggle('active', !!act && b.dataset.go === act.dataset.scene));
    };
    new MutationObserver(syncMini).observe(document.querySelector('.scene-controls'), { subtree: true, attributes: true, attributeFilter: ['class'] });
    syncMini();

    // mini navigation fades away when idle, wakes up on mouse move / touch
    let navTimer = null;
    function showNav() {
        const nav = document.getElementById('mini-nav');
        nav.classList.remove('idle');
        clearTimeout(navTimer);
        navTimer = setTimeout(() => {
            if (!nav.matches(':hover') && document.body.classList.contains('clean')) nav.classList.add('idle');
        }, 3500);
    }
    window.addEventListener('pointermove', showNav);
    window.addEventListener('pointerdown', showNav);

    // settings: the day you got together and her birthday (names are fixed: Đạt & bé Hạnh)
    document.getElementById('btn-set-name').addEventListener('click', () => {
        const day = prompt('Ngày bắt đầu yêu nhau (định dạng 2024-02-14). Để trống nếu không muốn hiện bộ đếm:', CFG.since);
        if (day === null) return;
        let bd = '';
        try { bd = localStorage.getItem('zen-bday') || ''; } catch (_) { /* ignore */ }
        const bday = prompt('Sinh nhật của bé Hạnh (định dạng tháng-ngày, ví dụ 08-21). Để trống nếu không muốn:', bd);
        if (bday === null) return;
        const u = new URLSearchParams();
        const vals = { since: /^\d{4}-\d{2}-\d{2}$/.test(day.trim()) ? day.trim() : '', bday: /^\d{2}-\d{2}$/.test(bday.trim()) ? bday.trim() : '' };
        Object.keys(vals).forEach(k => {
            try { localStorage.setItem('zen-' + k, vals[k]); } catch (_) { /* ignore */ }
            if (vals[k]) u.set(k, vals[k]);
        });
        location.href = location.origin + location.pathname + (u.toString() ? '?' + u.toString() : '');
    });

    // love letter: a different sweet message every day
    const LINES = ZLove.letterLines();
    let lineIdx = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000) % LINES.length;
    const letterModal = document.getElementById('letter-modal');
    function fillLetter() {
        document.getElementById('letter-to').textContent = 'Gửi ' + CFG.nick + ',';
        document.getElementById('letter-body').textContent = LINES[lineIdx];
        document.getElementById('letter-days').textContent = CFG.since ? 'Đã ' + daysTogether() + ' ngày mình bên nhau, và anh muốn còn thật nhiều ngày nữa. 💞' : '';
        document.getElementById('letter-sign').textContent = '— ' + CFG.from;
    }
    const btnLetter = document.getElementById('btn-letter');
    function toggleLetter() {
        fillLetter();
        letterModal.classList.toggle('active');
        btnLetter.classList.remove('pulse-hint');
    }
    btnLetter.addEventListener('click', toggleLetter);
    document.getElementById('btn-letter-h').addEventListener('click', toggleLetter);
    document.getElementById('btn-letter-next').addEventListener('click', () => {
        lineIdx = (lineIdx + 1) % LINES.length;
        fillLetter();
    });
    setTimeout(() => btnLetter.classList.remove('pulse-hint'), 60000);

    // ---------------- tools menu, mixer, quote toast, weather, gallery ----------------
    const toolsMenu = document.getElementById('tools-menu');
    const btnTools = document.getElementById('btn-tools');
    function placeMenu() {
        if (innerWidth <= 720 || (innerHeight <= 520 && innerWidth > innerHeight)) return;   // phones use the CSS bottom sheet
        const r = btnTools.getBoundingClientRect(), w = toolsMenu.offsetWidth || 310;
        toolsMenu.style.top = (r.bottom + 8) + 'px';
        toolsMenu.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
    }
    function toggleMenu(force) {
        const open = force !== undefined ? force : !toolsMenu.classList.contains('open');
        if (open) placeMenu();
        toolsMenu.classList.toggle('open', open);
        btnTools.classList.toggle('active', open);
    }
    btnTools.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener('pointerdown', (e) => {
        if (toolsMenu.classList.contains('open') && !toolsMenu.contains(e.target) && !btnTools.contains(e.target)) toggleMenu(false);
    });
    toolsMenu.querySelectorAll('button').forEach(b => b.addEventListener('click', () => toggleMenu(false)));
    window.addEventListener('resize', () => toggleMenu(false));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleMenu(false); });

    const btnMixer = document.getElementById('btn-mixer');
    btnMixer.addEventListener('click', () => btnMixer.classList.toggle('active', document.body.classList.toggle('mixer-open')));

    const midRow = document.querySelector('.middle-row');
    let quoteT = null;
    function showQuote() {
        if (document.body.classList.contains('clean')) return;
        tools.drawQuote();
        midRow.classList.add('show');
        clearTimeout(quoteT);
        quoteT = setTimeout(() => midRow.classList.remove('show'), 10000);
    }
    document.getElementById('btn-show-quote').addEventListener('click', () => setTimeout(showQuote, 150));
    document.getElementById('btn-new-quote').addEventListener('click', () => { clearTimeout(quoteT); quoteT = setTimeout(() => midRow.classList.remove('show'), 10000); });

    const weatherLabel = document.getElementById('weather-label');
    function syncWeather() { if (scenes.weatherName && weatherLabel) weatherLabel.textContent = scenes.weatherName(); }
    document.getElementById('btn-weather').addEventListener('click', () => {
        if (!scenes.cycleWeather) return;
        scenes.cycleWeather();
        syncWeather();
        ZLove.toast('🌦️ ' + scenes.weatherName(), 2200);
    });
    scenes.onChange = syncWeather;
    syncWeather();

    document.getElementById('btn-gallery').addEventListener('click', () => ZLove.openGallery());

    // steer one of the two characters
    const control = new ZenControl({ scenes });
    window.__control = control;
    ['btn-control', 'btn-control-mini'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', () => control.toggle()); });

    // focus mode (Pomodoro)
    const focus = new ZenFocus({ scenes, setClean, isClean: () => document.body.classList.contains('clean') });
    window.__focus = focus;
    ['btn-open-focus', 'btn-focus'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', () => focus.open()); });

    // offline + install support
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    }

    // 60 FPS Render Loop
    function animate() {
        requestAnimationFrame(animate);
        scenes.render();
    }

    animate();
});
