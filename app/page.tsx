"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useScrollAnimation } from "./hooks/useScrollAnimation";
import CustomCursor from "./components/CustomCursor";
import ScrollProgress from "./components/ScrollProgress";
import MetricsTicker from "./components/MetricsTicker";
import SkillConstellation from "./components/SkillConstellation";
import HorizontalProjects from "./components/HorizontalProjects";
import MusicPlayer from "./components/MusicPlayer";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  weight: ["400", "600"], 
  style: ["italic", "normal"] 
});

const CoreScene = dynamic(() => import("./components/CoreScene"), { ssr: false });

const experience = [
  {
    period: "MAY 2026 — PRESENT",
    company: "Curefit · House of Cult",
    role: "Software Engineering Intern",
    summary: "Engineering production AI automation across campaign, segmentation, notification, and internal operations systems.",
    outcomes: [
      "Built an AI agent for root-cause analysis with Hermes Agent and webhook-based self-learning feedback loops, auto-resolving 60%+ of failures while optimizing token usage for low latency and cost.",
      "Reduced incident response time by 70% by integrating Coralogix, AWS SQS, Sentry, and Metabase into automated monitoring and remediation pipelines.",
      "Evolved leave approval from Copilot to Autopilot with human-in-the-loop review, cutting manual review effort by 85%.",
      "Built and maintained 20+ REST APIs, including Metabase card APIs powering real-time dashboards for the Operations team.",
    ],
    stack: "Hermes Agent · Java · Python · AWS SQS · Coralogix · Sentry · Metabase · REST APIs",
  },
  {
    period: "MAY 2025 — APR 2026",
    company: "WorldQuant BRAIN",
    role: "Quantitative Research Consultant — Expert",
    summary: "Researched, implemented, and backtested quantitative alpha models under strict risk and turnover constraints.",
    outcomes: [
      "Developed and implemented new alpha models that improved investment-strategy performance by 20%.",
      "Conducted quantitative research and backtesting, collaborating with research teams to derive actionable financial insights.",
      "Submitted 300+ alphas; 12+ passed every quality check, including Sharpe above 2.25 and turnover below 30%.",
    ],
    stack: "Python · Quant research · Backtesting · Statistics",
  },
];

const projects = [
  {
    index: "01",
    title: "Automated Job Application System",
    type: "Full-stack browser automation",
    description: "A full-stack Chrome extension that turns unstructured résumé PDFs into editable profiles and completes applications across job portals.",
    outcomes: [
      "Built the extension and application stack with React, Node.js, Express, and MongoDB."
    ],
    result: "PDF → structured profile → autofill",
    stack: "React · Node.js · Express · MongoDB · JWT",
    href: "https://github.com/adityakumar027/Automated-Job-Application-System",
  },
  {
    index: "02",
    title: "Graph Node Classification",
    type: "Graph machine learning",
    description: "A GCN-based node classifier with two-hop neighborhood aggregation and weighted loss for the imbalanced CORA citation dataset.",
    outcomes: [
      "Improved classification accuracy by 15% over traditional dense-network baselines."
    ],
    result: "15% accuracy improvement",
    stack: "Python · TensorFlow · Keras · GCN",
    href: "https://github.com/adityakumar027/node-classifier",
  },
  {
    index: "03",
    title: "PyOS",
    type: "Systems simulation",
    description: "A modular terminal operating-system simulation with authentication, concurrent command execution, process scheduling, and an extensible shell.",
    outcomes: [
      "Built a terminal OS simulation with a custom CLI, secure authentication, and multithreading."
    ],
    result: "New commands in under 10 lines",
    stack: "Python · CLI · Multithreading",
    href: "https://github.com/adityakumar027/PyOS",
  },
];

const capabilities = [
  { label: "Languages", items: "C, C++, JavaScript, Python, SQL" },
  { label: "Backend & Web", items: "Node.js, React, Express, REST APIs, microservices, JWT, Tailwind CSS" },
  { label: "AI Engineering", items: "Hermes Agent, OpenClaw, RAG, tokenization, prompt engineering, AI agents, deep learning" },
  { label: "Cloud & Operations", items: "AWS SQS, Kubernetes, Rancher, Jenkins, Spinnaker, Coralogix, Sentry, Metabase" },
  { label: "Data & ML", items: "MySQL, MongoDB, TensorFlow, Keras, NumPy, Pandas, Matplotlib" },
  { label: "Engineering", items: "Git, GitHub, Linux, workflow automation, MCP tooling, data structures, algorithms, operating systems" },
];

