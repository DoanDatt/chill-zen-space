/**
 * ZenHaven 3.0 - Procedural Stylized Animals (Ghibli / Indie Aesthetic)
 * Built entirely with Three.js primitives - zero external model dependencies.
 * Each animal has idle animations (breathing, tail wag, head tilt, blinking)
 * and bounded organic movements.
 */

// =========================================================================
// 1. SCENE RAIN: COZY SLEEPING CAT
// =========================================================================
function createCat() {
    const catGroup = new THREE.Group();

    // Material palette - Warm Orange Tabby with creamy belly
    const matFur = new THREE.MeshStandardMaterial({ color: 0xdf7938, roughness: 0.85, metalness: 0.05 });
    const matCream = new THREE.MeshStandardMaterial({ color: 0xffe8d6, roughness: 0.9 });
    const matNose = new THREE.MeshStandardMaterial({ color: 0xffa4a4, roughness: 0.5 });
    const matBed = new THREE.MeshStandardMaterial({ color: 0x3b4252, roughness: 0.95 });

    // Plush circular bed cushion
    const bed = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.14, 24), matBed);
    bed.position.y = 0.07;
    bed.receiveShadow = true;
    catGroup.add(bed);

    // Torso container for breathing animation
    const torso = new THREE.Group();
    torso.position.set(0, 0.18, 0);
    catGroup.add(torso);

    const bodyGeo = new THREE.SphereGeometry(0.24, 16, 12);
    bodyGeo.scale(1.28, 0.78, 1.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, matFur);
    bodyMesh.castShadow = true;
    torso.add(bodyMesh);

    // Creamy chest patch
    const chestGeo = new THREE.SphereGeometry(0.18, 12, 10);
    chestGeo.scale(1.0, 0.7, 0.9);
    const chest = new THREE.Mesh(chestGeo, matCream);
    chest.position.set(0.08, -0.04, 0.1);
    torso.add(chest);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0.22, 0.05, 0.16);
    torso.add(headGroup);

    const headGeo = new THREE.SphereGeometry(0.15, 14, 12);
    headGeo.scale(1.1, 0.92, 1.0);
    const headMesh = new THREE.Mesh(headGeo, matFur);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Sleeping closed eyes (two curved arcs)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x3d1d11 });
    const eyeGeo = new THREE.TorusGeometry(0.03, 0.006, 6, 10, Math.PI);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.rotation.z = Math.PI;
    eyeL.position.set(0.09, 0.02, 0.12);
    headGroup.add(eyeL);

    // Snout & Pink Nose
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), matCream);
    muzzle.position.set(0.12, -0.03, 0.08);
    headGroup.add(muzzle);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.025, 3), matNose);
    nose.rotation.z = Math.PI;
    nose.position.set(0.16, -0.01, 0.08);
    headGroup.add(nose);

    // Ears with twitch capability
    const earGeo = new THREE.ConeGeometry(0.065, 0.13, 4);
    const earL = new THREE.Mesh(earGeo, matFur);
    earL.position.set(0.04, 0.14, -0.06);
    earL.rotation.set(-0.2, 0, 0.4);

    const earR = new THREE.Mesh(earGeo, matFur);
    earR.position.set(-0.06, 0.14, 0.04);
    earR.rotation.set(0.3, 0, -0.2);

    headGroup.add(earL, earR);

    // Multi-segmented tail curling around body
    const tailJoints = [];
    let tailParent = torso;
    const baseTailPos = new THREE.Vector3(-0.24, -0.02, -0.08);

    for (let i = 0; i < 4; i++) {
        const joint = new THREE.Group();
        if (i === 0) joint.position.copy(baseTailPos);
        else joint.position.set(0.08, 0, 0.06);
        tailParent.add(joint);

        const segGeo = new THREE.SphereGeometry(0.045 * (1 - i * 0.12), 8, 8);
        const segMesh = new THREE.Mesh(segGeo, matFur);
        joint.add(segMesh);

        tailJoints.push(joint);
        tailParent = joint;
    }

    // Animation state
    let animTime = 0;
    let earTwitchTimer = 0;

    return {
        mesh: catGroup,
        update: (delta) => {
            animTime += delta;
            earTwitchTimer += delta;

            // Deep, peaceful breathing
            const breath = Math.sin(animTime * 1.6);
            torso.scale.set(1 + breath * 0.04, 1 + breath * 0.05, 1 + breath * 0.03);

            // Occasional tail swish
            tailJoints.forEach((j, idx) => {
                const wave = Math.sin(animTime * 1.5 + idx * 0.6) * 0.14;
                j.rotation.y = wave;
            });

            // Random ear twitch every 4 seconds
            if (earTwitchTimer > 4.0) {
                earL.rotation.z = 0.4 + Math.sin((earTwitchTimer - 4.0) * 30) * 0.18;
                if (earTwitchTimer > 4.35) {
                    earL.rotation.z = 0.4;
                    earTwitchTimer = -Math.random() * 2.0;
                }
            }
        }
    };
}

