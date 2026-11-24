/**
 * ZenHaven 2.0 Zen Tools & Interactive Features
 * Features:
 * 1. 4-7-8 Guided Breathing Circle
 * 2. Thought Release Burner (Hóa tro muộn phiền thành sao)
 * 3. NEW: Sky Lantern Wish Release (Thả đèn trời ước nguyện)
 * 4. NEW: 432Hz Tibetan Singing Bowl & Bamboo Chimes
 * 5. Daily Comforting Affirmations
 * 6. Sleep Timer
 */

class ZenTools {
    constructor(scenesRef) {
        this.scenes = scenesRef;
        this.breathingActive = false;
        this.breathePhase = 'idle';
        this.breatheTimer = null;
        this.sleepTimer = null;
        this.sleepTimeLeft = 0;

        this.quotes = [
            "Hôm nay bạn đã làm rất tốt rồi. Hãy cho phép bản thân được nghỉ ngơi.",
            "Mọi chuyện xảy ra đều có lý do, và ngày mai sẽ là một khởi đầu dịu dàng hơn.",
            "Bạn không cần phải hoàn hảo. Đôi khi, chỉ cần cố gắng hết sức hôm nay đã là một kỳ tích.",
            "Hãy hít thở thật sâu, thả lỏng đôi vai, và buông bỏ những âu lo không thuộc về hiện tại.",
            "Sau cơn mưa, bầu trời luôn trong trẻo hơn. Bạn cũng vậy, sự bình yên đang trở về với bạn.",
            "Từng bước nhỏ vẫn là tiến về phía trước. Hãy tự hào về chính mình của ngày hôm nay.",
            "Thế giới ngoài kia có thể ồn ào và vội vã, nhưng nơi đây là chốn bình yên dành riêng cho bạn.",
            "Mọi áp lực đều đã ở lại phía sau cánh cửa. Bây giờ là thời gian để tâm hồn bạn được vỗ về.",
            "Cảm ơn bạn vì đã kiên trì đến tận giây phút này. Chúc bạn có một giấc ngủ thật ngon lành."
        ];

        this.initDOM();
    }

