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

    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion) {
      gsap.set(el.querySelectorAll(".reveal"), { y: 0, opacity: 1 });
      return;
    }

    const {
      selector = ".reveal",
      from = defaultFrom,
      to = defaultTo,
      triggerStart = "top 80%",
      stagger = 0.1,
      once = true,
    } = options;

    const targets = el.querySelectorAll(selector);

    const ctx = gsap.context(() => {
      // Regular reveals
      if (targets.length > 0) {
        gsap.fromTo(targets, from, {
          ...to,
          stagger,
          scrollTrigger: {
            trigger: el,
            start: triggerStart,
            once,
          },
        });
      }

      // Character-by-character reveals
      const textReveals = el.querySelectorAll(".reveal-text");
      if (textReveals.length > 0) {
        textReveals.forEach(heading => {
          const text = heading.textContent || "";
          heading.innerHTML = text.split("").map(char =>
            `<span class="char">${char === " " ? "&nbsp;" : char}</span>`
          ).join("");
          
          gsap.fromTo(heading.querySelectorAll(".char"),
            { x: -20, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
              stagger: 0.02,
              scrollTrigger: {
                trigger: heading,
                start: "top 80%",
                once: true,
              },
            }
          );
        });
      }
    });

    return () => ctx.revert();
  }, [ref]);
}
