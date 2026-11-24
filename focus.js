/**
 * ZenHaven - Focus mode (Pomodoro): hides every tool, calms the scene and shows a quiet timer.
 *  focus -> short break -> focus ... (auto-continues). Uses real timestamps so background tabs don't drift.
 */
class ZenFocus {
    constructor({ scenes, setClean, isClean }) {
        this.scenes = scenes;
        this.setClean = setClean;
        this.isClean = isClean;
        this.phase = null;           // 'focus' | 'break' | null
        this.running = false;
        this.cfg = { focus: 25, brk: 5, task: '' };
        this.endAt = 0; this.remain = 0; this.total = 1;
        this.cleanBefore = true;
        this.baseTitle = document.title;
        this.wake = null;
        this.build();
        this.timer = setInterval(() => this.tick(), 250);
        document.addEventListener('visibilitychange', () => { if (this.phase && !document.hidden) this.requestWake(); });
    }

    // ------------------------------------------------------------------ DOM
    build() {
        const modal = document.createElement('div');
        modal.id = 'focus-modal';
        modal.className = 'zen-modal focus-modal';
        modal.innerHTML = `
            <button class="modal-close" data-close>&times;</button>
            <h3 style="margin-bottom:6px;color:#fda4af;">🎯 Chế độ tập trung</h3>
            <p style="font-size:13px;color:#94a3b8;max-width:340px;">Ẩn hết mọi công cụ, cảnh chuyển sang yên tĩnh. Chỉ còn đồng hồ nhỏ để bạn làm việc thật sâu.</p>
            <input id="focus-task" class="focus-input" maxlength="60" placeholder="Bạn sẽ tập trung làm gì? (không bắt buộc)">
            <div class="focus-presets">
                <button class="glass-btn" data-f="25" data-b="5">25 phút<small>nghỉ 5</small></button>
                <button class="glass-btn" data-f="50" data-b="10">50 phút<small>nghỉ 10</small></button>
                <button class="glass-btn" data-f="90" data-b="15">90 phút<small>nghỉ 15</small></button>
            </div>
            <div class="focus-custom">
                <span>Tự chọn:</span>
                <input id="fc-focus" type="number" min="1" max="180" value="30"> phút, nghỉ
                <input id="fc-break" type="number" min="1" max="60" value="5"> phút
                <button id="fc-start" class="glass-btn active">▶ Bắt đầu</button>
            </div>
            <div class="focus-stats" id="focus-stats"></div>
            <div class="focus-tip">Mẹo: nhấn phím <b>F</b> để mở nhanh · rê chuột để xem điều khiển</div>`;
        document.body.appendChild(modal);
        this.modal = modal;

        const hud = document.createElement('div');
        hud.id = 'focus-hud';
        hud.innerHTML = `
            <svg class="fh-ring" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="19"/><circle class="fg" cx="22" cy="22" r="19" transform="rotate(-90 22 22)"/></svg>
            <div class="fh-text"><div class="fh-time">25:00</div><div class="fh-label">Tập trung</div><div class="fh-task"></div></div>
            <div class="fh-btns">
                <button data-a="pause" title="Tạm dừng / tiếp tục">⏸</button>
                <button data-a="skip" title="Bỏ qua giai đoạn này">⏭</button>
                <button data-a="stop" title="Kết thúc">⏹</button>
            </div>`;
        document.body.appendChild(hud);
        this.hud = hud;
        this.elTime = hud.querySelector('.fh-time');
        this.elLabel = hud.querySelector('.fh-label');
        this.elTask = hud.querySelector('.fh-task');
        this.elRing = hud.querySelector('.fg');
        this.C = 2 * Math.PI * 19;
        this.elRing.style.strokeDasharray = this.C;

        const toast = document.createElement('div');
        toast.id = 'focus-toast';
        document.body.appendChild(toast);
        this.toastEl = toast;

        modal.querySelector('[data-close]').addEventListener('click', () => this.closeModal());
        modal.querySelectorAll('.focus-presets button').forEach(b => b.addEventListener('click', () => {
            this.start(+b.dataset.f, +b.dataset.b, document.getElementById('focus-task').value);
        }));
        document.getElementById('fc-start').addEventListener('click', () => {
            const f = Math.max(1, Math.min(180, +document.getElementById('fc-focus').value || 25));
            const b = Math.max(1, Math.min(60, +document.getElementById('fc-break').value || 5));
            this.start(f, b, document.getElementById('focus-task').value);
        });
        hud.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
            const a = b.dataset.a;
            if (a === 'pause') this.togglePause();
            if (a === 'skip') this.nextPhase(true);
            if (a === 'stop') this.stop();
        }));

        // HUD collapses to just the time when the mouse is idle
        let idle = null;
        const wake = () => {
            hud.classList.remove('compact');
            clearTimeout(idle);
            idle = setTimeout(() => { if (this.phase) hud.classList.add('compact'); }, 6000);
        };
        window.addEventListener('pointermove', wake);
        window.addEventListener('pointerdown', wake);
        this.wakeHud = wake;

        window.addEventListener('keydown', (e) => {
            if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            if (e.key === 'f' || e.key === 'F') this.open();
            if (e.key === 'Escape') this.closeModal();
        });
        this.renderStats();
    }

    // ------------------------------------------------------------------ stats (per day, stored on this device)
    dayKey() { const d = new Date(); return 'zen-focus-' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    getStats() { try { return JSON.parse(localStorage.getItem(this.dayKey())) || { s: 0, m: 0 }; } catch (_) { return { s: 0, m: 0 }; } }
    addStats(min) {
        const s = this.getStats(); s.s += 1; s.m += min;
        try { localStorage.setItem(this.dayKey(), JSON.stringify(s)); } catch (_) { /* ignore */ }
        this.renderStats();
    }
    renderStats() {
        const s = this.getStats(), el = document.getElementById('focus-stats');
        if (el) el.textContent = s.s ? `Hôm nay: ${s.s} phiên · ${s.m} phút tập trung 🌱` : 'Hôm nay bạn chưa có phiên nào. Bắt đầu thôi!';
    }

    // ------------------------------------------------------------------ open / close
    open() {
        if (this.phase) { this.wakeHud(); this.toast('Đang trong phiên tập trung. Dùng nút ⏹ để kết thúc.'); return; }
        this.renderStats();
        this.modal.classList.add('active');
        const inp = document.getElementById('focus-task');
        if (inp) setTimeout(() => inp.focus(), 50);
    }
    closeModal() { this.modal.classList.remove('active'); }

    // ------------------------------------------------------------------ session control
    start(focusMin, breakMin, task) {
        this.cfg = { focus: focusMin, brk: breakMin, task: (task || '').trim().slice(0, 60) };
        this.cleanBefore = this.isClean();
        this.closeModal();
        document.body.classList.add('focusing');
        this.setClean(true);
        if (this.scenes.setCalm) this.scenes.setCalm(true);
        if (window.zenAudio) window.zenAudio.init();
        this.hud.classList.add('active');
        this.elTask.textContent = this.cfg.task;
        this.beginPhase('focus');
        this.requestWake();
        this.wakeHud();
    }

    beginPhase(phase) {
        this.phase = phase;
        this.total = (phase === 'focus' ? this.cfg.focus : this.cfg.brk) * 60000;
        this.endAt = Date.now() + this.total;
        this.running = true;
        this.hud.classList.toggle('break', phase === 'break');
        this.elLabel.textContent = phase === 'focus' ? 'Tập trung' : 'Nghỉ ngơi một chút 🌿';
        this.hud.querySelector('[data-a="pause"]').textContent = '⏸';
        this.render();
    }

    togglePause() {
        if (!this.phase) return;
        if (this.running) { this.remain = Math.max(0, this.endAt - Date.now()); this.running = false; this.hud.querySelector('[data-a="pause"]').textContent = '▶'; this.elLabel.textContent = 'Tạm dừng'; }
        else { this.endAt = Date.now() + this.remain; this.running = true; this.hud.querySelector('[data-a="pause"]').textContent = '⏸'; this.elLabel.textContent = this.phase === 'focus' ? 'Tập trung' : 'Nghỉ ngơi một chút 🌿'; }
    }

    nextPhase(skipped) {
        if (this.phase === 'focus') {
            if (!skipped) this.addStats(this.cfg.focus);
            else { const done = Math.round((this.total - Math.max(0, this.endAt - Date.now())) / 60000); if (done >= 5) this.addStats(done); }
            if (!skipped) { this.ring('bowl'); this.toast('Hoàn thành một phiên! Nghỉ ' + this.cfg.brk + ' phút nhé 💗'); }
            this.beginPhase('break');
        } else {
            if (!skipped) { this.ring('chime'); this.toast('Hết giờ nghỉ, mình tiếp tục nhé ✨'); }
            this.beginPhase('focus');
        }
    }

    stop() {
        if (this.phase === 'focus') {
            const done = Math.round((this.total - Math.max(0, (this.running ? this.endAt - Date.now() : this.remain))) / 60000);
            if (done >= 5) this.addStats(done);
        }
        this.phase = null; this.running = false;
        this.hud.classList.remove('active', 'compact', 'break');
        document.body.classList.remove('focusing');
        if (this.scenes.setCalm) this.scenes.setCalm(false);
        this.setClean(this.cleanBefore);
        document.title = this.baseTitle;
        this.releaseWake();
        this.toast('Đã kết thúc. Bạn làm tốt lắm! 🌸');
    }

    ring(kind) {
        const a = window.zenAudio;
        if (!a) return;
        try { a.init(); if (kind === 'bowl') a.playSingingBowl(); else a.playWindChimes(); } catch (_) { /* ignore */ }
    }

    // ------------------------------------------------------------------ per-tick
    tick() {
        if (!this.phase || !this.running) return;
        const left = this.endAt - Date.now();
        if (left <= 0) { this.nextPhase(false); return; }
        this.render(left);
    }

    render(leftMs) {
        const left = leftMs !== undefined ? leftMs : (this.running ? this.endAt - Date.now() : this.remain || this.total);
        const sec = Math.ceil(Math.max(0, left) / 1000);
        const m = Math.floor(sec / 60), s = sec % 60;
        const txt = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        this.elTime.textContent = txt;
        this.elRing.style.strokeDashoffset = this.C * (1 - Math.max(0, Math.min(1, 1 - left / this.total)));
        document.title = (this.phase === 'focus' ? '🎯 ' : '🌿 ') + txt + ' · ' + (this.cfg.task || (this.phase === 'focus' ? 'Tập trung' : 'Nghỉ ngơi'));
    }

    toast(msg) {
        this.toastEl.textContent = msg;
        this.toastEl.classList.add('show');
        clearTimeout(this._tt);
        this._tt = setTimeout(() => this.toastEl.classList.remove('show'), 4200);
    }

    // keep the screen on while focusing
    async requestWake() {
        try { if ('wakeLock' in navigator && !this.wake) { this.wake = await navigator.wakeLock.request('screen'); this.wake.addEventListener('release', () => { this.wake = null; }); } } catch (_) { /* ignore */ }
    }
    releaseWake() { try { if (this.wake) this.wake.release(); } catch (_) { /* ignore */ } this.wake = null; }
}
window.ZenFocus = ZenFocus;
