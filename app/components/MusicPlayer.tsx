"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const tracks = [
  { name: "Love Somebody", artist: "Morgan Wallen", src: "/music/Love Somebody.mp3" },
  { name: "Low Fade", artist: "Chill Beat", src: "/music/Low Fade.mp3" },
];

const TARGET_VOLUME = 0.18;

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRafRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * tracks.length));
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentTrack = tracks[trackIndex];

  // Smooth fade using requestAnimationFrame
  const fadeTo = useCallback((audio: HTMLAudioElement, target: number, duration = 2500) => {
    cancelAnimationFrame(fadeRafRef.current);
    const startVol = audio.volume;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      audio.volume = startVol + (target - startVol) * ease;
      if (t < 1) {
        fadeRafRef.current = requestAnimationFrame(tick);
      }
    };
    fadeRafRef.current = requestAnimationFrame(tick);
  }, []);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.loop = true;
    audio.src = currentTrack.src;
    audioRef.current = audio;

    const onTime = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onTime);

    return () => {
      cancelAnimationFrame(fadeRafRef.current);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onTime);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Update src on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = currentTrack.src;
    audio.load();
    // Seek to random position and play
    const playNew = async () => {
      try {
        audio.volume = 0;
        await audio.play();
        const dur = audio.duration;
        if (dur && dur > 10) {
          audio.currentTime = dur * 0.15 + Math.random() * dur * 0.6;
        }
        fadeTo(audio, TARGET_VOLUME);
        setIsPlaying(true);
      } catch {}
    };
    playNew();
  }, [trackIndex, fadeTo]);

  // Auto-play on first user interaction
  useEffect(() => {
    let started = false;

    const tryPlay = async () => {
      if (started) return;
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audio.volume = 0;
        await audio.play();
        const dur = audio.duration;
        if (dur && dur > 10) {
          audio.currentTime = dur * 0.15 + Math.random() * dur * 0.6;
        }
        fadeTo(audio, TARGET_VOLUME);
        setIsPlaying(true);
        started = true;
      } catch {}
    };

    // Try immediately (works if user already interacted)
    tryPlay();

    // Also listen for any user gesture
    const handler = () => {
      tryPlay();
      if (started) {
        window.removeEventListener("click", handler);
        window.removeEventListener("touchstart", handler);
      }
    };
    window.addEventListener("click", handler);
    window.addEventListener("touchstart", handler);

    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, [fadeTo]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      fadeTo(audio, 0, 800);
      // Wait for fade then pause
      setTimeout(() => {
        audio.pause();
        setIsPlaying(false);
      }, 850);
    } else {
      audio.volume = 0;
      await audio.play();
      fadeTo(audio, TARGET_VOLUME);
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    cancelAnimationFrame(fadeRafRef.current);
    setTrackIndex((i) => (i + 1) % tracks.length);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className={`music-player ${isExpanded ? "expanded" : ""}`}>
        {isExpanded && (
          <div className="music-player-detail">
            <div className="music-player-info">
              <span className="music-player-track">{currentTrack.name}</span>
              <span className="music-player-artist">{currentTrack.artist}</span>
            </div>
            <div className="music-player-progress">
              <div className="music-progress-bar">
                <div
                  className="music-progress-fill"
                  style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                />
              </div>
              <div className="music-time-row">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="music-player-controls">
              <button className="music-btn" onClick={nextTrack} aria-label="Next track">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 4l10 8-10 8V4zm11 0v16h2V4h-2z"/>
                </svg>
              </button>
              <button className="music-btn play-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        <button
          className="music-pill"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label="Toggle music player"
        >
          <span className={`music-icon ${isPlaying ? "spinning" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </span>
          {!isExpanded && (
            <span className="music-pill-text">
              {isPlaying ? currentTrack.name : "Play"}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
