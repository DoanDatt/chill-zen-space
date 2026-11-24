/**
 * ZenHaven - the "love" layer: custom letters, special-day celebrations (fireworks) and the photo gallery.
 * Content comes from love-config.js; names/dates come from window.ZEN_CONFIG (see app.js).
 */
const ZLove = (() => {
    const L = window.LOVE || {};
    const cfg = () => window.ZEN_CONFIG || { for: 'em', from: '', since: '' };
    const DEFAULT_LETTERS = ['Có em, những ngày mưa cũng trở nên ấm áp.', 'Cảm ơn em vì đã xuất hiện trong cuộc đời anh.'];
    const photos = (L.photos || []).filter(p => p && p.src);
    const pad = (n) => (n < 10 ? '0' : '') + n;
    const fill = (s, v) => (s || '').replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
    const letterLines = () => (L.letters && L.letters.length ? L.letters : DEFAULT_LETTERS);

    // ------------------------------------------------------------------ toast
    let toastEl = null, toastT = null;
    function toast(msg, ms = 3200) {
        if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'love-toast'; document.body.appendChild(toastEl); }
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        clearTimeout(toastT);
        toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
    }

    // ------------------------------------------------------------------ photo gallery / lightbox
    let box = null, idx = 0, touchX = 0;
    function buildBox() {
        box = document.createElement('div');
        box.id = 'photo-box';
        box.innerHTML = `
            <button class="pb-close" aria-label="Đóng">&times;</button>
            <button class="pb-nav pb-prev" aria-label="Ảnh trước">&#8249;</button>
            <figure><img alt=""><figcaption></figcaption></figure>
            <button class="pb-nav pb-next" aria-label="Ảnh sau">&#8250;</button>
            <div class="pb-count"></div>`;
        document.body.appendChild(box);
        box.addEventListener('click', (e) => { if (e.target === box) close(); });
        box.querySelector('.pb-close').addEventListener('click', close);
        box.querySelector('.pb-prev').addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
        box.querySelector('.pb-next').addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
        box.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
        box.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchX;
            if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        }, { passive: true });
        window.addEventListener('keydown', (e) => {
            if (!box.classList.contains('open')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') show(idx + 1);
            if (e.key === 'ArrowLeft') show(idx - 1);
        });
    }
    function show(i) {
        if (!photos.length) return;
        idx = (i + photos.length) % photos.length;
        const p = photos[idx];
        const img = box.querySelector('img');
        img.classList.remove('in');
        img.onload = () => img.classList.add('in');
        img.src = p.src;
        box.querySelector('figcaption').textContent = p.caption || '';
        box.querySelector('.pb-count').textContent = (idx + 1) + ' / ' + photos.length;
        box.classList.toggle('single', photos.length < 2);
    }
    function openPhoto(i) {
        if (!photos.length) return;
        if (!box) buildBox();
        show(i || 0);
        box.classList.add('open');
    }
    function close() { if (box) box.classList.remove('open'); }
    const openGallery = () => openPhoto(0);

    // ------------------------------------------------------------------ special days
    function dateParts(s) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; }
    function daysSince() {
        const s = dateParts(cfg().since); if (!s) return 0;
        const a = new Date(s.y, s.m - 1, s.d), now = new Date();
        const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((b - a) / 86400000);
    }

    function todaysEvents(force) {
        const c = cfg(), now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
        const md = pad(m) + '-' + pad(d);
        const vars = { name: c.for === 'em' ? 'em' : c.for, from: c.from || 'anh' };
        const msg = (k, n) => { const t = (L.messages || {})[k] || {}; return { title: fill(t.title, Object.assign({ n }, vars)), text: fill(t.text, Object.assign({ n }, vars)) }; };
        const ev = [];
        const s = dateParts(c.since);
        if (s) {
            const lastDay = new Date(y, m, 0).getDate();
            const sameDay = d === s.d || (s.d > lastDay && d === lastDay);
            if (m === s.m && sameDay && y > s.y) ev.push(Object.assign({ kind: 'anniversary', emoji: '🥂', key: 'anv' }, msg('anniversary', y - s.y)));
            else if (sameDay) {
                const months = (y - s.y) * 12 + (m - s.m);
                if (months > 0) ev.push(Object.assign({ kind: 'month', emoji: '💞', key: 'mon', small: true }, msg('month', months)));
            }
            const days = daysSince();
            if ((L.milestoneDays || []).includes(days)) ev.push(Object.assign({ kind: 'milestone', emoji: '🏆', key: 'ms' + days }, msg('milestone', days)));
        }
        const bd = (new URLSearchParams(location.search).get('bday') || L.birthday || '').trim();
        if (bd && bd === md) ev.push(Object.assign({ kind: 'birthday', emoji: '🎂', key: 'bd' }, msg('birthday', 0)));
        (L.specialDates || []).forEach((e, i) => {
            if (e && e.date === md) ev.push({ kind: 'special', emoji: e.emoji || '🎉', key: 'sp' + i, title: fill(e.title || 'Hôm nay là ngày đặc biệt', vars), text: fill(e.message || '', vars) });
        });
        // ?celebrate=anniversary|milestone|birthday|month|special previews a celebration on any day
        if (force) {
            const demo = {
                anniversary: Object.assign({ kind: 'anniversary', emoji: '🥂', key: 'demo' }, msg('anniversary', 2)),
                milestone: Object.assign({ kind: 'milestone', emoji: '🏆', key: 'demo' }, msg('milestone', 1000)),
                birthday: Object.assign({ kind: 'birthday', emoji: '🎂', key: 'demo' }, msg('birthday', 0)),
                month: Object.assign({ kind: 'month', emoji: '💞', key: 'demo', small: true }, msg('month', 7)),
                special: { kind: 'special', emoji: '🎉', key: 'demo', title: 'Hôm nay là ngày đặc biệt', text: 'Chỉ cần có em là mỗi ngày đều đặc biệt.' }
            };
            return [demo[force] || demo.anniversary];
        }
        return ev;
    }

    // ------------------------------------------------------------------ fireworks (2D canvas overlay)
    function fireworks(ms) {
        const cv = document.createElement('canvas');
        cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:88;pointer-events:none;';
        document.body.appendChild(cv);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const resize = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
        resize(); window.addEventListener('resize', resize);
        const g = cv.getContext('2d');
        const parts = [];
        const colors = [330, 345, 20, 45, 280, 200];
        function burst(x, y, hue, heart) {
            const n = heart ? 96 : 64;
            for (let i = 0; i < n; i++) {
                let vx, vy;
                if (heart) {
                    const t = (i / n) * Math.PI * 2;
                    vx = 16 * Math.pow(Math.sin(t), 3) * 0.2; vy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.2;
                } else {
                    const a = Math.random() * Math.PI * 2, sp = 1.2 + Math.random() * 3.6;
                    vx = Math.cos(a) * sp; vy = Math.sin(a) * sp;
                }
                parts.push({ x, y, vx, vy, life: 1, dec: 0.008 + Math.random() * 0.01, hue: hue + (Math.random() * 24 - 12), heart });
            }
        }
        const start = performance.now();
        let next = 0, raf = 0;
        function frame(now) {
            const t = now - start;
            g.globalCompositeOperation = 'destination-out';
            g.fillStyle = 'rgba(0,0,0,0.16)';
            g.fillRect(0, 0, cv.width, cv.height);
            g.globalCompositeOperation = 'lighter';
            if (t < ms && now > next) {
                const heart = Math.random() < 0.38;
                burst(innerWidth * (0.15 + Math.random() * 0.7), innerHeight * (0.15 + Math.random() * 0.4), colors[Math.floor(Math.random() * colors.length)], heart);
                next = now + 380 + Math.random() * 520;
            }
            for (let i = parts.length - 1; i >= 0; i--) {
                const p = parts[i];
                p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.vx *= 0.985; p.vy *= 0.985; p.life -= p.dec;
                if (p.life <= 0) { parts.splice(i, 1); continue; }
                g.fillStyle = `hsla(${p.hue},100%,${p.heart ? 70 : 62}%,${p.life})`;
                g.beginPath(); g.arc(p.x * dpr, p.y * dpr, (p.heart ? 2.2 : 1.8) * dpr * (0.6 + p.life * 0.5), 0, 6.283); g.fill();
            }
            if (t < ms + 3500 || parts.length) raf = requestAnimationFrame(frame);
            else { window.removeEventListener('resize', resize); cv.remove(); }
        }
        raf = requestAnimationFrame(frame);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); cv.remove(); };
    }

    function celebrate() {
        const force = new URLSearchParams(location.search).get('celebrate');
        const list = todaysEvents(force);
        if (!list.length) return;
        const day = new Date().toDateString();
        const fresh = list.filter(e => { try { return force || localStorage.getItem('zen-cel-' + e.key) !== day; } catch (_) { return true; } });
        if (!fresh.length) return;
        fresh.forEach(e => { try { localStorage.setItem('zen-cel-' + e.key, day); } catch (_) { /* ignore */ } });
        const big = fresh.find(e => !e.small);
        const smalls = fresh.filter(e => e.small);
        if (smalls.length && !big) { toast(smalls[0].emoji + ' ' + smalls[0].title, 7000); return; }
        const e = big;
        const wrap = document.createElement('div');
        wrap.id = 'celebrate';
        const extra = smalls.map(s => s.title).join(' · ');
        wrap.innerHTML = `<div class="cel-card"><div class="cel-emoji">${e.emoji}</div><h2></h2><p></p><div class="cel-extra"></div><button class="cel-btn">💗 Em cảm ơn anh</button></div>`;
        wrap.querySelector('h2').textContent = e.title;
        wrap.querySelector('p').textContent = e.text;
        wrap.querySelector('.cel-extra').textContent = extra;
        document.body.appendChild(wrap);
        requestAnimationFrame(() => wrap.classList.add('show'));
        const stop = fireworks(11000);
        if (window.zenAudio) { try { window.zenAudio.init(); window.zenAudio.playSingingBowl(); setTimeout(() => window.zenAudio.playWindChimes(), 1500); } catch (_) { /* ignore */ } }
        wrap.querySelector('.cel-btn').addEventListener('click', () => { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 700); });
        setTimeout(() => { if (wrap.isConnected) { wrap.classList.remove('show'); setTimeout(() => wrap.remove(), 700); } }, 20000);
        void stop;
    }

    // hide the gallery shortcut when there are no photos yet
    document.addEventListener('DOMContentLoaded', () => { document.body.classList.toggle('no-photos', !photos.length); });

    return { letterLines, photos, openPhoto, openGallery, toast, celebrate, daysSince, todaysEvents };
})();
window.ZLove = ZLove;
