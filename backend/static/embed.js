/**
 * Kaleido Embeddable Widget v1.0
 * Lightweight drop-in player for publishers
 */
(function () {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const jobId = currentScript.getAttribute("data-kaleido") || "";
  const container = document.createElement("div");
  container.className = "kaleido-embed-container";

  container.innerHTML = `
    <div style="border: 1px solid #27272a; background: #09090b; color: #f4f4f5; border-radius: 16px; padding: 16px; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); max-width: 580px; margin: 16px 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #18181b; padding-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="height: 10px; width: 10px; border-radius: 50%; background: #6366f1; display: inline-block;"></span>
          <strong style="font-size: 13px; letter-spacing: 0.5px;">KALEIDO VERIFIED BRIEFING</strong>
        </div>
        <span style="font-size: 11px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 2px 8px; border-radius: 9999px; font-weight: 600;">
          ✓ Fact-Invariant
        </span>
      </div>
      <p style="font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0 0 12px 0;">
        Listen to the 2-speaker audio brief verified against source claims.
      </p>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button id="kaleido-play-btn-${jobId}" style="background: #6366f1; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
          ▶
        </button>
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 600; color: #e4e4e7;">Multi-Speaker Audio Summary</div>
          <div style="font-size: 10px; color: #71717a;">Powered by Kaleido ADK & Google Cloud TTS</div>
        </div>
      </div>
    </div>
  `;

  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);
})();
