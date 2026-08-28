import { motion } from "motion/react";

export default function NotFound() {
  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-storm-950 text-white"
    >
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-5xl font-bold mb-4"
      >
        404
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="text-lg mb-12 max-w-xl text-center"
      >
        The page you're looking for doesn't exist.
      </motion.p>
      <motion.a
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        href="/"
        className="inline-block px-6 py-3 bg-electric text-white font-medium rounded-lg transition-transform duration-300 hover:scale-105"
      >
        Go home
      </motion.a>
    </motion.div>
  );
}