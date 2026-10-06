const { chromium } = require("../frontend/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RECORDINGS_DIR = path.resolve(__dirname, "../recordings");
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Artifact directory
const ARTIFACTS_DIR = "C:\\Users\\Acer\\.gemini\\antigravity-ide\\brain\\945e4869-21f8-4329-95be-5b919e6d3b3f";

// Find ffmpeg binary from the venv
const FFMPEG_PATH = path.resolve(
  __dirname,
  "../backend/.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"
);

async function run() {
  console.log("Launching Microsoft Edge with video recording enabled...");
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

  // 1. Showcase Split Hero and Ingestion Console
  console.log("1. Showcasing Hero and Ingest Console...");
  await page.evaluate(() => window.scrollBy({ top: 120, behavior: "smooth" }));
  await page.waitForTimeout(1500);

  // 2. Click Fast Demo Preset
  console.log("2. Loading Fast Demo Preset...");
  try {
    await page.waitForSelector("button:has-text('Breakthrough')", { timeout: 8000 });
    await page.click("button:has-text('Breakthrough')");
    console.log("Successfully loaded Breakthrough in Quantum Computing preset.");
  } catch (e) {
    console.log("Falling back to manual text injection...");
    await page.fill(
      "textarea",
      "Researchers at the International Quantum Research Institute have announced a decisive milestone in fault-tolerant quantum computing, demonstrating 100 logical qubits operating below the fault-tolerant threshold with dual-rail neutral atom arrays in optical tweezers."
    );
  }
  await page.waitForTimeout(1500);

  // 3. Select Audience Persona
  console.log("3. Selecting Audience Persona...");
  const personaSelect = await page.$("select");
  if (personaSelect) {
    await personaSelect.selectOption("executive");
    await page.waitForTimeout(1000);
  }

  // 4. Trigger Multi-Format Synthesis
  console.log("4. Launching Multi-Format Synthesis...");
  const submitBtn = await page.$("button[type='submit']");
  if (submitBtn) {
    await submitBtn.click();
  }

  // Showcase real-time SSE progress bar
  console.log("Waiting for pipeline synthesis to complete (monitoring real-time progress)...");
  await page.waitForTimeout(3000);

  // Wait up to 180 seconds for completion
  await page.waitForSelector("button:has-text('Audio Briefing')", { timeout: 180000 });
  console.log("Pipeline synthesis completed! All multi-modal formats ready.");
  await page.waitForTimeout(2000);

  // 5. Scroll to Bento Command Center
  console.log("5. Showcasing Bento Command Center...");
  await page.evaluate(() => window.scrollBy({ top: 520, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  // 6. Showcase Audio Briefing Player
  console.log("6. Showcasing Audio Briefing Player...");
  const playBtn = await page.$("button:has(svg.lucide-play), button[title*='Play'], button:has-text('Play')");
  if (playBtn) {
    await playBtn.click();
    console.log("Playing audio briefing with neural speech...");
    await page.waitForTimeout(3500);
    // Pause
    const pauseBtn = await page.$("button:has(svg.lucide-pause), button[title*='Pause']");
    if (pauseBtn) await pauseBtn.click();
    await page.waitForTimeout(1000);
  }

  // 7. Showcase Interactive Quiz Widget
  console.log("7. Showcasing Interactive Quiz Widget...");
  const quizTab = await page.$("button:has-text('Quiz')");
  if (quizTab) {
    await quizTab.click();
    await page.waitForTimeout(1500);
  }
  // Click first quiz option
  const quizOption = await page.$("button:has-text('A.'), button:has-text('B.'), button:has(span:has-text('A'))");
  if (quizOption) {
    await quizOption.click();
    console.log("Answered Quiz Question 1 — verifying grounded citation pill...");
    await page.waitForTimeout(2500);
  }

  // 8. Showcase Visual Story Deck
  console.log("8. Showcasing Visual Story Deck...");
  const storyTab = await page.$("button:has-text('Story Deck')");
  if (storyTab) {
    await storyTab.click();
    await page.waitForTimeout(1500);
  }
  const nextSlideBtn = await page.$("button:has-text('Next'), button:has(svg.lucide-chevron-right)");
  if (nextSlideBtn) {
    console.log("Advancing Story Deck Slide 1 -> 2...");
    await nextSlideBtn.click();
    await page.waitForTimeout(1500);
    console.log("Advancing Story Deck Slide 2 -> 3...");
    await nextSlideBtn.click();
    await page.waitForTimeout(2000);
  }

  // 9. Showcase Trust Inspector & Search Grounding
  console.log("9. Showcasing Grounded Trust Inspector...");
  await page.evaluate(() => window.scrollBy({ top: 280, behavior: "smooth" }));
  await page.waitForTimeout(2000);

  // 10. Showcase Persona Comparison Modal
  console.log("10. Showcasing Persona Comparison Modal...");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await page.waitForTimeout(1500);
  const personaModalBtn = await page.$("button:has-text('Persona Matrix')");
  if (personaModalBtn) {
    await personaModalBtn.click();
    console.log("Opened Persona Comparison Modal.");
    await page.waitForTimeout(2500);
    // Scroll inside modal to show invariance matrix table
    await page.evaluate(() => {
      const modal = document.querySelector(".fixed .overflow-y-auto");
      if (modal) modal.scrollBy({ top: 350, behavior: "smooth" });
    });
    await page.waitForTimeout(2500);
    const closeBtn = await page.$("button:has(svg.lucide-x)");
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(1200);
  }

  // 11. Showcase Audience Insights Drawer
  console.log("11. Showcasing Audience Insights Drawer...");
  const insightsBtn = await page.$("button:has-text('Audience Insights')");
  if (insightsBtn) {
    await insightsBtn.click();
    console.log("Opened Audience Insights Drawer.");
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const drawer = document.querySelector(".fixed .overflow-y-auto");
      if (drawer) drawer.scrollBy({ top: 300, behavior: "smooth" });
    });
    await page.waitForTimeout(2500);
    const closeBtn = await page.$("button:has(svg.lucide-x)");
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(1200);
  }

  // 12. Showcase Publisher Embed Sandbox
  console.log("12. Showcasing Publisher Embed Sandbox...");
  const embedBtn = await page.$("button:has-text('Publisher Embed')");
  if (embedBtn) {
    await embedBtn.click();
    console.log("Opened Publisher Embed Sandbox.");
    await page.waitForTimeout(2000);
    const copySnippetBtn = await page.$("button:has-text('Copy Snippet'), button:has-text('Copy Code')");
    if (copySnippetBtn) {
      await copySnippetBtn.click();
      console.log("Copied 1-line embed snippet.");
      await page.waitForTimeout(1500);
    }
    // Scroll down inside modal to view live newspaper simulation
    await page.evaluate(() => {
      const modal = document.querySelector(".fixed .overflow-y-auto");
      if (modal) modal.scrollBy({ top: 450, behavior: "smooth" });
    });
    await page.waitForTimeout(3000);
    const closeBtn = await page.$("button:has-text('Close Sandbox'), button:has(svg.lucide-x)");
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(1200);
  }

  // 13. Lens Switcher Showcase
  console.log("13. Showcasing News/Learn Lens Switcher...");
  const learnLensBtn = await page.$("button:has-text('Learn Lens')");
  if (learnLensBtn) {
    await learnLensBtn.click();
    await page.waitForTimeout(1500);
    const newsLensBtn = await page.$("button:has-text('News Lens')");
    if (newsLensBtn) await newsLensBtn.click();
    await page.waitForTimeout(1500);
  }

  // 14. Full Page Overview Tour
  console.log("14. Smooth Full-Page Tour...");
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
  console.log(`Converting recording to MP4 at: ${mp4Path}...`);

  try {
    const ffmpegCmd = `"${FFMPEG_PATH}" -y -i "${videoPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${mp4Path}"`;
    execSync(ffmpegCmd, { stdio: "inherit" });
    console.log(`MP4 conversion completed successfully!`);

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
  console.error("Error during showcase recording:", err);
  process.exit(1);
});
