import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Web Audio API wicket sound — sharp stumps-breaking crack + crowd roar
function playWicketSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Stump hit — sharp crack
    const crack = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ctx.currentTime + start + dur);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Noise burst for crowd roar
    const noise = (start: number, dur: number, vol: number) => {
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime + start);
      src.stop(ctx.currentTime + start + dur);
    };

    // Sharp stump crack sequence
    crack(1200, 0, 0.08, 0.5);
    crack(800, 0.02, 0.1, 0.4);
    crack(2000, 0.04, 0.06, 0.3);
    // Stump rattle
    crack(600, 0.1, 0.15, 0.25);
    crack(900, 0.12, 0.1, 0.2);
    // Crowd roar
    noise(0.15, 1.2, 0.25);
  } catch {}
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  scale: number;
  delay: number;
}

export function WicketCelebration({
  show,
  wicketType,
  batsmanName,
  onComplete,
}: {
  show: boolean;
  wicketType?: string | null;
  batsmanName?: string;
  onComplete?: () => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (!show) {
      soundPlayed.current = false;
      return;
    }

    if (!soundPlayed.current) {
      playWicketSound();
      soundPlayed.current = true;
    }

    // Generate particles
    const emojis = ["🏏", "🔴", "🔥", "💥", "⚡", "🎯"];
    const newParticles: Particle[] = Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 40 + 10,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      scale: 0.6 + Math.random() * 0.8,
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />

          {/* Particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0, x: "0%", y: "0%" }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, p.scale, p.scale, 0],
                x: `${p.x - 50}vw`,
                y: `${p.y - 50}vh`,
              }}
              transition={{
                duration: 1.8,
                delay: p.delay,
                ease: "easeOut",
              }}
              className="absolute text-2xl sm:text-3xl"
              style={{ left: "50%", top: "50%" }}
            >
              {p.emoji}
            </motion.div>
          ))}

          {/* Center content */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: [0, 1.2, 1], rotate: [0, 5, 0] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            {/* Shockwave ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border-2 border-destructive/40"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="absolute w-24 h-24 rounded-full border border-destructive/30"
            />

            {/* Main text */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: 2, repeatType: "reverse" }}
              className="text-center"
            >
              <p className="text-5xl sm:text-6xl font-display font-black text-destructive drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] tracking-tighter">
                WICKET!
              </p>
              {wicketType && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-lg sm:text-xl font-display font-bold text-destructive/70 mt-1"
                >
                  {wicketType}
                </motion.p>
              )}
              {batsmanName && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm font-semibold text-muted-foreground mt-2"
                >
                  {batsmanName} out!
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
