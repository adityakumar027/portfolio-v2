"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalProjects({ projects }: { projects: any[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !sectionRef.current || !scrollWrapperRef.current) return;

    const section = sectionRef.current;
    const scrollWrapper = scrollWrapperRef.current;

    // Calculate how far to move based on the wrapper's width vs the viewport
    const getScrollAmount = () => -(scrollWrapper.scrollWidth - window.innerWidth + 120);

    const tween = gsap.to(scrollWrapper, {
      x: getScrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${scrollWrapper.scrollWidth}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="horizontal-section" id="work">
      <div className="section-heading sticky-heading">
        <p className="section-index">SELECTED WORK</p>
        <h2>Built around a real<br />engineering problem.</h2>
      </div>
      
      <div className="horizontal-scroll-container">
        <div ref={scrollWrapperRef} className="horizontal-scroll-wrapper">
          {projects.map((project, idx) => (
            <a 
              className="horizontal-project-card" 
              href={project.href} 
              target="_blank" 
              rel="noreferrer" 
              key={project.index}
              style={{ zIndex: projects.length - idx }}
            >
              <div className="card-inner">
                <div className="project-top">
                  <p>{project.type}</p>
                  <span>{project.index} / 03</span>
                </div>
                <h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-meta">
                  <span>{project.result}</span>
                  <span>{project.stack}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}