const achievements = [
  { metric: "LinkedIn", before: "View my ", highlight: "engineering profile", after: " ↗", href: "https://www.linkedin.com/in/adicrzz/" },
  { metric: "LeetCode", before: "Knight · ", highlight: "1820", after: " rating ↗", href: "https://leetcode.com/u/aditya_x1x/" },
  { metric: "CodeChef", before: "3★ · ", highlight: "1661", after: " rating ↗", href: "https://www.codechef.com/users/aditya_x1x" },
  { metric: "Codeforces", before: "Competitive rating · ", highlight: "1300+", after: " ↗", href: "https://codeforces.com/profile/aditya_x1x" },
  { metric: "GitHub", before: "Explore my ", highlight: "projects & code", after: " ↗", href: "https://github.com/adityakumar027" },
];

const productionSurfaces = [
  { index: "01", title: "Campaign orchestration", description: "Worked on campaign execution and failure-analysis paths where reliability directly affects high-volume customer communication.", signal: "Production workflows · AI-assisted RCA" },
  { index: "02", title: "Segmentation services", description: "Contributed to operational services that turn audience and policy inputs into dependable, reviewable production workflows.", signal: "Human-in-the-loop · 85% less manual review" },
  { index: "03", title: "Notification reliability", description: "Built self-learning remediation loops across notification systems, automatically resolving more than 60% of observed failures.", signal: "60%+ auto-resolved · 70% faster response" },
  { index: "04", title: "Operations platform", description: "Delivered APIs and real-time operational visibility across Coralogix, Sentry, AWS SQS, and Metabase.", signal: "20+ REST APIs · Real-time dashboards" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const closeMenu = () => setMenuOpen(false);

  const experienceRef = useRef<HTMLElement>(null);
  const scaleRef = useRef<HTMLElement>(null);
  const skillsRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  useScrollAnimation(experienceRef, { stagger: 0.12 });
  useScrollAnimation(scaleRef, { stagger: 0.1 });
  useScrollAnimation(skillsRef, { selector: ".capabilities article", stagger: 0.08 });
  useScrollAnimation(contactRef);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? scrolled / maxScroll : 0;
      
      // Shift aurora position based on scroll
      document.documentElement.style.setProperty('--aurora-x', `${progress * 30}%`);
      document.documentElement.style.setProperty('--aurora-y', `${progress * 20}%`);
      
      // Existing scroll progress for 3D scene
      const hero = document.getElementById("top");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const heroProgress = Math.min(1, Math.max(0, -rect.top / rect.height));
        setScrollProgress(heroProgress);
      }
    };
    addEventListener("scroll", handleScroll, { passive: true });
    return () => removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const wraps = document.querySelectorAll(".hero-headline .word-wrap");
    const words = document.querySelectorAll(".hero-headline .word");
    if (wraps.length === 0) return;

    gsap.set(wraps, { overflow: "hidden", display: "inline-block" });
    gsap.set(words, { y: "110%", opacity: 0 });

    gsap.to(words, {
      y: "0%",
      opacity: 1,
      duration: 1,
      ease: "power4.out",
      stagger: 0.08,
      delay: 0.2,
    });
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <CoreScene scrollProgress={scrollProgress} />
      <div className="site-grain" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Portfolio home">
          <span>ADITYA KUMAR</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#experience" onClick={closeMenu}>EXPERIENCE</a>
          <a href="#scale" onClick={closeMenu}>SCALE</a>
          <a href="#work" onClick={closeMenu}>WORK</a>
          <a href="#skills" onClick={closeMenu}>SKILLS</a>
          <a href="#contact" onClick={closeMenu}>CONTACT</a>
        </nav>
        {menuOpen && (
          <motion.div
            className="nav-mobile"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <a href="#experience" onClick={closeMenu}>EXPERIENCE</a>
            <a href="#scale" onClick={closeMenu}>SCALE</a>
            <a href="#work" onClick={closeMenu}>WORK</a>
            <a href="#skills" onClick={closeMenu}>SKILLS</a>
            <a href="#contact" onClick={closeMenu}>CONTACT</a>
            <a href="https://drive.google.com/file/d/1OJ-TCUjlttRgMqDw7UB4nr96Z6fGtAiQ/view?usp=sharing" target="_blank" rel="noreferrer">RÉSUMÉ</a>
          </motion.div>
        )}
        <a className="resume-link" href="https://drive.google.com/file/d/1OJ-TCUjlttRgMqDw7UB4nr96Z6fGtAiQ/view?usp=sharing" target="_blank" rel="noreferrer">RÉSUMÉ</a>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label="Toggle navigation">
          {menuOpen ? "CLOSE" : "MENU"}
        </button>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-content">
            <h1 className="hero-headline">
              <div className="headline-line">
                <span className="word-wrap"><span className="word">I</span></span>{' '}
                <span className="word-wrap"><span className="word">build</span></span>{' '}
                <span className="word-wrap"><span className="word">systems</span></span>
              </div>
              <div className="headline-line">
                <span className="word-wrap"><span className="word">that</span></span>{' '}
                <span className="word-wrap"><span className={`word serif-accent ${playfair.className}`}><em>scale</em></span></span>{' '}
                <span className="word-wrap"><span className={`word serif-accent ${playfair.className}`}><em>&amp;</em></span></span>{' '}
                <span className="word-wrap"><span className={`word serif-accent ${playfair.className}`}><em>heal.</em></span></span>
              </div>
            </h1>
          </div>
          
          <div className="hero-bottom-grid" aria-hidden="true">
            <div className="hero-info-block">
              <span className="info-label">ROLE</span>
              <span className="info-value">SOFTWARE ENGINEER</span>
            </div>
            <div className="hero-info-block">
              <span className="info-label">LOCATION</span>
              <span className="info-value">IIIT GWALIOR</span>
            </div>
            <div className="hero-info-block">
              <span className="info-label">STATUS</span>
              <span className="info-value">OPEN TO OPPORTUNITIES</span>
            </div>
            <div className="hero-info-block">
              <span className="info-label">TIMELINE</span>
              <span className="info-value">GRADUATING 2027</span>
            </div>
          </div>
        </section>

        <MetricsTicker />

        <section className="section experience" id="experience" ref={experienceRef}>
          <div className="section-heading reveal">
            <p className="section-index">EXPERIENCE</p>
            <h2>Work that reached<br />production.</h2>
            <p>Focused on measurable improvements to reliability, speed, and operational clarity.</p>
          </div>
          <div className="experience-list">
            {experience.map((item) => (
              <article className="experience-item reveal" key={item.company}>
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

        <section className="section scale" id="scale" ref={scaleRef}>
          <div className="section-heading scale-heading reveal">
            <p className="section-index">CONSUMER SCALE</p>
            <h2>Engineering inside<br /><em>high-traffic systems.</em></h2>
            <p>Experience contributing to production services supporting consumer experiences used by millions of people.</p>
          </div>
          <div className="scale-context reveal">
            <p className="scale-label">CUREFIT · HOUSE OF CULT</p>
            <p className="scale-statement">I worked across <em>campaign</em>, <em>segmentation</em>, and <em>notification</em> services—building the automation, observability, and remediation paths that keep large consumer platforms dependable.</p>
          </div>
          <div className="scale-showcase">
            {productionSurfaces.map((surface) => (
              <article className="scale-showcase-card reveal" key={surface.index}>
                <div className="scale-showcase-index">{surface.index}</div>
                <div className="scale-showcase-content">
                  <h3>{surface.title}</h3>
                  <p>{surface.description}</p>
                  <div className="scale-showcase-signal">{surface.signal}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <HorizontalProjects projects={projects} />

        <section className="section about section-depth" id="skills" ref={skillsRef}>
          <div className="aurora-bg" aria-hidden="true">
            <div className="aurora-orb-1" />
            <div className="aurora-orb-2" />
          </div>
          <div className="section-heading reveal">
            <p className="section-index">PROFILE &amp; SKILLS</p>
            <h2>Strong foundations.<br />Production range.</h2>
          </div>
          <div className="about-layout">
            <div className="about-copy reveal">
              <p>I&apos;m an Integrated B.Tech IT + MBA student at IIIT Gwalior, graduating in 2027 with a 7.97 CGPA. My work sits at the intersection of backend engineering, intelligent automation, and production operations.</p>
              <p>I care about systems that are observable, explainable, and designed for failure—not just demos that work once.</p>
              <div className="education-line">
                <span className="education-label">Education</span>
                <strong>IIIT Gwalior</strong>
                <div className="education-meta">
                  <span>Integrated B.Tech IT + MBA</span>
                  <span>CGPA 7.97</span>
                  <span>Nov 2022 — Jun 2027</span>
                </div>
              </div>
            </div>
            <SkillConstellation capabilities={capabilities} />
          </div>
        </section>

        <section className="contact" id="contact" ref={contactRef}>
          <p className="section-index">CONTACT</p>
          <div className="reveal">
            <h2>Have a difficult<br />system to build?</h2>
          </div>
          <p>I&apos;m open to software engineering roles and ambitious technical work.</p>
          <a className="contact-email reveal" href="mailto:adi.workspace76865@gmail.com">Let&apos;s talk <span>↗</span></a>
          <div className="contact-links">
            <a href="https://github.com/adityakumar027" target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/adicrzz/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
            <a href="https://drive.google.com/file/d/1OJ-TCUjlttRgMqDw7UB4nr96Z6fGtAiQ/view?usp=sharing" target="_blank" rel="noreferrer">Résumé ↗</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© 2026 Aditya Kumar</span>
        <span>Designed as a quiet machine.</span>
        <a href="#top">Back to top ↑</a>
      </footer>

      <CustomCursor />
      <ScrollProgress />
      <MusicPlayer />
    </>
  );
}