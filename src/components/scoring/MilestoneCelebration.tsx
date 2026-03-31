import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function playMilestoneSound(isCentury: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const tone = (freq: number, start: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(vol, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };

    const noise = (start: number, dur: number, vol: number) => {
      const bufferSize = ctx.sampleRate * dur;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = isCentury ? 700 : 900;
      filter.Q.value = 0.4;
      src.buffer = buffer;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.08);
      gain.gain.setValueAtTime(vol * 0.8, ctx.currentTime + start + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime + start);
      src.stop(ctx.currentTime + start + dur);
    };

    if (isCentury) {
      // Grand fanfare
      tone(523, 0, 0.3, 0.25, "triangle");
      tone(659, 0.15, 0.3, 0.25, "triangle");
      tone(784, 0.3, 0.4, 0.3, "triangle");
      tone(1047, 0.5, 0.8, 0.35, "triangle");
      noise(0.3, 2.5, 0.4);
    } else {
      // Warm cheer
      tone(440, 0, 0.25, 0.2, "triangle");
      tone(554, 0.12, 0.25, 0.22, "triangle");
      tone(659, 0.25, 0.5, 0.25, "triangle");
      noise(0.2, 1.5, 0.3);
    }
  } catch {}
}

interface MilestoneCelebrationProps {
  type: "fifty" | "century" | null;
  batsmanName?: string;
  runs?: number;
  onComplete?: () => void;
}

export function MilestoneCelebration({ type, batsmanName, runs, onComplete }: MilestoneCelebrationProps) {
  const [show, setShow] = useState(false);
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (type) {
      setShow(true);
      soundPlayed.current = false;
      if (!soundPlayed.current) {
        playMilestoneSound(type === "century");
        soundPlayed.current = true;
      }
      const dur = type === "century" ? 3500 : 2500;
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, dur);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [type, onComplete]);

  const isCentury = type === "century";
  const label = isCentury ? "CENTURY! 💯" : "HALF CENTURY! 🔥";
  const primaryColor = isCentury ? "hsl(48, 95%, 55%)" : "hsl(142, 60%, 45%)";
  const textClass = isCentury
    ? "text-yellow-400 drop-shadow-[0_0_30px_rgba(234,179,8,0.5)]"
    : "text-primary drop-shadow-[0_0_30px_rgba(34,197,94,0.4)]";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background"
          />

          {/* Radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.5, 0.2], scale: [0.5, 2, 3] }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle, ${primaryColor} 0%, transparent 60%)` }}
          />

          {/* Expanding rings */}
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: [0.5, 3.5], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, delay, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2"
              style={{ borderColor: primaryColor }}
            />
          ))}

          {/* Star/confetti particles */}
          {Array.from({ length: isCentury ? 24 : 14 }).map((_, i) => {
            const angle = (360 / (isCentury ? 24 : 14)) * i;
            const rad = (angle * Math.PI) / 180;
            const dist = 60 + Math.random() * 100;
            const emojis = isCentury
              ? ["⭐", "🌟", "💛", "✨", "🏆", "👑"]
              : ["⭐", "🏏", "💚", "✨", "🔥"];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 0.5],
                  x: Math.cos(rad) * dist,
                  y: Math.sin(rad) * dist,
                }}
                transition={{ duration: 1.3, delay: 0.15 + i * 0.03, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 text-lg md:text-xl pointer-events-none"
              >
                {emojis[i % emojis.length]}
              </motion.div>
            );
          })}

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.2, 1], rotate: [-10, 5, 0] }}
              transition={{ duration: 0.5, delay: 0.1, ease: "backOut" }}
              className="text-center"
            >
              {/* Score number */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1] }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="mb-2"
              >
                <span
                  className={`text-7xl md:text-9xl font-display font-black ${textClass}`}
                >
                  {runs || (isCentury ? 100 : 50)}
                </span>
              </motion.div>

              <motion.p
                animate={{
                  textShadow: [
                    `0 0 10px ${primaryColor}`,
                    `0 0 40px ${primaryColor}`,
                    `0 0 10px ${primaryColor}`,
                  ],
                }}
                transition={{ duration: 0.8, repeat: 2 }}
                className={`text-3xl md:text-4xl font-display font-black ${textClass} tracking-tight`}
              >
                {label}
              </motion.p>

              {batsmanName && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-base md:text-lg font-display font-bold text-foreground mt-3"
                >
                  🏏 {batsmanName}
                </motion.p>
              )}

              {/* Underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 1.5, delay: 0.4 }}
                className="h-1 mx-auto mt-3 rounded-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)`,
                  width: "60%",
                }}
              />
            </motion.div>
          </div>

          {/* Falling emojis */}
          {(isCentury
            ? ["💯", "🏆", "👑", "🌟", "⭐", "🎊"]
            : ["5️⃣0️⃣", "🏏", "🔥", "⭐"]
          ).map((emoji, i) => (
            <motion.div
              key={`f-${i}`}
              initial={{ y: -40, x: `${12 + i * (isCentury ? 14 : 20)}%`, opacity: 0 }}
              animate={{
                y: ["0vh", "100vh"],
                opacity: [0, 1, 1, 0],
                rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
              }}
              transition={{ duration: 2 + Math.random(), delay: 0.4 + i * 0.15, ease: "easeIn" }}
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
