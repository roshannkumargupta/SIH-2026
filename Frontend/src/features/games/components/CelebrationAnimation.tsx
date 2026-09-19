import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationAnimationProps {
  show: boolean;
}

export function CelebrationAnimation({ show }: CelebrationAnimationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Burst of particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute size-3 rounded-full"
              style={{
                backgroundColor: i % 3 === 0 ? "#e9c46a" : i % 3 === 1 ? "#f4a261" : "#52b788",
              }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 600,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.5, delay: i * 0.015, ease: "easeOut" }}
            />
          ))}
          {/* Central trophy flash */}
          <motion.div
            className="text-8xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [0, 1.4, 1], rotate: [-30, 10, 0] }}
            transition={{ duration: 0.4, ease: "backOut" }}
          >
            🏆
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
