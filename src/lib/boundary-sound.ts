// Boundary crowd cheer sounds using Web Audio API

export function playBoundarySound(isSix: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Crowd noise burst
    const noise = (start: number, dur: number, vol: number, freq: number) => {
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = freq;
      filter.Q.value = 0.4;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.06);
      gain.gain.setValueAtTime(vol * 0.9, ctx.currentTime + start + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime + start);
      src.stop(ctx.currentTime + start + dur);
    };

    // Bat crack
    const crack = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.2, ctx.currentTime + start + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Bat hitting ball
    crack(1500, 0, 0.06, 0.35);
    crack(800, 0.01, 0.08, 0.25);

    if (isSix) {
      // Big SIX — louder, longer crowd roar with rising pitch
      noise(0.05, 1.5, 0.3, 900);
      noise(0.1, 1.3, 0.2, 1200);
      noise(0.2, 1.0, 0.15, 600);
      // Excited high-pitched whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.3);
      osc.frequency.linearRampToValueAtTime(2400, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.7);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.8);
    } else {
      // FOUR — moderate crowd cheer
      noise(0.05, 0.9, 0.2, 800);
      noise(0.1, 0.7, 0.12, 1100);
    }
  } catch {}
}
