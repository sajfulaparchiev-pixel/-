import { motion } from "framer-motion";

interface FlowIconProps {
  className?: string;
  size?: number;
}

const FlowIcon = ({ className = "", size = 20 }: FlowIconProps) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Animated flowing waves */}
      <motion.path
        d="M2 12C2 12 5 8 8 8C11 8 13 16 16 16C19 16 22 12 22 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0.5,
        }}
      />
      <motion.path
        d="M2 8C2 8 5 4 8 4C11 4 13 12 16 12C19 12 22 8 22 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          delay: 0.3,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0.5,
        }}
      />
      <motion.path
        d="M2 16C2 16 5 12 8 12C11 12 13 20 16 20C19 20 22 16 22 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.6 }}
        transition={{
          duration: 1.5,
          ease: "easeInOut",
          delay: 0.6,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0.5,
        }}
      />
    </motion.svg>
  );
};

export default FlowIcon;