// =========================================================================
// 2. SCENE AURORA: ARCTIC SNOW FOX, REINDEER HERD & OWL
// =========================================================================
function createArcticFox() {
    const fox = new THREE.Group();

    const matWhite = new THREE.MeshStandardMaterial({ color: 0xf5f7fb, roughness: 0.85 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1f232b, roughness: 0.5 });
    const matInnerEar = new THREE.MeshStandardMaterial({ color: 0xffd1dc, roughness: 0.7 });

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.75, 10);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, matWhite);
    body.position.y = 0.42;
    body.castShadow = true;
    fox.add(body);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.62, 0.38);
    fox.add(head);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), matWhite);
    head.add(headMesh);

    // Pointed Snout
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), matWhite);
    snout.rotation.x = Math.PI / 2;
    snout.position.set(0, -0.04, 0.18);
    head.add(snout);

    // Black nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), matDark);
    nose.position.set(0, -0.04, 0.29);
    head.add(nose);

    // Large pointed ears
    const earGeo = new THREE.ConeGeometry(0.09, 0.24, 4);
    const earL = new THREE.Mesh(earGeo, matWhite);
    earL.position.set(-0.11, 0.18, 0);
    earL.rotation.set(-0.1, 0, 0.3);

    const innerEarL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), matInnerEar);
    innerEarL.position.set(0, 0, 0.02);
    earL.add(innerEarL);

    const earR = new THREE.Mesh(earGeo, matWhite);
    earR.position.set(0.11, 0.18, 0);
    earR.rotation.set(-0.1, 0, -0.3);

    const innerEarR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 4), matInnerEar);
    innerEarR.position.set(0, 0, 0.02);
    earR.add(innerEarR);

    head.add(earL, earR);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8);
    const legs = [];
    const legOffsets = [
        [-0.12, 0.2, 0.25],
        [0.12, 0.2, 0.25],
        [-0.12, 0.2, -0.25],
        [0.12, 0.2, -0.25]
    ];
    legOffsets.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, matWhite);
        leg.position.set(...pos);
        fox.add(leg);
        legs.push(leg);
    });

    // Big Fluffy Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.45, -0.38);
    fox.add(tailGroup);

    const tailGeo = new THREE.SphereGeometry(0.18, 12, 10);
    tailGeo.scale(0.8, 0.9, 1.8);
    const tailMesh = new THREE.Mesh(tailGeo, matWhite);
    tailMesh.position.set(0, 0.05, -0.22);
    tailMesh.rotation.x = -0.35;
    tailGroup.add(tailMesh);

    // AI Wandering & Looking at Aurora Sky
    let time = 0;
    let state = 'walk'; // walk, sit
    let stateTimer = 0;
    let walkAngle = 0;

    fox.position.set(1.5, 0, 1.2);

    return {
        mesh: fox,
        update: (delta) => {
            time += delta;
            stateTimer += delta;

            if (state === 'walk') {
                // Walk in a gentle curved figure-eight path on the snow
                walkAngle += delta * 0.4;
                const radiusX = 2.4;
                const radiusZ = 1.8;
                fox.position.x = Math.sin(walkAngle) * radiusX;
                fox.position.z = Math.sin(walkAngle * 2) * radiusZ;

                const nextX = Math.sin(walkAngle + 0.05) * radiusX;
                const nextZ = Math.sin(walkAngle * 2 + 0.1) * radiusZ;
                fox.rotation.y = Math.atan2(nextX - fox.position.x, nextZ - fox.position.z);

                // Leg swing
                legs[0].rotation.x = Math.sin(time * 6) * 0.45;
                legs[1].rotation.x = -Math.sin(time * 6) * 0.45;
                legs[2].rotation.x = -Math.sin(time * 6) * 0.45;
                legs[3].rotation.x = Math.sin(time * 6) * 0.45;

                // Tail counter-sway
                tailGroup.rotation.y = Math.sin(time * 3) * 0.35;
                head.rotation.x = 0;

                if (stateTimer > 10.0) {
                    state = 'sit';
                    stateTimer = 0;
                }
            } else {
                // Sit & look up at the aurora
                legs.forEach(l => l.rotation.x = 0);
                head.rotation.x = -0.45 + Math.sin(time * 1.2) * 0.1; // head tilted up at sky
                head.rotation.y = Math.sin(time * 0.8) * 0.25;
                tailGroup.rotation.y = Math.sin(time * 2) * 0.15;

                if (stateTimer > 7.0) {
                    state = 'walk';
                    stateTimer = 0;
                }
            }
        }
    };
}

