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
        onUpdate: (self) => {
          // Update scroll dots
          const dots = section.querySelectorAll(".project-dot");
          const progress = self.progress;
          const activeIdx = Math.min(
            Math.floor(progress * dots.length),
            dots.length - 1
          );
          dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === activeIdx);
          });
        },
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-10px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.transform = "";
  };

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
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <span className="card-number">0{idx + 1}</span>
              <div className="card-mockup" aria-hidden="true" />
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
              <div className="card-arrow" aria-hidden="true">&#8599;</div>
            </a>
          ))}
        </div>
      </div>
      <div className="project-dots" aria-hidden="true">
        {projects.map((_, i) => (
          <div className={`project-dot ${i === 0 ? 'active' : ''}`} key={i} />
        ))}
      </div>
    </section>
  );
}
