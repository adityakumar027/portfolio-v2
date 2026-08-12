"use client";

import { FormEvent, useState } from "react";
import { contact } from "../content";
import { useScene } from "../lib/scene";
import HolographicPanel from "./HolographicPanel";

type ContactTerminalProps = {
  zone: "transmission";
  visible: boolean;
};

export default function ContactTerminal({ zone, visible }: ContactTerminalProps) {
  const store = useScene();
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const message = String(form.get("message") ?? "");
    store.current.burst?.(0, 1.8, -340);
    window.location.href = `mailto:${contact.email}?subject=Hello from portfolio&body=${encodeURIComponent(message + "\n\n— " + email)}`;
    setSent(true);
  };

  return (
    <HolographicPanel
      zone={zone}
      id="zone-transmission"
      title="Contact"
      position={[0, 1.9, -340]}
      visible={visible}
      width={520}
    >
      <p className="hz-eyebrow">05 / Transmission</p>
      <h3 className="hz-title">Have a difficult system to build?</h3>
      <p className="hz-body">Open to software engineering roles and ambitious technical work.</p>

      {sent ? (
        <p className="hz-acknowledged" role="status">
          TRANSMISSION ACKNOWLEDGED
        </p>
      ) : (
        <form className="hz-form" onSubmit={handleSubmit}>
          <label htmlFor="terminal-email">Your email</label>
          <input id="terminal-email" name="email" type="email" required placeholder="you@example.com" />
          <label htmlFor="terminal-message">Message</label>
          <textarea id="terminal-message" name="message" required rows={4} placeholder="Tell me about the system you want to build…" />
          <button type="submit" className="hz-send">
            Send transmission ↗
          </button>
        </form>
      )}

      <div className="hz-contact-links">
        <a href={contact.github} target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
        <a href={contact.resume} target="_blank" rel="noreferrer">Résumé ↗</a>
      </div>
    </HolographicPanel>
  );
}