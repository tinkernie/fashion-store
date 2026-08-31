"use client";

import { motion, Variants } from "framer-motion";

export interface AnimatedTextProps {
  text: string;
  className?: string;
  animationType?: "letters" | "words";
  duration?: number;
  delay?: number;
  staggerDelay?: number;
  initialY?: number;
  initialOpacity?: number;
  animateY?: number;
  animateOpacity?: number;
}

export default function AnimatedText({
  text,
  className = "text-4xl font-bold",
  animationType = "words",
  duration = 0.6,
  delay = 0,
  staggerDelay = 0.06,
  initialY = 16,
  initialOpacity = 0,
  animateY = 0,
  animateOpacity = 1,
}: AnimatedTextProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      y: initialY,
      opacity: initialOpacity,
    },
    visible: {
      y: animateY,
      opacity: animateOpacity,
      transition: {
        duration: duration,
        ease: "easeOut",
      },
    },
  };

  const renderLetters = () => {
    return text.split("").map((char, index) => (
      <motion.span
        key={`letter-${index}`}
        variants={itemVariants}
        className="inline-block"
        style={{ whiteSpace: char === " " ? "pre" : "normal" }}
      >
        {char}
      </motion.span>
    ));
  };

  const renderWords = () => {
    return text.split(" ").map((word, index) => (
      <motion.span
        key={`word-${index}`}
        variants={itemVariants}
        className="inline-block ml-2 last:ml-0"
      >
        {word}
      </motion.span>
    ));
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {animationType === "letters" ? renderLetters() : renderWords()}
    </motion.div>
  );
}

export { AnimatedText };
