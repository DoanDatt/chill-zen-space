/**
 * ZenHaven - a cute low-poly couple sitting close together (procedural, no external models).
 * makeCouple({ ground, outfit: 'cozy'|'winter'|'summer'|'spring', blanket, mat })
 *  - origin of the returned group = the hips, +Z = the direction they face.
 *  - ground:true  -> sitting on the floor with knees up; false -> sitting on a seat with legs hanging.
 *  - returns { mesh, update(dt, t), react() }
 */
const ZCouple = (() => {
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const std = (c, r = 0.85) => new THREE.MeshStandardMaterial({ color: c, roughness: r });

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

        [-1, 1].forEach(s => {                                                                // arms
            const sh = [s * 0.2, 0.48, 0];
            let el, ha;
            if (o.armAround && s === o.side) { el = [s * 0.38, 0.4, -0.04]; ha = [s * 0.56, 0.55, -0.14]; }
            else if (o.ground) { el = [s * 0.27, 0.3, 0.1]; ha = [s * 0.14, 0.24, 0.22]; }
            else { el = [s * 0.26, 0.28, 0.1]; ha = [s * 0.12, 0.13, 0.3]; }
            bone(upper, sh, el, 0.062, 0.055, mTop);
            bone(upper, el, ha, 0.055, 0.045, mTop);
            ball(upper, ha, 0.052, mSkin);
        });

        const mLeg = o.dress ? mSkin : mBot;                                                  // legs
        [-1, 1].forEach(s => {
            let kn, an;
            if (o.ground) { kn = [s * 0.11, 0.27, 0.3]; an = [s * 0.11, -0.08, 0.5]; }
            else { kn = [s * 0.11, 0, 0.36]; an = [s * 0.11, -0.32, 0.4]; }
            bone(g, [s * 0.1, 0, 0.02], kn, 0.088, 0.075, o.dress ? mTop : mBot);
            bone(g, kn, an, 0.07, 0.06, mLeg);
            ball(g, [an[0], an[1] - 0.03, an[2] + 0.05], 0.075, mShoe, 1, 0.7, 1.6);
        });
        if (o.dress) ball(g, [0, 0, 0.2], 0.3, mTop, 1, 0.32, 1.1);                           // skirt over the lap

        return { g, upper, head };
    }

    function plaidTex(a, b) {
        return ZU.canvasTex(128, 128, (c, w, h) => {
            c.fillStyle = a; c.fillRect(0, 0, w, h);
            c.fillStyle = 'rgba(0,0,0,0.35)';
            for (let i = 0; i < 4; i++) { c.fillRect(i * 32 + 6, 0, 12, h); c.fillRect(0, i * 32 + 6, w, 12); }
            c.fillStyle = b;
            for (let i = 0; i < 4; i++) { c.fillRect(i * 32 + 22, 0, 3, h); c.fillRect(0, i * 32 + 22, w, 3); }
        });
    }

    function makeCouple(opts = {}) {
        const { ground = false, outfit = 'cozy', blanket = false, mat = false } = opts;
        const P = OUTFITS[outfit] || OUTFITS.cozy;
        const him = person(Object.assign({}, P.him, { ground, side: 1, armAround: true }));
        const her = person(Object.assign({}, P.her, { ground, side: -1 }));
        him.g.position.x = -0.25; her.g.position.x = 0.25;
        her.upper.rotation.z = 0.1; her.head.rotation.z = 0.3; her.head.position.x = -0.08;   // her head rests on his shoulder
        him.upper.rotation.z = -0.04; him.head.rotation.z = -0.1;

        const root = new THREE.Group();
        root.add(him.g, her.g);

        if (blanket) {
            const bm = new THREE.MeshStandardMaterial({ map: plaidTex('#c0553b', 'rgba(255,230,190,.55)'), roughness: 1 });
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.09, 0.62), bm);
            top.position.set(0, 0.1, 0.22); top.castShadow = true; root.add(top);
            const drape = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.06), bm);
            drape.position.set(0, -0.06, 0.53); drape.rotation.x = 0.1; root.add(drape);
        }
        if (mat) {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.7), new THREE.MeshStandardMaterial({ map: plaidTex('#8f2f3a', 'rgba(255,220,180,.5)'), roughness: 1 }));
            m.rotation.x = -Math.PI / 2; m.position.set(0, -0.165, 0.25); m.receiveShadow = true; root.add(m);
        }

        // little hearts floating above them
        const hearts = [];
        for (let i = 0; i < 4; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ZU.heartTex(), transparent: true, opacity: 0, depthWrite: false, fog: false }));
            s.scale.set(0.3, 0.3, 1); root.add(s);
            hearts.push({ s, t: -1, dx: 0 });
        }
        function spawn(n) {
            let k = 0;
            hearts.forEach(h => { if (h.t < 0 && k < n) { h.t = 0; h.dx = (Math.random() - 0.5) * 0.4; k++; } });
        }

        let nextHeart = 3, happy = 0;
        return {
            mesh: root,
            react() { happy = 1.6; spawn(4); },
            update(dt, t) {
                const b = Math.sin(t * 1.5);
                him.upper.scale.y = 1 + b * 0.012; her.upper.scale.y = 1 + Math.sin(t * 1.5 + 0.6) * 0.012;
                const lean = happy > 0 ? Math.sin(Math.min(1, happy) * Math.PI) * 0.12 : 0;
                happy = Math.max(0, happy - dt);
                him.head.rotation.z = -0.1 - lean + Math.sin(t * 0.6) * 0.025;
                her.head.rotation.z = 0.3 + lean + Math.sin(t * 0.55 + 1) * 0.025;
                him.head.rotation.y = Math.sin(t * 0.3) * 0.12;
                her.head.rotation.y = Math.sin(t * 0.27 + 2) * 0.1;
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

    return { makeCouple };
})();
window.ZCouple = ZCouple;
