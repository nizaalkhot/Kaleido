"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Mic, Radio, Clock, Sparkles } from "lucide-react";
import { AudioBriefing, AudioSegment } from "@/types";

interface AudioPlayerProps {
  briefing: AudioBriefing;
  backendBaseUrl?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  briefing,
  backendBaseUrl = "http://localhost:8000",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(briefing.duration_seconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioSrc = briefing.audio_url.startsWith("http")
    ? briefing.audio_url
    : `${backendBaseUrl}${briefing.audio_url}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn("Audio play prevented:", e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const jumpToSegment = (startTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="liquid-card rounded-2xl p-5 shadow-2xl space-y-4">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm tracking-tight">
              {briefing.title}
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Dual-speaker studio • Google Cloud Neural2 voices
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="tactile-btn rounded-lg border border-white/10 bg-zinc-800/80 px-2.5 py-1 text-xs font-mono font-medium text-zinc-300 hover:bg-zinc-700"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Player Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3.5">
          <button
            onClick={togglePlay}
            className="tactile-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-zinc-950 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-300"
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <div className="flex-1">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-cyan-400"
            />
            <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5 font-mono">
              <span className="text-cyan-300 font-semibold">{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript with Speaker Badges and Active Sync */}
      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Mic className="h-3.5 w-3.5 text-cyan-400" /> Synchronized Dialogue Transcript
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">Tap any turn to scrub</span>
        </div>

        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {briefing.transcript.map((seg, idx) => {
            const isHost = seg.speaker.toLowerCase() === "host";
            const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;

            return (
              <div
                key={idx}
                onClick={() => jumpToSegment(seg.start_time)}
                className={`cursor-pointer rounded-xl p-3 transition border ${
                  isActive
                    ? "bg-cyan-950/30 border-cyan-500/40 shadow-sm ring-1 ring-cyan-500/20"
                    : "bg-zinc-900/60 border-white/5 hover:bg-zinc-900 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isHost
                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    {seg.speaker}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                  </span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isActive ? "text-zinc-100 font-medium" : "text-zinc-400"
                  }`}
                >
                  {seg.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
