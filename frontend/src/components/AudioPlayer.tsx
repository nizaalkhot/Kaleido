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
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-xl backdrop-blur">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-100 text-sm tracking-wide">
              {briefing.title}
            </h3>
            <p className="text-xs text-neutral-400">
              Multi-speaker synthesized brief • Neural2/Journey
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="rounded-md border border-neutral-700 bg-neutral-800/80 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-neutral-700 transition"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Player Controls */}
      <div className="my-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
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
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-neutral-700 accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 mt-1 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript with Speaker Badges and Active Sync */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2 font-medium">
          <span className="flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5 text-neutral-400" /> Synchronized Dialogue Transcript
          </span>
          <span className="text-[11px] text-neutral-500">Click any turn to jump</span>
        </div>

        <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1.5 scrollbar-thin">
          {briefing.transcript.map((seg, idx) => {
            const isHost = seg.speaker.toLowerCase() === "host";
            const isActive = currentTime >= seg.start_time && currentTime <= seg.end_time;

            return (
              <div
                key={idx}
                onClick={() => jumpToSegment(seg.start_time)}
                className={`cursor-pointer rounded-xl p-3 transition border ${
                  isActive
                    ? "bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                    : "bg-neutral-800/40 border-neutral-800 hover:bg-neutral-800/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isHost
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    }`}
                  >
                    {seg.speaker}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatTime(seg.start_time)} - {formatTime(seg.end_time)}
                  </span>
                </div>
                <p
                  className={`text-xs leading-relaxed ${
                    isActive ? "text-neutral-100 font-medium" : "text-neutral-300"
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
