const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * 2026-11-16 -- the last ACTIVE product images still hot-linked from another
 * site (4 HEINE photos on heine.com, « Matériel de consultation »). Ray Vision
 * already broke the same way (TL-L15, script 90), so they are copied into our
 * uploads and the media rows point to the local copy. Archived products keep
 * their external URLs (not shown on the site).
 *
 * REVERT POINT: 94-before.json (written on the first --apply) holds the old URLs;
 * --revert puts them back (the copied files stay, harmless).
 *
 * Run INSIDE the staging app container, from /tmp against /app's modules:
 *   docker cp 94-heine-images-locales.js <app>:/tmp/94.js
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/94.js            # dry-run
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/94.js --apply
 *   docker exec -w /app -e NODE_PATH=/app/node_modules <app> node /tmp/94.js --revert
 */

const APPLY = process.argv.includes("--apply");
const REVERT = process.argv.includes("--revert");
const BEFORE = path.join(__dirname, "94-before.json");
const UPLOADS = "/app/public/uploads/products";

async function main() {
  if (REVERT) {
    const before = JSON.parse(fs.readFileSync(BEFORE, "utf8"));
    for (const row of before) {
      console.log(`  revert ${row.id} -> ${row.url}`);
      await prisma.product_media.update({ where: { id: row.id }, data: { url: row.url } });
    }
    return;
  }

  const rows = await prisma.product_media.findMany({
    where: { url: { startsWith: "http" }, products: { status: "active" } },
    select: { id: true, url: true, product_id: true },
  });
  console.log(`${rows.length} active media hot-linked from another site`);

  const before = fs.existsSync(BEFORE) ? JSON.parse(fs.readFileSync(BEFORE, "utf8")) : [];
  for (const row of rows) {
    const ext = path.extname(new URL(row.url).pathname) || ".png";
    const name = `heine-94-${row.id.slice(0, 8)}${ext}`;
    console.log(`  ${row.url}\n    -> /uploads/products/${name}`);
    if (!APPLY) continue;

    const res = await fetch(row.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const type = res.headers.get("content-type") || "";
    if (!res.ok || !type.startsWith("image/")) {
      console.log(`    [SKIP] ${res.status} ${type}`);
      continue;
    }
    fs.writeFileSync(path.join(UPLOADS, name), Buffer.from(await res.arrayBuffer()));
    if (!before.some(b => b.id === row.id)) before.push({ id: row.id, url: row.url });
    fs.writeFileSync(BEFORE, JSON.stringify(before, null, 2));
    await prisma.product_media.update({ where: { id: row.id }, data: { url: `/uploads/products/${name}` } });
  }
  if (!APPLY) console.log("dry-run: nothing written (use --apply)");
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
