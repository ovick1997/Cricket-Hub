import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BoundaryCelebrationProps {
  type: "four" | "six" | null;
  onComplete?: () => void;
}

// Firework particle for SIX
function FireworkParticle({ delay, x, y, color, size }: { delay: number; x: number; y: number; color: string; size: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [1, 1, 0],
        scale: [0, 1.2, 0.3],
        x: x,
        y: y,
      }}
      transition={{ duration: 1.2, delay, ease: "easeOut" }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}`,
        left: "50%",
        top: "50%",
      }}
    />
  );
}

// Trail spark for SIX
function TrailSpark({ delay, angle, distance, color }: { delay: number; angle: number; distance: number; color: string }) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 0.8, 1, 0],
        x: [0, x * 0.3, x],
        y: [0, y * 0.3, y],
      }}
      transition={{ duration: 0.9, delay, ease: "easeOut" }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 4,
        height: 4,
        background: color,
        boxShadow: `0 0 6px ${color}`,
        left: "50%",
        top: "50%",
      }}
    />
  );
}

function SixCelebration() {
  const fireworkColors = [
    "hsl(142, 60%, 45%)", // primary green
    "hsl(32, 95%, 55%)",  // accent orange
    "hsl(48, 95%, 55%)",  // gold
    "hsl(0, 85%, 55%)",   // red
    "hsl(280, 80%, 60%)", // purple
    "hsl(200, 90%, 55%)", // blue
  ];

  // Generate multiple firework bursts
  const bursts = [
    { cx: "30%", cy: "35%", delay: 0 },
    { cx: "70%", cy: "30%", delay: 0.25 },
    { cx: "50%", cy: "45%", delay: 0.15 },
    { cx: "25%", cy: "55%", delay: 0.4 },
    { cx: "75%", cy: "50%", delay: 0.35 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
    >
      {/* Screen flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle, hsl(142, 60%, 45%) 0%, transparent 70%)" }}
      />

      {/* Firework bursts */}
      {bursts.map((burst, bi) => (
        <div key={bi} className="absolute" style={{ left: burst.cx, top: burst.cy }}>
          {/* Central flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: burst.delay }}
            className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
            style={{ background: fireworkColors[bi % fireworkColors.length], boxShadow: `0 0 30px ${fireworkColors[bi % fireworkColors.length]}` }}
          />

          {/* Spark trails */}
          {Array.from({ length: 16 }).map((_, i) => (
            <TrailSpark
              key={i}
              delay={burst.delay + 0.05}
              angle={(360 / 16) * i + (bi * 15)}
              distance={60 + Math.random() * 80}
              color={fireworkColors[(bi + i) % fireworkColors.length]}
            />
          ))}

          {/* Larger particles */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (360 / 8) * i + bi * 20;
            const rad = (angle * Math.PI) / 180;
            const dist = 40 + Math.random() * 60;
            return (
              <FireworkParticle
                key={`p-${i}`}
                delay={burst.delay + 0.1}
                x={Math.cos(rad) * dist}
                y={Math.sin(rad) * dist}
                color={fireworkColors[(bi + i + 2) % fireworkColors.length]}
                size={6 + Math.random() * 4}
              />
            );
          })}
        </div>
      ))}

      {/* SIX text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: [0, 1.3, 1], rotate: [-15, 5, 0] }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <motion.span
            animate={{ textShadow: [
              "0 0 20px hsl(142, 60%, 45%)",
              "0 0 60px hsl(142, 60%, 45%), 0 0 100px hsl(32, 95%, 55%)",
              "0 0 20px hsl(142, 60%, 45%)",
            ] }}
            transition={{ duration: 1.2, repeat: 1 }}
            className="text-7xl md:text-9xl font-display font-black text-primary drop-shadow-2xl"
          >
            SIX!
          </motion.span>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"
          />
        </motion.div>
      </div>

      {/* Falling emojis */}
      {["🏏", "🔥", "💫", "⭐", "✨", "🎆", "💥", "🌟"].map((emoji, i) => (
        <motion.div
          key={`e-${i}`}
          initial={{ y: -40, x: `${10 + i * 12}%`, opacity: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "100vh"],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
          }}
          transition={{ duration: 2 + Math.random(), delay: 0.3 + i * 0.12, ease: "easeIn" }}
          className="absolute text-2xl md:text-3xl pointer-events-none"
        >
          {emoji}
        </motion.div>
      ))}
    </motion.div>
  );
}

function FourCelebration() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
    >
      {/* White flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-white"
      />

      {/* Orange radial flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.4, 0], scale: [0.5, 2, 3] }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle, hsl(32, 95%, 55%) 0%, transparent 60%)" }}
      />

      {/* Horizontal speed lines */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: [0, 1, 0], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.5, delay: 0.05 + i * 0.03 }}
          className="absolute h-[2px]"
          style={{
            top: `${8 + i * 8}%`,
            left: i % 2 === 0 ? "0%" : "50%",
            right: i % 2 === 0 ? "50%" : "0%",
            background: `linear-gradient(${i % 2 === 0 ? "to right" : "to left"}, transparent, hsl(32, 95%, 55%), hsl(48, 95%, 55%))`,
            transformOrigin: i % 2 === 0 ? "left" : "right",
          }}
        />
      ))}

      {/* FOUR text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 3, opacity: 0 }}
          animate={{ scale: [3, 0.9, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <motion.span
            animate={{ textShadow: [
              "0 0 10px hsl(32, 95%, 55%)",
              "0 0 40px hsl(32, 95%, 55%)",
              "0 0 10px hsl(32, 95%, 55%)",
            ] }}
            transition={{ duration: 0.8, repeat: 1 }}
            className="text-6xl md:text-8xl font-display font-black text-accent drop-shadow-2xl"
          >
            FOUR!
          </motion.span>
        </motion.div>
      </div>

      {/* Corner flares */}
      {[
        { left: 0, top: 0 },
        { right: 0, top: 0 },
        { left: 0, bottom: 0 },
        { right: 0, bottom: 0 },
      ].map((pos, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.6, 0], scale: [0, 1.5, 2] }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            ...pos,
            background: "radial-gradient(circle, hsl(32, 95%, 55%) 0%, transparent 70%)",
          }}
        />
      ))}

      {/* Sparkle emojis */}
      {["💥", "🏏", "⚡", "🔥"].map((emoji, i) => (
        <motion.div
          key={`s-${i}`}
          initial={{ scale: 0, opacity: 0, x: `${20 + i * 20}%`, y: "50%" }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            y: [`50%`, `${30 + (i % 2) * 40}%`],
          }}
          transition={{ duration: 0.8, delay: 0.15 + i * 0.1 }}
          className="absolute text-3xl md:text-4xl pointer-events-none"
        >
          {emoji}
        </motion.div>
      ))}
    </motion.div>
  );
}

export function BoundaryCelebration({ type, onComplete }: BoundaryCelebrationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (type) {
      setShow(true);
      const duration = type === "six" ? 2500 : 1500;
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [type, onComplete]);

  return (
    <AnimatePresence>
      {show && type === "six" && <SixCelebration />}
      {show && type === "four" && <FourCelebration />}
    </AnimatePresence>
  );
}
