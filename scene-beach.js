/**
 * SCENE 3 - Golden sunset beach: glittering sea, palms, campfire, picnic, gulls, crab, dolphin.
 */
function buildBeachScene() {
    const { TAU, rand, rng, smooth, fbm, canvasTex, glowSprite, glowTex, cloudTex, stdMat, box, instanced } = ZU;
    const scene = new THREE.Scene();
    const R = rng(33);
    const updates = [];

    const HOR = 0xffa266;
    scene.fog = new THREE.Fog(0xffb883, 60, 260);

    // ---------------------------------------------------------------- sky + sun
    scene.add(ZU.makeSky({ top: 0x2a1a5e, mid: 0xc4508a, horizon: HOR, bottom: 0xffa266, midPos: 0.32 }));
    const sunPos = new THREE.Vector3(0, 9, -300);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshBasicMaterial({ color: 0xfff2c4, fog: false }));
    sun.position.copy(sunPos); scene.add(sun);
    const sunGlow1 = glowSprite(0xffc47a, 120, 0.5); sunGlow1.position.copy(sunPos).add(new THREE.Vector3(0, 0, 4)); scene.add(sunGlow1);
    const sunGlow2 = glowSprite(0xff7a8a, 400, 0.3); sunGlow2.position.copy(sunPos).add(new THREE.Vector3(0, 0, 6)); scene.add(sunGlow2);

    // clouds
    const clouds = [];
    const cloudCols = [0xffb8a0, 0xff9aa8, 0xffd6a8, 0xe08ab4, 0xffc89a];
    for (let i = 0; i < 18; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex(), color: cloudCols[i % cloudCols.length], transparent: true, opacity: 0.55 + R() * 0.35, depthWrite: false, fog: false }));
        const w = 90 + R() * 130;
        s.scale.set(w, w * 0.22, 1);
        s.position.set((R() - 0.5) * 520, 22 + R() * 70 + (i % 3) * 8, -230 - R() * 60);
        scene.add(s); clouds.push({ s, v: 0.5 + R() * 1.2, base: s.material.opacity });
    }
    updates.push((dt) => clouds.forEach(c => { c.s.position.x += c.v * dt; if (c.s.position.x > 290) c.s.position.x = -290; }));

    // distant islands
    scene.add(ZU.makeRidgeRing({ radius: 520, height: 26, y: -2, topColor: '#7a4a78', baseColor: '#5a3566', seed: 5, base: 0.0, amp: 0.55, freqs: [3, 5, 9] }));

    // ---------------------------------------------------------------- sea (shader)
    const seaMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uHor: { value: new THREE.Color(0xff9a68) },
            uNear: { value: new THREE.Color(0x2f8fa3) },
            uDeep: { value: new THREE.Color(0x1b3f73) },
            uSun: { value: new THREE.Color(0xffe1a0) },
            uCam: { value: new THREE.Vector3() }
        },
        vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform float uTime; uniform vec3 uHor; uniform vec3 uNear; uniform vec3 uDeep; uniform vec3 uSun; uniform vec3 uCam; varying vec3 vW;
            float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
                return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
            void main(){
                float dist = length(vW - uCam);
                float zf = clamp((-vW.z - 4.0) / 90.0, 0.0, 1.0);
                vec3 base = mix(uNear, uDeep, smoothstep(0.0, 0.55, zf));
                float rip = n(vW.xz * vec2(0.9, 2.6) + vec2(uTime * 0.25, uTime * 0.5)) + n(vW.xz * vec2(2.1, 5.0) - vec2(uTime * 0.2, uTime * 0.35)) * 0.6;
                base += (rip - 0.8) * 0.12;
                float fres = smoothstep(4.0, 130.0, dist);
                vec3 col = mix(base, uHor, fres * 0.9);
                float path = exp(-pow(vW.x / (3.0 + (-vW.z) * 0.16), 2.0));
                float sparkle = smoothstep(0.78, 0.98, n(vW.xz * vec2(1.6, 5.5) + vec2(uTime * 0.35, -uTime * 0.9)));
                col += uSun * path * smoothstep(12.0, 120.0, dist) * (0.45 + sparkle * 2.0);
                col += uHor * exp(-pow(vW.x / 90.0, 2.0)) * smoothstep(20.0, 200.0, dist) * 0.35;
                float fogk = smoothstep(240.0, 520.0, dist);
                col = mix(col, uHor, fogk);
                gl_FragColor = vec4(col, 1.0);
            }`
    });
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1400, 800, 1, 1), seaMat);
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0, -403);   // covers z in [-803, -3]
    scene.add(sea);
    updates.push((dt, t, ctx) => { seaMat.uniforms.uTime.value = t; if (ctx) seaMat.uniforms.uCam.value.copy(ctx.camera.position); });

    // foam line lapping at the shore
    const foamMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uTime; varying vec2 vUv;
            float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
                return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
            void main(){
                float wave = 0.5 + 0.5 * sin(uTime * 0.55);
                float edge = 0.12 + wave * 0.7 + (n(vec2(vUv.x * 14.0, uTime * 0.3)) - 0.5) * 0.18;
                float front = smoothstep(edge - 0.07, edge, vUv.y) * (1.0 - smoothstep(edge, edge + 0.025, vUv.y));
                float wash = (1.0 - smoothstep(0.0, edge, vUv.y)) * 0.0;
                float trail = smoothstep(edge, edge - 0.5, vUv.y) * smoothstep(0.0, 0.1, vUv.y) * 0.18 * (0.6 + 0.4 * n(vec2(vUv.x * 30.0, vUv.y * 6.0)));
                float a = clamp(front * (0.55 + 0.45 * n(vec2(vUv.x * 40.0, uTime))) + trail, 0.0, 1.0);
                gl_FragColor = vec4(vec3(1.0, 0.96, 0.92), a * 0.85);
            }`,
        transparent: true, depthWrite: false
    });
    const foam = new THREE.Mesh(new THREE.PlaneGeometry(200, 3.6), foamMat);
    foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.06, -1.6);
    foam.renderOrder = 2;
    // plane's local +Y is world -Z, so uv.y=1 is the sea side; flip to make waves roll toward land
    foam.rotation.z = Math.PI;
    scene.add(foam);
    updates.push((dt, t) => { foamMat.uniforms.uTime.value = t; });

    // ---------------------------------------------------------------- sand
    const sandH = (x, z) => {
        let h = -0.12 + 0.17 * smooth(3, -3.5, z);
        if (z < -3.5) h = 0.05 - (-3.5 - z) * 0.22;
        h += (fbm(x * 0.12, z * 0.12, 3) - 0.5) * 0.35 * smooth(-1, 8, z);
        h += smooth(13, 34, Math.abs(x)) * (2.5 + fbm(x * 0.07, z * 0.07, 3) * 6) * smooth(-4, 3, z);
        h += smooth(22, 55, z) * 3;
        return h;
    };
    const sand = ZU.makeTerrain({
        size: 160, seg: 260, flat: false, height: sandH,
        color: (x, y, z, c) => {
            const wet = smooth(0.0, -0.4, y) + smooth(-3.0, -4.5, z);
            const n = fbm(x * 0.4, z * 0.4, 2);
            c.setRGB(0.93 + n * 0.06, 0.78 + n * 0.08, 0.55 + n * 0.1);
            c.lerp(new THREE.Color(0x9c7048), Math.min(1, wet) * 0.8);
        }
    });
    sand.position.z = 40;   // covers z in [-40, 120]
    // ground function is evaluated in local space, so rebuild using world offsets
    (function reshape() {
        const pos = sand.geometry.attributes.position;
        const cols = sand.geometry.attributes.color;
        const c = new THREE.Color();
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), z = pos.getZ(i) + 40;
            const y = sandH(x, z);
            pos.setY(i, y);
            const wet = smooth(0.0, -0.4, y) + smooth(-3.0, -4.5, z);
            const n = fbm(x * 0.4, z * 0.4, 2);
            c.setRGB(0.82 + n * 0.06, 0.64 + n * 0.08, 0.44 + n * 0.1);
            c.lerp(new THREE.Color(0x8a6040), Math.min(1, wet) * 0.8);
            cols.setXYZ(i, c.r, c.g, c.b);
        }
        sand.geometry.computeVertexNormals();
        pos.needsUpdate = true; cols.needsUpdate = true;
    })();
    scene.add(sand);

    // scattered shells & pebbles
    scene.add(instanced(new THREE.DodecahedronGeometry(0.16, 0), stdMat(0xffffff, 0.8, 0, { flatShading: true }), 90, (i, o, col) => {
        const x = (R() - 0.5) * 36, z = -3.4 + R() * 16;
        o.position.set(x, sandH(x, z) + 0.04, z); o.scale.set(0.5 + R(), 0.35 + R() * 0.4, 0.5 + R()); o.rotation.set(R(), R() * TAU, R());
        const k = R();
        if (k < 0.4) col.setRGB(1, 0.9, 0.85); else if (k < 0.7) col.setRGB(0.95, 0.65, 0.6); else col.setRGB(0.6, 0.55, 0.55);
    }));

    // ---------------------------------------------------------------- lights
    scene.add(new THREE.HemisphereLight(0xffc29a, 0x7a4a3a, 0.5));
    const sunLight = new THREE.DirectionalLight(0xffa464, 0.95);
    sunLight.position.set(0, 14, -32);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    const scm = sunLight.shadow.camera; scm.left = -18; scm.right = 18; scm.top = 16; scm.bottom = -16; scm.near = 1; scm.far = 90;
    sunLight.shadow.bias = -0.0006;
    scene.add(sunLight);
    scene.add(sunLight.target);
    sunLight.target.position.set(0, 0, 4);

    // ---------------------------------------------------------------- palm trees
    function makePalm(h, lean, seed) {
        const r = rng(seed);
        const g = new THREE.Group();
        const pts = [];
        for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(new THREE.Vector3(Math.sin(u * 1.4) * lean * u, u * h, Math.sin(u * 3) * 0.3)); }
        const curve = new THREE.CatmullRomCurve3(pts);
        const trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.2, 7, false), stdMat(0x8a6a48, 0.95, 0, { flatShading: true }));
        trunk.castShadow = true; g.add(trunk);
        const top = pts[pts.length - 1];
        const crown = new THREE.Group(); crown.position.copy(top); g.add(crown);
        const fronds = [];
        const N = 10;
        for (let i = 0; i < N; i++) {
            const L = 3.4 + r() * 0.9;
            const geo = new THREE.PlaneGeometry(1.1, L, 4, 14);
            const pa = geo.attributes.position;
            const colors = new Float32Array(pa.count * 3);
            for (let k = 0; k < pa.count; k++) {
                const u = Math.max(0, Math.min(1, (pa.getY(k) + L / 2) / L));
                const wx = pa.getX(k) * (1 - 0.86 * Math.pow(u, 1.4));
                const fringe = 1 - 0.28 * Math.abs(Math.sin(u * 46)) * (Math.abs(pa.getX(k)) > 0.2 ? 1 : 0);
                pa.setXYZ(k, wx, Math.sin(u * 2.3) * 0.5 - Math.pow(u, 2) * 1.5, L * u * fringe);
                const gcol = new THREE.Color().setHSL(0.30 - u * 0.04, 0.55, 0.22 + u * 0.12);
                colors.set([gcol.r, gcol.g, gcol.b], k * 3);
            }
            geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geo.computeVertexNormals();
            const f = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8, flatShading: true }));
            f.castShadow = true;
            const pivot = new THREE.Group();
            pivot.rotation.y = (i / N) * TAU + r() * 0.3;
            pivot.rotation.x = -0.25 - r() * 0.2;
            pivot.add(f); crown.add(pivot);
            fronds.push({ pivot, base: pivot.rotation.x, ph: r() * 6 });
        }
        for (let i = 0; i < 3; i++) {
            const c = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), stdMat(0x4a3322, 0.8));
            c.position.set(Math.cos(i * 2.1) * 0.22, -0.2, Math.sin(i * 2.1) * 0.22); crown.add(c);
        }
        g.userData.fronds = fronds; g.userData.crown = crown;
        return g;
    }
    const palms = [];
    [[-8.5, -0.5, 6.5, 2.2, 1], [9.5, 1.5, 7.2, -2.4, 2], [-13, 5, 6.2, 1.6, 3], [14, -2, 5.8, -1.5, 4], [-5, -2.2, 4.6, 1.2, 5]].forEach(p => {
        const palm = makePalm(p[2], p[3], p[4]);
        palm.position.set(p[0], sandH(p[0], p[1]) - 0.1, p[1]);
        palm.rotation.y = R() * TAU;
        scene.add(palm); palms.push(palm);
    });
    updates.push((dt, t) => palms.forEach((p, k) => {
        p.userData.crown.rotation.z = Math.sin(t * 0.5 + k) * 0.03;
        p.userData.fronds.forEach(f => { f.pivot.rotation.x = f.base + Math.sin(t * 0.9 + f.ph) * 0.05; });
    }));

    // ---------------------------------------------------------------- campfire
    const campfire = ZU.makeFire({ scale: 1.2, intensity: 2.0, distance: 14 });
    const cfPos = new THREE.Vector3(4.6, sandH(4.6, 0.8), 0.8);
    campfire.group.position.copy(cfPos);
    scene.add(campfire.group);
    updates.push(campfire.update);
    const stones = instanced(new THREE.DodecahedronGeometry(0.2, 0), stdMat(0x6a5a52, 1, 0, { flatShading: true }), 9, (i, o, col) => {
        const a = (i / 9) * TAU; o.position.set(cfPos.x + Math.cos(a) * 0.7, cfPos.y + 0.08, cfPos.z + Math.sin(a) * 0.7); o.scale.set(1, 0.7, 1); o.rotation.set(R(), R(), R()); return false;
    });
    scene.add(stones);
    // log seats
    [[3.2, 2.0, 0.6], [6.1, 2.3, -0.5]].forEach(l => {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.6, 10), stdMat(0x6b4a30, 1));
        log.rotation.z = Math.PI / 2; log.rotation.y = l[2];
        log.position.set(l[0], sandH(l[0], l[1]) + 0.26, l[1]); log.castShadow = true; scene.add(log);
    });

    // ---------------------------------------------------------------- picnic blanket for two
    const px = -2.6, pz = 2.4;
    const py = sandH(px, pz) + 0.03;
    const picTex = canvasTex(128, 128, (g, w, h) => {
        g.fillStyle = '#f5e7d3'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#e07a7a'; for (let i = 0; i < 4; i++) { g.fillRect(i * 32, 0, 16, h); }
        g.globalCompositeOperation = 'multiply'; g.fillStyle = '#e8a0a0'; for (let i = 0; i < 4; i++) { g.fillRect(0, i * 32, w, 16); }
    });
    const blanket = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 2.2), new THREE.MeshStandardMaterial({ map: picTex, roughness: 1 }));
    blanket.position.set(px, py, pz); blanket.rotation.y = 0.18; blanket.receiveShadow = true; scene.add(blanket);
    const pic = new THREE.Group(); pic.position.set(px, py, pz); pic.rotation.y = 0.18; scene.add(pic);
    // the couple watches the sunset from the blanket
    const couple = ZCouple.makeCouple({ ground: true, outfit: 'summer' });
    couple.mesh.scale.setScalar(1.2);
    couple.mesh.position.set(-0.3, 0.17 * 1.2 + 0.03, 0.35);
    couple.mesh.rotation.y = Math.PI;
    ZU.shadowAll(couple.mesh, true);
    pic.add(couple.mesh);
    updates.push((dt, t) => couple.update(dt, t));
    // basket
    box(pic, 0.6, 0.34, 0.42, stdMat(0xa8744a, 1), 0.85, 0.2, -0.3);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 14, Math.PI), stdMat(0x7a4f2e, 1)); handle.position.set(0.85, 0.37, -0.3); pic.add(handle);
    // two glasses of juice
    [[0.35, -0.55], [0.58, -0.42]].forEach(p => {
        const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.2, 10), new THREE.MeshStandardMaterial({ color: 0xffc27a, transparent: true, opacity: 0.75, roughness: 0.1 }));
        gl.position.set(p[0], 0.13, p[1]); pic.add(gl);
    });
    // lantern on the blanket
    const lanternLight = new THREE.PointLight(0xffb86b, 1.1, 8, 2); lanternLight.position.set(-0.9, 0.7, -0.5); pic.add(lanternLight);
    const lant = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.38, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    lant.position.set(-0.9, 0.24, -0.5); pic.add(lant);
    const lg = glowSprite(0xffb86b, 1.5, 0.8); lg.position.set(-0.9, 0.3, -0.5); pic.add(lg);
    updates.push((dt, t) => { lanternLight.intensity = 1.0 + Math.sin(t * 7) * 0.12; lg.material.opacity = 0.7 + Math.sin(t * 6) * 0.1; });

    const polaroids = ZU.addPolaroids(pic, [
        { pos: [0.2, 0.3, -0.95], rot: [-0.3, 0.2, 0], scale: 1.05 },
        { pos: [0.55, 0.28, -0.9], rot: [-0.3, -0.25, 0], scale: 1.0 }
    ]);
    updates.push((dt, t) => ZU.swayPolaroids(polaroids, t));

    const weather = {
        names: ['Mây hồng', 'Mây thưa', 'Trời quang'], index: 0,
        set(i) { this.index = i; const m = [1, 0.35, 0.05][i]; clouds.forEach(c => { c.s.material.opacity = c.base * m; }); }
    };

    // wooden sign stuck in the sand: "A ♥ B"
    const sign = ZU.makeSign(ZU.signParts());
    sign.position.set(0.9, sandH(0.9, 1.0) - 0.05, 1.0); sign.rotation.y = -0.25; sign.scale.setScalar(1.15);
    scene.add(sign);

    // beach umbrella
    const umb = new THREE.Group(); umb.position.set(-7.2, sandH(-7.2, 3.5), 3.5); umb.rotation.z = 0.12;
    umb.add(ZU.at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 6), stdMat(0xe8dcc8, 0.6)), 0, 1.4, 0));
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.9, 0.7, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xff7e8c, side: THREE.DoubleSide, roughness: 0.9, flatShading: true }));
    canopy.position.y = 2.7; canopy.castShadow = true; umb.add(canopy);
    const stripes = new THREE.Mesh(new THREE.ConeGeometry(1.92, 0.72, 12, 1, true, 0, 0.52), new THREE.MeshStandardMaterial({ color: 0xfff1d8, side: THREE.DoubleSide, flatShading: true }));
    stripes.position.y = 2.7; umb.add(stripes);
    scene.add(umb);

    // floating sea lanterns near the shoreline
    const seaLanterns = [];
    for (let i = 0; i < 7; i++) {
        const g = new THREE.Group();
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.3), new THREE.MeshBasicMaterial({ color: 0xffb24a }));
        g.add(b);
        const gl = glowSprite(0xffa64a, 1.4, 0.8); g.add(gl);
        g.position.set(-6 + R() * 12, 0.12, -7 - R() * 14);
        scene.add(g); seaLanterns.push({ g, ph: R() * 10 });
    }
    updates.push((dt, t) => seaLanterns.forEach(l => { l.g.position.y = 0.12 + Math.sin(t * 1.1 + l.ph) * 0.05; l.g.position.x += Math.sin(t * 0.2 + l.ph) * 0.002; }));

    // ---------------------------------------------------------------- animals
    const gulls = createSeagullFlock(7); ZU.shadowAll(gulls.mesh, false); scene.add(gulls.mesh);
    const crab = createCrab(); ZU.shadowAll(crab.mesh, true); crab.mesh.scale.setScalar(1.6); crab.mesh.position.y = sandH(1.8, 3.2) + 0.1; scene.add(crab.mesh);
    const dolphin = createDolphin(); ZU.shadowAll(dolphin.mesh, false); dolphin.mesh.scale.setScalar(1.6); scene.add(dolphin.mesh);
    updates.push((dt) => {
        gulls.update(dt); crab.update(dt); dolphin.update(dt);
        if (Math.abs(crab.mesh.position.x) > 5) crab.mesh.position.x = Math.sign(crab.mesh.position.x) * 5;
        crab.mesh.position.y = sandH(crab.mesh.position.x, crab.mesh.position.z) + 0.1;
    });

    return {
        scene,
        couple,
        weather,
        polaroids,
        update(dt, t, ctx) { updates.forEach(u => u(dt, t, ctx)); },
        cfg: {
            target: new THREE.Vector3(0, 2.0, -8), dist: 19, camY: 3.6, fov: 54,
            hoverYaw: 0.45, hoverPitch: 0.12, maxYaw: 1.3, minPitch: -0.1, maxPitch: 0.35,
            minCamY: 0.9, bloom: { strength: 0.5, radius: 0.8, threshold: 0.85 }, exposure: 1
        }
    };
}
window.buildBeachScene = buildBeachScene;