function createReindeerHerd() {
    const herd = new THREE.Group();
    const matBody = new THREE.MeshStandardMaterial({ color: 0x544336, roughness: 0.9 });
    const matAntler = new THREE.MeshStandardMaterial({ color: 0xd6c2a8, roughness: 0.7 });

    function createSingleDeer(scale = 1.0) {
        const deer = new THREE.Group();

        // Torso
        const bodyGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.9, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, matBody);
        body.position.y = 0.8;
        deer.add(body);

        // Long neck
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.6, 8), matBody);
        neck.position.set(0, 1.15, 0.4);
        neck.rotation.x = -0.4;
        deer.add(neck);

        // Head with grazing rotation
        const headJoint = new THREE.Group();
        headJoint.position.set(0, 1.4, 0.55);
        deer.add(headJoint);

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.4), matBody);
        headJoint.add(head);

        // Majestic Branching Antlers
        for (let side = -1; side <= 1; side += 2) {
            const mainBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.7, 6), matAntler);
            mainBranch.position.set(side * 0.12, 0.35, -0.05);
            mainBranch.rotation.set(-0.3, 0, side * 0.4);
            headJoint.add(mainBranch);

            const tine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.3, 5), matAntler);
            tine1.position.set(side * 0.22, 0.4, 0.08);
            tine1.rotation.set(0.4, 0, side * 0.3);
            headJoint.add(tine1);
        }

        // Slender Legs
        const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.8, 6);
        [[-0.16, 0.4, 0.3], [0.16, 0.4, 0.3], [-0.16, 0.4, -0.3], [0.16, 0.4, -0.3]].forEach(pos => {
            const leg = new THREE.Mesh(legGeo, matBody);
            leg.position.set(...pos);
            deer.add(leg);
        });

        deer.scale.setScalar(scale);
        return { mesh: deer, headJoint };
    }

    const deer1 = createSingleDeer(0.85);
    deer1.mesh.position.set(-6.5, 0.8, -12);
    deer1.mesh.rotation.y = 0.8;
    herd.add(deer1.mesh);

    const deer2 = createSingleDeer(0.72);
    deer2.mesh.position.set(-5.2, 0.6, -13.5);
    deer2.mesh.rotation.y = 0.5;
    herd.add(deer2.mesh);

    const deer3 = createSingleDeer(0.65);
    deer3.mesh.position.set(-7.8, 0.9, -13.2);
    deer3.mesh.rotation.y = 1.1;
    herd.add(deer3.mesh);

    let time = 0;
    return {
        mesh: herd,
        update: (delta) => {
            time += delta;
            // Gentle grazing motion: lowering & raising head
            deer1.headJoint.rotation.x = Math.sin(time * 0.6) * 0.25 + 0.2;
            deer2.headJoint.rotation.x = Math.cos(time * 0.5) * 0.2 + 0.15;
            deer3.headJoint.rotation.x = Math.sin(time * 0.7 + 1.0) * 0.3 + 0.2;
        }
    };
}

