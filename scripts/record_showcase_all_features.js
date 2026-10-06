const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RECORDINGS_DIR = path.resolve(__dirname, "../recordings");
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

const ARTIFACTS_DIR = "C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\945e4869-21f8-4329-95be-5b919e6d3b3f";

const FFMPEG_PATH = path.resolve(
  __dirname,
  "../backend/.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
);

async function run() {
  console.log("Launching Microsoft Edge for exhaustive, flawless feature tour...");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: RECORDINGS_DIR,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // ==========================================
  // 1. HERO & INPUT MODALITIES
  // ==========================================
  console.log("1. Showcasing Split Hero & Input Modalities...");
  await page.evaluate(() => window.scrollBy({ top: 140, behavior: "smooth" }));
  await page.waitForTimeout(1500);

  // Switch to Web URL modality
  console.log("   - Modality: Web URL (SSRF Guarded)");
  await page.click("button:has-text('Web URL')");
  await page.waitForTimeout(800);
  await page.fill("input[type='url']", "https://nature.com/articles/quantum-error-suppression");
  await page.waitForTimeout(1500);

  // Switch to PDF Upload modality
  console.log("   - Modality: PDF Upload");
  await page.click("button:has-text('PDF Upload')");
  await page.waitForTimeout(1500);

  // Switch back to Raw Text modality
  console.log("   - Modality: Raw Text");
  await page.click("button:has-text('Raw Text')");
  await page.waitForTimeout(1000);

  // ==========================================
  // 2. MULTILINGUAL & PRESETS
  // ==========================================
  console.log("2. Showcasing Multilingual Support & Demo Presets...");
  // Click Hindi Renewable Energy preset to showcase multilingual support
  console.log("   - Selecting Hindi Renewable Energy preset...");
  await page.click("button:has-text('भारत')");
  await page.waitForTimeout(2000);

  // Switch back to Quantum preset for full technical verification
  console.log("   - Selecting Quantum Computing preset...");
  await page.click("button:has-text('Breakthrough')");
  await page.waitForTimeout(1500);

  // ==========================================
  // 3. TARGET ADAPTATION & LENS SWITCHER
  // ==========================================
  console.log("3. Showcasing Persona Targeting & Lens Switcher...");
  await page.selectOption("select", "executive");
  await page.waitForTimeout(1000);

  // Toggle Learn Lens in header
  console.log("   - Toggling Learn Lens...");
  await page.click("button:has-text('Learn Lens')");
  await page.waitForTimeout(1200);
  await page.click("button:has-text('News Lens')");
  await page.waitForTimeout(1200);

  // ==========================================
  // 4. MULTI-FORMAT SYNTHESIS (REAL-TIME SSE)
  // ==========================================
  console.log("4. Launching Multi-Format Synthesis...");
  await page.click("button[type='submit']");

  console.log("   - Watching live SSE progress ribbon...");
  await page.waitForTimeout(3000);

  // Wait for completed bento studio (cached content is fast)
  await page.waitForSelector("button:has-text('Audio Briefing')", { timeout: 180000 });
  console.log("   - Pipeline completed successfully!");
  await page.waitForTimeout(2000);

  // Scroll smoothly down to Bento Grid Row 1
  await page.evaluate(() => window.scrollBy({ top: 520, behavior: "smooth" }));
  await page.waitForTimeout(1500);

  // ==========================================
  // 5. CONTENT KNOWLEDGE GRAPH & ENTITIES
  // ==========================================
  console.log("5. Showcasing Content Knowledge Graph & Entities...");
  const entityPills = await page.$$(".liquid-card:has-text('Content Graph') span:has-text('(')");
  if (entityPills.length > 0) {
    await entityPills[0].hover();
    await page.waitForTimeout(800);
    if (entityPills.length > 2) {
      await entityPills[2].hover();
      await page.waitForTimeout(800);
    }
  }

  // ==========================================
  // 6. GROUNDED Q&A ASSISTANT (CHAT)
  // ==========================================
  console.log("6. Showcasing Grounded Q&A Assistant...");
  // Quick Prompt: Simpler
  console.log("   - Asking quick prompt: Simpler...");
  await page.click(".liquid-card:has-text('Content Graph') button:has-text('Simpler')");
  await page.waitForTimeout(3500);

  // Quick Prompt: Key Metrics
  console.log("   - Asking quick prompt: Key Metrics...");
  await page.click(".liquid-card:has-text('Content Graph') button:has-text('Key Metrics')");
  await page.waitForTimeout(3500);

  // Type custom question in Grounded Q&A
  console.log("   - Typing custom question into Grounded Q&A...");
  await page.fill("input[placeholder*='Ask a question']", "What was the gate fidelity percentage achieved?");
  await page.waitForTimeout(800);
  await page.click(".liquid-card:has-text('Content Graph') button:has(svg.lucide-send)");
  await page.waitForTimeout(4500);

  // ==========================================
  // 7. GROUNDED TRUST INSPECTOR & TWO-STAGE CRITIC
  // ==========================================
  console.log("7. Showcasing Grounded Trust Inspector & Claim Verification...");
  // Filter by Verified claims
  console.log("   - Filtering by Verified claims...");
  await page.click(".liquid-card:has-text('Kaleido Trust Layer') button:has-text('Verified')");
  await page.waitForTimeout(1500);

  // Filter by Flagged/Contradicted claims
  console.log("   - Filtering by Flagged claims (hallucination detection)...");
  await page.click(".liquid-card:has-text('Kaleido Trust Layer') button:has-text('Flagged')");
  await page.waitForTimeout(2000);

  // Reset filter to Show All
  const showAllBtn = await page.$(".liquid-card:has-text('Kaleido Trust Layer') button:has-text('Show All')");
  if (showAllBtn) {
    await showAllBtn.click();
    await page.waitForTimeout(1000);
  }

  // Expand claim accordion drawer
  console.log("   - Expanding claim drawer to show source quote & grounding citations...");
  const claimHeader = await page.$(".liquid-card:has-text('Kaleido Trust Layer') .cursor-pointer:has(span:has-text('VERIFIED')), .liquid-card:has-text('Kaleido Trust Layer') .cursor-pointer:has(span:has-text('FLAGGED'))");
  if (claimHeader) {
    await claimHeader.click();
    await page.waitForTimeout(2000);
  }

  // Scroll to Bento Grid Row 2 (Audio, Quiz, Story Deck)
  await page.evaluate(() => window.scrollBy({ top: 480, behavior: "smooth" }));
  await page.waitForTimeout(1500);

  // ==========================================
  // 8. INTERACTIVE AUDIO BRIEFING PLAYER
  // ==========================================
  console.log("8. Showcasing Dual-Speaker Audio Briefing Player...");
  const audioPlayBtn = await page.$(".liquid-card:has(audio) button:has(svg.lucide-play)");
  if (audioPlayBtn) {
    console.log("   - Starting playback...");
    await audioPlayBtn.click();
    await page.waitForTimeout(3000);

    // Cycle speed using exact speed text
    console.log("   - Cycling audio playback speed...");
    const speedBtn = await page.$(".liquid-card:has(audio) button:text-matches('^[0-9.]+x$')");
    if (speedBtn) {
      await speedBtn.click();
      await page.waitForTimeout(800);
      await speedBtn.click();
      await page.waitForTimeout(800);
      await speedBtn.click();
      await page.waitForTimeout(800);
    }

    // Click dialogue turn bubble to jump playback
    const dialogueTurn = await page.$(".liquid-card:has(audio) .cursor-pointer");
    if (dialogueTurn) {
      console.log("   - Clicking dialogue turn bubble to jump playback...");
      await dialogueTurn.click();
      await page.waitForTimeout(2000);
    }

    // Pause audio
    const audioPauseBtn = await page.$(".liquid-card:has(audio) button:has(svg.lucide-pause)");
    if (audioPauseBtn) await audioPauseBtn.click();
    await page.waitForTimeout(1000);
  }

  // ==========================================
  // 9. INTERACTIVE QUIZ WIDGET (FULL RUN TO AWARD)
  // ==========================================
  console.log("9. Showcasing Interactive Quiz Widget (Full Run)...");
  // Answer Question 1
  const option1 = await page.$(".liquid-card:has-text('Question 1') button:has(span:has-text('A')), .liquid-card:has-text('Question') button:has(span:has-text('A'))");
  if (option1) {
    console.log("   - Answering Question 1...");
    await option1.click();
    await page.waitForTimeout(1500);
  }

  // Next Question
  const nextQBtn1 = await page.$("button:has-text('Next Question')");
  if (nextQBtn1) {
    console.log("   - Advancing to Question 2...");
    await nextQBtn1.click();
    await page.waitForTimeout(1200);
    // Answer Question 2
    const option2 = await page.$("button:has(span:has-text('B')), button:has(span:has-text('A'))");
    if (option2) {
      await option2.click();
      await page.waitForTimeout(1500);
    }
  }

  // Next Question
  const nextQBtn2 = await page.$("button:has-text('Next Question'), button:has-text('Finish Quiz')");
  if (nextQBtn2) {
    console.log("   - Advancing to Question 3...");
    await nextQBtn2.click();
    await page.waitForTimeout(1200);
    // Answer Question 3
    const option3 = await page.$("button:has(span:has-text('C')), button:has(span:has-text('B'))");
    if (option3) {
      await option3.click();
      await page.waitForTimeout(1500);
    }
  }

  // Complete Quiz -> Award Screen
  const finishQuizBtn = await page.$("button:has-text('Finish Quiz'), button:has-text('Next Question')");
  if (finishQuizBtn) {
    console.log("   - Completing Quiz to show Award Screen...");
    await finishQuizBtn.click();
    await page.waitForTimeout(2500);

    // Retake Quiz to demonstrate reset
    const retakeBtn = await page.$("button:has-text('Retake Quiz')");
    if (retakeBtn) {
      console.log("   - Resetting quiz with Retake Quiz...");
      await retakeBtn.click();
      await page.waitForTimeout(1200);
    }
  }

  // ==========================================
  // 10. VISUAL STORY CARD DECK
  // ==========================================
  console.log("10. Showcasing Visual Story Card Deck...");
  // Navigate via dots
  const storyDots = await page.$$(".liquid-card:has-text('Card') button.rounded-full");
  if (storyDots.length >= 3) {
    console.log("   - Clicking Story Deck dot 2...");
    await storyDots[1].click();
    await page.waitForTimeout(1500);
    console.log("   - Clicking Story Deck dot 3...");
    await storyDots[2].click();
    await page.waitForTimeout(1500);
  }

  // Navigate via Previous arrow
  const prevSlideBtn = await page.$(".liquid-card:has-text('Card') button:has(svg.lucide-chevron-left)");
  if (prevSlideBtn) {
    console.log("   - Clicking Previous card arrow...");
    await prevSlideBtn.click();
    await page.waitForTimeout(1200);
  }

  // ==========================================
  // 11. PERSONA MATRIX & INVARIANCE MODAL
  // ==========================================
  console.log("11. Showcasing Persona Matrix & Fact-Invariance Proof Modal...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1200);

  console.log("   - Opening Persona Comparison Modal...");
  await page.click("header button:has-text('Persona Matrix'), button:has-text('Fact-Invariance Proof')");
  await page.waitForTimeout(2500);

  // Scroll inside modal to show Fact-Invariance Matrix table
  await page.evaluate(() => {
    const modal = document.querySelector(".fixed .overflow-y-auto");
    if (modal) modal.scrollBy({ top: 400, behavior: "smooth" });
  });
  await page.waitForTimeout(3000);

  // Close modal
  await page.click(".fixed button:has(svg.lucide-x)");
  await page.waitForTimeout(1200);

  // ==========================================
  // 12. AUDIENCE INSIGHTS & AI VARIANT REGENERATION
  // ==========================================
  console.log("12. Showcasing Audience Insights Drawer & Live AI Optimization...");
  await page.click("header button:has-text('Audience Insights'), button:has-text('Drop-Off Insights')");
  await page.waitForTimeout(2500);

  // Scroll inside drawer to show retention funnel and diagnosis
  await page.evaluate(() => {
    const drawer = document.querySelector(".fixed .overflow-y-auto");
    if (drawer) drawer.scrollBy({ top: 320, behavior: "smooth" });
  });
  await page.waitForTimeout(2000);

  // Click "Regenerate Optimized Variant" button
  const regenBtn = await page.$(".fixed button:has-text('Regenerate Optimized Variant')");
  if (regenBtn) {
    console.log("   - Clicking 'Regenerate Optimized Variant' with Gemini Pro...");
    await regenBtn.click();
    await page.waitForTimeout(5000);
    console.log("   - Fact-invariant variant regenerated and applied!");
  }

  // Close drawer
  await page.click(".fixed button:has-text('Close Insights'), .fixed button:has(svg.lucide-x)");
  await page.waitForTimeout(1200);

  // ==========================================
  // 13. PUBLISHER EMBED SANDBOX & ECONOMICS
  // ==========================================
  console.log("13. Showcasing Publisher Embed Widget & Credit Metering...");
  await page.click("header button:has-text('Publisher Embed')");
  await page.waitForTimeout(2000);

  // Copy embed snippet
  console.log("   - Copying 1-line script snippet...");
  await page.click(".fixed button:has-text('Copy Snippet'), .fixed button:has-text('Copy Code')");
  await page.waitForTimeout(1500);

  // Scroll down inside modal to view live newspaper simulation and unit economics
  await page.evaluate(() => {
    const modal = document.querySelector(".fixed .overflow-y-auto");
    if (modal) modal.scrollBy({ top: 480, behavior: "smooth" });
  });
  await page.waitForTimeout(3500);

  // Close sandbox
  await page.click(".fixed button:has-text('Close Sandbox'), .fixed button:has(svg.lucide-x)");
  await page.waitForTimeout(1200);

  // ==========================================
  // 14. COMPREHENSIVE PANORAMIC TOUR
  // ==========================================
  console.log("14. Final Panoramic Layout Tour...");
  await page.evaluate(() => window.scrollTo({ top: 650, behavior: "smooth" }));
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  // Close context to finalize video
  console.log("Finalizing video recording...");
  const video = page.video();
  await page.close();
  await context.close();
  const videoPath = await video.path();
  await browser.close();

  console.log(`Raw video saved at: ${videoPath}`);

  // Convert to MP4
  const mp4Path = path.resolve(RECORDINGS_DIR, "kaleido_feature_showcase.mp4");
  console.log(`Converting complete recording to MP4 at: ${mp4Path}...`);

  try {
    const ffmpegCmd = `"${FFMPEG_PATH}" -y -i "${videoPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${mp4Path}"`;
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(`Exhaustive MP4 showcase created successfully!`);

    const stats = fs.statSync(mp4Path);
    console.log(`MP4 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    // Copy to artifacts directory
    if (fs.existsSync(ARTIFACTS_DIR)) {
      const artifactMp4 = path.join(ARTIFACTS_DIR, "kaleido_feature_showcase.mp4");
      fs.copyFileSync(mp4Path, artifactMp4);
      console.log(`Copied MP4 to artifacts directory: ${artifactMp4}`);
    }
  } catch (err) {
    console.error("FFmpeg conversion error:", err);
  }
}

run().catch((err) => {
  console.error("Error during exhaustive showcase recording:", err);
  process.exit(1);
});
