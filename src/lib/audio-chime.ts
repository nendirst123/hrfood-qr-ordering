// Web Audio API Synthesizer for Kitchen & Cashier Order Bells
// Dual-frequency mechanical ringing bell ("Kring-Kring-Kring") with 30s continuous loop & stop control

let activeAudioContext: AudioContext | null = null;
let activeRingInterval: NodeJS.Timeout | null = null;
let autoStopTimeout: NodeJS.Timeout | null = null;
let isRingingActive = false;

// Play a single 1.8s mechanical bell burst ("kring-kring-kring")
function playSingleBellBurst(ctx: AudioContext, startTime: number, duration: number = 1.6) {
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  // Tremolo oscillator (clapper vibrating rapidly at 24 Hz)
  const tremoloOsc = ctx.createOscillator();
  const tremoloGain = ctx.createGain();
  tremoloOsc.frequency.setValueAtTime(24, startTime); // 24 strikes per second
  tremoloGain.gain.setValueAtTime(0.5, startTime);
  tremoloOsc.connect(tremoloGain);

  // Dual metallic bell harmonic frequencies (High metallic gong resonance)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc3 = ctx.createOscillator(); // High chime sparkle

  osc1.type = 'triangle';
  osc1.frequency.setValueAtTime(2150, startTime); // Primary gong frequency

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(2650, startTime); // Harmonic overtone

  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(3250, startTime); // Metallic sparkle

  // Tremolo depth control
  const bellGain = ctx.createGain();
  bellGain.gain.setValueAtTime(0.5, startTime);
  tremoloGain.connect(bellGain.gain);

  osc1.connect(bellGain);
  osc2.connect(bellGain);
  osc3.connect(bellGain);
  bellGain.connect(masterGain);

  // Envelope for the burst: quick attack, sustained vibrating ring, then fade
  masterGain.gain.setValueAtTime(0.001, startTime);
  masterGain.gain.exponentialRampToValueAtTime(0.45, startTime + 0.05);
  masterGain.gain.setValueAtTime(0.45, startTime + duration - 0.2);
  masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  tremoloOsc.start(startTime);
  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);

  tremoloOsc.stop(startTime + duration);
  osc1.stop(startTime + duration);
  osc2.stop(startTime + duration);
  osc3.stop(startTime + duration);
}

// Start continuous 30s ringing bell ("kring-kring-kring... ")
export function startOrderRinging(durationSeconds: number = 30): { stop: () => void } {
  // Stop existing ringing if any
  stopOrderRinging();

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return { stop: () => {} };

    activeAudioContext = new AudioContextClass();
    if (activeAudioContext.state === 'suspended') {
      activeAudioContext.resume();
    }

    isRingingActive = true;

    // Play first burst immediately
    playSingleBellBurst(activeAudioContext, activeAudioContext.currentTime, 1.6);

    // Repeat burst every 2.1 seconds (1.6s ring + 0.5s pause)
    activeRingInterval = setInterval(() => {
      if (activeAudioContext && isRingingActive) {
        if (activeAudioContext.state === 'suspended') {
          activeAudioContext.resume();
        }
        playSingleBellBurst(activeAudioContext, activeAudioContext.currentTime, 1.6);
      }
    }, 2100);

    // Auto stop after durationSeconds (default 30 seconds)
    autoStopTimeout = setTimeout(() => {
      stopOrderRinging();
    }, durationSeconds * 1000);

    return { stop: stopOrderRinging };
  } catch (err) {
    console.error('Failed to start order ringing bell:', err);
    return { stop: () => {} };
  }
}

// Stop the bell ringing immediately
export function stopOrderRinging(): void {
  isRingingActive = false;

  if (activeRingInterval) {
    clearInterval(activeRingInterval);
    activeRingInterval = null;
  }

  if (autoStopTimeout) {
    clearTimeout(autoStopTimeout);
    autoStopTimeout = null;
  }

  if (activeAudioContext) {
    try {
      activeAudioContext.close();
    } catch (e) {
      // ignore
    }
    activeAudioContext = null;
  }
}

// Check if bell is currently ringing
export function isOrderRinging(): boolean {
  return isRingingActive;
}

// Single burst for "Tes Bell" or quick test
export function playNewOrderChime(): boolean {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return false;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    playSingleBellBurst(ctx, ctx.currentTime, 1.6);
    setTimeout(() => {
      try {
        ctx.close();
      } catch (e) {}
    }, 1800);
    return true;
  } catch (err) {
    console.error('Audio chime error:', err);
    return false;
  }
}

