"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomCursor() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);

      // Magnetic effect for contact email
      const emailLink = document.querySelector(".contact-email") as HTMLElement;
      if (emailLink) {
        const rect = emailLink.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance < 100) {
          const strength = 1 - distance / 100;
          emailLink.style.transform = `translate(${deltaX * strength * 0.3}px, ${deltaY * strength * 0.3}px)`;
        } else {
          emailLink.style.transform = "";
        }
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .horizontal-project-card, .capabilities article, .contact-email")) {
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, .horizontal-project-card, .capabilities article, .contact-email")) {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="custom-cursor"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          opacity: 1, 
          scale: isHovering ? 2.5 : 1,
          x: mouseX,
          y: mouseY
        }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ 
          type: "spring", 
          damping: 25, 
          stiffness: 400, 
          mass: 0.5
        }}
      />
    </AnimatePresence>
  );
}