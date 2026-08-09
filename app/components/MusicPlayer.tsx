"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const tracks = [
  { name: "Love Somebody", artist: "Morgan Wallen", src: "/music/Love Somebody.mp3" },
  { name: "Low Fade", artist: "Chill Beat", src: "/music/Low Fade.mp3" },
];

const FADE_DURATION = 2500;
const TARGET_VOLUME = 0.18;

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * tracks.length));
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const currentTrack = tracks[trackIndex];

  const fadeIn = useCallback((audio: HTMLAudioElement, from = 0, to = TARGET_VOLUME) => {
    if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    audio.volume = from;
    const steps = 30;
    const increment = (to - from) / steps;
    const stepTime = FADE_DURATION / steps;
    let current = from;
    fadeTimerRef.current = setInterval(() => {
      current += increment;
      if (current >= to) {
        audio.volume = to;
        if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
      } else {
        audio.volume = current;
      }
    }, stepTime);
  }, []);

  // Auto-play random song at random position on first interaction
  useEffect(() => {
    if (hasAutoPlayed) return;

    const tryAutoplay = async () => {
      const audio = audioRef.current;
      if (!audio || hasAutoPlayed) return;

      try {
        audio.volume = 0;
        await audio.play();

        // Seek to random position between 15% and 75% of track
        const dur = audio.duration;
        if (dur && dur > 10) {
          const minPos = dur * 0.15;
          const maxPos = dur * 0.75;
          const randomPos = minPos + Math.random() * (maxPos - minPos);
          audio.currentTime = randomPos;
        }

        fadeIn(audio);
        setIsPlaying(true);
        setHasAutoPlayed(true);
      } catch {
        // Autoplay blocked, wait for user gesture
      }
    };

    // Try on mount
    const timer = setTimeout(tryAutoplay, 500);

    // Also try on first user interaction
    const onInteraction = () => {
      tryAutoplay();
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
    };
    window.addEventListener("click", onInteraction, { once: true });
    window.addEventListener("touchstart", onInteraction, { once: true });
    window.addEventListener("scroll", onInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("touchstart", onInteraction);
      window.removeEventListener("scroll", onInteraction);
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
    };
  }, [hasAutoPlayed, fadeIn]);

  // Update audio src on track change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0;
    audio.load();

    if (isPlaying || hasAutoPlayed) {
      const playAndSeek = async () => {
        try {
          await audio.play();
          const dur = audio.duration;
          if (dur && dur > 10) {
            const minPos = dur * 0.15;
            const maxPos = dur * 0.75;
            const randomPos = minPos + Math.random() * (maxPos - minPos);
            audio.currentTime = randomPos;
          }
          fadeIn(audio);
          setIsPlaying(true);
        } catch {}
      };
      playAndSeek();
    }
  }, [trackIndex]);

  // Time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onTime);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onTime);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      // Fade out
      if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
      const from = audio.volume;
      const steps = 20;
      const decrement = from / steps;
      let current = from;
      fadeTimerRef.current = setInterval(() => {
        current -= decrement;
        if (current <= 0) {
          audio.volume = 0;
          audio.pause();
          if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
        } else {
          audio.volume = current;
        }
      }, FADE_DURATION / steps);
      setIsPlaying(false);
    } else {
      fadeIn(audio, 0, TARGET_VOLUME);
      audio.play();
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (fadeTimerRef.current) clearInterval(fadeTimerRef.current);
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
      <audio ref={audioRef} src={currentTrack.src} preload="auto" loop />

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
