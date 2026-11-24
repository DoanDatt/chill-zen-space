/**
 * ZenHaven 2.0 Procedural Audio Engine
 * Features:
 * - Rain, Fire, Ocean, Wind, Crickets
 * - Generative Lofi Piano Chords
 * - NEW: 432Hz Tibetan Singing Bowl (Chuông Xoay Tây Tạng Chữa Lành)
 * - NEW: Bamboo Wind Chimes (Chuông Gió Tre Thanh Khiết)
 * - NEW: Cozy Cat Purring & Meow
 */

class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.8;

        this.tracks = {
            lofi: { gainNode: null, volume: 0.65, isPlaying: false },
            rain: { gainNode: null, volume: 0.5, isPlaying: false, source: null },
            fire: { gainNode: null, volume: 0.45, isPlaying: false, source: null },
            ocean: { gainNode: null, volume: 0.0, isPlaying: false, source: null },
            wind: { gainNode: null, volume: 0.35, isPlaying: false, source: null },
            crickets: { gainNode: null, volume: 0.0, isPlaying: false, source: null }
        };

        this.lofiTimer = null;
        this.chordIndex = 0;
        this.catPurrGain = null;
        this.isPurring = false;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.createReverb();

            for (const key of Object.keys(this.tracks)) {
                const g = this.ctx.createGain();
                g.gain.setValueAtTime(0, this.ctx.currentTime);
                g.connect(this.masterGain);
                this.tracks[key].gainNode = g;
            }
        }

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createReverb() {
        const sampleRate = this.ctx.sampleRate;
        const length = sampleRate * 3.2; // 3.2s deep warm decay
        const impulse = this.ctx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const t = i / length;
            const decay = Math.exp(-t * 3.0);
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }

        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = impulse;

        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.masterGain);
    }

    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime + 0.1);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime + 0.2);
        }
        return this.isMuted;
    }

    setTrackVolume(trackName, val) {
        if (!this.tracks[trackName]) return;
        this.tracks[trackName].volume = val;
        if (this.tracks[trackName].isPlaying && this.tracks[trackName].gainNode && this.ctx) {
            this.tracks[trackName].gainNode.gain.linearRampToValueAtTime(val, this.ctx.currentTime + 0.1);
        }
    }

    // --- 1. RAIN GENERATOR ---
    startRain() {
        if (this.tracks.rain.isPlaying) return;
        this.init();

        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
            b6 = white * 0.115926;
        }

        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

        rainSource.connect(filter);
        filter.connect(this.tracks.rain.gainNode);

        this.tracks.rain.gainNode.gain.linearRampToValueAtTime(this.tracks.rain.volume, this.ctx.currentTime + 0.5);
        rainSource.start();

        this.tracks.rain.source = rainSource;
        this.tracks.rain.isPlaying = true;
    }

    stopRain() {
        if (!this.tracks.rain.isPlaying) return;
        this.tracks.rain.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        setTimeout(() => {
            if (this.tracks.rain.source) {
                try { this.tracks.rain.source.stop(); } catch (e) {}
            }
            this.tracks.rain.isPlaying = false;
        }, 450);
    }

    // --- 2. FIREPLACE GENERATOR ---
    startFire() {
        if (this.tracks.fire.isPlaying) return;
        this.init();

        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        const fireSource = this.ctx.createBufferSource();
        fireSource.buffer = noiseBuffer;
        fireSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        fireSource.connect(filter);
        filter.connect(this.tracks.fire.gainNode);

        this.firePopInterval = setInterval(() => {
            if (!this.tracks.fire.isPlaying || this.isMuted) return;
            if (Math.random() < 0.45) {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const popGain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(600 + Math.random() * 900, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.035);

                popGain.gain.setValueAtTime(this.tracks.fire.volume * 0.4, now);
                popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

                osc.connect(popGain);
                popGain.connect(this.masterGain);

                osc.start(now);
                osc.stop(now + 0.035);
            }
        }, 120);

        this.tracks.fire.gainNode.gain.linearRampToValueAtTime(this.tracks.fire.volume, this.ctx.currentTime + 0.5);
        fireSource.start();

        this.tracks.fire.source = fireSource;
        this.tracks.fire.isPlaying = true;
    }

    stopFire() {
        if (!this.tracks.fire.isPlaying) return;
        if (this.firePopInterval) clearInterval(this.firePopInterval);
        this.tracks.fire.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        setTimeout(() => {
            if (this.tracks.fire.source) {
                try { this.tracks.fire.source.stop(); } catch (e) {}
            }
            this.tracks.fire.isPlaying = false;
        }, 450);
    }

    // --- 3. OCEAN WAVES GENERATOR ---
    startOcean() {
        if (this.tracks.ocean.isPlaying) return;
        this.init();

        const bufferSize = 4 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.04 * white)) / 1.04;
            lastOut = output[i];
            output[i] *= 2.8;
        }

        const oceanSource = this.ctx.createBufferSource();
        oceanSource.buffer = noiseBuffer;
        oceanSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(450, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        const waveGain = this.ctx.createGain();
        const lfoVol = this.ctx.createOscillator();
        lfoVol.type = 'sine';
        lfoVol.frequency.setValueAtTime(0.12, this.ctx.currentTime);

        const lfoVolGain = this.ctx.createGain();
        lfoVolGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        lfoVol.connect(lfoVolGain);
        lfoVolGain.connect(waveGain.gain);

        oceanSource.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(this.tracks.ocean.gainNode);

        this.tracks.ocean.gainNode.gain.linearRampToValueAtTime(this.tracks.ocean.volume, this.ctx.currentTime + 0.6);
        oceanSource.start();
        lfo.start();
        lfoVol.start();

        this.tracks.ocean.source = oceanSource;
        this.tracks.ocean._lfo = [lfo, lfoVol];
        this.tracks.ocean.isPlaying = true;
    }

    stopOcean() {
        if (!this.tracks.ocean.isPlaying) return;
        this.tracks.ocean.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        setTimeout(() => {
            if (this.tracks.ocean.source) {
                try { this.tracks.ocean.source.stop(); } catch (e) {}
            }
            if (this.tracks.ocean._lfo) {
                this.tracks.ocean._lfo.forEach(l => { try { l.stop(); } catch (e) {} });
            }
            this.tracks.ocean.isPlaying = false;
        }, 450);
    }

    // --- 4. NIGHT BREEZE ---
    startWind() {
        if (this.tracks.wind.isPlaying) return;
        this.init();

        const bufferSize = 3 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.12;
        }

        const windSource = this.ctx.createBufferSource();
        windSource.buffer = noiseBuffer;
        windSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 4.0;
        filter.frequency.setValueAtTime(380, this.ctx.currentTime);

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        windSource.connect(filter);
        filter.connect(this.tracks.wind.gainNode);

        this.tracks.wind.gainNode.gain.linearRampToValueAtTime(this.tracks.wind.volume, this.ctx.currentTime + 0.6);
        windSource.start();
        lfo.start();

        this.tracks.wind.source = windSource;
        this.tracks.wind._lfo = lfo;
        this.tracks.wind.isPlaying = true;
    }

    stopWind() {
        if (!this.tracks.wind.isPlaying) return;
        this.tracks.wind.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        setTimeout(() => {
            if (this.tracks.wind.source) {
                try { this.tracks.wind.source.stop(); } catch (e) {}
            }
            if (this.tracks.wind._lfo) {
                try { this.tracks.wind._lfo.stop(); } catch (e) {}
            }
            this.tracks.wind.isPlaying = false;
        }, 450);
    }

    // --- 5. CRICKETS ---
    startCrickets() {
        if (this.tracks.crickets.isPlaying) return;
        this.init();

        this.tracks.crickets.isPlaying = true;
        this.tracks.crickets.gainNode.gain.linearRampToValueAtTime(this.tracks.crickets.volume, this.ctx.currentTime + 0.5);

        this.cricketInterval = setInterval(() => {
            if (!this.tracks.crickets.isPlaying || this.isMuted) return;
            const now = this.ctx.currentTime;
            const bursts = 3 + Math.floor(Math.random() * 3);

            for (let b = 0; b < bursts; b++) {
                const burstTime = now + b * 0.06;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(4500 + Math.random() * 300, burstTime);

                gain.gain.setValueAtTime(0.001, burstTime);
                gain.gain.linearRampToValueAtTime(this.tracks.crickets.volume * 0.25, burstTime + 0.015);
                gain.gain.exponentialRampToValueAtTime(0.001, burstTime + 0.045);

                osc.connect(gain);
                gain.connect(this.tracks.crickets.gainNode);

                osc.start(burstTime);
                osc.stop(burstTime + 0.045);
            }
        }, 900 + Math.random() * 600);
    }

    stopCrickets() {
        if (!this.tracks.crickets.isPlaying) return;
        if (this.cricketInterval) clearInterval(this.cricketInterval);
        this.tracks.crickets.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        this.tracks.crickets.isPlaying = false;
    }

    // --- 6. GENERATIVE LOFI PIANO ---
    startLofi() {
        if (this.tracks.lofi.isPlaying) return;
        this.init();

        this.tracks.lofi.isPlaying = true;
        this.tracks.lofi.gainNode.gain.linearRampToValueAtTime(this.tracks.lofi.volume, this.ctx.currentTime + 0.5);

        const chordBook = [
            [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
            [110.00, 130.81, 164.81, 196.00, 246.94], // Am9
            [87.31, 110.00, 130.81, 164.81, 246.94],  // Fmaj7#11
            [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
            [82.41, 98.00, 123.47, 146.83, 196.00],   // Em7
            [98.00, 130.81, 174.61, 220.00, 329.63]   // G13sus
        ];

        const playNextChord = () => {
            if (!this.tracks.lofi.isPlaying) return;

            const chord = chordBook[this.chordIndex % chordBook.length];
            this.chordIndex++;

            const now = this.ctx.currentTime;
            const chordDuration = 4.4;

            chord.forEach((freq, idx) => {
                const noteTime = now + idx * (0.06 + Math.random() * 0.04);
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                const vibrato = this.ctx.createOscillator();
                vibrato.frequency.setValueAtTime(4.2 + Math.random() * 0.6, noteTime);
                const vibratoGain = this.ctx.createGain();
                vibratoGain.gain.setValueAtTime(1.2, noteTime);
                vibrato.connect(osc.frequency);
                vibrato.start(noteTime);
                vibrato.stop(noteTime + chordDuration);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800 + Math.random() * 200, noteTime);
                filter.frequency.exponentialRampToValueAtTime(350, noteTime + chordDuration);

                const noteGain = this.ctx.createGain();
                noteGain.gain.setValueAtTime(0.001, noteTime);
                noteGain.gain.linearRampToValueAtTime(0.12 / Math.sqrt(chord.length), noteTime + 0.12);
                noteGain.gain.exponentialRampToValueAtTime(0.0005, noteTime + chordDuration);

                osc.connect(filter);
                filter.connect(noteGain);
                noteGain.connect(this.tracks.lofi.gainNode);

                if (this.reverbNode) noteGain.connect(this.reverbNode);

                osc.start(noteTime);
                osc.stop(noteTime + chordDuration);
            });

            this.lofiTimer = setTimeout(playNextChord, 4500);
        };

        playNextChord();
    }

    stopLofi() {
        if (!this.tracks.lofi.isPlaying) return;
        if (this.lofiTimer) clearTimeout(this.lofiTimer);
        this.tracks.lofi.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        this.tracks.lofi.isPlaying = false;
    }

    // --- 7. NEW: 432Hz TIBETAN SINGING BOWL (Chuông Xoay Tây Tạng) ---
    // Deep harmonic resonance at sacred healing frequency 432 Hz
    playSingingBowl() {
        this.init();
        const now = this.ctx.currentTime;
        const fundamental = 432; // Sacred A=432Hz tuning
        const harmonics = [1, 2.76, 5.4, 8.1]; // Metal bowl acoustic partials
        const duration = 6.5;

        harmonics.forEach((ratio, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = fundamental * ratio;
            osc.frequency.setValueAtTime(freq, now);

            // Subtle gentle tremolo modulation
            const trem = this.ctx.createOscillator();
            trem.frequency.setValueAtTime(2.5 + idx * 0.5, now);
            const tremGain = this.ctx.createGain();
            tremGain.gain.setValueAtTime(0.08, now);
            trem.connect(gain.gain);
            trem.start(now);
            trem.stop(now + duration);

            const amp = 0.28 / Math.pow(idx + 1, 1.3);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(amp, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

            osc.connect(gain);
            gain.connect(this.masterGain);
            if (this.reverbNode) gain.connect(this.reverbNode);

            osc.start(now);
            osc.stop(now + duration);
        });
    }

    // --- 8. NEW: BAMBOO WIND CHIMES ---
    playWindChimes() {
        this.init();
        const now = this.ctx.currentTime;
        const pentatonic = [587.33, 659.25, 783.99, 880.0, 1046.5]; // D5, E5, G5, A5, C6
        const strikes = 4 + Math.floor(Math.random() * 3);

        for (let i = 0; i < strikes; i++) {
            const strikeTime = now + i * (0.12 + Math.random() * 0.15);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
            osc.frequency.setValueAtTime(freq, strikeTime);

            gain.gain.setValueAtTime(0.001, strikeTime);
            gain.gain.linearRampToValueAtTime(0.18, strikeTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 2.2);

            osc.connect(gain);
            gain.connect(this.masterGain);
            if (this.reverbNode) gain.connect(this.reverbNode);

            osc.start(strikeTime);
            osc.stop(strikeTime + 2.2);
        }
    }

    // --- 9. NEW: COZY CAT PURR & MEOW ---
    playCatMeow() {
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        filter.type = 'bandpass';
        filter.Q.value = 3.5;

        // Sweet soft meow
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.5);

        filter.frequency.setValueAtTime(1150, now);
        filter.frequency.exponentialRampToValueAtTime(1550, now + 0.18);
        filter.frequency.exponentialRampToValueAtTime(900, now + 0.5);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playChime() {
        this.init();
        const now = this.ctx.currentTime;
        const freqs = [1046.5, 1318.5, 1567.98, 2093.0];

        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.08);

            gain.gain.setValueAtTime(0.001, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 2.5);

            osc.connect(gain);
            gain.connect(this.masterGain);
            if (this.reverbNode) gain.connect(this.reverbNode);

            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 2.5);
        });
    }
}

window.zenAudio = new AudioEngine();
