"use client";

import { useEffect, useRef, useState } from "react";
import {
  achievements,
  capabilities,
  contact,
  experience,
  productionSurfaces,
  projects,
} from "../content";
import { ZONES, zoneForZ, type ZoneId } from "../lib/spline";
import { useScene } from "../lib/scene";
import ContactTerminal from "./ContactTerminal";
import HolographicPanel from "./HolographicPanel";

type ZoneManagerProps = {
  onZoneChange: (zone: ZoneId) => void;
};

const ACTIVE_OVERLAP = 10;
const UNMOUNT_AT = 50;

function zoneVisible(cameraZ: number, from: number, to: number): boolean {
  return cameraZ >= from - ACTIVE_OVERLAP && cameraZ <= to + ACTIVE_OVERLAP;
}

export default function ZoneManager({ onZoneChange }: ZoneManagerProps) {
  const store = useScene();
  const [activeZone, setActiveZone] = useState<ZoneId>("approach");
  const [visibleZones, setVisibleZones] = useState<Set<ZoneId>>(new Set(["approach"]));
  const activeRef = useRef<ZoneId>("approach");
  const visibleRef = useRef<Set<ZoneId>>(new Set(["approach"]));

  useEffect(() => {
    let frame = 0;

    const tick = () => {
      const { cameraZ } = store.current;
      const zone = zoneForZ(cameraZ);
      const current = ZONES.find((entry) => entry.id === zone);
      const progress = current ? (cameraZ - current.from) / (current.to - current.from) : 0;
      store.current.zoneTransition = Math.min(1, Math.max(0, progress));
      if (zone !== activeRef.current) {
        activeRef.current = zone;
        setActiveZone(zone);
        onZoneChange(zone);
      }

      const mounted: Set<ZoneId> = new Set();
      for (const entry of ZONES) {
        const closeEnough = Math.abs(cameraZ - entry.center) <= UNMOUNT_AT;
        if (closeEnough && zoneVisible(cameraZ, entry.from, entry.to)) mounted.add(entry.id);
      }
      if (mounted.size !== visibleRef.current.size) {
        visibleRef.current = mounted;
        setVisibleZones(mounted);
      } else {
        let changed = false;
        for (const id of ZONES) {
          if (mounted.has(id.id) !== visibleRef.current.has(id.id)) {
            changed = true;
            break;
          }
        }
        if (changed) {
          visibleRef.current = mounted;
          setVisibleZones(mounted);
        }
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [store, onZoneChange]);

  const inZone = (zone: ZoneId) => visibleZones.has(zone);

  return (
    <>
      <HolographicPanel zone="approach" id="zone-approach" title="Hero" position={[0, 1.7, -18]} visible={inZone("approach")} width={560}>
        <p className="hz-eyebrow">Aditya Kumar · Software Engineer</p>
        <h1 className="hz-title">
          I build systems
          <br />
          that <em>scale &amp; heal.</em>
        </h1>
        <p className="hz-body">
          Production AI and backend infrastructure engineered to scale, recover, and stay reliable — from self-healing
          workflows to research-driven machine learning systems.
        </p>
        <div className="hz-actions">
          <a className="hz-primary" href="#path" onClick={(event) => event.preventDefault()}>
            View selected work ↓
          </a>
          <a className="hz-text" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </div>
        <p className="hz-metrics" aria-label="Selected career metrics">
          <span><strong>1,200+</strong> coding problems solved</span>
          <span><strong>50+</strong> production APIs shipped</span>
          <span><strong>80%+</strong> failures auto-resolved</span>
        </p>
      </HolographicPanel>

      <HolographicPanel zone="path" id="zone-path" title="Experience" position={[-5.6, 2.6, -80]} visible={inZone("path")} width={430}>
        <p className="hz-eyebrow">01 / Experience</p>
        <h3 className="hz-heading">Work that reached production.</h3>
        <div className="hz-list">
          {experience.map((item) => (
            <article key={item.company} className="hz-entry">
              <p className="hz-meta-line">
                <span>{item.period}</span>
              </p>
              <h4>{item.role}</h4>
              <p className="hz-company">{item.company}</p>
              <p className="hz-summary">{item.summary}</p>
              <ul>
                {item.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
              <p className="hz-stack">{item.stack}</p>
            </article>
          ))}
        </div>
      </HolographicPanel>

      <HolographicPanel zone="path" id="zone-work" title="Selected work" position={[5.6, 2.6, -80]} visible={inZone("path")} width={430}>
        <p className="hz-eyebrow">02 / Selected work</p>
        <h3 className="hz-heading">Built around a real engineering problem.</h3>
        <div className="hz-list">
          {projects.map((project) => (
            <a className="hz-entry hz-link" href={project.href} target="_blank" rel="noreferrer" key={project.index}>
              <p className="hz-meta-line">
                <span>{project.type}</span>
                <span>{project.index} / 03 ↗</span>
              </p>
              <h4>{project.title}</h4>
              <p className="hz-summary">{project.description}</p>
              <p className="hz-stack">{project.stack}</p>
            </a>
          ))}
        </div>
      </HolographicPanel>

      <HolographicPanel zone="ascent" id="zone-about" title="Profile" position={[-5.6, 2.6, -250]} visible={inZone("ascent")} width={430}>
        <p className="hz-eyebrow">03 / Profile</p>
        <h3 className="hz-heading">Strong foundations. Production range.</h3>
        <p className="hz-summary">
          Integrated B.Tech IT + MBA student at IIIT Gwalior, graduating 2027 with a 7.97 CGPA. My work sits at the
          intersection of backend engineering, intelligent automation, and production operations.
        </p>
        <p className="hz-summary">
          I care about systems that are observable, explainable, and designed for failure — not just demos that work once.
        </p>
        <p className="hz-meta-line">
          <span>Education</span>
          <span>IIIT Gwalior · B.Tech IT + MBA · Nov 2022 — Jun 2027</span>
        </p>
        <div className="hz-chips" aria-label="Selected achievements">
          {achievements.map((achievement) => (
            <span key={achievement}>{achievement}</span>
          ))}
        </div>
      </HolographicPanel>

      <HolographicPanel zone="ascent" id="zone-skills" title="Skills and surfaces" position={[5.6, 2.6, -250]} visible={inZone("ascent")} width={430}>
        <p className="hz-eyebrow">04 / Capabilities</p>
        <h3 className="hz-heading">Consumer scale, production discipline.</h3>
        <div className="hz-grid">
          {capabilities.map((capability) => (
            <article key={capability.label} className="hz-cell">
              <h4>{capability.label}</h4>
              <p>{capability.items}</p>
            </article>
          ))}
        </div>
        {productionSurfaces.map((surface) => (
          <p className="hz-signal" key={surface.index}>
            <span>{surface.index}</span> {surface.title} — {surface.signal}
          </p>
        ))}
      </HolographicPanel>

      <ContactTerminal zone="transmission" visible={inZone("transmission")} />
    </>
  );
}