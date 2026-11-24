/**
 * ZenHaven 4.0 - shared helpers (noise, textures, sky, stars, terrain, fire...)
 * Everything is procedural: no external models or textures.
 */
const ZU = (() => {
    const TAU = Math.PI * 2;
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const lerp = (a, b, t) => a + (b - a) * t;
    const rand = (a, b) => a + Math.random() * (b - a);
    const smooth = (e0, e1, x) => {
        const t = clamp((x - e0) / (e1 - e0), 0, 1);
        return t * t * (3 - 2 * t);
    };

    function rng(seed) {
        let a = seed >>> 0;
        return () => {
            a = (a + 0x6D2B79F5) >>> 0;
            let t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hash2(ix, iz) {
        let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263);
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    }
    function vnoise(x, z) {
        const ix = Math.floor(x), iz = Math.floor(z);
        const fx = x - ix, fz = z - iz;
        const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
        return lerp(lerp(hash2(ix, iz), hash2(ix + 1, iz), u),
                    lerp(hash2(ix, iz + 1), hash2(ix + 1, iz + 1), u), v);
    }
    function fbm(x, z, oct = 4) {
        let s = 0, a = 0.5, f = 1, n = 0;
        for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, z * f); n += a; f *= 2; a *= 0.5; }
        return s / n;
    }

    // ------------------------------------------------------------------ textures
    function canvasTex(w, h, draw) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        draw(g, w, h);
        const t = new THREE.CanvasTexture(c);
        t.anisotropy = 4;
        return t;
    }

    let _glow = null;
    function glowTex() {
        if (_glow) return _glow;
        _glow = canvasTex(128, 128, (g, w, h) => {
            const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
            gr.addColorStop(0, 'rgba(255,255,255,1)');
            gr.addColorStop(0.2, 'rgba(255,255,255,0.6)');
            gr.addColorStop(0.5, 'rgba(255,255,255,0.14)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = gr; g.fillRect(0, 0, w, h);
        });
        return _glow;
    }

    let _heart = null;
    function heartTex() {
        if (_heart) return _heart;
        _heart = canvasTex(128, 128, (g, w, h) => {
            g.translate(w / 2, h / 2 + 6);
            g.beginPath();
            g.moveTo(0, 30);
            g.bezierCurveTo(-62, -8, -34, -52, 0, -22);
            g.bezierCurveTo(34, -52, 62, -8, 0, 30);
            const gr = g.createLinearGradient(0, -40, 0, 34);
            gr.addColorStop(0, '#ff9ab8'); gr.addColorStop(1, '#ff4f87');
            g.fillStyle = gr; g.shadowColor = 'rgba(255,90,140,0.9)'; g.shadowBlur = 12;
            g.fill();
        });
        return _heart;
    }

    let _cloud = null;
    function cloudTex() {
        if (_cloud) return _cloud;
        const r = rng(7);
        _cloud = canvasTex(512, 160, (g, w, h) => {
            for (let i = 0; i < 26; i++) {
                const x = 80 + r() * (w - 160), y = h * 0.5 + (r() - 0.5) * 36;
                const rad = 26 + r() * 44;
                const gr = g.createRadialGradient(x, y, 0, x, y, rad);
                gr.addColorStop(0, 'rgba(255,255,255,0.42)');
                gr.addColorStop(1, 'rgba(255,255,255,0)');
                g.fillStyle = gr; g.fillRect(0, 0, w, h);
            }
        });
        return _cloud;
    }

    function glowSprite(color, size, opacity = 1) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTex(), color, transparent: true, opacity,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        }));
        s.scale.set(size, size, 1);
        return s;
    }

    // ------------------------------------------------------------------ sky dome
    function makeSky({ top, mid, horizon, bottom, midPos = 0.35 }) {
        const mat = new THREE.ShaderMaterial({
            uniforms: {
                uTop: { value: new THREE.Color(top) }, uMid: { value: new THREE.Color(mid) },
                uHor: { value: new THREE.Color(horizon) }, uBot: { value: new THREE.Color(bottom !== undefined ? bottom : horizon) },
                uMidPos: { value: midPos }
            },
            vertexShader: `varying vec3 vDir;
                void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
            fragmentShader: `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uBot; uniform float uMidPos;
                varying vec3 vDir;
                void main(){
                    float h = vDir.y; vec3 c;
                    if (h > 0.0) {
                        c = mix(uHor, uMid, smoothstep(0.0, uMidPos, h));
                        c = mix(c, uTop, smoothstep(uMidPos, 0.95, h));
                    } else { c = mix(uHor, uBot, smoothstep(0.0, -0.35, h)); }
                    gl_FragColor = vec4(c, 1.0);
                }`,
            side: THREE.BackSide, depthWrite: false, fog: false
        });
        const m = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 24), mat);
        m.renderOrder = -100;
        m.frustumCulled = false;
        return m;
    }

    // ------------------------------------------------------------------ twinkling points (stars, fairy lights)
    function makeTwinkle({ positions, colors, sizes, speed = 1 }) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        const ph = new Float32Array(sizes.length);
        for (let i = 0; i < ph.length; i++) ph[i] = Math.random();
        geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uPR: { value: ZU.pixelRatio || 1 }, uSpeed: { value: speed } },
            vertexShader: `attribute float aSize; attribute float aPhase; attribute vec3 aColor;
                uniform float uTime; uniform float uPR; uniform float uSpeed;
                varying vec3 vC; varying float vA;
                void main(){
                    vC = aColor;
                    vA = 0.55 + 0.45 * sin(uTime * uSpeed * (0.8 + aPhase * 1.2) + aPhase * 40.0);
                    gl_PointSize = aSize * uPR * (0.7 + 0.3 * vA);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `varying vec3 vC; varying float vA;
                void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC, a * a * vA); }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
        });
        const points = new THREE.Points(geo, mat);
        points.frustumCulled = false;
        return { points, update: (t) => { mat.uniforms.uTime.value = t; } };
    }

    function makeStars(count, { radius = 600, minY = 0.04, maxSize = 4.2 } = {}) {
        const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count);
        const palette = [new THREE.Color(0xffffff), new THREE.Color(0xbfd4ff), new THREE.Color(0xffe9c4), new THREE.Color(0xd6c6ff)];
        for (let i = 0; i < count; i++) {
            let x, y, z, l;
            do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; l = Math.hypot(x, y, z); } while (l > 1 || l < 0.1 || y / l < minY);
            positions.set([x / l * radius, y / l * radius, z / l * radius], i * 3);
            const c = palette[Math.floor(Math.random() * palette.length)];
            colors.set([c.r, c.g, c.b], i * 3);
            sizes[i] = 1.2 + Math.pow(Math.random(), 4) * maxSize;
        }
        return makeTwinkle({ positions, colors, sizes, speed: 1.1 });
    }

    // ------------------------------------------------------------------ terrain
    function makeTerrain({ size = 140, seg = 200, height, color, flat = true }) {
        const geo = new THREE.PlaneGeometry(size, size, seg, seg);
        geo.rotateX(-Math.PI / 2);
        const pos = geo.attributes.position;
        const cols = new Float32Array(pos.count * 3);
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getZ(i);
            const y = height(x, z);
            pos.setY(i, y);
            color(x, y, z, c);
            cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
        geo.computeVertexNormals();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: flat }));
        mesh.receiveShadow = true;
        return mesh;
    }

    // ------------------------------------------------------------------ panoramic ridge ring (far mountains / hills)
    function makeRidgeRing({ radius, height, y = 0, topColor, baseColor, seed, base = 0.45, amp = 0.5, freqs = [2, 3, 5, 8, 13] }) {
        const r = rng(seed);
        const ph = freqs.map(() => r() * TAU);
        const am = freqs.map((f, i) => 1 / (i + 1.3));
        const norm = am.reduce((a, b) => a + b, 0);
        const tex = canvasTex(2048, 256, (g, w, h) => {
            const gr = g.createLinearGradient(0, 0, 0, h);
            gr.addColorStop(0, topColor); gr.addColorStop(0.55, baseColor); gr.addColorStop(1, baseColor);
            g.fillStyle = gr;
            g.beginPath(); g.moveTo(0, h);
            for (let x = 0; x <= w; x += 4) {
                const u = x / w;
                let v = 0;
                freqs.forEach((f, i) => { v += am[i] * Math.sin(TAU * f * u + ph[i]); });
                v = (v / norm) * 0.5 + 0.5;
                const ry = h * (1 - (base + amp * v * 0.75));
                g.lineTo(x, ry);
            }
            g.lineTo(w, h); g.closePath(); g.fill();
        });
        const mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, height, 72, 1, true),
            new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false })
        );
        mesh.position.y = y + height / 2;
        mesh.renderOrder = -90;
        mesh.frustumCulled = false;
        return mesh;
    }

    // ------------------------------------------------------------------ misc builders
    function instanced(geo, mat, count, fn) {
        const m = new THREE.InstancedMesh(geo, mat, count);
        const o = new THREE.Object3D();
        const col = new THREE.Color();
        let useColor = false;
        for (let i = 0; i < count; i++) {
            o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1);
            col.set(0xffffff);
            const r = fn(i, o, col);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
            if (r !== false) { m.setColorAt(i, col); useColor = true; }
        }
        m.instanceMatrix.needsUpdate = true;
        if (useColor && m.instanceColor) m.instanceColor.needsUpdate = true;
        m.frustumCulled = false;
        return m;
    }

    function stdMat(color, rough = 0.9, metal = 0, extra = {}) {
        return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra));
    }

    function box(parent, w, h, d, mat, x, y, z, shadow = true) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z);
        m.castShadow = shadow; m.receiveShadow = true;
        parent.add(m);
        return m;
    }

    // Wooden sign post with text such as "A ♥ B"
    function makeSign(parts, w = 2.1, h = 0.82) {
        const g = new THREE.Group();
        const wood = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.9 });
        const tex = canvasTex(512, 200, (c, W, H) => {
            c.fillStyle = '#c99a62'; c.fillRect(0, 0, W, H);
            for (let i = 0; i < 26; i++) { c.strokeStyle = 'rgba(90,55,25,' + (0.06 + Math.random() * 0.1) + ')'; c.beginPath(); c.moveTo(0, Math.random() * H); c.bezierCurveTo(W * .3, Math.random() * H, W * .7, Math.random() * H, W, Math.random() * H); c.stroke(); }
            c.strokeStyle = '#7a4d28'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10);
            let size = 64;
            const measure = () => { c.font = 'bold ' + size + 'px Georgia, serif'; return parts.reduce((a, p) => a + c.measureText(p.t).width, 0); };
            while (measure() > W - 70 && size > 20) size -= 2;
            let x = (W - measure()) / 2;
            c.textBaseline = 'middle';
            parts.forEach(p => {
                c.fillStyle = p.heart ? '#d9304f' : '#4a2812';
                c.shadowColor = 'rgba(255,240,210,.55)'; c.shadowBlur = 2; c.shadowOffsetY = 2;
                c.fillText(p.t, x, H / 2 + 4);
                x += c.measureText(p.t).width;
            });
        });
        const board = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), [wood, wood, wood, wood, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), wood]);
        board.position.y = 1.15; board.castShadow = true; g.add(board);
        [-w * 0.36, w * 0.36].forEach(px => {
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.25, 7), wood);
            post.position.set(px, 0.62, -0.08); post.castShadow = true; g.add(post);
        });
        return g;
    }

    function signParts() {
        const c = window.ZEN_CONFIG || { for: 'em', from: '' };
        if (c.from) return [{ t: c.from + ' ' }, { t: '♥', heart: true }, { t: ' ' + c.for }];
        return [{ t: '♥ ', heart: true }, { t: c.for === 'em' ? 'Mãi bên nhau' : c.for }, { t: ' ♥', heart: true }];
    }

    // Polaroid photo cards (photos come from love-config.js). Tap one in a scene to open it large.
    const photoTexCache = {};
    function loadPhotoTex(src, cb) {
        if (photoTexCache[src]) { cb(photoTexCache[src]); return; }
        new THREE.TextureLoader().load(src, (t) => { photoTexCache[src] = t; cb(t); }, undefined, () => { /* missing file: keep the blank card */ });
    }
    function makePolaroid(photo, idx, w = 0.62) {
        const h = w * 1.22, g = new THREE.Group();
        const card = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), new THREE.MeshStandardMaterial({ color: 0xfdf8ee, roughness: 0.9 }));
        card.castShadow = true; g.add(card);
        const iw = w * 0.86, ih = iw * 0.92;
        const pm = new THREE.MeshStandardMaterial({ color: 0xcfc6bb, roughness: 0.6, emissive: 0xffffff, emissiveIntensity: 0.28 });
        const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), pm);
        photoMesh.position.set(0, h / 2 - w * 0.07 - ih / 2, 0.0115); g.add(photoMesh);
        loadPhotoTex(photo.src, (tex) => {
            const a = tex.image.width / tex.image.height, target = iw / ih;
            if (a > target) { tex.repeat.x = target / a; tex.offset.x = (1 - tex.repeat.x) / 2; } else { tex.repeat.y = a / target; tex.offset.y = (1 - tex.repeat.y) / 2; }
            pm.map = tex; pm.emissiveMap = tex; pm.color.set(0xffffff); pm.needsUpdate = true;
        });
        if (photo.caption) {
            const ct = canvasTex(256, 56, (c, W, H) => { c.fillStyle = '#4a3a30'; c.font = '28px "Segoe Script","Bradley Hand",cursive'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(photo.caption.slice(0, 22), W / 2, H / 2); });
            const cap = new THREE.Mesh(new THREE.PlaneGeometry(iw, iw * 0.2), new THREE.MeshBasicMaterial({ map: ct, transparent: true }));
            cap.position.set(0, -h / 2 + w * 0.11, 0.0115); g.add(cap);
        }
        g.userData.photoIndex = idx;
        return g;
    }
    function addPolaroids(parent, slots) {
        const ph = ((window.LOVE && window.LOVE.photos) || []).filter(p => p && p.src);
        const out = [];
        const n = Math.min(slots.length, ph.length);
        for (let i = 0; i < n; i++) {
            const s = slots[i], g = makePolaroid(ph[i], i, s.w || 0.62);
            g.position.set(s.pos[0], s.pos[1], s.pos[2]);
            g.rotation.set(...(s.rot || [0, 0, 0]));
            g.scale.setScalar(s.scale || 1);
            g.userData.baseZ = g.rotation.z;
            parent.add(g); out.push(g);
        }
        return out;
    }
    function swayPolaroids(list, t) { list.forEach((g, i) => { g.rotation.z = g.userData.baseZ + Math.sin(t * 0.8 + i * 1.7) * 0.012; }); }

    function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }

    function shadowAll(obj, cast = true, receive = false) {
        obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
    }

    // Cozy flickering fire (fireplace / campfire)
    function makeFire({ scale = 1, intensity = 2.2, distance = 16, withLogs = true } = {}) {
        const g = new THREE.Group();
        const flames = [];
        const cols = [0xff4d12, 0xff7a1c, 0xffa92e, 0xffd45e];
        const specs = [[0, 0, 0.30, 1.05], [-0.16, 0.05, 0.22, 0.8], [0.17, -0.03, 0.22, 0.85], [0.03, 0.12, 0.17, 0.62], [-0.05, -0.12, 0.15, 0.55]];
        specs.forEach((s, i) => {
            const m = new THREE.Mesh(new THREE.ConeGeometry(s[2], s[3], 8, 1, true),
                new THREE.MeshBasicMaterial({ color: cols[Math.min(3, i)], transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
            m.position.set(s[0], s[3] / 2 + 0.08, s[1]);
            g.add(m);
            flames.push({ m, base: s[3], ph: Math.random() * 10, sp: 5 + Math.random() * 4 });
        });
        if (withLogs) {
            const logMat = stdMat(0x3b2415, 1);
            for (let i = 0; i < 3; i++) {
                const log = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 7), logMat);
                log.rotation.z = Math.PI / 2; log.rotation.y = i * 1.05 + 0.2;
                log.position.set(0, 0.07 + (i === 2 ? 0.12 : 0), 0);
                log.castShadow = true;
                g.add(log);
            }
            const coal = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: 0xff5a1a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
            coal.rotation.x = -Math.PI / 2; coal.position.y = 0.03;
            g.add(coal);
        }
        const glow = glowSprite(0xff8a3a, 2.6, 0.75);
        glow.position.y = 0.55;
        g.add(glow);
        const light = new THREE.PointLight(0xff8a3a, intensity, distance, 2);
        light.position.y = 0.7;
        g.add(light);

        const N = 36;
        const ep = new Float32Array(N * 3), eps = [];
        for (let i = 0; i < N; i++) eps.push({ x: 0, y: Math.random(), z: 0, s: 0.5 + Math.random() * 0.8, a: Math.random() * TAU });
        const eg = new THREE.BufferGeometry();
        eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
        const embers = new THREE.Points(eg, new THREE.PointsMaterial({ map: glowTex(), color: 0xffa040, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
        embers.frustumCulled = false;
        g.add(embers);
        g.scale.setScalar(scale);

        return {
            group: g, light, baseIntensity: intensity,
            update(dt, t) {
                flames.forEach((f, i) => {
                    const k = 0.85 + 0.25 * Math.sin(t * f.sp + f.ph) + 0.12 * Math.sin(t * f.sp * 2.3 + f.ph * 3);
                    f.m.scale.set(1 + 0.12 * Math.sin(t * f.sp * 1.4 + f.ph), k, 1 + 0.12 * Math.cos(t * f.sp + f.ph));
                    f.m.position.y = (f.base * k) / 2 + 0.08;
                    f.m.rotation.z = Math.sin(t * 3 + f.ph) * 0.08;
                });
                light.intensity = intensity * (0.82 + 0.18 * Math.sin(t * 11) + 0.1 * Math.sin(t * 23.7 + 1));
                glow.material.opacity = 0.6 + 0.2 * Math.sin(t * 9);
                for (let i = 0; i < N; i++) {
                    const e = eps[i];
                    e.y += dt * e.s * 0.9;
                    if (e.y > 1.8) { e.y = 0.1; e.a = Math.random() * TAU; }
                    ep[i * 3] = Math.sin(e.a + t * 0.8) * (0.15 + e.y * 0.15);
                    ep[i * 3 + 1] = e.y;
                    ep[i * 3 + 2] = Math.cos(e.a + t * 0.7) * 0.15;
                }
                eg.attributes.position.needsUpdate = true;
            }
        };
    }

    // Soft rising steam from a cup
    function makeSteam(count = 6) {
        const g = new THREE.Group();
        const puffs = [];
        for (let i = 0; i < count; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }));
            g.add(s);
            puffs.push({ s, t: i / count });
        }
        return {
            group: g,
            update(dt) {
                puffs.forEach(p => {
                    p.t += dt * 0.28; if (p.t > 1) p.t -= 1;
                    p.s.position.set(Math.sin(p.t * 7 + p.s.id) * 0.05 * p.t * 3, p.t * 0.55, 0);
                    const sc = 0.1 + p.t * 0.28;
                    p.s.scale.set(sc, sc, 1);
                    p.s.material.opacity = Math.sin(p.t * Math.PI) * 0.28;
                });
            }
        };
    }

    return {
        TAU, clamp, lerp, rand, smooth, rng, vnoise, fbm, canvasTex, glowTex, heartTex, cloudTex, glowSprite,
        makeSky, makeTwinkle, makeStars, makeTerrain, makeRidgeRing, instanced, stdMat, box, at, makeSign, signParts, makePolaroid, addPolaroids, swayPolaroids, shadowAll,
        makeFire, makeSteam, pixelRatio: 1
    };
})();
window.ZU = ZU;