function createOwl() {
    const owl = new THREE.Group();
    const matFeather = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.9 });
    const matBeak = new THREE.MeshStandardMaterial({ color: 0xffaa00 });

    // Owl Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), matFeather);
    body.scale.set(0.9, 1.2, 0.8);
    owl.add(body);

    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), matBeak);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.05, 0.18);
    owl.add(beak);

    // Wings
    const wingGeo = new THREE.PlaneGeometry(0.65, 0.3);
    const wingL = new THREE.Mesh(wingGeo, matFeather);
    wingL.position.set(-0.35, 0.05, 0);
    wingL.rotation.y = Math.PI / 2;

    const wingR = new THREE.Mesh(wingGeo, matFeather);
    wingR.position.set(0.35, 0.05, 0);
    wingR.rotation.y = -Math.PI / 2;

    owl.add(wingL, wingR);

    // Flight Path
    let flightProgress = 0;
    owl.position.set(-15, 12, -18);

    return {
        mesh: owl,
        update: (delta) => {
            flightProgress += delta * 0.15;
            if (flightProgress > 1.0) flightProgress = 0;

            // Glide across sky from left to right in a subtle arc
            owl.position.x = -16 + flightProgress * 32;
            owl.position.y = 11 + Math.sin(flightProgress * Math.PI) * 2.5;
            owl.position.z = -20 + Math.sin(flightProgress * Math.PI * 2) * 3;
            owl.rotation.y = Math.PI / 2 + Math.cos(flightProgress * Math.PI) * 0.2;

            // Wing flap: flaps periodically, glides otherwise
            const flap = Math.sin(flightProgress * 45);
            wingL.rotation.z = flap * 0.6;
            wingR.rotation.z = -flap * 0.6;
        }
    };
}

// =========================================================================
// 3. SCENE BEACH: SEAGULL FLOCK, SAND CRAB & LEAPING DOLPHIN
// =========================================================================
function createSeagullFlock(count = 5) {
    const flock = new THREE.Group();
    const matBird = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const matBeak = new THREE.MeshBasicMaterial({ color: 0xffb703 });

    const birds = [];

    for (let i = 0; i < count; i++) {
        const bird = new THREE.Group();

        // Body
        const bodyGeo = new THREE.ConeGeometry(0.08, 0.45, 6);
        bodyGeo.rotateX(Math.PI / 2);
        const body = new THREE.Mesh(bodyGeo, matBird);
        bird.add(body);

        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.1, 4), matBeak);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, 0, 0.26);
        bird.add(beak);

        // Articulated Wings
        const wingL = new THREE.Group();
        wingL.position.set(-0.06, 0.02, 0);
        const wLMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14), matBird);
        wLMesh.position.x = -0.19;
        wingL.add(wLMesh);

        const wingR = new THREE.Group();
        wingR.position.set(0.06, 0.02, 0);
        const wRMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.14), matBird);
        wRMesh.position.x = 0.19;
        wingR.add(wRMesh);

        bird.add(wingL, wingR);

        // Individual flight trajectory offsets
        birds.push({
            mesh: bird,
            wingL,
            wingR,
            offsetAngle: (i / count) * Math.PI * 2,
            radius: 8.5 + (i % 3) * 1.8,
            height: 6.5 + i * 0.6,
            speed: 0.35 + (i * 0.04)
        });

        flock.add(bird);
    }

    let time = 0;
    return {
        mesh: flock,
        update: (delta) => {
            time += delta;
            birds.forEach(b => {
                const angle = time * b.speed + b.offsetAngle;
                b.mesh.position.x = Math.cos(angle) * b.radius;
                b.mesh.position.z = -12 + Math.sin(angle) * (b.radius * 0.6);
                b.mesh.position.y = b.height + Math.sin(angle * 2) * 0.8;

                // Turn towards flight tangent
                b.mesh.rotation.y = -angle + Math.PI / 2;
                b.mesh.rotation.z = Math.sin(angle * 2) * 0.2; // banking into turn

                // Smooth wing flapping
                const flap = Math.sin(time * 8 + b.offsetAngle) * 0.65;
                b.wingL.rotation.z = flap;
                b.wingR.rotation.z = -flap;
            });
        }
    };
}

function createCrab() {
    const crab = new THREE.Group();
    const matShell = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const matEye = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Shell
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), matShell);
    shell.scale.set(1.4, 0.6, 1.0);
    shell.position.y = 0.08;
    crab.add(shell);

    // Eye Stalks
    for (let s = -1; s <= 1; s += 2) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), matEye);
        eye.position.set(s * 0.06, 0.16, 0.08);
        crab.add(eye);
    }

    // Pincers / Claws
    const clawL = new THREE.Group();
    clawL.position.set(-0.16, 0.1, 0.1);
    const cLM = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), matShell);
    cLM.scale.set(1.4, 0.8, 0.6);
    clawL.add(cLM);

    const clawR = new THREE.Group();
    clawR.position.set(0.16, 0.1, 0.1);
    const cRM = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), matShell);
    cRM.scale.set(1.4, 0.8, 0.6);
    clawR.add(cRM);

    crab.add(clawL, clawR);

    // Legs
    const legs = [];
    for (let i = 0; i < 6; i++) {
        const side = i < 3 ? -1 : 1;
        const row = (i % 3) - 1;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.01, 0.14, 4), matShell);
        leg.position.set(side * 0.14, 0.05, row * 0.07);
        leg.rotation.z = side * 0.6;
        crab.add(leg);
        legs.push(leg);
    }

    crab.position.set(1.8, -0.15, 3.2);

    let time = 0;
    let scuttleDir = 1;
    let scuttleTimer = 0;

    return {
        mesh: crab,
        update: (delta) => {
            time += delta;
            scuttleTimer += delta;

            if (scuttleTimer > 3.0) {
                scuttleDir *= -1;
                scuttleTimer = 0;
            }

            // Scuttle sideways on beach sand
            crab.position.x += scuttleDir * delta * 0.45;
            legs.forEach((l, idx) => {
                l.rotation.x = Math.sin(time * 12 + idx) * 0.35;
            });

            // Wiggle claws playfully
            clawL.rotation.y = Math.sin(time * 4) * 0.3;
            clawR.rotation.y = -Math.sin(time * 4) * 0.3;
        }
    };
}