    initDOM() {
        // Daily Quote button
        const btnNewQuote = document.getElementById('btn-new-quote');
        if (btnNewQuote) {
            btnNewQuote.addEventListener('click', () => this.drawQuote());
        }

        // Breathing Circle Toggle
        const btnBreathe = document.getElementById('btn-toggle-breathe');
        if (btnBreathe) {
            btnBreathe.addEventListener('click', () => this.toggleBreathing());
        }

        // Thought Burner Submit
        const btnBurnThought = document.getElementById('btn-burn-thought');
        const thoughtInput = document.getElementById('thought-input');
        if (btnBurnThought && thoughtInput) {
            btnBurnThought.addEventListener('click', () => {
                const text = thoughtInput.value.trim();
                if (!text) return;
                this.burnThought(text);
            });
        }

        // Sky Lantern Wish Release
        const btnReleaseLantern = document.getElementById('btn-release-lantern');
        const wishInput = document.getElementById('wish-input');
        if (btnReleaseLantern && wishInput) {
            btnReleaseLantern.addEventListener('click', () => {
                const wish = wishInput.value.trim();
                this.releaseLantern(wish);
            });
        }

        // 432Hz Tibetan Singing Bowl Trigger
        const btnBowl = document.getElementById('btn-singing-bowl');
        if (btnBowl) {
            btnBowl.addEventListener('click', () => {
                if (window.zenAudio) {
                    window.zenAudio.playSingingBowl();
                }
                btnBowl.classList.add('pulse');
                setTimeout(() => btnBowl.classList.remove('pulse'), 1500);
            });
        }

        // Bamboo Wind Chime Trigger
        const btnChime = document.getElementById('btn-wind-chime');
        if (btnChime) {
            btnChime.addEventListener('click', () => {
                if (window.zenAudio) {
                    window.zenAudio.playWindChimes();
                }
            });
        }

        // Sleep Timer Presets
        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mins = parseInt(btn.dataset.mins, 10);
                this.startSleepTimer(mins);
            });
        });

        // Initialize first random quote
        this.drawQuote();
    }

    drawQuote() {
        const quoteEl = document.getElementById('quote-text');
        if (quoteEl) {
            const random = this.quotes[Math.floor(Math.random() * this.quotes.length)];
            quoteEl.style.opacity = '0';
            setTimeout(() => {
                quoteEl.textContent = `"${random}"`;
                quoteEl.style.opacity = '1';
            }, 250);
        }
    }

    // 4-7-8 Breathing Guide Cycle
    toggleBreathing() {
        const modal = document.getElementById('breathe-modal');
        if (!modal) return;

        this.breathingActive = !this.breathingActive;
        modal.classList.toggle('active', this.breathingActive);

        if (this.breathingActive) {
            this.runBreathingCycle();
        } else {
            if (this.breatheTimer) clearTimeout(this.breatheTimer);
        }
    }

    runBreathingCycle() {
        if (!this.breathingActive) return;

        const circle = document.getElementById('breathe-circle');
        const text = document.getElementById('breathe-instruction');
        const count = document.getElementById('breathe-count');

        // Step 1: INHALE (4 seconds)
        this.breathePhase = 'inhale';
        if (text) text.textContent = 'Hít vào chậm rãi qua mũi...';
        if (circle) {
            circle.style.transition = 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)';
            circle.style.transform = 'scale(1.5)';
            circle.style.borderColor = '#6ee7b7';
            circle.style.boxShadow = '0 0 35px rgba(110, 231, 183, 0.55)';
        }

        let seconds = 4;
        const tickInhale = setInterval(() => {
            if (!this.breathingActive) { clearInterval(tickInhale); return; }
            if (count) count.textContent = `${seconds}`;
            seconds--;
            if (seconds < 0) {
                clearInterval(tickInhale);
                this.stepHold();
            }
        }, 1000);
    }

    stepHold() {
        if (!this.breathingActive) return;

        const circle = document.getElementById('breathe-circle');
        const text = document.getElementById('breathe-instruction');
        const count = document.getElementById('breathe-count');

        this.breathePhase = 'hold';
        if (text) text.textContent = 'Giữ hơi thở thanh thản...';
        if (circle) {
            circle.style.transition = 'none';
            circle.style.borderColor = '#93c5fd';
            circle.style.boxShadow = '0 0 35px rgba(147, 197, 253, 0.55)';
        }

        let seconds = 7;
        const tickHold = setInterval(() => {
            if (!this.breathingActive) { clearInterval(tickHold); return; }
            if (count) count.textContent = `${seconds}`;
            seconds--;
            if (seconds < 0) {
                clearInterval(tickHold);
                this.stepExhale();
            }
        }, 1000);
    }

    stepExhale() {
        if (!this.breathingActive) return;

        const circle = document.getElementById('breathe-circle');
        const text = document.getElementById('breathe-instruction');
        const count = document.getElementById('breathe-count');

        this.breathePhase = 'exhale';
        if (text) text.textContent = 'Thở ra nhẹ nhàng qua miệng...';
        if (circle) {
            circle.style.transition = 'transform 8s cubic-bezier(0.4, 0, 0.2, 1)';
            circle.style.transform = 'scale(1.0)';
            circle.style.borderColor = '#c084fc';
            circle.style.boxShadow = '0 0 25px rgba(192, 132, 252, 0.4)';
        }

        let seconds = 8;
        const tickExhale = setInterval(() => {
            if (!this.breathingActive) { clearInterval(tickExhale); return; }
            if (count) count.textContent = `${seconds}`;
            seconds--;
            if (seconds < 0) {
                clearInterval(tickExhale);
                this.runBreathingCycle();
            }
        }, 1000);
    }

    // Burn & Release Thought
    burnThought(text) {
        const thoughtPaper = document.getElementById('thought-paper');
        const thoughtInput = document.getElementById('thought-input');
        const sparkContainer = document.getElementById('thought-sparks');

        if (!thoughtPaper) return;

        if (window.zenAudio) window.zenAudio.playChime();
        thoughtPaper.classList.add('burning');

        if (sparkContainer) {
            sparkContainer.innerHTML = '';
            for (let i = 0; i < 30; i++) {
                const spark = document.createElement('div');
                spark.className = 'spark-particle';
                spark.style.left = `${Math.random() * 100}%`;
                spark.style.animationDelay = `${Math.random() * 0.4}s`;
                spark.style.animationDuration = `${0.8 + Math.random() * 0.8}s`;
                sparkContainer.appendChild(spark);
            }
        }

        setTimeout(() => {
            thoughtPaper.classList.remove('burning');
            if (thoughtInput) thoughtInput.value = '';
            if (sparkContainer) sparkContainer.innerHTML = '';

            const toast = document.getElementById('thought-toast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3500);
            }
        }, 1600);
    }

    // Release Sky Lantern Wish
    releaseLantern(wishText) {
        if (this.scenes) {
            // Switch to Aurora hill if not already
            if (this.scenes.currentSceneId !== 'aurora') {
                this.scenes.switchScene('aurora');
                document.querySelectorAll('.scene-btn').forEach(b => {
                    b.classList.toggle('active', b.dataset.scene === 'aurora');
                });
            }
            this.scenes.launchSkyLantern(wishText);
        }

        const wishInput = document.getElementById('wish-input');
        if (wishInput) wishInput.value = '';

        const toast = document.getElementById('wish-toast');
        if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 4000);
        }

        // Close modal
        const modal = document.getElementById('lantern-modal');
        if (modal) {
            setTimeout(() => modal.classList.remove('active'), 1200);
        }
    }

    // Sleep Timer
    startSleepTimer(minutes) {
        if (this.sleepTimer) clearInterval(this.sleepTimer);

        this.sleepTimeLeft = minutes * 60;
        const timerDisplay = document.getElementById('timer-display');
        const initialVol = window.zenAudio ? window.zenAudio.masterVolume : 0.8;

        document.querySelectorAll('.timer-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.mins, 10) === minutes);
        });

        this.sleepTimer = setInterval(() => {
            this.sleepTimeLeft--;

            const m = Math.floor(this.sleepTimeLeft / 60);
            const s = this.sleepTimeLeft % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `⏳ Tự tắt sau: ${m}:${s < 10 ? '0' : ''}${s}`;
            }

            if (this.sleepTimeLeft <= 120 && window.zenAudio) {
                const fadeFactor = this.sleepTimeLeft / 120;
                window.zenAudio.setMasterVolume(initialVol * fadeFactor);
            }

            if (this.sleepTimeLeft <= 0) {
                clearInterval(this.sleepTimer);
                if (timerDisplay) timerDisplay.textContent = '💤 Đã tắt âm thanh - Chúc bạn ngủ ngon!';
                if (window.zenAudio) window.zenAudio.toggleMute();
            }
        }, 1000);
    }
}

window.ZenTools = ZenTools;
