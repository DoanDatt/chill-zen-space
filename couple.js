/**
 * A cute low-poly couple (procedural, no external models) that lives its own life:
 * they sit together, then stand up, walk hand in hand around the scene, stop to look at things, and come back to sit.
 *
 *   const couple = ZCouple.makeCouple({ outfit: 'cozy'|'winter'|'summer'|'spring', ground: false, blanket: false });
 *   scene.add(couple.mesh);
 *   couple.setSeat({ pos: Vector3 (hips while seated, world), yaw, scale });
 *   couple.setWander({ groundY(x,z), area:{x0,x1,z0,z1}, isBlocked(x,z), via:[[x,z]...], specials:[{x,z,face:[x,z],pause,hearts}], sitMin, sitMax, freeRadius });
 *   couple.update(dt, t);   couple.react();   couple.setActive(bool);
 *   // steer ONE of them yourself (the other stays and watches):
 *   couple.setPlayer('him'|'her'|null);  couple.setMove(x, z, run);  couple.moveTo(x, z);  couple.playerPos();
 */
const ZCouple = (() => {
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const std = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const smooth01 = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const wrapPi = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
    const rnd = (a, b) => a + Math.random() * (b - a);

    const L1 = 0.36, L2 = 0.34, A1 = 0.26, A2 = 0.24;     // thigh, shin, upper arm, forearm
    const STAND_H = 0.785;                                 // hips -> sole when standing

    function ball(parent, p, r, mat, sx = 1, sy = 1, sz = 1) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat);
        m.position.set(p[0], p[1], p[2]); m.scale.set(sx, sy, sz); m.castShadow = true;
        parent.add(m); return m;
    }
    function bone(parent, a, b, r0, r1, mat) {
        const A = V(a[0], a[1], a[2]), B = V(b[0], b[1], b[2]);
        const d = B.clone().sub(A), len = d.length();
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 9), mat);
        m.position.copy(A).addScaledVector(d, 0.5);
        m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
        m.castShadow = true; parent.add(m); return m;
    }
    // an arm or a leg: two segments hanging down from a joint (rotate j1 / j2 to pose it)
    function limb(parent, pos, l1, l2, r, mat1, mat2) {
        const j1 = new THREE.Group(); j1.position.set(pos[0], pos[1], pos[2]); parent.add(j1);
        const s1 = new THREE.Mesh(new THREE.CylinderGeometry(r[0], r[1], l1, 9), mat1); s1.position.y = -l1 / 2; s1.castShadow = true; j1.add(s1);
        ball(j1, [0, 0, 0], r[0] * 1.02, mat1);
        const j2 = new THREE.Group(); j2.position.y = -l1; j1.add(j2);
        const s2 = new THREE.Mesh(new THREE.CylinderGeometry(r[2], r[3], l2, 9), mat2); s2.position.y = -l2 / 2; s2.castShadow = true; j2.add(s2);
        ball(j2, [0, 0, 0], r[2] * 1.02, mat2);
        return { j1, j2 };
    }

    const OUTFITS = {
        cozy: {
            him: { skin: 0xf0c8a4, hair: 0x2a211e, top: 0x3a5683, bottom: 0x2b2e3b },
            her: { skin: 0xf6d4ba, hair: 0x4b2f22, top: 0xf2e2cf, bottom: 0x7a4f60, longHair: true }
        },
        winter: {
            him: { skin: 0xf0c8a4, hair: 0x2a211e, top: 0xc9443b, bottom: 0x2b2e3b, hat: 0x33425e, pom: 0xe9dcc0, scarf: 0xe9d9b2 },
            her: { skin: 0xf6d4ba, hair: 0x4b2f22, top: 0x2f909c, bottom: 0x38404a, longHair: true, hat: 0xf3b8cb, pom: 0xffffff, scarf: 0xffffff }
        },
        summer: {
            him: { skin: 0xe8b88e, hair: 0x2a211e, top: 0xf6f1e6, bottom: 0xd7b88a },
            her: { skin: 0xf3c9a6, hair: 0x3a2418, top: 0xff8b7b, bottom: 0xff8b7b, dress: true, longHair: true }
        },
        spring: {
            him: { skin: 0xf0c8a4, hair: 0x2a211e, top: 0x78899b, bottom: 0x3e404c },
            her: { skin: 0xf6d4ba, hair: 0x2f1d16, top: 0xffc5d8, bottom: 0xffc5d8, dress: true, longHair: true, flower: true }
        }
    };

    function person(o) {
        const g = new THREE.Group(), upper = new THREE.Group();
        g.add(upper);
        const mSkin = std(o.skin, 0.7), mTop = std(o.top, 0.9), mBot = std(o.bottom, 0.9);
        const mHair = std(o.hair, 0.55), mShoe = std(o.shoe || 0x3a2f2c, 0.8);
        const dark = new THREE.MeshBasicMaterial({ color: 0x2a1c18 });

        ball(g, [0, 0, 0.02], 0.2, o.dress ? mTop : mBot, 1, 0.62, 0.95);                  // pelvis
        const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.5, 12), mTop);
        torso.position.y = 0.26; torso.castShadow = true; upper.add(torso);
        ball(upper, [0, 0.5, 0], 0.2, mTop, 1, 0.5, 0.8);                                  // shoulders
        bone(upper, [0, 0.52, 0], [0, 0.7, 0], 0.065, 0.06, mSkin);                          // neck

        const head = new THREE.Group(); head.position.set(0, 0.86, 0); upper.add(head);
        ball(head, [0, 0, 0], 0.2, mSkin, 1, 1.02, 0.97);
        [-1, 1].forEach(s => {
            ball(head, [s * 0.075, 0, 0.178], 0.024, dark, 1, 1.3, 0.6);                      // eyes
            const ch = ball(head, [s * 0.115, -0.05, 0.158], 0.035, std(0xff9fb0, 1), 1, 0.7, 0.4);
            ch.material.transparent = true; ch.material.opacity = 0.55;                       // blush
        });
        const smile = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI), dark);
        smile.rotation.z = Math.PI; smile.position.set(0, -0.065, 0.19); head.add(smile);

        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), mHair);
        cap.position.set(0, 0.02, -0.015); cap.rotation.x = -0.3; cap.castShadow = true; head.add(cap);
        if (o.longHair) {
            ball(head, [0, -0.2, -0.13], 0.17, mHair, 1.05, 1.7, 0.65);
            [-1, 1].forEach(s => ball(head, [s * 0.17, -0.12, 0.0], 0.1, mHair, 0.3, 1.1, 0.45));
        } else {
            ball(head, [0, 0.13, 0.15], 0.1, mHair, 1.7, 0.45, 0.6);
        }
        if (o.hat) {
            const hm = std(o.hat, 0.95);
            const hat = new THREE.Mesh(new THREE.SphereGeometry(0.238, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.53), hm);
            hat.position.set(0, 0.04, -0.005); hat.rotation.x = -0.12; hat.castShadow = true; head.add(hat);
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.226, 0.035, 8, 20), hm);
            cuff.rotation.x = Math.PI / 2 - 0.12; cuff.position.set(0, 0.02, -0.005); head.add(cuff);
            ball(head, [0, 0.28, -0.035], 0.058, std(o.pom || 0xffffff, 1));
        }
        if (o.flower) {
            ball(head, [0.15, 0.13, 0.1], 0.05, std(0xffb3cf, 0.8));
            ball(head, [0.17, 0.14, 0.14], 0.02, std(0xffe08a, 0.8));
        }
        if (o.scarf) {
            const sm = std(o.scarf, 0.95);
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 8, 18), sm);
            ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.62, 0.01); upper.add(ring);
            bone(upper, [0.1, 0.6, 0.12], [0.14, 0.34, 0.2], 0.045, 0.04, sm);
        }

        // jointed arms (index 0 = left x<0, 1 = right x>0) and legs
        const arms = [-1, 1].map(s => {
            const a = limb(upper, [s * 0.2, 0.48, 0], A1, A2, [0.062, 0.055, 0.055, 0.045], mTop, mTop);
            ball(a.j2, [0, -A2, 0], 0.052, mSkin);
            return a;
        });
        const legs = [-1, 1].map(s => {
            const l = limb(g, [s * 0.1, 0, 0.02], L1, L2, [0.088, 0.075, 0.07, 0.06], o.dress ? mTop : mBot, o.dress ? mSkin : mBot);
            ball(l.j2, [0, -L2 - 0.03, 0.05], 0.075, mShoe, 1, 0.7, 1.6);
            return l;
        });
        // skirt follows the legs: hangs when standing, drapes over the lap when sitting
        let skirt = null;
        if (o.dress) {
            skirt = new THREE.Group(); skirt.position.set(0, 0.02, 0.02); g.add(skirt);
            const sm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.31, 0.36, 18, 1, true), new THREE.MeshStandardMaterial({ color: o.top, roughness: 0.9, side: THREE.DoubleSide }));
            sm.position.y = -0.17; sm.castShadow = true; skirt.add(sm);
        }
        return { g, upper, head, arms, legs, skirt };
    }

    function plaidTexture(a, b) {
        return ZU.canvasTex(128, 128, (c, w, h) => {
            c.fillStyle = a; c.fillRect(0, 0, w, h);
            c.fillStyle = 'rgba(0,0,0,0.35)';
            for (let i = 0; i < 4; i++) { c.fillRect(i * 32 + 6, 0, 12, h); c.fillRect(0, i * 32 + 6, w, 12); }
            c.fillStyle = b;
            for (let i = 0; i < 4; i++) { c.fillRect(i * 32 + 22, 0, 3, h); c.fillRect(0, i * 32 + 22, w, 3); }
        });
    }

    // arm poses: [shoulder rx, shoulder rz, elbow rx, elbow rz]  (s = -1 left, +1 right; rx<0 = forward, rz = sideways)
    const ARM = {
        lap: (s) => [-0.45, -s * 0.2, -0.85, 0],
        ground: (s) => [-0.7, -s * 0.15, -0.65, 0],
        around: (s) => [0.35, s * 1.17, 0, s * 1.1],
        hold: (s) => [-0.3, s * 0.06, -0.45, 0],
        rest: (s) => [-0.05, s * 0.08, -0.12, 0]
    };

    function makeCouple(opts = {}) {
        const { ground = false, outfit = 'cozy', blanket = false } = opts;
        const P = OUTFITS[outfit] || OUTFITS.cozy;
        const people = [person(Object.assign({}, P.him)), person(Object.assign({}, P.her))];   // 0 = him (Đạt), 1 = her (Hạnh)
        const OFF = [-0.25, 0.25];
        people[0].g.position.x = OFF[0]; people[1].g.position.x = OFF[1];

        const root = new THREE.Group();
        root.add(people[0].g, people[1].g);

        let lap = null;
        if (blanket) {
            lap = new THREE.Group();
            const bm = new THREE.MeshStandardMaterial({ map: plaidTexture('#c0553b', 'rgba(255,230,190,.55)'), roughness: 1 });
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.62), bm); top.position.set(0, 0.1, 0.22); top.castShadow = true; lap.add(top);
            const drape = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.06), bm); drape.position.set(0, -0.06, 0.53); drape.rotation.x = 0.1; lap.add(drape);
            root.add(lap);
        }

        // floating hearts
        const hearts = [];
        for (let i = 0; i < 4; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZU.heartTex(), transparent: true, opacity: 0, depthWrite: false, fog: false }));
            s.scale.set(0.3, 0.3, 1); root.add(s);
            hearts.push({ s, t: -1, dx: 0 });
        }
        const spawn = (n) => { let k = 0; hearts.forEach(h => { if (h.t < 0 && k < n) { h.t = 0; h.dx = (Math.random() - 0.5) * 0.4; k++; } }); };

        // ------------------------------------------------------------ the couple's own life
        const seat = { pos: V(0, 0, 0), yaw: 0, scale: 1 };
        const W = { groundY: () => 0, area: { x0: -3, x1: 3, z0: -3, z1: 3 }, isBlocked: () => false, playBlocked: null, via: [], specials: [], sitMin: 22, sitMax: 40, freeRadius: 0, speed: 0.85 };
        let state = 'sit', stateT = 0, sitTimer = rnd(9, 15), active = true;
        let path = [], wi = 0, ph = 0, yaw = 0, pauseT = 0, faceYaw = 0;
        let sitFrom = null, yawFrom = 0, lapK = 1, happy = 0, nextHeart = 3;
        const px = { x: 0, z: 0 };
        let player = null;       // the one character the visitor is steering (null = nobody)

        const freeR = () => (W.freeRadius || 2.8 * seat.scale);
        const blockedAt = (x, z) => (Math.hypot(x - seat.pos.x, z - seat.pos.z) < freeR() ? false : W.isBlocked(x, z));
        const playBlockedAt = (x, z) => (W.playBlocked ? W.playBlocked(x, z) : W.isBlocked(x, z));
        const clearSeg = (a, b, fn) => {
            const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / 0.25));
            for (let i = 0; i <= n; i++) { const u = i / n; if (fn(a.x + (b.x - a.x) * u, a.z + (b.z - a.z) * u)) return false; }
            return true;
        };
        // shortest walkable route between two points, using the scene's "via" points around obstacles (tiny Dijkstra)
        function route(a, b, fn = blockedAt) {
            const nodes = [a, b].concat(W.via.map(v => ({ x: v[0], z: v[1] })).filter(v => !fn(v.x, v.z)));
            const n = nodes.length, dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
            dist[0] = 0;
            for (let it = 0; it < n; it++) {
                let u = -1; for (let i = 0; i < n; i++) if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;
                if (u < 0 || dist[u] === Infinity) break;
                done[u] = true;
                for (let v = 0; v < n; v++) {
                    if (done[v]) continue;
                    const d = Math.hypot(nodes[u].x - nodes[v].x, nodes[u].z - nodes[v].z);
                    if (dist[u] + d < dist[v] && clearSeg(nodes[u], nodes[v], fn)) { dist[v] = dist[u] + d; prev[v] = u; }
                }
            }
            if (dist[1] === Infinity) return null;
            const out = []; for (let i = 1; i !== -1; i = prev[i]) out.unshift(nodes[i]);
            return out.slice(1);      // without the start point
        }
        const padded = (x, z) => playBlockedAt(x, z) || playBlockedAt(x + 0.22, z) || playBlockedAt(x - 0.22, z) || playBlockedAt(x, z + 0.22) || playBlockedAt(x, z - 0.22);
        const plan = (a, b) => gridRoute(a, b, padded) || gridRoute(a, b, playBlockedAt);
        // A* on a small grid: finds a way around ANY obstacle (used when the visitor taps the ground or the character walks back to sit)
        function gridRoute(a, b, fn) {
            const B = W.playBounds || { x0: -12, x1: 12, z0: -10, z1: 8 }, cs = 0.35;
            const nx = Math.ceil((B.x1 - B.x0) / cs) + 1, nz = Math.ceil((B.z1 - B.z0) / cs) + 1;
            const cell = new Int8Array(nx * nz);                                  // 0 unknown, 1 free, 2 blocked
            const wx = (i) => B.x0 + i * cs, wz = (j) => B.z0 + j * cs;
            const ci = (x) => clamp(Math.round((x - B.x0) / cs), 0, nx - 1), cj = (z) => clamp(Math.round((z - B.z0) / cs), 0, nz - 1);
            const free = (i, j) => { const k = j * nx + i; if (!cell[k]) cell[k] = fn(wx(i), wz(j)) ? 2 : 1; return cell[k] === 1; };
            let start = { x: a.x, z: a.z }; const pre = [];
            if (fn(a.x, a.z)) {                                                    // standing inside something: step out first
                let f = null;
                for (let r = 0.35; r <= 3.5 && !f; r += 0.35) for (let t = 0; t < 6.28 && !f; t += 0.4) { const x = a.x + Math.cos(t) * r, z = a.z + Math.sin(t) * r; if (!fn(x, z)) f = { x, z }; }
                if (!f) return null;
                pre.push(f); start = f;
            }
            const si = ci(start.x), sj = cj(start.z), gi = ci(b.x), gj = cj(b.z), N = nx * nz;
            const g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), heap = [];
            const push = (f, k) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; const t = heap[p]; heap[p] = heap[c]; heap[c] = t; c = p; } };
            const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; const t = heap[m]; heap[m] = heap[c]; heap[c] = t; c = m; } } return top; };
            const sk = sj * nx + si, gk = gj * nx + gi;
            g[sk] = 0; push(Math.hypot(si - gi, sj - gj), sk);
            let ok = false;
            while (heap.length) {
                const k = pop()[1];
                if (k === gk) { ok = true; break; }
                const i = k % nx, j = (k / nx) | 0;
                for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
                    if (!di && !dj) continue;
                    const ni = i + di, nj = j + dj;
                    if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue;
                    const nk = nj * nx + ni;
                    if (nk !== gk && !free(ni, nj)) continue;
                    if (di && dj && (!free(i + di, j) || !free(i, j + dj))) continue;      // no cutting corners
                    const ng = g[k] + (di && dj ? 1.414 : 1);
                    if (ng < g[nk]) { g[nk] = ng; came[nk] = k; push(ng + Math.hypot(ni - gi, nj - gj), nk); }
                }
            }
            if (!ok) return null;
            const cells = []; for (let k = gk; k !== -1; k = came[k]) cells.unshift({ x: wx(k % nx), z: wz((k / nx) | 0) });
            cells[cells.length - 1] = { x: b.x, z: b.z };
            const out = []; let anchor = cells[0], idx = 0;                              // string pulling: keep only the corners that matter
            while (idx < cells.length - 1) {
                let far = idx + 1;
                for (let q = cells.length - 1; q > idx + 1; q--) { if (clearSeg(anchor, cells[q], fn)) { far = q; break; } }
                out.push(cells[far]); anchor = cells[far]; idx = far;
            }
            return pre.concat(out);
        }
        const fwd = () => ({ x: Math.sin(seat.yaw), z: Math.cos(seat.yaw) });
        const approachPoint = () => { const f = fwd(); return { x: seat.pos.x + f.x * 0.95 * seat.scale, z: seat.pos.z + f.z * 0.95 * seat.scale, home: true }; };
        function planTrip() {
            const f = fwd(), a = W.area;
            const exit = { x: seat.pos.x + f.x * 1.15 * seat.scale, z: seat.pos.z + f.z * 1.15 * seat.scale };
            const home = approachPoint();
            const pts = [exit];
            let last = exit;
            const stops = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < stops; i++) {
                for (let tries = 0; tries < 40; tries++) {
                    let c;
                    if (W.specials.length && Math.random() < 0.45) { const sp = W.specials[Math.floor(Math.random() * W.specials.length)]; c = { x: sp.x, z: sp.z, special: sp }; }
                    else c = { x: rnd(a.x0, a.x1), z: rnd(a.z0, a.z1) };
                    if (blockedAt(c.x, c.z) || Math.hypot(c.x - last.x, c.z - last.z) < 1.5) continue;
                    const r = route(last, c);
                    if (!r) continue;
                    r.forEach((p, k) => pts.push(k === r.length - 1 ? c : p));
                    last = c; break;
                }
            }
            const back = route(last, home);
            if (back) back.forEach((p, k) => pts.push(k === back.length - 1 ? home : p));
            else { pts.push(exit); pts.push(home); }
            return pts;
        }
        const standY = (x, z) => W.groundY(x, z) + STAND_H * seat.scale;

        // target joint angles for one person
        function targetsFor(p, mode, walkPh, solo) {
            const out = { legs: [], arms: [] };
            [-1, 1].forEach((s) => {
                const inner = p === 0 ? s === 1 : s === -1;
                const phs = walkPh + (s > 0 ? 0 : Math.PI);
                if (mode === 'sit') {
                    out.legs.push(ground ? [-2.2, 1.8] : [-1.5708, 1.5708]);
                    out.arms.push(inner && p === 0 && !solo ? ARM.around(s) : (ground ? ARM.ground(s) : ARM.lap(s)));
                } else if (mode === 'walk') {
                    out.legs.push([-Math.sin(phs) * 0.55, 0.08 + 0.85 * Math.max(0, Math.cos(phs))]);
                    out.arms.push(inner && !solo ? ARM.hold(s) : [Math.sin(phs) * 0.5, s * 0.1, -0.25 - 0.15 * Math.max(0, -Math.sin(phs)), 0]);
                } else {   // stand
                    out.legs.push([0, 0]);
                    out.arms.push(inner && !solo ? ARM.hold(s) : ARM.rest(s));
                }
            });
            return out;
        }
        // current angles (smoothed towards the targets so every change of pose is gentle)
        const cur = [0, 1].map(p => { const o = targetsFor(p, 'sit', 0, false); return { legs: o.legs.map(l => l.slice()), arms: o.arms.map(a => a.slice()) }; });
        function applyPoseFor(p, tgt, rate, dt) {
            const k = 1 - Math.exp(-dt * rate), pp = people[p];
            for (let i = 0; i < 2; i++) {
                const cl = cur[p].legs[i], tl = tgt.legs[i];
                cl[0] += (tl[0] - cl[0]) * k; cl[1] += (tl[1] - cl[1]) * k;
                pp.legs[i].j1.rotation.x = cl[0]; pp.legs[i].j2.rotation.x = cl[1];
                const ca = cur[p].arms[i], ta = tgt.arms[i];
                for (let q = 0; q < 4; q++) ca[q] += (ta[q] - ca[q]) * k;
                pp.arms[i].j1.rotation.set(ca[0], 0, ca[1]);
                pp.arms[i].j2.rotation.set(ca[2], 0, ca[3]);
            }
            if (pp.skirt) pp.skirt.rotation.x = (cur[p].legs[0][0] + cur[p].legs[1][0]) * 0.5 * 0.92;
        }
        function snapPose(p, mode, solo) {   // jump straight to a pose (used when switching worlds)
            const t = targetsFor(p, mode, 0, solo);
            cur[p].legs = t.legs.map(l => l.slice()); cur[p].arms = t.arms.map(a => a.slice());
            applyPoseFor(p, t, 1000, 0.016);
        }

        function enterSit() { state = 'sit'; stateT = 0; sitTimer = rnd(W.sitMin, W.sitMax); yaw = seat.yaw; px.x = seat.pos.x; px.z = seat.pos.z; }

        // ------------------------------------------------------------ the visitor steers one character
        function detach(k) {
            const g = people[k].g;
            root.updateMatrixWorld(true);
            const wp = new THREE.Vector3(); g.getWorldPosition(wp);
            root.parent.attach(g);
            g.rotation.set(0, root.rotation.y, 0);
            g.scale.setScalar(seat.scale);
            player = { k, g, x: wp.x, z: wp.z, yaw: root.rotation.y, ph: 0, moving: false, mode: 'free', path: [], pi: 0, input: { x: 0, z: 0, run: false }, seatT: 0, from: null };
            player.y = wp.y;
            people[k].upper.rotation.z = 0; people[k].head.position.x = 0; people[k].head.rotation.z = 0;
        }
        function attachBack(k) {
            const g = people[k].g;
            root.attach(g);
            g.rotation.set(0, wrapPi(player.yaw - root.rotation.y), 0);     // attach() may report an equivalent but odd Euler; keep it a pure turn
            g.scale.set(1, 1, 1);
        }
        function startReturn() {
            const a = approachPoint();
            const from = { x: player.x, z: player.z };
            const r = plan(from, a);
            player.mode = 'return'; player.pi = 0;
            player.path = r || [a];
            player.input.x = 0; player.input.z = 0;
        }
        function instantRejoin() {
            if (!player) return;
            const k = player.k, g = people[k].g;
            root.attach(g);
            g.position.set(OFF[k], 0, 0); g.rotation.set(0, 0, 0); g.scale.set(1, 1, 1);
            player = null;
            enterSit();
            root.position.set(seat.pos.x, seat.pos.y, seat.pos.z); root.rotation.y = seat.yaw;
            snapPose(0, 'sit', false); snapPose(1, 'sit', false);
        }
        function updatePlayer(dt, t) {
            const Pl = player, k = Pl.k, pp = people[k];
            let moved = false, dir = null, speedMul = 1;
            if (Pl.mode === 'free') {
                const inp = Pl.input, mag = Math.hypot(inp.x, inp.z);
                if (mag > 0.05) { dir = { x: inp.x / mag, z: inp.z / mag }; speedMul = Math.min(1, mag) * (inp.run ? 1.8 : 1); Pl.path = []; }
                else if (Pl.path.length) {
                    const wp = Pl.path[Pl.pi], d = Math.hypot(wp.x - Pl.x, wp.z - Pl.z);
                    if (d < 0.16) { Pl.pi++; if (Pl.pi >= Pl.path.length) { Pl.path = []; Pl.pi = 0; } }
                    else dir = { x: (wp.x - Pl.x) / d, z: (wp.z - Pl.z) / d };
                }
            } else if (Pl.mode === 'return') {
                if (!Pl.path[Pl.pi]) { startReturn(); return; }
                const wp = Pl.path[Pl.pi], d = Math.hypot(wp.x - Pl.x, wp.z - Pl.z);
                if (d < 0.18) {
                    if (Pl.pi < Pl.path.length - 1) Pl.pi++;
                    else if (state === 'sit') { Pl.mode = 'seating'; Pl.seatT = 0; attachBack(k); Pl.from = { px: pp.g.position.clone(), ry: wrapPi(pp.g.rotation.y) }; }
                    else { const dd = { x: seat.pos.x - Pl.x, z: seat.pos.z - Pl.z }; dir = null; Pl.faceSeat = Math.atan2(dd.x, dd.z); }
                } else dir = { x: (wp.x - Pl.x) / d, z: (wp.z - Pl.z) / d };
            }
            if (Pl.mode === 'free' || Pl.mode === 'return') {
                const speed = 1.5 * (seat.scale / 1.2);
                if (dir) {
                    const diff = wrapPi(Math.atan2(dir.x, dir.z) - Pl.yaw);
                    Pl.yaw += clamp(diff, -9 * dt, 9 * dt);
                    if (Math.abs(diff) < 1.3) {
                        const step = speed * speedMul * dt;
                        let nx = Pl.x + dir.x * step, nz = Pl.z + dir.z * step;
                        if (!playBlockedAt(Pl.x, Pl.z) && playBlockedAt(nx, nz)) {   // slide along obstacles (but never trap someone who starts inside one)
                            if (!playBlockedAt(nx, Pl.z)) nz = Pl.z;
                            else if (!playBlockedAt(Pl.x, nz)) nx = Pl.x;
                            else { nx = Pl.x; nz = Pl.z; }
                        }
                        const dd = Math.hypot(nx - Pl.x, nz - Pl.z);
                        if (dd > 1e-5) { moved = true; Pl.stuck = 0; Pl.x = nx; Pl.z = nz; Pl.ph += (dd / (0.8 * seat.scale)) * Math.PI * 2; }
                        else {
                            Pl.stuck = (Pl.stuck || 0) + dt;
                            if (Pl.stuck > 0.6 && Pl.mode === 'free' && Pl.path.length && Pl.goal) {         // blocked on the way: plan again, then give up
                                const r = (Pl.replans || 0) < 2 ? plan({ x: Pl.x, z: Pl.z }, Pl.goal) : null;
                                Pl.replans = (Pl.replans || 0) + 1; Pl.stuck = 0;
                                if (r) { Pl.path = r; Pl.pi = 0; } else { Pl.path = []; Pl.pi = 0; }
                            }
                            if (Pl.stuck > 0.6 && Pl.mode === 'return') {
                                const r = plan({ x: Pl.x, z: Pl.z }, approachPoint());
                                if (r) { Pl.path = r; Pl.pi = 0; Pl.stuck = 0.0; Pl.restuck = (Pl.restuck || 0) + 1; }
                            }
                        }
                    }
                } else if (Pl.mode === 'return' && Pl.faceSeat !== undefined) {
                    Pl.yaw += clamp(wrapPi(Pl.faceSeat - Pl.yaw), -4 * dt, 4 * dt);
                }
                if (Pl.mode === 'return' && Pl.restuck > 3) { instantRejoin(); return; }     // never leave anyone stranded
                Pl.moving = moved;
                const gy = standY(Pl.x, Pl.z) + (moved ? Math.abs(Math.sin(Pl.ph)) * 0.035 * seat.scale : 0);
                Pl.y += (gy - Pl.y) * (1 - Math.exp(-dt * 12));
                pp.g.position.set(Pl.x, Pl.y, Pl.z); pp.g.rotation.y = Pl.yaw;
                applyPoseFor(k, targetsFor(k, moved ? 'walk' : 'stand', Pl.ph, true), moved ? 12 : 7, dt);
                pp.upper.rotation.x += ((moved ? 0.06 : 0) - pp.upper.rotation.x) * Math.min(1, dt * 6);
                pp.head.rotation.y = Math.sin(t * (moved ? 0.7 : 0.3) + k) * (moved ? 0.05 : 0.1);
            } else if (Pl.mode === 'seating') {
                Pl.seatT += dt;
                const u = smooth01(Pl.seatT / 1.8);
                const f = Pl.from;
                pp.g.position.set(f.px.x + (OFF[k] - f.px.x) * u, f.px.y * (1 - u), f.px.z * (1 - u));
                pp.g.rotation.y = f.ry * (1 - u);
                const s = 1; pp.g.scale.setScalar(pp.g.scale.x + (s - pp.g.scale.x) * Math.min(1, dt * 4));
                applyPoseFor(k, targetsFor(k, u > 0.4 ? 'sit' : 'stand', Pl.ph, true), 5, dt);
                if (Pl.seatT >= 1.8) { pp.g.position.set(OFF[k], 0, 0); pp.g.rotation.set(0, 0, 0); pp.g.scale.set(1, 1, 1); player = null; sitTimer = rnd(W.sitMin, W.sitMax); }
            }
        }

        return {
            mesh: root,
            state: () => state,
            blocked: blockedAt,
            playBlocked: playBlockedAt,
            setSeat(s) {
                seat.pos.copy(s.pos); seat.yaw = s.yaw || 0; seat.scale = s.scale || 1;
                root.position.copy(seat.pos); root.rotation.y = seat.yaw; root.scale.setScalar(seat.scale);
                yaw = seat.yaw; px.x = seat.pos.x; px.z = seat.pos.z;
            },
            setWander(c) { Object.assign(W, c); },
            setActive(v) {
                active = !!v;
                if (!active && player) this.setPlayer(null);
            },
            startTrip() { if (state === 'sit' && !player) sitTimer = 0; },
            react() { happy = 1.6; spawn(4); },

            // ---- steering one character (who: 'him' | 'her' | null)
            setPlayer(who) {
                if (!who) { if (player && player.mode !== 'return' && player.mode !== 'seating') startReturn(); return; }
                const k = who === 'her' ? 1 : 0;
                if (player) {
                    if (player.k === k) { if (player.mode === 'return') { player.mode = 'free'; player.path = []; player.pi = 0; } return; }
                    instantRejoin();
                }
                detach(k);
            },
            getPlayer: () => (player ? (player.k === 1 ? 'her' : 'him') : null),
            playerMode: () => (player ? player.mode : null),
            playerPos: () => (player ? V(player.x, player.y, player.z) : null),
            setMove(x, z, run) { if (player && player.mode === 'free') { player.input.x = x; player.input.z = z; player.input.run = !!run; } },
            moveTo(x, z) {
                if (!player || player.mode !== 'free') return false;
                let tx = x, tz = z;
                if (playBlockedAt(tx, tz)) {           // find the nearest free spot around the tapped point
                    let found = false;
                    for (let r = 0.3; r <= 1.8 && !found; r += 0.3) for (let a = 0; a < 6.28 && !found; a += 0.5) { const cx = x + Math.cos(a) * r, cz = z + Math.sin(a) * r; if (!playBlockedAt(cx, cz)) { tx = cx; tz = cz; found = true; } }
                    if (!found) return false;
                }
                const r = plan({ x: player.x, z: player.z }, { x: tx, z: tz });
                if (!r) return false;
                player.path = r; player.pi = 0; player.goal = { x: tx, z: tz }; player.replans = 0;
                return true;
            },
            instantRejoin,
            update(dt, t) {
                stateT += dt;
                const wantTrip = active && !player;
                // nobody should start a new trip while a visitor is steering; anyone already out goes home
                if (!wantTrip && (state === 'walk' || state === 'pause') && path.length && !path[wi].home) { path = [path[path.length - 1]]; wi = 0; state = 'walk'; }
                let mode = 'sit', rate = 6;
                if (state === 'sit') {
                    root.position.set(seat.pos.x, seat.pos.y, seat.pos.z); root.rotation.y = seat.yaw;
                    if (wantTrip) { sitTimer -= dt; if (sitTimer <= 0) { state = 'rise'; stateT = 0; } }
                } else if (state === 'rise') {
                    mode = 'stand'; rate = 4;
                    root.position.y += (standY(px.x, px.z) - root.position.y) * (1 - Math.exp(-dt * 3.2));
                    if (stateT > 1.5) {
                        if (!wantTrip) { state = 'sitdown'; stateT = 0; sitFrom = { x: px.x, z: px.z }; yawFrom = yaw; }
                        else { path = planTrip(); wi = 0; state = 'walk'; stateT = 0; }
                    }
                } else if (state === 'walk' || state === 'pause') {
                    const tgtY = standY(px.x, px.z);
                    if (state === 'walk') {
                        mode = 'walk'; rate = 12;
                        let moved = false;
                        const wp = path[wi];
                        const dx = wp.x - px.x, dz = wp.z - px.z, d = Math.hypot(dx, dz);
                        const diff = wrapPi(Math.atan2(dx, dz) - yaw);
                        yaw += clamp(diff, -2.6 * dt, 2.6 * dt);
                        if (Math.abs(diff) < 0.7 && d > 0.001) {
                            const step = Math.min(d, W.speed * dt);
                            px.x += Math.sin(yaw) * step; px.z += Math.cos(yaw) * step;
                            ph += (step / (0.8 * seat.scale)) * Math.PI * 2;
                            moved = true;
                        }
                        if (!moved) mode = 'stand';
                        if (d < 0.18) {
                            if (wp.home) { state = 'sitdown'; stateT = 0; sitFrom = { x: px.x, z: px.z }; yawFrom = yaw; }
                            else if (wp.special) { state = 'pause'; stateT = 0; pauseT = wp.special.pause || 5; faceYaw = wp.special.face ? Math.atan2(wp.special.face[0] - px.x, wp.special.face[1] - px.z) : yaw; if (wp.special.hearts) spawn(3); }
                            else wi = Math.min(wi + 1, path.length - 1);
                        }
                    } else {
                        mode = 'stand'; rate = 5;
                        yaw += clamp(wrapPi(faceYaw - yaw), -1.8 * dt, 1.8 * dt);
                        if (stateT > pauseT) { wi = Math.min(wi + 1, path.length - 1); state = 'walk'; stateT = 0; }
                    }
                    const bob = state === 'walk' && mode === 'walk' ? Math.abs(Math.sin(ph)) * 0.035 * seat.scale : 0;
                    root.position.set(px.x, root.position.y + (tgtY + bob - root.position.y) * (1 - Math.exp(-dt * 10)), px.z);
                    root.rotation.y = yaw;
                } else if (state === 'sitdown') {
                    const u = smooth01(stateT / 2.1);
                    mode = u > 0.5 ? 'sit' : 'stand'; rate = 5;
                    px.x = sitFrom.x + (seat.pos.x - sitFrom.x) * u; px.z = sitFrom.z + (seat.pos.z - sitFrom.z) * u;
                    yaw = yawFrom + wrapPi(seat.yaw - yawFrom) * u;
                    const y0 = standY(sitFrom.x, sitFrom.z);
                    root.position.set(px.x, y0 + (seat.pos.y - y0) * u, px.z);
                    root.rotation.y = yaw;
                    if (stateT >= 2.1) enterSit();
                }

                const walking = state === 'walk' && mode === 'walk';
                const solo = !!player;
                for (let p = 0; p < 2; p++) {
                    if (player && player.k === p) continue;
                    applyPoseFor(p, targetsFor(p, mode, ph, solo), rate, dt);
                }

                // little life: breathing, head movement, body lean
                const b = Math.sin(t * 1.5);
                const seated = state === 'sit';
                const lean = happy > 0 ? Math.sin(Math.min(1, happy) * Math.PI) * 0.12 : 0;
                happy = Math.max(0, happy - dt);
                const tilt = solo ? 0.15 : (seated ? 1 : 0.35);
                for (let p = 0; p < 2; p++) {
                    if (player && player.k === p) continue;
                    const pp = people[p];
                    pp.upper.scale.y = 1 + (p ? Math.sin(t * 1.5 + 0.6) : b) * 0.012;
                    pp.upper.rotation.x += ((walking ? 0.06 : 0) - pp.upper.rotation.x) * Math.min(1, dt * 6);
                    pp.upper.rotation.z = (p === 0 ? -0.04 : 0.1) * tilt;
                    pp.head.position.x = (p === 1 ? -0.08 : 0) * tilt;
                    const sway = Math.sin(t * (p ? 0.55 : 0.6) + p) * 0.025;
                    pp.head.rotation.z = (p === 0 ? -0.1 : 0.3) * tilt + (p === 0 ? -lean : lean) + sway;
                    pp.head.rotation.y = walking ? Math.sin(t * (0.7 - p * 0.1) + p) * 0.06 : Math.sin(t * (p ? 0.27 : 0.3) + p * 2) * (p ? 0.1 : 0.12);
                }
                // the one who stays behind watches the one you are steering
                if (player) {
                    const q = player.k === 0 ? 1 : 0, pp = people[q];
                    const wpos = new THREE.Vector3(); pp.g.getWorldPosition(wpos);
                    const ryaw = root.rotation.y;
                    const want = clamp(wrapPi(Math.atan2(player.x - wpos.x, player.z - wpos.z) - ryaw), -1.1, 1.1);
                    pp.head.rotation.y += (want - pp.head.rotation.y) * Math.min(1, dt * 4);
                    if (Math.hypot(player.x - wpos.x, player.z - wpos.z) < 1.5 * seat.scale) { nextHeart -= dt * 1.5; }
                }

                if (player) updatePlayer(dt, t);

                if (lap) { lapK += ((seated ? 1 : 0) - lapK) * Math.min(1, dt * 5); lap.visible = lapK > 0.03; lap.scale.setScalar(Math.max(0.01, lapK)); }

                nextHeart -= dt;
                if (nextHeart < 0) { spawn(1); nextHeart = 5 + Math.random() * 5; }
                hearts.forEach(h => {
                    if (h.t < 0) return;
                    h.t += dt / 2.6;
                    if (h.t >= 1) { h.t = -1; h.s.material.opacity = 0; return; }
                    h.s.position.set(h.dx + Math.sin(h.t * 6) * 0.05, 1.35 + h.t * 0.9, 0.05);
                    h.s.material.opacity = Math.sin(h.t * Math.PI) * 0.9;
                });
            }
        };
    }

    return { makeCouple, plaidTexture };
})();
window.ZCouple = ZCouple;
