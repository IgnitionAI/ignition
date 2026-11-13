import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../evidence/ign-221");
const origin = process.env.CIRCUIT_URL ?? "http://127.0.0.1:3020";
const url = `${origin}/?e2e=1`;

const consoleLines = [];
const networkLines = [];
const metrics = {
  origin: url,
  webgl: null,
  keyboard: null,
  completion: null,
  frames: null,
  secondStart: null,
};

function stamp(kind, text) {
  return `${new Date().toISOString()} [${kind}] ${text}`;
}

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-gpu-sandbox",
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on("console", (msg) =>
  consoleLines.push(stamp(msg.type(), msg.text())),
);
page.on("pageerror", (err) =>
  consoleLines.push(stamp("pageerror", err.stack || String(err))),
);
page.on("requestfinished", (req) => {
  void req.response().then(
    (res) => {
      networkLines.push(
        stamp(
          "net",
          `${req.method()} ${req.url()} -> ${res ? res.status() : "no-response"}`,
        ),
      );
    },
    (err) => {
      networkLines.push(stamp("net-err", `${req.url()} :: ${err}`));
    },
  );
});
page.on("requestfailed", (req) => {
  networkLines.push(
    stamp("net-fail", `${req.method()} ${req.url()} :: ${req.failure()?.errorText}`),
  );
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByTestId("nav-race").click();
  await page.getByTestId("race-garage").waitFor({ timeout: 60000 });
  await page.screenshot({ path: join(outDir, "01-garage.png"), fullPage: true });

  await page.getByTestId("race-mode").selectOption("human");
  await page.getByTestId("player-vehicle").selectOption("sedan-sports");
  await page.getByTestId("opponent-0").selectOption("bundled-29");
  await page.screenshot({
    path: join(outDir, "02-garage-human.png"),
    fullPage: true,
  });

  await page.getByTestId("opponent-0").selectOption("");
  await page.getByTestId("start-race").click();
  const missing = await page.getByRole("alert").textContent();
  if (!/Choisissez un pilote valide|Choose a valid driver/.test(missing ?? ""))
    throw new Error(`Expected explicit driver error, got: ${missing}`);
  await page.getByTestId("opponent-0").selectOption("bundled-29");
  await page.getByTestId("start-race").click();

  await page.waitForFunction(
    () => window.__IGNITION_E2E__?.snapshot()?.human === true,
    null,
    { timeout: 60000 },
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: join(outDir, "03-countdown.png"),
    fullPage: true,
  });

  metrics.webgl = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const gl =
      canvas?.getContext("webgl2") ||
      canvas?.getContext("webgl") ||
      canvas?.getContext("experimental-webgl");
    if (!gl) return { ok: false };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      ok: true,
      vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: dbg
        ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
    };
  });

  await page.keyboard.down("ArrowUp");
  await page.waitForTimeout(3500);
  metrics.keyboard = await page.evaluate(() => {
    const api = window.__IGNITION_E2E__;
    const speed = document.querySelector(".speedometer strong")?.textContent;
    return { snapshot: api?.snapshot() ?? null, speed };
  });
  await page.screenshot({
    path: join(outDir, "04-keyboard-accel.png"),
    fullPage: true,
  });
  await page.keyboard.up("ArrowUp");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(outDir, "05-paused.png"),
    fullPage: true,
  });
  await page.getByTestId("resume-race").click();
  await page.waitForTimeout(400);

  metrics.frames = await page.evaluate(async () => {
    const samples = [];
    await new Promise((resolve) => {
      let last = performance.now();
      const step = (now) => {
        samples.push(now - last);
        last = now;
        if (samples.length < 90) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    samples.sort((a, b) => a - b);
    const sum = samples.reduce((a, b) => a + b, 0);
    return {
      count: samples.length,
      medianMs: samples[Math.floor(samples.length / 2)],
      p95Ms: samples[Math.floor(samples.length * 0.95)],
      meanMs: sum / samples.length,
      fps: 1000 / (sum / samples.length),
    };
  });

  await page.keyboard.press("Escape");
  const checkpoint = await page.evaluate(async () => {
    const response = await fetch("/drivers/driver-11.json");
    if (!response.ok) throw new Error(`driver-11.json HTTP ${response.status}`);
    return response.json();
  });
  metrics.completion = await page.evaluate(
    async (cp) => {
      const api = window.__IGNITION_E2E__;
      if (!api) throw new Error("E2E hook missing");
      return api.completeWithFrozenCheckpoint(cp);
    },
    checkpoint,
    { timeout: 120000 },
  );

  await page.getByTestId("race-results").waitFor({ timeout: 15000 });
  await page.screenshot({
    path: join(outDir, "06-results.png"),
    fullPage: true,
  });
  const resultsText = await page.getByTestId("race-results").innerText();
  if (!/bundled-29/.test(resultsText))
    throw new Error(`Results missing checkpoint id:\n${resultsText}`);

  await page.getByTestId("new-race").click();
  await page.getByTestId("race-garage").waitFor({ timeout: 30000 });
  await page.getByTestId("race-mode").selectOption("human");
  await page.getByTestId("opponent-0").selectOption("bundled-29");
  await page.getByTestId("start-race").click();
  await page.waitForFunction(
    () =>
      window.__IGNITION_E2E__?.snapshot()?.human === true &&
      window.__IGNITION_E2E__.snapshot()?.finished === false,
    null,
    { timeout: 60000 },
  );
  metrics.secondStart = await page.evaluate(() => window.__IGNITION_E2E__?.snapshot());
  await page.screenshot({
    path: join(outDir, "07-new-race.png"),
    fullPage: true,
  });

  if (!metrics.keyboard?.snapshot?.human)
    throw new Error("Keyboard race snapshot missing human session");
  if (!metrics.completion?.competitorIds?.includes("bundled-29"))
    throw new Error("Completion did not keep the learned opponent");
  if (metrics.completion.rulesId !== "circuit-race-v2-ghost-v1")
    throw new Error(`Unexpected rules id ${metrics.completion.rulesId}`);
  if (!metrics.secondStart || metrics.secondStart.finished)
    throw new Error("New race did not start a fresh session");
} finally {
  await writeFile(join(outDir, "console.txt"), consoleLines.join("\n") + "\n");
  await writeFile(join(outDir, "network.txt"), networkLines.join("\n") + "\n");
  await writeFile(join(outDir, "metrics.json"), JSON.stringify(metrics, null, 2));
  await browser.close();
}

console.log(JSON.stringify({ ok: true, outDir, metrics }, null, 2));
