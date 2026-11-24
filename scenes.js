/**
 * ZenHaven 4.0 - 3D scene controller (Three.js r128)
 * - Hover the mouse: the whole scene gently rotates around you.
 * - Drag: look around further. Wheel / pinch: zoom. Tap: little hearts (and pet the cat).
 * - 4 worlds (rain / aurora / beach / sakura) built lazily, with bloom + fade transitions.
 */
class ZenScenes {
    constructor(container) {
        this.container = container;
        this.currentSceneId = null;
        this.worlds = {};
        this.builders = {
            rain: window.buildRainScene, aurora: window.buildAuroraScene,
            beach: window.buildBeachScene, sakura: window.buildSakuraScene
        };
        container.innerHTML = '';

        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        ZU.pixelRatio = dpr;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.canvas = this.renderer.domElement;
        this.canvas.id = 'zen-canvas';
        this.canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;cursor:grab;';
        container.appendChild(this.canvas);

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1500);
        this.clock = new THREE.Clock();
        this.time = 0;

        // fade overlay used when switching scenes
        this.fade = document.createElement('div');
        this.fade.style.cssText = 'position:absolute;inset:0;background:#05060c;opacity:1;transition:opacity .55s ease;pointer-events:none;z-index:5;';
        container.appendChild(this.fade);

        // camera rig state
        this.mouseX = 0; this.mouseY = 0; this.smMouseX = 0; this.smMouseY = 0;
        this.dragYaw = 0; this.dragPitch = 0; this.yaw = 0; this.pitch = 0;
        this.zoom = 1; this.targetZoom = 1;
        this.dragging = false; this.dragMoved = 0; this.lastX = 0; this.lastY = 0;
        this.hearts = [];
        this.raycaster = new THREE.Raycaster();

        this.initPost();
        this.bindEvents();

