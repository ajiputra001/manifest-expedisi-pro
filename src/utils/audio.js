const AudioContextClass = window.AudioContext || window.webkitAudioContext;

export const playSystemSound = (type) => {
    try {
        if (!window.globalAudioCtx) {
            window.globalAudioCtx = new AudioContextClass();
        }
        const ctx = window.globalAudioCtx;
        
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const playTone = (freq, waveType, duration, startTimeOffset = 0) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = waveType;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const start = ctx.currentTime + startTimeOffset;
            // Set volume to 0.5 initially, then fade out
            gain.gain.setValueAtTime(0.5, start);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            
            osc.start(start);
            osc.stop(start + duration);
        };

        if (type === 'success') {
            playTone(880, 'sine', 0.1, 0);
            playTone(1760, 'sine', 0.15, 0.1);
        } else if (type === 'double') {
            playTone(300, 'sawtooth', 0.3, 0);
            playTone(200, 'sawtooth', 0.4, 0.2);
        } else if (type === 'cancel' || type === 'error') {
            playTone(400, 'square', 0.2, 0);
            playTone(200, 'square', 0.4, 0.2);
        }
    } catch(e) { console.error('Audio error:', e); }
};