function createDolphin() {
    const dolphin = new THREE.Group();
    const matSkin = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.3,
        metalness: 0.4
    });

    // Sleek streamlined body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.32, 1.4, 12);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, matSkin);
    dolphin.add(body);

    // Beak / Snout
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), matSkin);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, -0.05, 0.85);
    dolphin.add(beak);

    // Dorsal Fin
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), matSkin);
    fin.position.set(0, 0.35, 0);
    fin.rotation.x = -0.5;
    dolphin.add(fin);

    // Fluke / Tail
    const tailGeo = new THREE.PlaneGeometry(0.45, 0.2);
    const tail = new THREE.Mesh(tailGeo, matSkin);
    tail.rotation.x = Math.PI / 2;
    tail.position.set(0, 0, -0.85);
    dolphin.add(tail);

    dolphin.position.set(0, -5, -18);

    let jumpTimer = 0;
    let isJumping = false;
    let jumpProgress = 0;

    return {
        mesh: dolphin,
        update: (delta) => {
            jumpTimer += delta;

            // Leap every 12 seconds
            if (!isJumping && jumpTimer > 8.0) {
                isJumping = true;
                jumpProgress = 0;
                dolphin.position.x = (Math.random() - 0.5) * 12;
            }

            if (isJumping) {
                jumpProgress += delta * 0.75;
                const arc = Math.sin(jumpProgress * Math.PI);

                // Parabolic leap out of water and back
                dolphin.position.y = -0.4 + arc * 1.8;
                dolphin.position.z = -18 + jumpProgress * 3.5;

                // Pitch angle smoothly following the trajectory
                dolphin.rotation.x = (jumpProgress - 0.5) * 1.6;

                // Tail swish
                tail.rotation.x = Math.PI / 2 + Math.sin(jumpProgress * 25) * 0.3;

                if (jumpProgress >= 1.0) {
                    isJumping = false;
                    jumpTimer = 0;
                    dolphin.position.y = -5;
                }
            }
        }
    };
}

// =========================================================================
// 4. SCENE SAKURA: KOI FISH IN POND, BUTTERFLIES & GRAZING DEER
// =========================================================================
function createKoiFish() {
    const koi = new THREE.Group();

    // Vibrant Kohaku pattern (White with vermilion orange patches)
    const matKoi = new THREE.MeshStandardMaterial({
        color: 0xff4500,
        roughness: 0.2,
        metalness: 0.1
    });

    const matWhite = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2
    });

    // Body segments for S-curve swimming
    const seg1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), matKoi);
    seg1.scale.set(0.8, 0.7, 1.4);
    koi.add(seg1);

    const tailJoint = new THREE.Group();
    tailJoint.position.set(0, 0, -0.16);
    koi.add(tailJoint);

    const seg2 = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 8), matWhite);
    seg2.rotation.x = -Math.PI / 2;
    seg2.position.set(0, 0, -0.14);
    tailJoint.add(seg2);

    const caudalFin = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.14), matKoi);
    caudalFin.rotation.x = Math.PI / 2;
    caudalFin.position.set(0, 0, -0.3);
    tailJoint.add(caudalFin);

    koi.position.set(1.5, 0.02, -1.5);
    koi.scale.setScalar(0.7);

    let swimAngle = 0;

    return {
        mesh: koi,
        update: (delta) => {
            swimAngle += delta * 0.65;

            // Swim in an elliptical loop in the pond
            const radiusX = 2.6;
            const radiusZ = 1.9;
            const centerX = 1.5;
            const centerZ = -1.5;

            koi.position.x = centerX + Math.cos(swimAngle) * radiusX;
            koi.position.z = centerZ + Math.sin(swimAngle) * radiusZ;

            // Face swimming direction
            koi.rotation.y = -swimAngle;

            // Realistic rhythmic tail swish (S-curve)
            tailJoint.rotation.y = Math.sin(swimAngle * 6) * 0.45;
        }
    };
}