        this.switching = false;
        this.baseDpr = dpr;
        this.quality = 'high';
        const q = new URLSearchParams(location.search).get('q');
        this.autoQuality = !q;
        this.activate('rain');
        const weak = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || (navigator.hardwareConcurrency || 8) <= 4;
        if (q ? q !== 'high' : weak) this.setQuality(q === 'minimal' ? 'minimal' : 'low');
        requestAnimationFrame(() => { this.fade.style.opacity = '0'; });
    }

    // ------------------------------------------------------------------ post-processing
    initPost() {
        const w = window.innerWidth, h = window.innerHeight, dpr = this.renderer.getPixelRatio();
        let target = undefined;
        if (this.renderer.capabilities.isWebGL2 && THREE.WebGLMultisampleRenderTarget) {
            target = new THREE.WebGLMultisampleRenderTarget(w * dpr, h * dpr, { format: THREE.RGBAFormat });
            target.samples = 4;
        }
        this.composer = new THREE.EffectComposer(this.renderer, target);
        this.composer.setPixelRatio(dpr);
        this.composer.setSize(w, h);
        this.renderPass = new THREE.RenderPass(new THREE.Scene(), this.camera);
        this.composer.addPass(this.renderPass);
        this.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.8, 0.5);
        this.composer.addPass(this.bloom);
    }

    // ------------------------------------------------------------------ input
    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'mouse' || this.dragging) {
                this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
                this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
            }
            if (this.dragging) {
                const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
                this.dragMoved += Math.abs(dx) + Math.abs(dy);
                this.dragYaw -= dx * 0.0055;
                this.dragPitch += dy * 0.0035;
                this.lastX = e.clientX; this.lastY = e.clientY;
            }
        });
        this.canvas.addEventListener('pointerdown', (e) => {
            this.dragging = true; this.dragMoved = 0;
            this.lastX = e.clientX; this.lastY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
            try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        });
        const end = (e) => {
            if (!this.dragging) return;
            this.dragging = false;
            this.canvas.style.cursor = 'grab';
            if (this.dragMoved < 7 && e && e.type === 'pointerup') this.handleTap(e.clientX, e.clientY);
        };
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', () => { this.dragging = false; this.canvas.style.cursor = 'grab'; });
        window.addEventListener('pointerleave', () => { this.mouseX = 0; this.mouseY = 0; });
        document.addEventListener('mouseleave', () => { this.mouseX = 0; this.mouseY = 0; });
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetZoom = Math.min(1.35, Math.max(0.6, this.targetZoom * (1 + e.deltaY * 0.0009)));
        }, { passive: false });
    }

    resize() {
        const w = window.innerWidth, h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
        this.camera.aspect = w / h;
        this.applyFov();
        for (const id in this.worlds) {
            this.worlds[id].scene.traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.uPR) o.material.uniforms.uPR.value = this.renderer.getPixelRatio(); });
        }
    }

    applyFov() {
        const w = this.world;
        const base = w ? w.cfg.fov : 50;
        const a = this.camera.aspect;
        this.camera.fov = a < 1.3 ? base * Math.pow(Math.min(1.9, 1.3 / a), 0.85) : base;
        this.camera.updateProjectionMatrix();
    }

    // ------------------------------------------------------------------ adaptive quality (weak phones / laptops)
    setQuality(level) {
        this.quality = level;
        const dpr = level === 'high' ? this.baseDpr : Math.min(1.25, this.baseDpr);
        this.renderer.setPixelRatio(dpr);
        this.composer.setPixelRatio(dpr);
        this.bloom.enabled = level !== 'minimal';
        for (const id in this.worlds) this.applyQualityTo(this.worlds[id]);
        this.resize();
    }

    applyQualityTo(w) {
        const low = this.quality !== 'high';
        w.scene.traverse(o => {
            if (o.isLight && o.shadow) {
                if (o.userData.cs === undefined) o.userData.cs = o.castShadow;
                o.castShadow = low ? false : o.userData.cs;
            }
        });
    }

    // ------------------------------------------------------------------ worlds
    getWorld(id) {
        if (!this.worlds[id]) {
            const build = this.builders[id];
            this.worlds[id] = build();
            this.applyQualityTo(this.worlds[id]);
            // compile shaders for this world up-front to avoid a hitch on first frame
            try { this.renderer.compile(this.worlds[id].scene, this.camera); } catch (_) { /* ignore */ }
        }
        return this.worlds[id];
    }

    activate(id) {
        const w = this.getWorld(id);
        this.world = w;
        this.currentSceneId = id;
        this.renderPass.scene = w.scene;
        const b = w.cfg.bloom;
        this.bloom.strength = b.strength; this.bloom.radius = b.radius; this.bloom.threshold = b.threshold;
        this.dragYaw = 0; this.dragPitch = 0; this.yaw = 0; this.pitch = 0; this.targetZoom = 1; this.zoom = 1;
        this.hearts.forEach(h => { if (h.parent) h.parent.remove(h.sprite); });
        this.hearts = [];
        this.applyFov();
        this.updateCamera(0.016);
    }

    switchScene(id) {
        if (id === this.currentSceneId || !this.builders[id]) return;
        this.fade.style.opacity = '1';
        const token = (this.switchToken = (this.switchToken || 0) + 1);
        setTimeout(() => {
            if (token !== this.switchToken) return;
            this.activate(id);
            requestAnimationFrame(() => { this.fade.style.opacity = '0'; });
        }, 560);
    }

    // sky lantern with a typed wish (called from ZenTools)
    launchSkyLantern(text) {
        const w = this.getWorld('aurora');
        if (this.currentSceneId !== 'aurora') {
            this.switchScene('aurora');
            setTimeout(() => w.launchLantern(text), 700);
        } else {
            w.launchLantern(text);
        }
        if (window.zenAudio) window.zenAudio.playChime();
    }

    // ------------------------------------------------------------------ interaction
    handleTap(cx, cy) {
        if (!this.world) return;
        const ndc = new THREE.Vector2((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
        this.raycaster.setFromCamera(ndc, this.camera);
        if (this.world.pettable) {
            const hits = this.raycaster.intersectObject(this.world.pettable, true);
            if (hits.length) { this.petCat(); return; }
        }
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.05);
        const pt = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(plane, pt) && pt.distanceTo(this.camera.position) < 60) {
            this.spawnHearts(pt.clone().setY(0.4), 3);
            if (this.world.onTap) this.world.onTap(pt, this.time);
        }
    }

    petCat() {
        if (window.zenAudio) { window.zenAudio.init(); window.zenAudio.playCatMeow(); }
        const w = this.world;
        if (w.onPet) w.onPet();
        if (w.petPos) this.spawnHearts(w.petPos(), 7);
    }

    spawnHearts(pos, n) {
        for (let i = 0; i < n; i++) {
            const mat = new THREE.SpriteMaterial({ map: ZU.heartTex(), transparent: true, depthWrite: false, fog: false, opacity: 0 });
            const s = new THREE.Sprite(mat);
            const size = 0.35 + Math.random() * 0.3;
            s.scale.set(size, size, 1);
            s.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.9, Math.random() * 0.3, (Math.random() - 0.5) * 0.6));
            this.world.scene.add(s);
            this.hearts.push({ sprite: s, parent: this.world.scene, age: -i * 0.12, vy: 0.7 + Math.random() * 0.5, sx: (Math.random() - 0.5) * 0.4, size });
        }
    }

    updateHearts(dt) {
        for (let i = this.hearts.length - 1; i >= 0; i--) {
            const h = this.hearts[i];
            h.age += dt;
            if (h.age < 0) continue;
            h.sprite.position.y += h.vy * dt;
            h.sprite.position.x += h.sx * dt + Math.sin(h.age * 4) * 0.004;
            const life = 1.8, k = h.age / life;
            h.sprite.material.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.95;
            const sc = h.size * (0.6 + Math.min(1, k * 3) * 0.6);
            h.sprite.scale.set(sc, sc, 1);
            if (k >= 1) { h.parent.remove(h.sprite); h.sprite.material.dispose(); this.hearts.splice(i, 1); }
        }
    }

    // ------------------------------------------------------------------ camera rig
    updateCamera(dt) {
        const cfg = this.world.cfg;
        const k = 1 - Math.exp(-dt * 3.2);
        this.smMouseX += (this.mouseX - this.smMouseX) * k;
        this.smMouseY += (this.mouseY - this.smMouseY) * k;
        this.zoom += (this.targetZoom - this.zoom) * (1 - Math.exp(-dt * 6));

        if (!this.dragging) {              // drag offset relaxes very slowly back to centre
            const r = Math.exp(-dt * 0.08);
            this.dragYaw *= r; this.dragPitch *= r;
        }
        this.dragYaw = Math.max(-cfg.maxYaw, Math.min(cfg.maxYaw, this.dragYaw));
        this.dragPitch = Math.max(-0.3, Math.min(0.45, this.dragPitch));

        const idleYaw = Math.sin(this.time * 0.11) * 0.035;
        const idlePitch = Math.sin(this.time * 0.17 + 1.3) * 0.012;
        let tYaw = this.dragYaw - this.smMouseX * cfg.hoverYaw + idleYaw;
        let tPitch = this.dragPitch + this.smMouseY * cfg.hoverPitch + idlePitch;
        tYaw = Math.max(-cfg.maxYaw, Math.min(cfg.maxYaw, tYaw));
        tPitch = Math.max(cfg.minPitch, Math.min(cfg.maxPitch, tPitch));
        const k2 = dt === 0 ? 1 : 1 - Math.exp(-dt * 5);
        this.yaw += (tYaw - this.yaw) * k2;
        this.pitch += (tPitch - this.pitch) * k2;

        const off = new THREE.Vector3(0, cfg.camY - cfg.target.y, cfg.dist * this.zoom);
        off.applyEuler(new THREE.Euler(-this.pitch, this.yaw, 0, 'YXZ'));
        this.camera.position.copy(cfg.target).add(off);
        if (this.camera.position.y < cfg.minCamY) this.camera.position.y = cfg.minCamY;
        this.camera.lookAt(cfg.target);
    }

    // ------------------------------------------------------------------ frame
    update(dt) {
        this.time += dt;
        this.updateCamera(dt);
        this.world.update(dt, this.time, { camera: this.camera });
        this.updateHearts(dt);
    }

    render() {
        const raw = this.clock.getDelta();
        const dt = Math.min(raw, 0.08);
        if (!this.world) return;
        if (this.autoQuality && raw < 0.25 && !document.body.classList.contains('intro-open')) {
            this.fAcc = (this.fAcc || 0) + raw; this.fN = (this.fN || 0) + 1;
            if (this.fN >= 150) {                       // judge every ~150 frames
                const avg = this.fAcc / this.fN;
                this.fAcc = 0; this.fN = 0;
                if (avg > 0.036) {
                    if (this.quality === 'high') this.setQuality('low');
                    else if (this.quality === 'low') this.setQuality('minimal');
                }
            }
        }
        this.update(dt);
        this.composer.render(dt);
    }
}

window.ZenScenes = ZenScenes;
