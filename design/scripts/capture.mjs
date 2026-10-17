import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir =
  process.env.PHASE2_MEDIA_OUT ||
  "/cursor/stores/bc-69cca2ee-086d-4958-861f-572ca096de17/media/phase2-design";
const chrome = process.env.CHROME || "/usr/local/bin/google-chrome";

const directions = (process.env.DIRECTIONS || "a,b,c").split(",").map((s) => s.trim()).filter(Boolean);
const screens = ["home", "trail", "listen", "celebration", "grown-ups"];
const sizes = [
  { w: 1180, h: 820, tag: "1180x820" },
  { w: 390, h: 844, tag: "390x844" },
];

const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://127.0.0.1");
      let file = path.join(root, decodeURIComponent(url.pathname));
      if (file.endsWith(path.sep)) file = path.join(file, "index.html");
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("no");
          return;
        }
        res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function shoot(page, url, file, waitMs) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(waitMs);
  await page.screenshot({ path: file, animations: "allow" });
}

async function record(browser, origin, id) {
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (frame) => {
    frames.push(Buffer.from(frame.data, "base64"));
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
    } catch { /* closing */ }
  });
  await page.goto(`${origin}/direction-${id}/index.html?demo=1`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 72,
    maxWidth: 1180,
    maxHeight: 820,
    everyNthFrame: 2,
  });
  await page.waitForTimeout(17000);
  await cdp.send("Page.stopScreencast");
  await page.waitForTimeout(200);
  await context.close();

  const dir = `/tmp/phase2-frames-${id}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir);
  frames.forEach((buf, i) => {
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.jpg`), buf);
  });
  const mp4 = path.join(outDir, `direction-${id}-motion.mp4`);
  const fps = Math.max(1, frames.length / 17);
  await new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y",
      "-framerate", String(fps),
      "-i", path.join(dir, "f%04d.jpg"),
      "-vf", "scale=1180:820:force_original_aspect_ratio=decrease,pad=1180:820:(ow-iw)/2:(oh-ih)/2",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      mp4,
    ]);
    let err = "";
    ff.stderr.on("data", (d) => { err += d; });
    ff.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-500)))));
  });
  console.log("video", mp4, "frames", frames.length);
}

const server = await startServer();
const port = server.address().port;
const origin = `http://127.0.0.1:${port}`;
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: [
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
    "--hide-scrollbars",
  ],
});

const page = await browser.newPage();
page.on("pageerror", (err) => console.log("PAGEERROR", err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE", msg.text());
});
for (const id of directions) {
  for (const screen of screens) {
    for (const size of sizes) {
      await page.setViewportSize({ width: size.w, height: size.h });
      const file = path.join(outDir, `direction-${id}-${screen}-${size.tag}.png`);
      const waitMs = screen === "celebration" ? 1600 : 1200;
      await shoot(
        page,
        `${origin}/direction-${id}/index.html?screen=${encodeURIComponent(screen)}&shot=1`,
        file,
        waitMs
      );
      console.log("png", path.basename(file));
    }
  }
}
await page.close();

for (const id of directions) {
  await record(browser, origin, id);
}

await browser.close();
server.close();
