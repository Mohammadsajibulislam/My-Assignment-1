/**
 * One-off / re-runnable image build step.
 * Source of truth: assets/*.png (design originals committed to the repo).
 * Outputs modern formats + responsive sizes consumed by index.html.
 *
 * Run: npm run images
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "assets");

const log = (file, buf) =>
  console.log(`  ${file.padEnd(24)} ${(buf.length / 1024).toFixed(1)} KB`);

await mkdir(assets, { recursive: true });

/* ---------------------------------- Hero ---------------------------------- */
const hero = path.join(assets, "hero-bg.png");
const heroMeta = await sharp(hero).metadata();
console.log(`hero-bg.png: ${heroMeta.width}x${heroMeta.height}`);

const heroWidths = [1280, 1920].filter((w) => w < heroMeta.width);

for (const width of heroWidths) {
  const out = path.join(assets, `hero-bg-${width}.webp`);
  const buf = await sharp(hero).resize({ width }).webp({ quality: 72 }).toBuffer();
  await sharp(hero).resize({ width }).webp({ quality: 72 }).toFile(out);
  log(path.basename(out), buf);
}

const heroFull = path.join(assets, "hero-bg.webp");
const heroFullBuf = await sharp(hero).webp({ quality: 72 }).toBuffer();
await sharp(hero).webp({ quality: 72 }).toFile(heroFull);
log("hero-bg.webp", heroFullBuf);

/* --------------------------- Solution illustration ------------------------ */
const knowledge = path.join(assets, "knowledge.png");
const knowledgeBuf = await sharp(knowledge).webp({ quality: 82 }).toBuffer();
await sharp(knowledge).webp({ quality: 82 }).toFile(path.join(assets, "knowledge.webp"));
log("knowledge.webp", knowledgeBuf);

/* --------------------------------- Social --------------------------------- */
/* OG image: 1200x630 centre crop of the hero (LinkedIn/Facebook requirement). */
const ogPath = path.join(assets, "og-image.jpg");
const ogBuf = await sharp(hero)
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 80, mozjpeg: true })
  .toBuffer();
await sharp(hero)
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(ogPath);
log("og-image.jpg", ogBuf);

/* -------------------------------- Favicons -------------------------------- */
/* The logo is wide (139x60), so letterbox it onto a square canvas. */
const logo = path.join(assets, "logo-navbar.png");
const logoMeta = await sharp(logo).metadata();

const makeIcon = async (size, file, background) => {
  const inner = Math.round(size * 0.72);
  const resized = await sharp(logo).resize({ width: inner, height: inner, fit: "inside" }).png().toBuffer();
  const icon = await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toBuffer();
  await (await import("node:fs/promises")).writeFile(path.join(assets, file), icon);
  log(file, icon);
};

console.log(`logo-navbar.png: ${logoMeta.width}x${logoMeta.height}`);
await makeIcon(64, "favicon.png", { r: 0, g: 0, b: 0, alpha: 0 });
await makeIcon(180, "apple-touch-icon.png", { r: 255, g: 255, b: 255, alpha: 1 });

console.log("\nDone.");
