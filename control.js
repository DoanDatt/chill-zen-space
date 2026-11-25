/**
 * ZenHaven - steer ONE of the two characters (Đạt or Hạnh) yourself.
 *  - choose who in the little panel (🎮); the other one stays and watches you
 *  - keyboard: W A S D / arrow keys (hold Shift to run) - movement is relative to the camera
 *  - touch: on-screen stick; tap the ground to walk there (works with the mouse too)
 *  - Esc / ⏹ stops: the character walks back and sits down next to the other one
 */
class ZenControl {
    constructor({ scenes }) {
        this.scenes = scenes;
        this.who = null;                 // 'him' | 'her' | null
        this.keys = {};
        this.joy = { x: 0, y: 0 };
        this.lastWorld = null;
        this.build();
        scenes.onFrame = (dt) => this.tick(dt);
    }

    get active() { return this.who !== null; }

    // ------------------------------------------------------------------ DOM
    build() {
        const panel = document.createElement('div');
        panel.id = 'ctrl-panel';
        panel.innerHTML = `
            <div class="cp-head"><span class="cp-title">🎮 Điều khiển nhân vật</span><button class="cp-x" data-act="close" aria-label="Đóng">&times;</button></div>
            <div class="cp-pick">
                <div class="cp-ask">Bạn muốn điều khiển ai? <small>(chỉ một người, người kia ngồi chờ)</small></div>
                <div class="cp-row">
                    <button data-who="him">👦 Đạt</button>
                    <button data-who="her">👧 Hạnh</button>
                </div>
            </div>
            <div class="cp-driving">
                <div class="cp-now"></div>
                <div class="cp-row">
                    <button data-act="swap">🔁 Đổi người</button>
                    <button data-act="stop">⏹ Dừng</button>
                </div>
            </div>
            <div class="cp-hint"></div>`;
        document.body.appendChild(panel);
        this.panel = panel;
        this.hint = panel.querySelector('.cp-hint');
        this.now = panel.querySelector('.cp-now');

        panel.querySelectorAll('[data-who]').forEach(b => b.addEventListener('click', () => this.start(b.dataset.who)));
        panel.querySelector('[data-act="close"]').addEventListener('click', () => this.hidePanel());
        panel.querySelector('[data-act="stop"]').addEventListener('click', () => this.stop());
        panel.querySelector('[data-act="swap"]').addEventListener('click', () => this.start(this.who === 'him' ? 'her' : 'him'));

        // while steering the panel gets out of the way: only this small stop button stays
        const chip = document.createElement('button');
        chip.id = 'ctrl-chip';
        chip.title = 'Dừng điều khiển (Esc)';
        chip.setAttribute('aria-label', 'Dừng điều khiển');
        chip.textContent = '⏹';
        chip.addEventListener('click', () => this.stop());
        document.body.appendChild(chip);

        // on-screen stick (phones)
        const stick = document.createElement('div');
        stick.id = 'ctrl-stick';
        stick.innerHTML = '<div class="knob"></div>';
        document.body.appendChild(stick);
        const knob = stick.querySelector('.knob');
        let id = null;
        const move = (e) => {
            const r = stick.getBoundingClientRect(), R = r.width / 2;
            let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
            const m = Math.hypot(dx, dy);
            if (m > R * 0.8) { dx = dx / m * R * 0.8; dy = dy / m * R * 0.8; }
            knob.style.transform = `translate(${dx}px, ${dy}px)`;
            this.joy.x = dx / (R * 0.8); this.joy.y = dy / (R * 0.8);
        };
        stick.addEventListener('pointerdown', (e) => { id = e.pointerId; stick.setPointerCapture(id); move(e); e.preventDefault(); });
        stick.addEventListener('pointermove', (e) => { if (e.pointerId === id) move(e); });
        const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; this.joy.x = 0; this.joy.y = 0; };
        stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);

        // keyboard
        const dirKey = (k) => ({ w: 'up', arrowup: 'up', s: 'down', arrowdown: 'down', a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right' }[k]);
        window.addEventListener('keydown', (e) => {
            if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
            const k = e.key.toLowerCase();
            if (this.who) {
                const d = dirKey(k);
                if (d) { this.keys[d] = true; e.preventDefault(); }
                if (k === 'shift') this.keys.run = true;
                if (k === 'escape') this.stop();
            }
        });
        window.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase(), d = dirKey(k);
            if (d) this.keys[d] = false;
            if (k === 'shift') this.keys.run = false;
        });
        window.addEventListener('blur', () => { this.keys = {}; });
        this.refresh();
    }

    // ------------------------------------------------------------------ UI actions
    toggle() {                                     // the 🎮 button: show / hide the panel (steering keeps going)
        if (this.panel.classList.contains('open')) this.hidePanel();
        else { this.panel.classList.add('open'); this.refresh(); }
    }
    hidePanel() { this.panel.classList.remove('open'); this.refresh(); }
    start(who) {
        const c = this.scenes.coupleNow();
        if (!c) return;
        const first = this.who === null;
        this.who = who;
        c.setPlayer(who);
        this.panel.classList.remove('open');           // get out of the way right away
        this.refresh();
        if (window.ZLove) {
            const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            ZLove.toast((who === 'him' ? '👦 Đạt' : '👧 Hạnh') + (touch ? ': kéo cần điều khiển hoặc chạm vào mặt đất' : ': W A S D / mũi tên để đi · Shift để chạy · Esc để dừng'), first ? 5000 : 2500);
        }
    }
    stop() {
        const c = this.scenes.coupleNow();
        if (c) c.setPlayer(null);
        this.who = null;
        this.keys = {}; this.joy.x = 0; this.joy.y = 0;
        this.refresh();
    }
    refresh() {
        const driving = this.who !== null;
        this.panel.classList.toggle('driving', driving);
        document.body.classList.toggle('driving', driving);
        this.panel.querySelectorAll('[data-who]').forEach(b => b.classList.toggle('on', b.dataset.who === this.who));
        this.now.textContent = driving ? `Đang điều khiển ${this.who === 'him' ? 'Đạt 👦' : 'Hạnh 👧'}` : '';
        const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        this.hint.textContent = driving
            ? (touch ? 'Kéo cần điều khiển để đi · hoặc chạm vào mặt đất để đi tới đó' : 'W A S D hoặc mũi tên để đi · giữ Shift để chạy · bấm vào mặt đất để đi tới đó · Esc để dừng')
            : '';
    }

    // ------------------------------------------------------------------ every frame
    tick(dt) {
        const sc = this.scenes, c = sc.coupleNow();
        if (sc.world !== this.lastWorld) {                 // the scene changed: carry the choice over
            this.lastWorld = sc.world;
            if (this.who && c) c.setPlayer(this.who);
        }
        if (!this.who || !c) return;
        const mode = c.playerMode();
        if (mode !== 'free') {                              // ended by the app (e.g. focus mode) -> walking back
            if (mode === 'return' || mode === 'seating' || mode === null) { this.who = null; this.keys = {}; this.joy.x = this.joy.y = 0; this.refresh(); }
            return;
        }
        let ix = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0) + this.joy.x;
        let iz = (this.keys.up ? 1 : 0) - (this.keys.down ? 1 : 0) - this.joy.y;
        const m = Math.hypot(ix, iz);
        if (m > 1) { ix /= m; iz /= m; }
        if (m < 0.08) { c.setMove(0, 0, false); return; }
        // relative to the camera: "up" walks away from the viewer
        const cam = sc.camera, t = sc.camT || sc.world.cfg.target;
        let fx = t.x - cam.position.x, fz = t.z - cam.position.z;
        const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
        const rx = -fz, rz = fx;
        c.setMove(fx * iz + rx * ix, fz * iz + rz * ix, !!this.keys.run);
    }
}
window.ZenControl = ZenControl;
