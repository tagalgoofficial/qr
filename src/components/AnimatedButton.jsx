import React from 'react';
import { motion } from 'framer-motion';

const AnimatedButton = ({ 
  children, 
  className = '', 
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  const buttonVariants = {
    tap: { scale: 0.95 },
    hover: { 
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 17
      }
    }
  };

  const baseClasses = variant === 'primary' 
    ? 'btn-primary' 
    : variant === 'secondary' 
    ? 'btn-secondary' 
    : 'btn-accent';

  return (
    <motion.button
      className={`${baseClasses} ${className}`}
      variants={buttonVariants}
      whileHover={!disabled ? "hover" : {}}
      whileTap={!disabled ? "tap" : {}}
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default AnimatedButton;

