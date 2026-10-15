/**
 * Kaleido Embeddable Widget v2.0
 * Multi-Theme, verified drop-in interactive player for publishers
 */
(function () {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const jobId = currentScript.getAttribute("data-kaleido") || "";
  const theme = currentScript.getAttribute("data-theme") || "dark";
  const backendUrl = currentScript.getAttribute("data-backend") || (new URL(currentScript.src).origin);
  const container = document.createElement("div");
  container.className = `kaleido-embed-container kaleido-theme-${theme}`;

  const isLight = theme === "light" || theme === "editorial";
  const isCompact = theme === "compact";

  const bg = isLight ? "#ffffff" : "#09090b";
  const border = isLight ? "#e4e4e7" : "#27272a";
  const text = isLight ? "#18181b" : "#f4f4f5";
  const textMuted = isLight ? "#71717a" : "#a1a1aa";
  const accent = "#06b6d4";

  if (isCompact) {
    container.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: 10px; border: 1px solid ${border}; background: ${bg}; color: ${text}; border-radius: 9999px; padding: 6px 14px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin: 8px 0;">
        <button id="kaleido-btn-${jobId}" style="background: ${accent}; color: #000; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold;">
          ▶
        </button>
        <span style="font-size: 12px; font-weight: 600;">Listen to Verified Briefing</span>
        <span style="font-size: 10px; color: #10b981; font-weight: 700; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 9999px;">✓ Invariant</span>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="border: 1px solid ${border}; background: ${bg}; color: ${text}; border-radius: 16px; padding: 18px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); max-width: 580px; margin: 16px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid ${border}; padding-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="height: 10px; width: 10px; border-radius: 50%; background: ${accent}; display: inline-block;"></span>
            <strong style="font-size: 12px; letter-spacing: 0.6px; font-family: monospace;">KALEIDO VERIFIED BRIEFING</strong>
          </div>
          <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 9999px; font-weight: 600;">
            ✓ 100% Fact-Invariant
          </span>
        </div>
        <p style="font-size: 12px; color: ${textMuted}; line-height: 1.5; margin: 0 0 14px 0;">
          Authoritative dual-speaker audio synthesis grounded in source claims with Google Vertex AI.
        </p>
        <div style="display: flex; align-items: center; gap: 14px;">
          <button id="kaleido-btn-${jobId}" style="background: ${accent}; color: #000; border: none; border-radius: 50%; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 14px rgba(6,182,212,0.4); transition: transform 0.15s ease;">
            ▶
          </button>
          <div style="flex: 1;">
            <div id="kaleido-status-${jobId}" style="font-size: 12px; font-weight: 600; color: ${text};">Ready to play</div>
            <div style="font-size: 10px; color: ${textMuted}; font-family: monospace;">Powered by Kaleido ADK & Vertex AI</div>
          </div>
        </div>
      </div>
    `;
  }

  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  // Audio playback handler
  let audioEl = null;
  const playBtn = document.getElementById(`kaleido-btn-${jobId}`);
  const statusEl = document.getElementById(`kaleido-status-${jobId}`);

  if (playBtn) {
    playBtn.addEventListener("click", function () {
      if (!audioEl) {
        audioEl = new Audio();
        // Fetch active job to get audio_url
        fetch(`${backendUrl}/api/jobs/${jobId}`)
          .then(r => r.json())
          .then(job => {
            if (job.audio && job.audio.audio_url) {
              audioEl.src = job.audio.audio_url.startsWith("http") ? job.audio.audio_url : `${backendUrl}${job.audio.audio_url}`;
              audioEl.play();
              playBtn.textContent = "⏸";
              if (statusEl) statusEl.textContent = "Playing verified brief...";
            } else {
              if (statusEl) statusEl.textContent = "Briefing audio ready";
            }
          })
          .catch(() => {
            if (statusEl) statusEl.textContent = "Unable to connect to audio service";
          });

        audioEl.addEventListener("ended", () => {
          playBtn.textContent = "▶";
          if (statusEl) statusEl.textContent = "Playback complete";
        });
        audioEl.addEventListener("pause", () => {
          playBtn.textContent = "▶";
        });
        audioEl.addEventListener("play", () => {
          playBtn.textContent = "⏸";
        });
      } else {
        if (audioEl.paused) {
          audioEl.play();
        } else {
          audioEl.pause();
        }
      }
    });
  }
})();

