"use client";

import { useMemo } from "react";
import {
  achievements,
  capabilities,
  contact,
  experience,
  productionSurfaces,
  projects,
} from "../content";

function fallbackPetals() {
  return Array.from({ length: 20 }, (_, index) => index);
}

export default function ReducedMotionFallback() {
  const petals = useMemo(() => fallbackPetals(), []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="site-grain" aria-hidden="true" />
      <div className="fallback-sakura" aria-hidden="true">
        {petals.map((index) => (
          <i key={index} style={{
            left: `${(index * 47) % 100}%`,
            animationDelay: `${-(index * 3.7)}s`,
            animationDuration: `${40 + (index % 5) * 9}s`,
          }} />
        ))}
      </div>
      <div className="core-fallback" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Aditya Kumar home">
          <span className="brand-mark">C</span>
          <span>THE CORE<small>ADITYA KUMAR</small></span>
        </a>
        <nav className="nav-links is-open" aria-label="Primary navigation">
          <a href="#experience">Experience</a>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#scale">Scale</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="resume-link" href={contact.resume} target="_blank" rel="noreferrer">Résumé <span>↗</span></a>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Aditya Kumar · Software Engineer</p>
            <h1>I build systems<br />that <em>scale &amp; heal.</em></h1>
            <p className="hero-summary">Production AI and backend infrastructure engineered to scale, recover, and stay reliable—from self-healing workflows to research-driven machine learning systems.</p>
            <div className="hero-actions">
              <a className="primary-action" href="#work">View selected work <span>↓</span></a>
              <a className="text-action" href={`mailto:${contact.email}`}>{contact.email}</a>
            </div>
          </div>
          <div className="hero-proof" aria-label="Selected career metrics">
            <article><strong>1,200+</strong><span><em>Coding problems</em> solved</span></article>
            <article><strong>50+</strong><span>Production <em>APIs shipped</em></span></article>
            <article><strong>80%+</strong><span>Failures <em>auto-resolved</em></span></article>
            <article><strong>Millions+</strong><span>Users served by <em>production services</em></span></article>
          </div>
        </section>

        <section className="section experience" id="experience">
          <div className="section-heading">
            <p className="section-index">01 / EXPERIENCE</p>
            <h2>Work that reached<br />production.</h2>
            <p>Focused on measurable improvements to reliability, speed, and operational clarity.</p>
          </div>
          <div className="experience-list">
            {experience.map((item) => (
              <article className="experience-item" key={item.company}>
                <p className="period">{item.period}</p>
                <div className="experience-main">
                  <p className="company">{item.company}</p>
                  <h3>{item.role}</h3>
                  <p className="experience-summary">{item.summary}</p>
                  <ul>{item.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                  <p className="stack">{item.stack}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section work" id="work">
          <div className="section-heading work-heading">
            <p className="section-index">02 / SELECTED WORK</p>
            <h2>Built around a real<br />engineering problem.</h2>
          </div>
          <div className="project-list">
            {projects.map((project) => (
              <a className="project" href={project.href} target="_blank" rel="noreferrer" key={project.index}>
                <div className={`project-visual visual-${project.index}`} aria-hidden="true">
                  <span>{project.index}</span><i /><i /><b>{project.result}</b>
                </div>
                <div className="project-content">
                  <div className="project-top"><p>{project.type}</p><span>{project.index} / 03</span></div>
                  <h3>{project.title}</h3>
                  <p className="project-description">{project.description}</p>
                  <ul className="project-outcomes">{project.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
                  <div className="project-meta"><span>{project.result}</span><span>{project.stack}</span></div>
                </div>
                <span className="project-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        <section className="section about" id="about">
          <div className="section-heading">
            <p className="section-index">03 / PROFILE &amp; SKILLS</p>
            <h2>Strong foundations.<br />Production range.</h2>
          </div>
          <div className="about-layout">
            <div className="about-copy">
              <p>I’m an Integrated B.Tech IT + MBA student at IIIT Gwalior, graduating in 2027 with a 7.97 CGPA. My work sits at the intersection of backend engineering, intelligent automation, and production operations.</p>
              <p>I care about systems that are observable, explainable, and designed for failure—not just demos that work once.</p>
              <div className="education-line"><span>Education</span><strong>IIIT Gwalior · Integrated B.Tech IT + MBA · Nov 2022—Jun 2027</strong></div>
            </div>
            <div className="capabilities">
              {capabilities.map((capability) => <article key={capability.label}><h3>{capability.label}</h3><p>{capability.items}</p></article>)}
            </div>
          </div>
          <div className="achievement-strip" aria-label="Selected achievements">
            {achievements.map((achievement, index) => <span key={achievement}><b>{String(index + 1).padStart(2, "0")}</b>{achievement}</span>)}
          </div>
        </section>

        <section className="section scale" id="scale">
          <div className="section-heading scale-heading">
            <p className="section-index">04 / CONSUMER SCALE</p>
            <h2>Engineering inside<br /><em>high-traffic systems.</em></h2>
            <p>Experience contributing to production services supporting consumer experiences used by millions of people.</p>
          </div>
          <div className="scale-context">
            <p className="scale-label">CUREFIT · HOUSE OF CULT</p>
            <p className="scale-statement">I worked across <em>campaign</em>, <em>segmentation</em>, and <em>notification</em> services—building the automation, observability, and remediation paths that keep large consumer platforms dependable.</p>
          </div>
          <div className="service-grid">
            {productionSurfaces.map((surface) => (
              <article key={surface.index}>
                <span>{surface.index}</span>
                <h3>{surface.title}</h3>
                <p>{surface.description}</p>
                <strong>{surface.signal}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="contact" id="contact">
          <p className="section-index">05 / CONTACT</p>
          <h2>Have a difficult<br />system to build?</h2>
          <p>I’m open to software engineering roles and ambitious technical work.</p>
          <a className="contact-email" href={`mailto:${contact.email}`}>Let’s talk <span>↗</span></a>
          <div className="contact-links">
            <a href={contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a href={contact.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Aditya Kumar</span>
        <span>Designed as a quiet machine.</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </>
  );
}