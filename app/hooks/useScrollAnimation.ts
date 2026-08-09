"use client";

import { useEffect, RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type AnimationOptions = {
  selector?: string;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  triggerStart?: string;
  stagger?: number;
  once?: boolean;
};

const defaultFrom = { y: 40, opacity: 0 };
const defaultTo = { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" };

export function useScrollAnimation(
  ref: RefObject<HTMLElement | null>,
  options: AnimationOptions = {}
) {
  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const {
      selector = ".reveal",
      from = defaultFrom,
      to = defaultTo,
      triggerStart = "top 80%",
      stagger = 0.1,
      once = true,
    } = options;

    const targets = el.querySelectorAll(selector);
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, from, {
        ...to,
        stagger,
        scrollTrigger: {
          trigger: el,
          start: triggerStart,
          once,
        },
      });
    });

    return () => ctx.revert();
  }, [ref, options.selector, options.triggerStart, options.stagger, options.once]);
}
