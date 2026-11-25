/**
 * SCENE 4 - Dreamy cherry-blossom grove at dusk: koi pond, fawn, butterflies, fireflies, falling petals.
 */
function buildSakuraScene() {
    const { TAU, rand, rng, smooth, fbm, canvasTex, glowSprite, glowTex, stdMat, box, instanced } = ZU;
    const scene = new THREE.Scene();
    const R = rng(47);
    const updates = [];
    scene.fog = new THREE.FogExp2(0xf6c4d6, 0.017);

    // ---------------------------------------------------------------- sky
    scene.add(ZU.makeSky({ top: 0x6c5ab0, mid: 0xf0a2c4, horizon: 0xffd9bd, bottom: 0xffd9bd, midPos: 0.38 }));
    const sunGlow = glowSprite(0xffd9a0, 260, 0.75); sunGlow.position.set(-150, 70, -330); scene.add(sunGlow);
    scene.add(ZU.makeRidgeRing({ radius: 520, height: 120, y: -10, topColor: '#d9b4e0', baseColor: '#e4b8d4', seed: 2, base: 0.25, amp: 0.5 }));
    scene.add(ZU.makeRidgeRing({ radius: 470, height: 90, y: -8, topColor: '#c49ad2', baseColor: '#d7a2c6', seed: 6, base: 0.22, amp: 0.45 }));
    scene.add(ZU.makeRidgeRing({ radius: 420, height: 60, y: -6, topColor: '#a984c4', baseColor: '#c68db8', seed: 12, base: 0.18, amp: 0.4 }));

    // drifting clouds
    const clouds = [];
    for (let i = 0; i < 10; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZU.cloudTex(), color: i % 2 ? 0xffd2e2 : 0xffe9d2, transparent: true, opacity: 0.55, depthWrite: false, fog: false }));
        const w = 100 + R() * 120; s.scale.set(w, w * 0.22, 1);
        s.position.set((R() - 0.5) * 600, 70 + R() * 80, -250 - R() * 80);
        scene.add(s); clouds.push({ s, v: 0.4 + R() });
    }
    updates.push((dt) => clouds.forEach(c => { c.s.position.x += c.v * dt; if (c.s.position.x > 320) c.s.position.x = -320; }));

    // ---------------------------------------------------------------- lights
    scene.add(new THREE.HemisphereLight(0xffd6ec, 0x6a8a58, 0.5));
    scene.add(new THREE.AmbientLight(0xffe0ec, 0.12));
    const sun = new THREE.DirectionalLight(0xffd2a0, 0.85);
    sun.position.set(-16, 15, -2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 70;
    sun.shadow.bias = -0.0006;
    scene.add(sun);

    // ---------------------------------------------------------------- terrain with the pond carved in
    const pond = { x: 1.5, z: -1.5, rx: 3.9, rz: 3.1 };
    const heightFn = (x, z) => {
        const r = Math.hypot(x, z + 2);
        let h = (fbm(x * 0.05, z * 0.05, 4) - 0.45) * 5 * smooth(7, 26, r);
        h += smooth(40, 90, r) * fbm(x * 0.03 + 4, z * 0.03, 3) * 16;
        const d = ((x - pond.x) / pond.rx) ** 2 + ((z - pond.z) / pond.rz) ** 2;
        h += -0.6 * smooth(1.15, 0.4, d);
        return h;
    };
    const ground = ZU.makeTerrain({
        size: 200, seg: 300, flat: true, height: heightFn,
        color: (x, y, z, c) => {
            const n = fbm(x * 0.2, z * 0.2, 3), m = fbm(x * 0.05 + 7, z * 0.05, 2);
            c.setRGB(0.42 + n * 0.18 + m * 0.1, 0.66 + n * 0.14, 0.38 + n * 0.1);
            const d = ((x - pond.x) / pond.rx) ** 2 + ((z - pond.z) / pond.rz) ** 2;
            if (d < 1.4) c.lerp(new THREE.Color(0x8a7a5a), smooth(1.4, 1.05, d) * 0.7);
        }
    });
    scene.add(ground);

    // ---------------------------------------------------------------- pond water (shader with tap ripples)
    const rippleU = [new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99), new THREE.Vector3(0, 0, -99)];
    const waterMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uRip: { value: rippleU } },
        vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform float uTime; uniform vec3 uRip[4]; varying vec2 vUv; varying vec3 vW;
            void main(){
                vec2 p = vUv - 0.5; float r = length(p) * 2.0;
                vec3 deep = vec3(0.12, 0.45, 0.55), shallow = vec3(0.62, 0.88, 0.9);
                vec3 c = mix(shallow, deep, smoothstep(1.0, 0.15, r));
                float sh = 0.5 + 0.5 * sin(p.x * 26.0 + p.y * 17.0 + uTime * 0.9 + sin(p.y * 11.0 + uTime * 0.5) * 1.5);
                c += vec3(1.0, 0.72, 0.82) * 0.16 * sh;
                c += vec3(1.0) * pow(max(0.0, sin(p.x * 70.0 + uTime * 1.3) * sin(p.y * 62.0 - uTime)), 14.0) * 0.5;
                float ring = 0.0;
                for (int i = 0; i < 4; i++) {
                    float age = uTime - uRip[i].z;
                    if (age > 0.0 && age < 4.0) {
                        float d = distance(vW.xz, uRip[i].xy);
                        float front = age * 1.5;
                        ring += sin((d - front) * 16.0) * exp(-pow(d - front, 2.0) * 5.0) * (1.0 - age / 4.0);
                    }
                }
                c += vec3(1.0) * ring * 0.35;
                gl_FragColor = vec4(c, 0.55 * smoothstep(1.0, 0.92, r));
            }`,
        transparent: true, depthWrite: false
    });
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), waterMat);
    water.rotation.x = -Math.PI / 2; water.scale.set(pond.rx * 1.02, pond.rz * 1.02, 1);
    water.position.set(pond.x, 0.06, pond.z); water.renderOrder = 1;
    scene.add(water);
    // uniform vec3 uRip: we store (x, z, startTime) -> shader reads .xy as (x,z)
    let ripIdx = 0;
    function addRipple(x, z, t) { rippleU[ripIdx].set(x, z, t); ripIdx = (ripIdx + 1) % 4; }
    let lastT = 0;
    updates.push((dt, t) => { waterMat.uniforms.uTime.value = t; lastT = t; });

    // pond rim stones
    scene.add(instanced(new THREE.DodecahedronGeometry(0.4, 0), stdMat(0xffffff, 1, 0, { flatShading: true }), 34, (i, o, col) => {
        const a = (i / 34) * TAU + (R() - 0.5) * 0.1;
        const k = 1.06 + R() * 0.08;
        o.position.set(pond.x + Math.cos(a) * pond.rx * k, 0.05, pond.z + Math.sin(a) * pond.rz * k);
        o.scale.set(0.7 + R() * 0.9, 0.5 + R() * 0.5, 0.7 + R() * 0.9); o.rotation.set(R(), R() * TAU, R());
        const g = 0.62 + R() * 0.2; col.setRGB(g, g * 0.97, g * 1.05);
    }));
    // lily pads + lotus
    const padMat = new THREE.MeshStandardMaterial({ color: 0x5fb06e, roughness: 0.8, side: THREE.DoubleSide });
    for (let i = 0; i < 9; i++) {
        const a = R() * TAU, rr = 0.55 + R() * 0.4;
        const pad = new THREE.Mesh(new THREE.CircleGeometry(0.28 + R() * 0.2, 14, 0.3, TAU - 0.5), padMat);
        pad.rotation.x = -Math.PI / 2; pad.rotation.z = R() * TAU;
        pad.position.set(pond.x + Math.cos(a) * pond.rx * rr * 0.95, 0.075, pond.z + Math.sin(a) * pond.rz * rr * 0.95);
        scene.add(pad);
        if (i % 3 === 0) {
            const lotus = new THREE.Group(); lotus.position.copy(pad.position); lotus.position.y += 0.05;
            for (let k = 0; k < 8; k++) {
                const pt = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), new THREE.MeshStandardMaterial({ color: k % 2 ? 0xffc2d8 : 0xffa3c4, roughness: 0.7, emissive: 0xff7aa8, emissiveIntensity: 0.12 }));
                pt.scale.set(0.5, 1.2, 0.25); pt.position.set(Math.cos(k * TAU / 8) * 0.1, 0.1, Math.sin(k * TAU / 8) * 0.1);
                pt.rotation.set(Math.sin(k * TAU / 8) * 0.7, -k * TAU / 8, -Math.cos(k * TAU / 8) * 0.7); lotus.add(pt);
            }
            scene.add(lotus);
        }
    }

    // ---------------------------------------------------------------- sakura trees
    const petalCols = [0xffb3cd, 0xff9fc2, 0xffc6dc, 0xf98bb4, 0xffd5e4];
    const blobGeo = new THREE.IcosahedronGeometry(1, 1);
    const blobMats = petalCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: true, emissive: 0xff7aa8, emissiveIntensity: 0.1 }));
    const barkMat = stdMat(0x5a3d33, 1, 0, { flatShading: true });
    const Y = new THREE.Vector3(0, 1, 0);
    function sakuraTree(seed, s) {
        const r = rng(seed);
        const g = new THREE.Group();
        let x = 0, y = 0, lean = (r() - 0.5) * 0.5;
        for (let i = 0; i < 3; i++) {
            const len = 1.1 + r() * 0.5, rb = 0.4 - i * 0.09;
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(rb - 0.07, rb, len, 7), barkMat);
            cyl.position.set(x + Math.sin(lean) * len * 0.5, y + len / 2, 0); cyl.rotation.z = -lean;
            cyl.castShadow = true; g.add(cyl);
            x += Math.sin(lean) * len; y += len; lean += (r() - 0.5) * 0.45;
        }
        const top = new THREE.Vector3(x, y, 0);
        const ends = [top.clone().add(new THREE.Vector3(0, 0.6, 0))];
        const nb = 5;
        for (let i = 0; i < nb; i++) {
            const a = (i / nb) * TAU + r(), len = 1.6 + r() * 1.3;
            const dir = new THREE.Vector3(Math.cos(a) * 0.85, 0.55 + r() * 0.3, Math.sin(a) * 0.85).normalize();
            const br = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, len, 5), barkMat);
            br.position.copy(top).addScaledVector(dir, len / 2);
            br.quaternion.setFromUnitVectors(Y, dir); br.castShadow = true; g.add(br);
            ends.push(top.clone().addScaledVector(dir, len));
        }
        ends.forEach((e, i) => {
            const n = i === 0 ? 3 : 2;
            for (let k = 0; k < n; k++) {
                const b = new THREE.Mesh(blobGeo, blobMats[Math.floor(r() * blobMats.length)]);
                const rad = 1.0 + r() * 0.9;
                b.scale.set(rad, rad * 0.78, rad);
                b.position.set(e.x + (r() - 0.5) * 1.6, e.y + 0.3 + r() * 0.8, e.z + (r() - 0.5) * 1.6);
                b.castShadow = true; g.add(b);
            }
        });
        g.scale.setScalar(s);
        return g;
    }
    const treeSpots = [
        [-8.5, -5.5, 1.55], [9.8, -6, 1.45], [-13, -1, 1.25], [13.5, 0.5, 1.3], [-5, -13, 1.3], [3, -14.5, 1.5],
        [11, -13, 1.25], [-12, -12, 1.4], [6, -22, 1.6], [-9, -23, 1.55], [-19, -8, 1.5], [19, -9, 1.45],
        [-15, 6.5, 1.3], [15.5, 7.5, 1.3], [-24, -18, 1.7], [24, -19, 1.7], [-3, -32, 1.8], [0, 14, 1.4]
    ];
    const trees = treeSpots.map((p, i) => {
        const t = sakuraTree(100 + i * 13, p[2]);
        t.position.set(p[0], heightFn(p[0], p[1]), p[1]);
        t.rotation.y = R() * TAU;
        scene.add(t);
        return t;
    });
    updates.push((dt, t) => trees.forEach((tr, i) => { tr.rotation.z = Math.sin(t * 0.5 + i) * 0.006; }));

    // ---------------------------------------------------------------- grass tufts, flowers, ground petals
    const inPond = (x, z) => ((x - pond.x) / (pond.rx + 0.5)) ** 2 + ((z - pond.z) / (pond.rz + 0.5)) ** 2 < 1;
    const tufts = [];
    while (tufts.length < 2200) {
        const x = (R() - 0.5) * 50, z = -24 + R() * 30;
        if (inPond(x, z)) continue;
        tufts.push([x, z]);
    }
    scene.add(instanced(new THREE.ConeGeometry(0.06, 0.32, 4), stdMat(0xffffff, 1), tufts.length, (i, o, col) => {
        const [x, z] = tufts[i];
        o.position.set(x, heightFn(x, z) + 0.17, z); o.scale.set(1, 0.6 + R() * 1.1, 1); o.rotation.set((R() - 0.5) * 0.5, R() * TAU, (R() - 0.5) * 0.5);
        col.setRGB(0.35 + R() * 0.2, 0.62 + R() * 0.22, 0.3 + R() * 0.12);
    }));
    const flowerCols = [[1, 1, 1], [1, 0.8, 0.88], [1, 0.9, 0.4], [0.8, 0.7, 1]];
    scene.add(instanced(new THREE.SphereGeometry(0.075, 6, 5), new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: 0x442233, emissiveIntensity: 0.2 }), 380, (i, o, col) => {
        let x, z; do { x = (R() - 0.5) * 40; z = -18 + R() * 21; } while (inPond(x, z));
        o.position.set(x, heightFn(x, z) + 0.32 + R() * 0.12, z);
        const c = flowerCols[Math.floor(R() * flowerCols.length)]; col.setRGB(c[0], c[1], c[2]);
    }));
    scene.add(instanced(new THREE.CircleGeometry(0.1, 5), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 1, emissive: 0xff8fb5, emissiveIntensity: 0.15 }), 700, (i, o, col) => {
        let x, z; do { x = (R() - 0.5) * 36; z = -16 + R() * 28; } while (inPond(x, z));
        o.position.set(x, heightFn(x, z) + 0.05, z); o.rotation.set(-Math.PI / 2, 0, R() * TAU); o.scale.set(1, 0.7, 1);
        const c = new THREE.Color(petalCols[Math.floor(R() * petalCols.length)]); col.copy(c);
    }));

    // ---------------------------------------------------------------- stone lantern (toro)
    const toro = new THREE.Group(); toro.position.set(6.0, heightFn(6, 0.4), 0.4);
    const stone = stdMat(0x9a96a4, 0.95, 0, { flatShading: true });
    box(toro, 0.9, 0.2, 0.9, stone, 0, 0.1, 0);
    const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 8), stone); col1.position.y = 0.65; col1.castShadow = true; toro.add(col1);
    box(toro, 0.8, 0.12, 0.8, stone, 0, 1.16, 0);
    box(toro, 0.5, 0.5, 0.5, new THREE.MeshBasicMaterial({ color: 0xffc46b }), 0, 1.47, 0, false);
    [[0.27, 0], [-0.27, 0], [0, 0.27], [0, -0.27]].forEach(p => box(toro, p[0] ? 0.06 : 0.58, 0.58, p[1] ? 0.06 : 0.58, stone, p[0], 1.47, p[1]));
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.48, 4), stone); cap.position.y = 1.96; cap.rotation.y = Math.PI / 4; cap.castShadow = true; toro.add(cap);
    const jewel = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), stone); jewel.position.y = 2.28; toro.add(jewel);
    toro.scale.setScalar(1.15);
    scene.add(toro);
    const toroLight = new THREE.PointLight(0xffb86b, 1.5, 9, 2); toroLight.position.set(6.0, 1.9, 0.9); scene.add(toroLight);
    const toroGlow = glowSprite(0xffb86b, 2.8, 0.7); toroGlow.position.set(6.0, 1.75, 0.5); scene.add(toroGlow);
    updates.push((dt, t) => { toroLight.intensity = 1.35 + Math.sin(t * 5.3) * 0.12 + Math.sin(t * 13) * 0.05; });

    // a bench behind the pond with a couple sitting under the falling petals
    const bench = new THREE.Group(); bench.position.set(1.7, heightFn(1.7, -5.9), -5.9);
    const benchWood = stdMat(0x8a5a38, 0.9, 0, { flatShading: true });
    box(bench, 1.9, 0.08, 0.5, benchWood, 0, 0.45, 0);
    box(bench, 1.9, 0.5, 0.06, benchWood, 0, 0.82, -0.3).rotation.x = -0.12;
    [[-0.8, -0.18], [0.8, -0.18], [-0.8, 0.18], [0.8, 0.18]].forEach(p => box(bench, 0.08, 0.45, 0.08, benchWood, p[0], 0.225, p[1]));
    const couple = ZCouple.makeCouple({ outfit: 'spring' });
    couple.mesh.scale.setScalar(1.2); couple.mesh.position.set(0, 0.61, -0.03);
    ZU.shadowAll(couple.mesh, true);
    bench.add(couple.mesh);
    scene.add(bench);
    updates.push((dt, t) => couple.update(dt, t));

    // ---------------------------------------------------------------- torii gate in the mist
    const torii = new THREE.Group(); torii.position.set(0, heightFn(0, -27), -27);
    const red = stdMat(0xd9382f, 0.7), blk = stdMat(0x1f1a1c, 0.8);
    [-2.5, 2.5].forEach(px => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 4.8, 12), red); p.position.set(px, 2.4, 0); p.castShadow = true; torii.add(p);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.45, 12), blk); base.position.set(px, 0.22, 0); torii.add(base);
    });
    box(torii, 5.2, 0.28, 0.3, red, 0, 3.9, 0);
    const kasagi = box(torii, 7.4, 0.4, 0.6, blk, 0, 4.85, 0);
    box(torii, 7.8, 0.14, 0.7, red, 0, 5.1, 0);
    torii.scale.setScalar(2.2);
    scene.add(torii);

    // ---------------------------------------------------------------- falling petals
    const PN = 650;
    const petalGeo = new THREE.PlaneGeometry(0.16, 0.11);
    const petals = new THREE.InstancedMesh(petalGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6, emissive: 0xff8fb5, emissiveIntensity: 0.35 }), PN);
    petals.frustumCulled = false;
    const pd = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < PN; i++) {
        pd.push({ x: (R() - 0.5) * 44, y: R() * 12, z: -20 + R() * 36, v: 0.35 + R() * 0.5, a: R() * TAU, rs: 1 + R() * 2.5, sw: 0.4 + R() * 0.8 });
        petals.setColorAt(i, new THREE.Color(petalCols[Math.floor(R() * petalCols.length)]));
    }
    petals.instanceColor.needsUpdate = true;
    scene.add(petals);
    updates.push((dt, t) => {
        for (let i = 0; i < PN; i++) {
            const p = pd[i];
            p.y -= p.v * dt; p.x += (0.45 + Math.sin(t * 0.4 + p.a) * 0.25) * dt;
            if (p.y < 0.05) { p.y = 10 + R() * 4; p.x = (R() - 0.5) * 44; p.z = -20 + R() * 36; }
            if (p.x > 24) p.x = -24;
            dummy.position.set(p.x + Math.sin(t * p.sw + p.a) * 0.6, p.y, p.z + Math.cos(t * p.sw * 0.8 + p.a) * 0.5);
            dummy.rotation.set(t * p.rs + p.a, t * p.rs * 0.7, t * p.rs * 0.4);
            dummy.updateMatrix(); petals.setMatrixAt(i, dummy.matrix);
        }
        petals.instanceMatrix.needsUpdate = true;
    });

    const polaroids = ZU.addPolaroids(scene, [
        { pos: [-2.7, heightFn(-2.7, 2.5) + 0.3, 2.5], rot: [-0.35, 0.55, 0], scale: 1.0, w: 0.55 },
        { pos: [-2.15, heightFn(-2.15, 2.8) + 0.3, 2.8], rot: [-0.35, 0.8, 0], scale: 0.95, w: 0.55 }
    ]);
    updates.push((dt, t) => ZU.swayPolaroids(polaroids, t));

    const weather = {
        names: ['Hoa rơi nhiều', 'Hoa rơi nhẹ', 'Lặng gió'], index: 0,
        set(i) { this.index = i; petals.count = Math.floor(PN * [1, 0.3, 0][i]); }
    };

    // ---------------------------------------------------------------- fireflies
    const FN = 110, fPos = new Float32Array(FN * 3), fCol = new Float32Array(FN * 3), fSize = new Float32Array(FN), fd = [];
    for (let i = 0; i < FN; i++) {
        fd.push({ x: (R() - 0.5) * 30, y: 0.4 + R() * 3.2, z: -14 + R() * 22, a: R() * TAU, s: 0.2 + R() * 0.4 });
        const c = R() < 0.7 ? [1, 0.95, 0.5] : [0.8, 1, 0.6]; fCol.set(c, i * 3); fSize[i] = 20 + R() * 20;
    }
    const flies = ZU.makeTwinkle({ positions: fPos, colors: fCol, sizes: fSize, speed: 2.0 });
    scene.add(flies.points);
    updates.push((dt, t) => {
        flies.update(t);
        const arr = flies.points.geometry.attributes.position;
        fd.forEach((f, i) => {
            f.a += dt * f.s;
            fPos[i * 3] = f.x + Math.sin(f.a * 1.3) * 1.2; fPos[i * 3 + 1] = f.y + Math.sin(f.a * 2.1) * 0.4; fPos[i * 3 + 2] = f.z + Math.cos(f.a) * 1.2;
        });
        arr.needsUpdate = true;
    });

    // ---------------------------------------------------------------- god rays
    const rayTex = canvasTex(64, 256, (g, w, h) => {
        const gx = g.createLinearGradient(0, 0, w, 0);
        gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gx; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'destination-in';
        const gy = g.createLinearGradient(0, 0, 0, h);
        gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.25, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gy; g.fillRect(0, 0, w, h);
    });
    const rays = [];
    for (let i = 0; i < 6; i++) {
        const from = new THREE.Vector3(-22 + i * 2.2, 22, -4 - i * 1.5), to = new THREE.Vector3(-6 + i * 3.4, 0, -2 + i);
        const dir = to.clone().sub(from), len = dir.length(); dir.normalize();
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2 + R() * 3, len), new THREE.MeshBasicMaterial({ map: rayTex, color: 0xffe2b8, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        m.position.copy(from).addScaledVector(dir, len / 2);
        m.quaternion.setFromUnitVectors(Y, dir);
        scene.add(m); rays.push({ m, ph: R() * 10 });
    }
    updates.push((dt, t) => rays.forEach(r => { r.m.material.opacity = 0.075 + 0.04 * Math.sin(t * 0.35 + r.ph); }));

    // ---------------------------------------------------------------- animals
    const kois = [];
    [[0, 1.0], [4.2, 0.85], [8.6, 1.1]].forEach(k => {
        const koi = createKoiFish(); koi.update(k[0]); koi.mesh.scale.setScalar(k[1]); ZU.shadowAll(koi.mesh, false); scene.add(koi.mesh); kois.push(koi);
    });
    const fawn = createGrazingFawn(); ZU.shadowAll(fawn.mesh, true); fawn.mesh.scale.setScalar(1.25); scene.add(fawn.mesh);
    const butter = createButterflies(6); scene.add(butter.mesh);
    updates.push((dt) => { kois.forEach(k => k.update(dt)); fawn.update(dt); butter.update(dt); });

    return {
        scene,
        couple,
        weather,
        polaroids,
        update(dt, t) { updates.forEach(u => u(dt, t)); },
        onTap(pt, t) {
            const d = ((pt.x - pond.x) / pond.rx) ** 2 + ((pt.z - pond.z) / pond.rz) ** 2;
            if (d < 1.1) addRipple(pt.x, pt.z, lastT);
        },
        cfg: {
            target: new THREE.Vector3(0.4, 1.5, -3), dist: 12.5, camY: 3.4, fov: 52,
            hoverYaw: 0.5, hoverPitch: 0.13, maxYaw: 1.3, minPitch: -0.1, maxPitch: 0.38,
            minCamY: 1.1, bloom: { strength: 0.4, radius: 0.85, threshold: 0.88 }, exposure: 1
        }
    };
}
window.buildSakuraScene = buildSakuraScene;
