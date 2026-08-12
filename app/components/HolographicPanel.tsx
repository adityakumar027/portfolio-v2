"use client";

import { Html } from "@react-three/drei";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ZoneId } from "../lib/spline";

type HolographicPanelProps = {
  zone: ZoneId;
  id: string;
  title: string;
  position: [number, number, number];
  visible: boolean;
  width?: number;
  children: ReactNode;
};

export default function HolographicPanel({
  zone,
  id,
  title,
  position,
  visible,
  width,
  children,
}: HolographicPanelProps) {
  return (
    <group position={position}>
      <Html transform={false} prepend={true} center zIndexRange={[30, 10]}>
        <motion.section
          className="hz-panel"
          aria-labelledby={id}
          data-zone={zone}
          style={width ? { width } : undefined}
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={visible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 18 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!visible}
        >
          <h2 id={id} className="hz-zone-title">{title}</h2>
          {children}
        </motion.section>
      </Html>
    </group>
  );
}