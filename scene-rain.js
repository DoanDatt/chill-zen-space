/**
 * SCENE 1 - Cozy attic: rain on the window, crackling fireplace, sleeping cat.
 */
function buildRainScene() {
    const { TAU, rand, rng, canvasTex, glowSprite, glowTex, stdMat, box, instanced } = ZU;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a14);

    const R = rng(11);
    const updates = [];

    // ---------------------------------------------------------------- lights
    scene.add(new THREE.AmbientLight(0x5a5478, 0.75));
    scene.add(new THREE.HemisphereLight(0x7d8cc4, 0x3a2216, 0.55));
    const moon = new THREE.DirectionalLight(0x8aa6e0, 0.55);
    moon.position.set(0, 7, -12);
    scene.add(moon);

    // ---------------------------------------------------------------- textures
    const woodTex = canvasTex(512, 512, (g, w, h) => {
        const rows = 8;
        for (let i = 0; i < rows; i++) {
            const y = (i * h) / rows;
            const l = 28 + R() * 10;
            g.fillStyle = `hsl(${24 + R() * 5},46%,${l}%)`;
            g.fillRect(0, y, w, h / rows);
            for (let k = 0; k < 14; k++) {
                g.strokeStyle = `rgba(30,15,6,${0.05 + R() * 0.08})`;
                g.beginPath(); g.moveTo(0, y + R() * (h / rows)); g.lineTo(w, y + R() * (h / rows)); g.stroke();
            }
            g.fillStyle = 'rgba(20,10,4,0.55)'; g.fillRect(0, y, w, 2);
            const cut = R() * w;
            g.fillRect(cut, y, 2, h / rows);
        }
    });
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(3, 3);

    const wallTex = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#4b3329'; g.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 32) { g.fillStyle = 'rgba(255,220,180,0.045)'; g.fillRect(x, 0, 16, h); }
        for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${R() * 0.05})`; g.fillRect(R() * w, R() * h, 2, 2); }
    });
    wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
    wallTex.repeat.set(5, 2);

    const brickTex = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#3a312d'; g.fillRect(0, 0, w, h);
        const bh = 32, bw = 64;
        for (let r = 0; r < h / bh; r++) {
            for (let c = -1; c < w / bw + 1; c++) {
                const x = c * bw + (r % 2) * (bw / 2);
                const l = 36 + R() * 14;
                g.fillStyle = `hsl(${15 + R() * 15},${18 + R() * 10}%,${l}%)`;
                g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4);
            }
        }
    });
    brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping;

    // ---------------------------------------------------------------- room shell
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95, color: 0xffffff });
    const trimMat = stdMat(0x24160f, 0.7);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.8, metalness: 0 }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 1);
    floor.receiveShadow = true;
    scene.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), stdMat(0x2a1d18, 1));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 6, 1);
    scene.add(ceil);

    const sideL = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    sideL.rotation.y = Math.PI / 2; sideL.position.set(-8, 3, 1); scene.add(sideL);
    const sideR = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), wallMat);
    sideR.rotation.y = -Math.PI / 2; sideR.position.set(8, 3, 1); scene.add(sideR);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat);
    front.rotation.y = Math.PI; front.position.set(0, 3, 8); scene.add(front);

    // back wall with window opening x[-3.2,3.2] y[1.3,4.9]
    box(scene, 4.8, 6, 0.3, wallMat, -5.6, 3, -6.15, false);
    box(scene, 4.8, 6, 0.3, wallMat, 5.6, 3, -6.15, false);
    box(scene, 6.4, 1.1, 0.3, wallMat, 0, 5.45, -6.15, false);
    box(scene, 6.4, 1.3, 0.3, wallMat, 0, 0.65, -6.15, false);
    box(scene, 16, 0.35, 0.12, trimMat, 0, 0.18, -5.95);   // baseboard
    for (const z of [-4, 0, 4]) box(scene, 16, 0.4, 0.35, trimMat, 0, 5.8, z);   // ceiling beams

    // window frame
    const wf = stdMat(0x1e130e, 0.6);
    box(scene, 6.6, 0.22, 0.28, wf, 0, 4.95, -6.0);
    box(scene, 6.6, 0.22, 0.28, wf, 0, 1.3, -6.0);
    box(scene, 0.22, 3.7, 0.28, wf, -3.2, 3.1, -6.0);
    box(scene, 0.22, 3.7, 0.28, wf, 3.2, 3.1, -6.0);
    box(scene, 0.12, 3.6, 0.16, wf, 0, 3.1, -6.0);
    box(scene, 6.4, 0.12, 0.16, wf, 0, 3.1, -6.0);
    box(scene, 7.2, 0.14, 0.7, wf, 0, 1.22, -5.8);     // sill

    // glass
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 3.6),
        new THREE.MeshBasicMaterial({ color: 0xa8c0e8, transparent: true, opacity: 0.07, depthWrite: false }));
    glass.position.set(0, 3.1, -6.05);
    scene.add(glass);

    // ---------------------------------------------------------------- outside: night city in the rain
    const skyTex = canvasTex(8, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#0b0e30'); gr.addColorStop(0.45, '#3a2a6a'); gr.addColorStop(1, '#b45f86');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: skyTex, fog: false }));
    sky.position.set(0, 24, -34); scene.add(sky);

    function cityTex(seed, dark, lit, minH, maxH) {
        const r = rng(seed);
        return canvasTex(1024, 512, (g, w, h) => {
            let x = 0;
            while (x < w) {
                const bw = 50 + r() * 90, bh = h * (minH + r() * (maxH - minH));
                g.fillStyle = dark; g.fillRect(x, h - bh, bw - 4, bh);
                for (let wy = h - bh + 14; wy < h - 10; wy += 22) {
                    for (let wx = x + 8; wx < x + bw - 16; wx += 18) {
                        if (r() < lit) {
                            g.fillStyle = r() < 0.15 ? '#7fc4ff' : (r() < 0.5 ? '#ffd27a' : '#ffb35c');
                            g.globalAlpha = 0.55 + r() * 0.45;
                            g.fillRect(wx, wy, 8, 12);
                            g.globalAlpha = 1;
                        }
                    }
                }
                x += bw;
            }
        });
    }
    const far = new THREE.Mesh(new THREE.PlaneGeometry(80, 40),
        new THREE.MeshBasicMaterial({ map: cityTex(5, '#14122e', 0.3, 0.25, 0.8), transparent: true, fog: false }));
    far.position.set(0, 15, -24); scene.add(far);
    const near = new THREE.Mesh(new THREE.PlaneGeometry(50, 20),
        new THREE.MeshBasicMaterial({ map: cityTex(9, '#09081a', 0.14, 0.2, 0.7), transparent: true, fog: false }));
    near.position.set(0, 7.5, -14); scene.add(near);

    // street bokeh (blurry city lights seen through the wet glass)
    const bokeh = [];
    const bokehCols = [0xffb347, 0xff7a8a, 0x6ec6ff, 0xffe08a, 0xff9ad5, 0x9dffd0];
    for (let i = 0; i < 46; i++) {
        const s = glowSprite(bokehCols[Math.floor(R() * bokehCols.length)], 0.8 + R() * 2.0, 0.35 + R() * 0.4);
        s.position.set((R() - 0.5) * 20, 0.2 + R() * 5, -8 - R() * 7);
        scene.add(s);
        bokeh.push({ s, base: s.material.opacity, ph: R() * 10, sp: 0.6 + R() * 1.4 });
    }
    updates.push((dt, t) => bokeh.forEach(b => { b.s.material.opacity = b.base * (0.7 + 0.3 * Math.sin(t * b.sp + b.ph)); }));

    // falling rain outside
    const RN = 900, rainPos = new Float32Array(RN * 2 * 3), rainData = [];
    for (let i = 0; i < RN; i++) rainData.push({ x: (R() - 0.5) * 30, y: R() * 11 - 1, z: -6.3 - R() * 12, v: 13 + R() * 6, l: 0.5 + R() * 0.7 });
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xb4cdf5, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }));
    rain.frustumCulled = false;
    scene.add(rain);
    updates.push((dt) => {
        for (let i = 0; i < RN; i++) {
            const d = rainData[i];
            d.y -= d.v * dt;
            if (d.y < -1) { d.y = 10 + R() * 2; d.x = (R() - 0.5) * 30; }
            rainPos.set([d.x, d.y, d.z, d.x - d.l * 0.1, d.y + d.l, d.z], i * 6);
        }
        rainGeo.attributes.position.needsUpdate = true;
    });

    // droplets and drips on the glass
    const DN = 70, dropPos = new Float32Array(DN * 3), trailPos = new Float32Array(DN * 6), drops = [];
    for (let i = 0; i < DN; i++) {
        drops.push({ x: (R() - 0.5) * 6.2, y: 1.4 + R() * 3.4, v: 0, wait: R() * 6, tr: 0.15 + R() * 0.3 });
    }
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
    const dropPts = new THREE.Points(dropGeo, new THREE.PointsMaterial({ map: glowTex(), color: 0xd6e6ff, size: 0.11, transparent: true, opacity: 0.8, depthWrite: false }));
    dropPts.frustumCulled = false;
    scene.add(dropPts);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.22, depthWrite: false }));
    trails.frustumCulled = false;
    scene.add(trails);
    updates.push((dt) => {
        drops.forEach((d, i) => {
            d.wait -= dt;
            if (d.wait <= 0) { d.v = 0.5 + Math.random() * 0.9; if (Math.random() < 0.35) { d.wait = 0.4 + Math.random() * 1.5; d.v = 0; } else d.wait = 0.6 + Math.random() * 1.2; }
            d.v *= 0.985;
            d.y -= d.v * dt;
            if (d.y < 1.45) { d.y = 4.8; d.x = (Math.random() - 0.5) * 6.2; d.v = 0; }
            dropPos.set([d.x, d.y, -6.04], i * 3);
            trailPos.set([d.x, d.y, -6.04, d.x, d.y + d.tr * (0.3 + Math.min(1, d.v)), -6.04], i * 6);
        });
        dropGeo.attributes.position.needsUpdate = true;
        trailGeo.attributes.position.needsUpdate = true;
    });

    // ---------------------------------------------------------------- fireplace (right of the window)
    const fx = 5.5;
    const stoneMat = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.95 });
    brickTex.repeat.set(1.5, 1.5);
    box(scene, 0.8, 3.0, 1.0, stoneMat, fx - 1.4, 1.5, -5.5);
    box(scene, 0.8, 3.0, 1.0, stoneMat, fx + 1.4, 1.5, -5.5);
    box(scene, 3.6, 0.7, 1.0, stoneMat, fx, 2.65, -5.5);
    box(scene, 4.3, 0.2, 1.3, stdMat(0x3a2418, 0.6), fx, 3.08, -5.4);   // mantel
    box(scene, 4.2, 0.12, 1.7, stdMat(0x4a4140, 0.9), fx, 0.06, -5.2);  // hearth
    box(scene, 2.0, 2.3, 0.1, stdMat(0x0a0605, 1), fx, 1.25, -5.93);    // firebox back
    const fire = ZU.makeFire({ scale: 1.5, intensity: 0.85, distance: 14 });
    fire.group.position.set(fx, 0.12, -5.45);
    scene.add(fire.group);
    fire.light.position.set(0, 0.9, 0.6);
    updates.push(fire.update);

    // mantel decor: candles + painting
    const candleMat = stdMat(0xf4e6c8, 0.8);
    const flames = [];
    for (const cx of [fx - 1.5, fx + 1.4, fx + 1.0]) {
        const h = 0.35 + R() * 0.2;
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, h, 10), candleMat);
        c.position.set(cx, 3.18 + h / 2, -5.4); scene.add(c);
        const f = glowSprite(0xffc46b, 0.5, 0.95);
        f.position.set(cx, 3.2 + h + 0.08, -5.4); scene.add(f);
        flames.push({ f, ph: R() * 9 });
    }
    updates.push((dt, t) => flames.forEach(o => { o.f.scale.setScalar(0.45 + 0.07 * Math.sin(t * 9 + o.ph)); }));
    const paint = canvasTex(256, 176, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#f6b9a0'); gr.addColorStop(0.55, '#f9d9a8'); gr.addColorStop(1, '#6a8bb0');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(150, 78, 20, 0, TAU); g.fill();
        g.fillStyle = '#4a5f86'; g.beginPath(); g.moveTo(0, 130); g.lineTo(60, 80); g.lineTo(110, 118); g.lineTo(170, 70); g.lineTo(256, 130); g.lineTo(256, 176); g.lineTo(0, 176); g.fill();
        g.fillStyle = '#2d3b5c'; g.beginPath(); g.moveTo(0, 150); g.lineTo(80, 112); g.lineTo(140, 146); g.lineTo(256, 108); g.lineTo(256, 176); g.lineTo(0, 176); g.fill();
    });
    box(scene, 2.5, 1.7, 0.1, stdMat(0x1c120d, 0.5), fx, 4.5, -5.93);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshStandardMaterial({ map: paint, roughness: 0.8, emissive: 0xffffff, emissiveMap: paint, emissiveIntensity: 0.18 }));
    art.position.set(fx, 4.5, -5.87); scene.add(art);
    // put your own photo in the frame: drop a file called us.jpg next to index.html
    new THREE.TextureLoader().load('us.jpg', (tex) => {
        const img = tex.image, a = img.width / img.height, target = 2.2 / 1.4;
        if (a > target) { tex.repeat.x = target / a; tex.offset.x = (1 - tex.repeat.x) / 2; }
        else { tex.repeat.y = a / target; tex.offset.y = (1 - tex.repeat.y) / 2; }
        art.material.map = tex; art.material.emissiveMap = tex; art.material.needsUpdate = true;
    }, undefined, () => { /* no photo: keep the painting */ });

    // ---------------------------------------------------------------- bookshelf (left)
    const shelfMat = stdMat(0x3a2517, 0.7);
    const sx = -5.75;
    box(scene, 0.14, 4.7, 0.6, shelfMat, sx - 1.4, 2.35, -5.65);
    box(scene, 0.14, 4.7, 0.6, shelfMat, sx + 1.4, 2.35, -5.65);
    box(scene, 2.94, 0.06, 0.05, shelfMat, sx, 2.35, -5.95);
    box(scene, 2.7, 4.7, 0.05, stdMat(0x2a1a10, 1), sx, 2.35, -5.93);
    const shelfY = [0.22, 1.32, 2.42, 3.52, 4.62];
    shelfY.forEach(y => box(scene, 2.9, 0.1, 0.6, shelfMat, sx, y, -5.65));
    const bookCols = [0xb5523b, 0xd9a441, 0x3f6b87, 0x5e8c61, 0x8a4f7d, 0xe8dcc2, 0x2f3e4f, 0xc77d5a, 0x7aa6a1];
    const bookList = [];
    for (let k = 0; k < 4; k++) {
        let x = sx - 1.28;
        while (x < sx + 1.2) {
            const w = 0.1 + R() * 0.14, h = 0.6 + R() * 0.32;
            if (R() < 0.1) { x += 0.3 + R() * 0.3; continue; }
            bookList.push({ x: x + w / 2, y: shelfY[k] + 0.05 + h / 2, w, h, c: bookCols[Math.floor(R() * bookCols.length)], tilt: 0 });
            x += w + 0.01;
        }
        if (bookList.length) bookList[bookList.length - 1].tilt = 0.25;
    }
    const books = instanced(new THREE.BoxGeometry(1, 1, 1), stdMat(0xffffff, 0.8), bookList.length, (i, o, col) => {
        const b = bookList[i];
        o.position.set(b.x, b.y, -5.62); o.scale.set(b.w, b.h, 0.38); o.rotation.z = b.tilt;
        col.set(b.c);
    });
    books.castShadow = true;
    scene.add(books);
    // plant on top of the shelf
    const topPlant = new THREE.Group();
    topPlant.position.set(sx + 0.6, 4.67, -5.65);
    topPlant.add(ZU.at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.3, 10), stdMat(0xd9a07a, 0.8)), 0, 0.15, 0));
    for (let i = 0; i < 7; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), stdMat(0x5fa56a, 0.8));
        leaf.scale.set(0.5, 1.8, 0.2);
        leaf.position.set(Math.cos(i * 0.9) * 0.14, 0.5, Math.sin(i * 0.9) * 0.1);
        leaf.rotation.z = Math.cos(i * 0.9) * 0.7; leaf.rotation.x = Math.sin(i * 0.9) * 0.5;
        topPlant.add(leaf);
    }
    scene.add(topPlant);

    // ---------------------------------------------------------------- desk under the window
    const deskMat = stdMat(0x5a3a22, 0.6);
    box(scene, 4.4, 0.12, 1.4, deskMat, -0.2, 1.0, -5.0);
    [[-2.3, -4.45], [1.9, -4.45], [-2.3, -5.55], [1.9, -5.55]].forEach(p => box(scene, 0.1, 1.0, 0.1, deskMat, p[0], 0.5, p[1]));
    // laptop
    const lap = new THREE.Group(); lap.position.set(0.2, 1.06, -4.9);
    box(lap, 0.95, 0.04, 0.62, stdMat(0x9a9aa6, 0.4, 0.6), 0, 0.02, 0);
    const scr = new THREE.Group(); scr.position.set(0, 0.04, -0.3); scr.rotation.x = 0.28; lap.add(scr);
    box(scr, 0.95, 0.6, 0.03, stdMat(0x2a2a30, 0.5), 0, 0.3, 0, false);
    const screenFace = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.52), new THREE.MeshBasicMaterial({ color: 0x86b9f0 }));
    screenFace.position.set(0, 0.3, 0.02); scr.add(screenFace);
    scene.add(lap);
    const lapGlow = glowSprite(0x86b9f0, 1.6, 0.25); lapGlow.position.set(0.2, 1.45, -4.6); scene.add(lapGlow);
    // mug with steam
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.24, 14), stdMat(0xf2e9dc, 0.4));
    mug.position.set(1.45, 1.18, -4.75); mug.castShadow = true; scene.add(mug);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 10), stdMat(0xf2e9dc, 0.4));
    handle.position.set(1.58, 1.18, -4.75); scene.add(handle);
    const steam = ZU.makeSteam(7); steam.group.position.set(1.45, 1.32, -4.75); scene.add(steam.group);
    updates.push(steam.update);
    // stacked books
    [[0x9c4a3a, 0.6], [0x3f6b87, 0.52], [0xd9a441, 0.46]].forEach((b, i) => {
        const bk = box(scene, b[1], 0.1, 0.4, stdMat(b[0], 0.8), 1.95 - i * 0.02, 1.11 + i * 0.1, -5.15);
        bk.rotation.y = (i - 1) * 0.12;
    });
    // desk lamp
    const lamp = new THREE.Group(); lamp.position.set(-1.7, 1.06, -5.2);
    lamp.add(ZU.at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.06, 14), stdMat(0x1c1c1c, 0.5, 0.4)), 0, 0.03, 0));
    const arm1 = box(lamp, 0.05, 0.9, 0.05, stdMat(0x1c1c1c, 0.5, 0.4), 0, 0.5, 0); arm1.rotation.z = 0.15;
    const arm2 = box(lamp, 0.05, 0.7, 0.05, stdMat(0x1c1c1c, 0.5, 0.4), 0.25, 1.15, 0); arm2.rotation.z = -1.0;
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe8b84a, emissive: 0xffb040, emissiveIntensity: 0.9, side: THREE.DoubleSide, roughness: 0.6 }));
    shade.position.set(0.55, 1.3, 0); shade.rotation.z = Math.PI + 0.25;
    lamp.add(shade);
    scene.add(lamp);
    const lampLight = new THREE.PointLight(0xffc27a, 1.0, 7, 2);
    lampLight.position.set(-1.1, 2.2, -4.8);
    scene.add(lampLight);
    const lampGlow = glowSprite(0xffc27a, 1.6, 0.6); lampGlow.position.set(-1.15, 2.3, -5.1); scene.add(lampGlow);
    // chair
    const chair = new THREE.Group(); chair.position.set(0.5, 0, -3.3); chair.rotation.y = 0.35;
    const chMat = stdMat(0x3d2a20, 0.7);
    box(chair, 0.9, 0.1, 0.9, stdMat(0x7a3b3b, 0.9), 0, 0.85, 0);
    box(chair, 0.9, 1.0, 0.1, chMat, 0, 1.4, 0.4);
    [[-0.38, -0.38], [0.38, -0.38], [-0.38, 0.38], [0.38, 0.38]].forEach(p => box(chair, 0.08, 0.85, 0.08, chMat, p[0], 0.42, p[1]));
    scene.add(chair);

    // ---------------------------------------------------------------- sofa + plaid blanket
    // low sofa with a couple snuggling under a plaid blanket
    const sofa = new THREE.Group(); sofa.position.set(-3.9, 0, -1.6); sofa.rotation.y = 0.5;
    const sofaMat = stdMat(0x8a4a44, 0.95);
    box(sofa, 3.0, 0.3, 1.2, sofaMat, 0, 0.25, 0);
    box(sofa, 3.0, 1.0, 0.35, sofaMat, 0, 0.6, -0.5);
    box(sofa, 0.35, 0.6, 1.2, sofaMat, -1.5, 0.4, 0);
    box(sofa, 0.35, 0.6, 1.2, sofaMat, 1.5, 0.4, 0);
    box(sofa, 2.5, 0.15, 0.95, stdMat(0xa05a52, 0.95), 0, 0.475, 0.1);
    const couple = ZCouple.makeCouple({ outfit: 'cozy', blanket: true });
    couple.mesh.scale.setScalar(1.3); couple.mesh.position.set(0, 0.68, 0.0);
    ZU.shadowAll(couple.mesh, true);
    sofa.add(couple.mesh);
    updates.push((dt, t) => couple.update(dt, t));
    scene.add(sofa);

    // ---------------------------------------------------------------- rug + cat
    const rugTex = canvasTex(512, 512, (g, w, h) => {
        const c = w / 2;
        const rings = ['#7a2f35', '#c9ad86', '#2f5d62', '#c9953a', '#7a2f35', '#c9ad86', '#3b2a4a'];
        rings.forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, c - i * 34, 0, TAU); g.fill(); });
        for (let i = 0; i < 40; i++) { g.strokeStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.arc(c, c, 8 + i * 6, 0, TAU); g.stroke(); }
    });
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(3.7, 0.02, -2.5); rug.receiveShadow = true;
    scene.add(rug);

    const cat = createCat();
    cat.mesh.position.set(3.7, 0.03, -2.4);
    cat.mesh.rotation.y = -0.7;
    cat.mesh.scale.setScalar(1.75);
    ZU.shadowAll(cat.mesh, true, false);
    scene.add(cat.mesh);

    // ---------------------------------------------------------------- big plant
    const plant = new THREE.Group(); plant.position.set(7.0, 0, -5.0);
    plant.add(ZU.at(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.8, 14), stdMat(0xb9764f, 0.85)), 0, 0.4, 0));
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.8, 6), stdMat(0x5a3d26, 1));
    trunk.position.y = 1.6; plant.add(trunk);
    const leaves = [];
    for (let i = 0; i < 22; i++) {
        const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5), stdMat(i % 3 ? 0x4f9a5e : 0x6bb374, 0.8));
        const a = i * 2.4, rr = 0.2 + R() * 0.6;
        l.scale.set(1, 0.35, 1.5);
        l.position.set(Math.cos(a) * rr, 1.7 + R() * 1.4, Math.sin(a) * rr);
        l.rotation.set(R() - 0.5, a, R() - 0.5);
        plant.add(l); leaves.push(l);
    }
    scene.add(plant);
    updates.push((dt, t) => { plant.rotation.z = Math.sin(t * 0.6) * 0.012; leaves.forEach((l, i) => { l.rotation.x += Math.sin(t * 1.3 + i) * 0.0008; }); });

    // ---------------------------------------------------------------- fairy lights
    const swags = [[-7.6, -3.0, 5.3, 4.5], [-3.0, 3.0, 5.4, 4.7], [3.0, 7.6, 5.3, 4.5]];
    const flPos = [], flCol = [], flSize = [], wirePos = [];
    const lightCols = [new THREE.Color(0xffd08a), new THREE.Color(0xffb36b), new THREE.Color(0xffe6b8), new THREE.Color(0xff9d8a)];
    swags.forEach(s => {
        const n = 13;
        for (let i = 0; i <= n; i++) {
            const u = i / n;
            const x = s[0] + (s[1] - s[0]) * u, y = s[2] - Math.sin(u * Math.PI) * (s[2] - s[3]) * 0.9;
            const next = (i + 1) / n;
            if (i < n) {
                const x2 = s[0] + (s[1] - s[0]) * next, y2 = s[2] - Math.sin(next * Math.PI) * (s[2] - s[3]) * 0.9;
                wirePos.push(x, y, -5.8, x2, y2, -5.8);
            }
            if (i > 0 && i < n) {
                flPos.push(x, y - 0.06, -5.72);
                const c = lightCols[Math.floor(R() * lightCols.length)];
                flCol.push(c.r, c.g, c.b); flSize.push(30 + R() * 14);
            }
        }
    });
    const wire = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(wirePos, 3)), new THREE.LineBasicMaterial({ color: 0x15100c }));
    scene.add(wire);
    const fairy = ZU.makeTwinkle({ positions: new Float32Array(flPos), colors: new Float32Array(flCol), sizes: new Float32Array(flSize), speed: 1.4 });
    scene.add(fairy.points);
    updates.push((dt, t) => fairy.update(t));

    // ---------------------------------------------------------------- floating dust in the window light
    const DUST = 70, dustPos = new Float32Array(DUST * 3), dust = [];
    for (let i = 0; i < DUST; i++) dust.push({ x: (R() - 0.5) * 6, y: 1.2 + R() * 3.8, z: -5.5 + R() * 4.5, a: R() * TAU, s: 0.1 + R() * 0.25 });
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    scene.add(Object.assign(new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex(), color: 0xbcd0ff, size: 0.07, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })), { frustumCulled: false }));
    updates.push((dt, t) => {
        dust.forEach((d, i) => {
            d.a += dt * 0.3;
            dustPos.set([d.x + Math.sin(d.a * 1.3) * 0.4, d.y + Math.sin(d.a) * 0.25 + Math.sin(t * d.s) * 0.1,d.z + Math.cos(d.a * 0.8) * 0.3], i * 3);
        });
        dustGeo.attributes.position.needsUpdate = true;
    });

    // ---------------------------------------------------------------- lightning flash behind the clouds
    const flash = new THREE.PointLight(0x9db8ff, 0, 40, 2);
    flash.position.set(0, 6, -9);
    scene.add(flash);
    let nextFlash = 14 + Math.random() * 14, flashT = 0;
    updates.push((dt) => {
        nextFlash -= dt;
        if (nextFlash < 0) { flashT = 0.5; nextFlash = 18 + Math.random() * 22; }
        if (flashT > 0) {
            flashT -= dt;
            flash.intensity = Math.max(0, Math.sin(flashT * 40)) * 4 * (flashT / 0.5);
            sky.material.color.setScalar(1 + flash.intensity * 0.6);
        } else { flash.intensity = 0; sky.material.color.setScalar(1); }
    });

    // ---------------------------------------------------------------- cat extras (purr bump on petting)
    let purr = 0;
    function onPet() { purr = 1.4; }
    updates.push((dt, t) => {
        cat.update(dt);
        if (purr > 0) {
            purr -= dt;
            const k = Math.sin(purr * 18) * 0.018 * Math.min(1, purr);
            cat.mesh.scale.setScalar(1.75 * (1 + k + 0.04 * Math.min(1, purr)));
        } else cat.mesh.scale.setScalar(1.75);
    });

    return {
        scene,
        couple,
        update(dt, t) { updates.forEach(u => u(dt, t)); },
        pettable: cat.mesh,
        onPet,
        petPos: () => new THREE.Vector3(3.7, 1.3, -2.4),
        cfg: {
            target: new THREE.Vector3(0.6, 2.35, -3.2), dist: 9.8, camY: 3.4, fov: 44,
            hoverYaw: 0.3, hoverPitch: 0.1, maxYaw: 0.78, minPitch: -0.12, maxPitch: 0.32,
            portraitExtra: 0.3, minCamY: 1.4, bloom: { strength: 0.55, radius: 0.75, threshold: 0.7 }, exposure: 1
        }
    };
}
window.buildRainScene = buildRainScene;
