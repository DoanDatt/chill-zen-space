/**
 * SCENE 2 - Aurora night over a snowy valley: fox, reindeer, owl, cabin, sky lanterns.
 */
function buildAuroraScene() {
    const { TAU, rand, rng, smooth, fbm, canvasTex, glowSprite, glowTex, stdMat, box, instanced } = ZU;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e2038, 0.013);
    const R = rng(21);
    const updates = [];

    // ---------------------------------------------------------------- sky
    scene.add(ZU.makeSky({ top: 0x01020c, mid: 0x0a1a42, horizon: 0x1a5a78, bottom: 0x0a1a2a, midPos: 0.4 }));
    const stars = ZU.makeStars(2600);
    scene.add(stars.points);
    updates.push((dt, t) => stars.update(t));

    const moonGlow = glowSprite(0xbcd6ff, 70, 0.55); moonGlow.position.set(-170, 150, -330); scene.add(moonGlow);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: 0xf2f6ff, fog: false }));
    moon.position.set(-170, 150, -330); moon.lookAt(0, 0, 0); scene.add(moon);

    scene.add(ZU.makeRidgeRing({ radius: 480, height: 150, y: -20, topColor: '#9fb7e0', baseColor: '#16284a', seed: 3, base: 0.3, amp: 0.55 }));
    scene.add(ZU.makeRidgeRing({ radius: 430, height: 110, y: -15, topColor: '#6f8cbf', baseColor: '#0f1c38', seed: 8, base: 0.25, amp: 0.45 }));
    scene.add(ZU.makeRidgeRing({ radius: 380, height: 70, y: -10, topColor: '#3c5688', baseColor: '#0a1428', seed: 14, base: 0.2, amp: 0.4 }));

    // ---------------------------------------------------------------- aurora curtains
    const auroraMats = [];
    function curtain(w, h, pos, c1, c2, c3, seed, amp) {
        const mat = new THREE.ShaderMaterial({
            uniforms: { uTime: { value: 0 }, uC1: { value: new THREE.Color(c1) }, uC2: { value: new THREE.Color(c2) }, uC3: { value: new THREE.Color(c3) }, uSeed: { value: seed }, uAmp: { value: amp } },
            vertexShader: `uniform float uTime; uniform float uSeed; uniform float uAmp; varying vec2 vUv; varying float vH;
                void main(){
                    vUv = uv; vec3 p = position;
                    float x = p.x;
                    p.z += sin(x * 0.045 + uTime * 0.18 + uSeed) * uAmp + sin(x * 0.11 - uTime * 0.12 + uSeed * 2.0) * uAmp * 0.4;
                    p.y += sin(x * 0.07 + uTime * 0.25 + uSeed) * 2.0 * (1.0 - uv.y);
                    vH = uv.y;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
                }`,
            fragmentShader: `uniform float uTime; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform float uSeed; varying vec2 vUv; varying float vH;
                void main(){
                    float x = vUv.x;
                    float rays = 0.55 + 0.45 * sin(x * 140.0 + sin(x * 17.0 + uTime * 0.6 + uSeed) * 3.0 + uTime * 0.3);
                    rays *= 0.7 + 0.3 * sin(x * 37.0 - uTime * 0.5 + uSeed * 3.0);
                    float v = pow(1.0 - vH, 1.6) * smoothstep(0.0, 0.07, vH);
                    float edge = smoothstep(0.0, 0.12, x) * smoothstep(1.0, 0.88, x);
                    float pulse = 0.75 + 0.25 * sin(uTime * 0.45 + x * 6.0 + uSeed);
                    vec3 c = mix(uC1, uC2, smoothstep(0.0, 0.55, vH));
                    c = mix(c, uC3, smoothstep(0.5, 1.0, vH));
                    float a = v * rays * edge * pulse * 0.9;
                    gl_FragColor = vec4(c * (0.8 + a), a);
                }`,
            transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false
        });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 160, 8), mat);
        m.position.copy(pos); m.frustumCulled = false; m.renderOrder = -50;
        scene.add(m); auroraMats.push(mat);
        return m;
    }
    curtain(320, 64, new THREE.Vector3(0, 62, -150), 0x37ffa2, 0x1fd6c8, 0xa77bff, 1.0, 22);
    curtain(300, 56, new THREE.Vector3(-30, 70, -190), 0x4dffb5, 0x29b8ff, 0xff6fd8, 4.0, 28);
    curtain(260, 50, new THREE.Vector3(60, 56, -120), 0x2cff8c, 0x20e0a0, 0x7b6bff, 7.0, 16);
    const auroraLight = new THREE.PointLight(0x44ffb0, 0.7, 70, 1.5);
    auroraLight.position.set(0, 18, -20); scene.add(auroraLight);
    updates.push((dt, t) => {
        auroraMats.forEach(m => m.uniforms.uTime.value = t);
        auroraLight.color.setHSL(0.42 + Math.sin(t * 0.15) * 0.08, 0.9, 0.55);
        auroraLight.intensity = 0.65 + Math.sin(t * 0.4) * 0.2;
    });

    // ---------------------------------------------------------------- lights
    scene.add(new THREE.HemisphereLight(0x5a7cdf, 0x16233a, 0.5));
    const moonLight = new THREE.DirectionalLight(0x9fb8ff, 0.6);
    moonLight.position.set(-14, 20, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    const sc = moonLight.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 14; sc.bottom = -14; sc.near = 1; sc.far = 60;
    moonLight.shadow.bias = -0.0006;
    scene.add(moonLight);

    // ---------------------------------------------------------------- terrain
    const lake = { x: 9, z: -11, rx: 8.5, rz: 5.5 };
    const heightFn = (x, z) => {
        const r = Math.hypot(x, z + 2);
        const mask = smooth(7, 22, r);
        let h = (fbm(x * 0.045, z * 0.045, 4) - 0.45) * 7 * mask;
        h += smooth(25, 70, r) * (fbm(x * 0.02 + 9, z * 0.02, 3) * 26);
        h += 0.9 * Math.exp(-((x + 6.5) ** 2 + (z + 13) ** 2) / 50);   // reindeer knoll
        const d = ((x - lake.x) / lake.rx) ** 2 + ((z - lake.z) / lake.rz) ** 2;
        if (d < 1.5) h = h * smooth(1.5, 0.9, d) - 0.55 * smooth(1.15, 0.75, d);
        return h;
    };
    const ground = ZU.makeTerrain({
        size: 220, seg: 240, flat: false, height: heightFn,
        color: (x, y, z, c) => {
            const n = fbm(x * 0.12, z * 0.12, 2);
            c.setRGB(0.55 + n * 0.12, 0.66 + n * 0.1, 0.9);
            const sh = smooth(-0.3, 4, y);
            c.multiplyScalar(0.62 + sh * 0.2);
        }
    });
    scene.add(ground);

    // frozen lake (shimmering reflection of the aurora)
    const lakeMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
            void main(){
                vec2 p = vUv - 0.5;
                float r = length(p) * 2.0;
                float band = 0.5 + 0.5 * sin(p.x * 6.0 + sin(p.y * 4.0 + uTime * 0.4) * 1.5 + uTime * 0.25);
                vec3 deep = vec3(0.03, 0.09, 0.17);
                vec3 green = vec3(0.12, 0.9, 0.6);
                vec3 violet = vec3(0.45, 0.35, 0.95);
                vec3 refl = mix(green, violet, smoothstep(-0.5, 0.5, p.y + sin(p.x * 4.0 + uTime * 0.3) * 0.2));
                vec3 c = mix(deep, refl, 0.42 + 0.25 * band);
                float sp = fract(sin(dot(floor((p + 0.5) * 70.0 + vec2(floor(uTime * 1.5), 0.0)), vec2(12.9898, 78.233))) * 43758.5453);
                c += vec3(0.8, 0.95, 1.0) * step(0.985, sp) * 0.5;
                gl_FragColor = vec4(c, smoothstep(1.0, 0.86, r));
            }`,
        transparent: true, depthWrite: false
    });
    const lakeMesh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), lakeMat);
    lakeMesh.rotation.x = -Math.PI / 2; lakeMesh.scale.set(lake.rx * 0.98, lake.rz * 0.98, 1);
    lakeMesh.position.set(lake.x, -0.12, lake.z);
    // after rotation the circle's local Y scales into world Z, so swap scale axes
    lakeMesh.scale.set(lake.rx * 0.98, lake.rz * 0.98, 1);
    scene.add(lakeMesh);
    updates.push((dt, t) => lakeMat.uniforms.uTime.value = t);

    // ---------------------------------------------------------------- snowy pine forest (instanced)
    const pines = [];
    let guard = 0;
    while (pines.length < 330 && guard++ < 6000) {
        const a = R() * TAU, r = 10 + Math.pow(R(), 0.8) * 62;
        const x = Math.cos(a) * r, z = -4 + Math.sin(a) * r;
        if (Math.abs(x) < 6.5 && z > -6 && z < 8) continue;                       // fox clearing
        if (z > -3 && Math.abs(x) < 15) continue;                                  // keep the foreground open
        if (((x - lake.x) / (lake.rx + 1.5)) ** 2 + ((z - lake.z) / (lake.rz + 1.5)) ** 2 < 1) continue;   // lake
        if (Math.hypot(x + 6.5, z + 13) < 4.5) continue;                          // reindeer
        if (Math.hypot(x - 17, z + 20) < 7) continue;                             // cabin
        if (fbm(x * 0.07 + 3, z * 0.07 + 5, 2) < 0.4) continue;
        pines.push({ x, y: heightFn(x, z), z, s: 0.8 + R() * 0.7 + r * 0.004, rot: R() * TAU });
    }
    const layerSpec = [
        { geo: new THREE.ConeGeometry(1.5, 2.6, 7), y: 2.0, col: [0.07, 0.2, 0.2] },
        { geo: new THREE.ConeGeometry(1.15, 2.2, 7), y: 3.3, col: [0.28, 0.42, 0.52] },
        { geo: new THREE.ConeGeometry(0.8, 1.9, 7), y: 4.5, col: [0.6, 0.7, 0.85] }
    ];
    layerSpec.forEach(L => {
        const m = instanced(L.geo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), pines.length, (i, o, col) => {
            const p = pines[i];
            o.position.set(p.x, p.y + L.y * p.s, p.z); o.scale.setScalar(p.s); o.rotation.y = p.rot;
            const v = 0.85 + R() * 0.3;
            col.setRGB(L.col[0] * v, L.col[1] * v, L.col[2] * v);
        });
        m.castShadow = true; scene.add(m);
    });
    scene.add(Object.assign(instanced(new THREE.CylinderGeometry(0.16, 0.22, 1.6, 6), stdMat(0x3b2a20, 1), pines.length, (i, o, col) => {
        const p = pines[i]; o.position.set(p.x, p.y + 0.6 * p.s, p.z); o.scale.setScalar(p.s); col.set(0xffffff);
    }), { castShadow: true }));

    // rocks sprinkled in the snow
    scene.add(instanced(new THREE.DodecahedronGeometry(0.5, 0), stdMat(0x7d8aa6, 1, 0, { flatShading: true }), 40, (i, o, col) => {
        const a = R() * TAU, r = 8 + R() * 30;
        const x = Math.cos(a) * r, z = -3 + Math.sin(a) * r;
        o.position.set(x, heightFn(x, z) + 0.1, z); o.scale.set(0.5 + R(), 0.4 + R() * 0.6, 0.5 + R()); o.rotation.set(R(), R() * TAU, R());
        col.setRGB(0.55 + R() * 0.2, 0.62 + R() * 0.2, 0.8);
    }));

    // ---------------------------------------------------------------- warm cabin on the far hill
    const cabin = new THREE.Group();
    const cx = 17, cz = -20;
    cabin.position.set(cx, heightFn(cx, cz), cz);
    cabin.rotation.y = -0.6;
    box(cabin, 4.6, 2.4, 3.4, stdMat(0x6b4a33, 0.9), 0, 1.2, 0);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.8, 4), stdMat(0xe6eefc, 0.9));
    roof.position.y = 3.2; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.78); cabin.add(roof);
    box(cabin, 0.5, 1.4, 0.5, stdMat(0x4a4452, 1), 1.4, 3.3, -0.3);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.8), new THREE.MeshBasicMaterial({ color: 0xffc46b }));
    win.position.set(-0.9, 1.4, 1.71); cabin.add(win);
    const win2 = win.clone(); win2.position.set(1.0, 1.4, 1.71); cabin.add(win2);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.5), new THREE.MeshBasicMaterial({ color: 0x3a2417 }));
    door.position.set(0.05, 0.8, 1.71); cabin.add(door);
    const cabinGlow = glowSprite(0xffb85c, 9, 0.5); cabinGlow.position.set(0, 1.6, 2.6); cabin.add(cabinGlow);
    const cabinLight = new THREE.PointLight(0xffb060, 1.4, 20, 2); cabinLight.position.set(0, 2, 3); cabin.add(cabinLight);
    ZU.shadowAll(cabin, true, false);
    scene.add(cabin);
    // chimney smoke
    const smoke = [];
    for (let i = 0; i < 9; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xc9d6ee, transparent: true, opacity: 0, depthWrite: false }));
        scene.add(s); smoke.push({ s, t: i / 9 });
    }
    const chim = new THREE.Vector3(1.4, 4.0, -0.3).applyAxisAngle(new THREE.Vector3(0, 1, 0), cabin.rotation.y).add(cabin.position);
    updates.push((dt, t) => smoke.forEach(p => {
        p.t += dt * 0.09; if (p.t > 1) p.t -= 1;
        p.s.position.set(chim.x + p.t * 4 + Math.sin(p.t * 9) * 0.4, chim.y + p.t * 9, chim.z);
        const k = 0.7 + p.t * 3.2; p.s.scale.set(k, k, 1);
        p.s.material.opacity = Math.sin(p.t * Math.PI) * 0.3;
    }));

    // ---------------------------------------------------------------- falling snow + sparkles
    const SN = 1600, snowPos = new Float32Array(SN * 3), snow = [];
    for (let i = 0; i < SN; i++) snow.push({ x: (R() - 0.5) * 60, y: R() * 24, z: -30 + R() * 56, v: 0.5 + R() * 0.9, a: R() * TAU });
    const snowGeo = new THREE.BufferGeometry();
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
    scene.add(Object.assign(new THREE.Points(snowGeo, new THREE.PointsMaterial({ map: glowTex(), color: 0xeaf4ff, size: 0.2, transparent: true, opacity: 0.85, depthWrite: false })), { frustumCulled: false }));
    updates.push((dt, t) => {
        for (let i = 0; i < SN; i++) {
            const s = snow[i];
            s.y -= s.v * dt; s.a += dt * 0.5;
            if (s.y < 0) { s.y = 24; s.x = (R() - 0.5) * 60; }
            snowPos.set([s.x + Math.sin(s.a) * 0.6 + t * 0.15 % 60 * 0, s.y, s.z + Math.cos(s.a * 0.7) * 0.4], i * 3);
        }
        snowGeo.attributes.position.needsUpdate = true;
    });
    const spN = 260, spP = new Float32Array(spN * 3), spC = new Float32Array(spN * 3), spS = new Float32Array(spN);
    for (let i = 0; i < spN; i++) {
        const x = (R() - 0.5) * 36, z = -14 + R() * 24;
        spP.set([x, heightFn(x, z) + 0.05, z], i * 3);
        spC.set(R() < 0.5 ? [0.7, 0.95, 1] : [0.8, 1, 0.9], i * 3);
        spS[i] = 6 + R() * 10;
    }
    const sparkle = ZU.makeTwinkle({ positions: spP, colors: spC, sizes: spS, speed: 2.4 });
    scene.add(sparkle.points);
    updates.push((dt, t) => sparkle.update(t));

    // ---------------------------------------------------------------- shooting stars
    const meteorTex = canvasTex(256, 16, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, w, 0);
        gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.85, 'rgba(190,225,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
        g.fillStyle = gr; g.fillRect(0, h * 0.35, w, h * 0.3);
    });
    const meteor = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.9), new THREE.MeshBasicMaterial({ map: meteorTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    meteor.visible = false; meteor.frustumCulled = false;
    scene.add(meteor);
    let mT = -1, mWait = 3, mDir = 1, mStart = new THREE.Vector3();
    updates.push((dt) => {
        if (mT < 0) {
            mWait -= dt;
            if (mWait < 0) { mT = 0; mDir = Math.random() < 0.5 ? 1 : -1; mStart.set(-mDir * (60 + Math.random() * 60), 90 + Math.random() * 50, -230); meteor.visible = true; meteor.rotation.z = -mDir * 0.32; meteor.scale.x = mDir; }
        } else {
            mT += dt / 1.1;
            meteor.position.set(mStart.x + mDir * mT * 190, mStart.y - mT * 55, mStart.z);
            meteor.material.opacity = Math.sin(Math.min(1, mT) * Math.PI);
            if (mT >= 1) { mT = -1; meteor.visible = false; mWait = 6 + Math.random() * 10; }
        }
    });

    // ---------------------------------------------------------------- animals
    const fox = createArcticFox(); ZU.shadowAll(fox.mesh, true);
    fox.mesh.traverse(o => { if (o.isMesh && o.material && o.material.color) { o.material = o.material.clone(); o.material.color.multiplyScalar(0.82); } });
    const foxWrap = new THREE.Group(); foxWrap.position.set(0, 0, -3.2); foxWrap.scale.setScalar(1.2); foxWrap.add(fox.mesh); scene.add(foxWrap);
    const herd = createReindeerHerd(); ZU.shadowAll(herd.mesh, true); scene.add(herd.mesh);
    const owl = createOwl(); scene.add(owl.mesh);
    updates.push((dt) => { fox.update(dt); herd.update(dt); owl.update(dt); });

    // a couple wrapped up warm on a blanket, watching the aurora, with a small lantern
    const couple = ZCouple.makeCouple({ ground: true, outfit: 'winter', mat: true });
    couple.mesh.scale.setScalar(1.15);
    couple.mesh.position.set(4.9, 0.17 * 1.15, -4.0);
    couple.mesh.rotation.y = Math.PI + 0.25;
    ZU.shadowAll(couple.mesh, true);
    scene.add(couple.mesh);
    const camp = new THREE.Group(); camp.position.set(3.5, 0, -3.3);
    const lampBody = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc46b, side: THREE.DoubleSide }));
    lampBody.position.y = 0.14; camp.add(lampBody);
    const lampGlow = glowSprite(0xffb05a, 0.8, 0.4); lampGlow.position.y = 0.2; camp.add(lampGlow);
    const lampLight = new THREE.PointLight(0xffb86b, 0.9, 7, 2); lampLight.position.y = 0.5; camp.add(lampLight);
    scene.add(camp);
    updates.push((dt, t) => { couple.update(dt, t); lampLight.intensity = 0.85 + Math.sin(t * 6) * 0.1; });

    // ---------------------------------------------------------------- sky lanterns
    const lanterns = [];
    const lanternBodyGeo = new THREE.CylinderGeometry(0.34, 0.24, 0.62, 14, 1, true);
    function makeLantern(big) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(lanternBodyGeo, new THREE.MeshBasicMaterial({ color: 0xffa43a, side: THREE.DoubleSide, transparent: true, opacity: 0.95, fog: false }));
        g.add(body);
        const top = new THREE.Mesh(new THREE.CircleGeometry(0.34, 14), new THREE.MeshBasicMaterial({ color: 0xff8a2a, side: THREE.DoubleSide, fog: false }));
        top.rotation.x = Math.PI / 2; top.position.y = 0.31; g.add(top);
        const fl = glowSprite(0xff9a3c, big ? 1.5 : 1.8, big ? 0.5 : 0.9); fl.userData.base = fl.material.opacity; g.add(fl);
        return g;
    }
    // a festival of tiny far-away lanterns drifting upward
    for (let i = 0; i < 9; i++) {
        const g = makeLantern(false);
        const l = { g, x: (R() - 0.5) * 50, y: R() * 40, z: -26 - R() * 25, sp: 0.5 + R() * 0.6, ph: R() * 10, ambient: true, sc: 1.0 + R() * 0.8 };
        g.scale.setScalar(l.sc); scene.add(g); lanterns.push(l);
    }

    function launchLantern(wishText) {
        const g = makeLantern(true);
        const l = { g, x: (Math.random() - 0.5) * 3.5, y: 0.8, z: -2.5 + Math.random() * 1.5, sp: 1.15, ph: Math.random() * 10, age: 0, sc: 1.35 };
        g.position.set(l.x, l.y, l.z); g.scale.setScalar(l.sc);
        scene.add(g);
        if (wishText) {
            const el = document.createElement('div');
            el.className = 'lantern-wish';
            el.textContent = wishText;
            el.style.cssText = 'position:fixed;left:0;top:0;z-index:12;max-width:220px;text-align:center;font-size:13px;line-height:1.35;color:#ffe9b8;text-shadow:0 0 10px rgba(255,170,60,.9),0 1px 3px rgba(0,0,0,.7);pointer-events:none;transition:opacity .6s;opacity:0;font-style:italic;';
            document.body.appendChild(el);
            l.el = el;
            requestAnimationFrame(() => { el.style.opacity = '1'; });
        }
        lanterns.push(l);
    }

    const tmpV = new THREE.Vector3();
    updates.push((dt, t, ctx) => {
        for (let i = lanterns.length - 1; i >= 0; i--) {
            const l = lanterns[i];
            if (l.ambient) {
                l.y += dt * l.sp; if (l.y > 55) { l.y = 0; l.x = (R() - 0.5) * 50; }
                l.g.position.set(l.x + Math.sin(t * 0.3 + l.ph) * 1.4, l.y, l.z);
            } else {
                l.age += dt;
                l.y += dt * l.sp * (0.6 + Math.min(1, l.age * 0.2));
                const x = l.x + Math.sin(t * 0.7 + l.ph) * 0.5 + l.age * 0.12;
                l.g.position.set(x, l.y, l.z - l.age * 0.25);
                l.g.rotation.z = Math.sin(t * 0.9 + l.ph) * 0.08;
                const fade = l.age > 26 ? Math.max(0, 1 - (l.age - 26) / 4) : 1;
                l.g.children.forEach(c => { if (c.material) c.material.opacity = (c.userData.base !== undefined ? c.userData.base : 0.95) * fade; });
                if (l.el && ctx) {
                    tmpV.copy(l.g.position); tmpV.y += 0.9; tmpV.project(ctx.camera);
                    const sx = (tmpV.x * 0.5 + 0.5) * window.innerWidth, sy = (-tmpV.y * 0.5 + 0.5) * window.innerHeight;
                    l.el.style.transform = `translate(${sx - 110}px, ${sy - 28}px)`;
                    if (l.age > 12) l.el.style.opacity = String(Math.max(0, 1 - (l.age - 12) / 5));
                    if (tmpV.z > 1) l.el.style.opacity = '0';
                }
                if (l.age > 30) {
                    scene.remove(l.g); if (l.el) l.el.remove(); lanterns.splice(i, 1);
                }
            }
        }
    });

    return {
        scene,
        couple,
        update(dt, t, ctx) { updates.forEach(u => u(dt, t, ctx)); },
        launchLantern,
        cfg: {
            target: new THREE.Vector3(0, 2.9, -9), dist: 15.5, camY: 2.2, fov: 58,
            hoverYaw: 0.5, hoverPitch: 0.14, maxYaw: 1.35, minPitch: -0.08, maxPitch: 0.4,
            minCamY: 1.2, bloom: { strength: 0.85, radius: 0.8, threshold: 0.5 }, exposure: 1
        }
    };
}
window.buildAuroraScene = buildAuroraScene;
