import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function playHattrickSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Epic horn-like fanfare
    const tone = (freq: number, start: number, dur: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    // Massive crowd roar
    const noise = (start: number, dur: number, vol: number) => {
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 600;
      filter.Q.value = 0.3;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.1);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime + start);
      src.stop(ctx.currentTime + start + dur);
    };

    // Fanfare notes
    tone(440, 0, 0.3, 0.3);
    tone(554, 0.15, 0.3, 0.3);
    tone(659, 0.3, 0.5, 0.35);
    tone(880, 0.5, 0.8, 0.4);
    // Crowd roar
    noise(0.3, 2.0, 0.35);
  } catch {}
}

export function HattrickCelebration({
  show,
  bowlerName,
  onComplete,
}: {
  show: boolean;
  bowlerName?: string;
  onComplete?: () => void;
}) {
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (!show) {
      soundPlayed.current = false;
      return;
    }
    if (!soundPlayed.current) {
      playHattrickSound();
      soundPlayed.current = true;
    }
    const timer = setTimeout(() => onComplete?.(), 3500);
    return () => clearTimeout(timer);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
          {/* Dark overlay with red tint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />

          {/* Pulsing red rings */}
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: [0.3, 4], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, delay, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-destructive/60"
            />
          ))}

          {/* Fire particles */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (360 / 20) * i;
            const rad = (angle * Math.PI) / 180;
            const dist = 80 + Math.random() * 120;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.5, 0.5],
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                }}
                transition={{ duration: 1.2, delay: 0.2 + i * 0.03, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 text-xl pointer-events-none"
              >
                {["🔥", "💀", "⚡", "🏏", "💥"][i % 5]}
              </motion.div>
            );
          })}

          {/* Three wicket stumps animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-3 mb-24">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 60, opacity: 0, rotate: 0 }}
                  animate={{
                    y: [60, 0, -10, 0],
                    opacity: 1,
                    rotate: [0, i === 1 ? 0 : (i === 0 ? -15 : 15), 0],
                  }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.15, ease: "backOut" }}
                  className="text-4xl md:text-5xl"
                >
                  🏏
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.3, 1], rotate: [-10, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
              className="text-center"
            >
              <motion.p
                animate={{
                  textShadow: [
                    "0 0 20px hsl(0, 85%, 55%)",
                    "0 0 60px hsl(0, 85%, 55%), 0 0 100px hsl(32, 95%, 55%)",
                    "0 0 20px hsl(0, 85%, 55%)",
                  ],
                }}
                transition={{ duration: 1, repeat: 2 }}
                className="text-5xl md:text-7xl font-display font-black text-destructive tracking-tighter"
              >
                HAT-TRICK! 🎩
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-lg md:text-xl font-display font-bold text-accent mt-2"
              >
                3 wickets in 3 balls!
              </motion.p>
              {bowlerName && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="text-sm font-semibold text-muted-foreground mt-2"
                >
                  🌟 {bowlerName}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Confetti rain */}
          {["🎩", "🔥", "⭐", "🎯", "✨", "💫"].map((emoji, i) => (
            <motion.div
              key={`c-${i}`}
              initial={{ y: -50, x: `${10 + i * 16}%`, opacity: 0 }}
              animate={{
                y: ["0vh", "100vh"],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
              }}
              transition={{ duration: 2.5, delay: 0.5 + i * 0.15, ease: "easeIn" }}
              className="absolute text-2xl md:text-3xl pointer-events-none"
            >
              {emoji}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