function createButterflies(count = 4) {
    const group = new THREE.Group();
    const colors = [0xf472b6, 0x38bdf8, 0xfde047, 0xa78bfa];
    const butterflies = [];

    for (let i = 0; i < count; i++) {
        const b = new THREE.Group();
        const matWing = new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            side: THREE.DoubleSide
        });

        // Wings
        const wingL = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), matWing);
        wingL.position.x = -0.05;
        const wingR = new THREE.Mesh(new THREE.CircleGeometry(0.07, 6), matWing);
        wingR.position.x = 0.05;

        b.add(wingL, wingR);
        group.add(b);

        butterflies.push({
            mesh: b,
            wingL,
            wingR,
            basePos: new THREE.Vector3(-1.8 + (i % 2) * 2.5, 1.2 + i * 0.3, 0.5 + (i * 0.6)),
            speed: 0.8 + i * 0.2,
            phase: i * 1.5
        });
    }

    let time = 0;
    return {
        mesh: group,
        update: (delta) => {
            time += delta;
            butterflies.forEach(b => {
                const t = time * b.speed + b.phase;
                // Fluttering orbit
                b.mesh.position.x = b.basePos.x + Math.sin(t) * 0.8;
                b.mesh.position.y = b.basePos.y + Math.cos(t * 1.5) * 0.35;
                b.mesh.position.z = b.basePos.z + Math.cos(t) * 0.8;

                // Rapid wing flap (~18 Hz)
                const flap = Math.sin(time * 22 + b.phase) * 1.1;
                b.wingL.rotation.y = flap;
                b.wingR.rotation.y = -flap;
            });
        }
    };
}

function createGrazingFawn() {
    const fawn = new THREE.Group();
    const matFawn = new THREE.MeshStandardMaterial({ color: 0xba7947, roughness: 0.85 });
    const matSpot = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.7, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeo, matFawn);
    body.position.y = 0.55;
    fawn.add(body);

    // Dappled spots
    for (let i = -2; i <= 2; i++) {
        const spot = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6), matSpot);
        spot.rotation.x = -Math.PI / 2;
        spot.position.set(0.08, 0.76, i * 0.1);
        fawn.add(spot);
    }

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.45, 8), matFawn);
    neck.position.set(0, 0.85, 0.32);
    neck.rotation.x = -0.5;
    fawn.add(neck);

    const headJoint = new THREE.Group();
    headJoint.position.set(0, 1.05, 0.46);
    fawn.add(headJoint);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.3), matFawn);
    headJoint.add(head);

    // Delicate pointy ears
    for (let s = -1; s <= 1; s += 2) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), matFawn);
        ear.position.set(s * 0.1, 0.12, -0.05);
        ear.rotation.set(-0.2, 0, s * 0.5);
        headJoint.add(ear);
    }

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.03, 0.55, 6);
    [[-0.12, 0.28, 0.22], [0.12, 0.28, 0.22], [-0.12, 0.28, -0.22], [0.12, 0.28, -0.22]].forEach(p => {
        const leg = new THREE.Mesh(legGeo, matFawn);
        leg.position.set(...p);
        fawn.add(leg);
    });

    fawn.position.set(-2.8, 0, -2.2);
    fawn.rotation.y = 0.65;

    let time = 0;
    return {
        mesh: fawn,
        update: (delta) => {
            time += delta;
            // Peaceful grazing motion: lowering snout to grass, lifting, looking around
            headJoint.rotation.x = Math.sin(time * 0.5) * 0.35 + 0.3;
            headJoint.rotation.y = Math.sin(time * 0.25) * 0.2;
        }
    };
}

// Global Exports
window.createCat = createCat;
window.createArcticFox = createArcticFox;
window.createReindeerHerd = createReindeerHerd;
window.createOwl = createOwl;
window.createSeagullFlock = createSeagullFlock;
window.createCrab = createCrab;
window.createDolphin = createDolphin;
window.createKoiFish = createKoiFish;
window.createButterflies = createButterflies;
window.createGrazingFawn = createGrazingFawn;
