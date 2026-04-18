/**
 * Generate 400x400 SVG tiles for each subcategory:
 *   gradient background (primary-50 -> primary-100) + centered icon + optional modifier.
 *
 * Output:
 *   /tmp/kitmed-icons/<slug>.svg
 *
 * Icon sources:
 *   - lucide-react (node_modules/lucide-react/dist/esm/icons/*.js) parsed for child elements
 *   - custom SVG shapes below (drawn in lucide stroke style: 24x24 viewBox, stroke currentColor,
 *     stroke-width 2, fill none, stroke-linecap/linejoin round)
 */

const fs = require("fs");
const path = require("path");

const LUCIDE_DIR = path.join(
  __dirname,
  "..",
  "..",
  "node_modules",
  "lucide-react",
  "dist",
  "esm",
  "icons",
);
const MAPPING = JSON.parse(
  fs.readFileSync(path.join(__dirname, "icon-mapping.json"), "utf-8"),
);
const OUT_DIR = "/tmp/kitmed-icons";
const TILE_SIZE = 400;
const ICON_PX = 192; // icon renders at 48% of tile
const MODIFIER_PX = 96; // modifier at 24% of tile

fs.mkdirSync(OUT_DIR, { recursive: true });

// -----------------------------------------------------------------------------
// Custom SVGs in lucide style (24x24 viewBox, stroke currentColor width 2)
// -----------------------------------------------------------------------------
const CUSTOM_ICONS = {
  "custom:scalpel": [
    '<path d="M3 21l9-9"/>',
    '<path d="M12 12l7-8 -2 6 -5 2z"/>',
  ],
  "custom:contact-lens": [
    '<path d="M3 14c0-5 4-9 9-9s9 4 9 9"/>',
    '<circle cx="12" cy="14" r="2"/>',
  ],
  "custom:lensmeter": [
    '<rect x="8" y="4" width="8" height="14" rx="1"/>',
    '<path d="M10 2h4v2h-4z"/>',
    '<path d="M8 18h8v3H8z"/>',
    '<circle cx="12" cy="11" r="1.5"/>',
  ],
  "custom:slit-lamp": [
    '<path d="M12 3v11"/>',
    '<path d="M10 14h4"/>',
    '<path d="M8 21h8"/>',
    '<path d="M12 14v7"/>',
    '<path d="M5 8h3"/>',
    '<path d="M16 8h3"/>',
  ],
  "custom:iol-lens": [
    '<circle cx="12" cy="12" r="5"/>',
    '<path d="M5 12a3 3 0 0 0 -3 3"/>',
    '<path d="M19 12a3 3 0 0 1 3 3"/>',
  ],
  "custom:glaucoma-valve": [
    '<ellipse cx="6" cy="12" rx="3" ry="4"/>',
    '<path d="M9 12h11"/>',
    '<path d="M20 10v4"/>',
  ],
  "custom:phaco-tip": [
    '<path d="M3 12h12l2 -2v4z"/>',
    '<path d="M18 9h4"/>',
    '<path d="M18 15h4"/>',
  ],
  "custom:ophthalmoscope": [
    '<circle cx="12" cy="8" r="4"/>',
    '<path d="M12 12v3"/>',
    '<rect x="9" y="15" width="6" height="6" rx="1"/>',
    '<path d="M16 7h3"/>',
  ],
  "custom:splint": [
    '<path d="M8 4c2 2 2 14 0 16"/>',
    '<path d="M16 4c-2 2 -2 14 0 16"/>',
    '<path d="M8 8h8"/>',
    '<path d="M8 16h8"/>',
  ],
  "custom:joint-brace": [
    '<circle cx="12" cy="12" r="4"/>',
    '<path d="M4 6l6 3"/>',
    '<path d="M14 15l6 3"/>',
    '<path d="M4 18l6 -3"/>',
    '<path d="M14 9l6 -3"/>',
  ],
  "custom:lumbar-belt": [
    '<rect x="2" y="10" width="20" height="4" rx="1"/>',
    '<circle cx="12" cy="12" r="1"/>',
    '<path d="M10 12h4"/>',
  ],
  "custom:knee-ankle-brace": [
    '<path d="M10 3c-2 3 -2 15 0 18"/>',
    '<path d="M14 3c2 3 2 15 0 18"/>',
    '<path d="M8 8h8"/>',
    '<path d="M8 13h8"/>',
    '<path d="M8 18h8"/>',
  ],
  "custom:cervical-collar": [
    '<path d="M4 9c2 -3 6 -4 8 -4s6 1 8 4"/>',
    '<path d="M4 9v6c2 3 6 4 8 4s6 -1 8 -4v-6"/>',
  ],
  "custom:stretcher": [
    '<rect x="2" y="9" width="20" height="5" rx="1"/>',
    '<path d="M2 14v3"/>',
    '<path d="M22 14v3"/>',
    '<circle cx="6" cy="19" r="2"/>',
    '<circle cx="18" cy="19" r="2"/>',
  ],
  "custom:binoculars": [
    '<circle cx="6" cy="14" r="4"/>',
    '<circle cx="18" cy="14" r="4"/>',
    '<path d="M10 13h4"/>',
    '<path d="M6 10V5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v5"/>',
    '<path d="M14 10V5a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v5"/>',
  ],
};

// -----------------------------------------------------------------------------
// Read a lucide icon's child element array from its compiled source
// -----------------------------------------------------------------------------
function lucideElements(iconName) {
  if (iconName.startsWith("custom:")) {
    const shapes = CUSTOM_ICONS[iconName];
    if (!shapes) throw new Error(`custom icon not defined: ${iconName}`);
    return shapes.join("");
  }
  const file = path.join(LUCIDE_DIR, `${iconName}.js`);
  if (!fs.existsSync(file)) throw new Error(`lucide icon not found: ${iconName}`);
  // Flatten multi-line object literals to single-line for the regex.
  const src = fs.readFileSync(file, "utf-8").replace(/\s+/g, " ");
  const tupleRe = /\[\s*"([a-z]+)"\s*,\s*\{([^}]+)\}\s*\]/g;
  const out = [];
  let m;
  while ((m = tupleRe.exec(src)) !== null) {
    const tag = m[1];
    const propsStr = m[2];
    const props = {};
    const propRe = /([a-zA-Z\-]+)\s*:\s*"([^"]*)"/g;
    let pm;
    while ((pm = propRe.exec(propsStr)) !== null) props[pm[1]] = pm[2];
    if (props.key) delete props.key;
    const attrs = Object.entries(props)
      .map(([k, v]) => `${k}="${v}"`)
      .join(" ");
    out.push(`<${tag} ${attrs}/>`);
  }
  if (out.length === 0) throw new Error(`no elements parsed for ${iconName}`);
  return out.join("");
}

// -----------------------------------------------------------------------------
// Assemble the final 400x400 SVG
// -----------------------------------------------------------------------------
function buildTile(iconName, iconModifier) {
  const iconInner = lucideElements(iconName);
  const iconOffset = (TILE_SIZE - ICON_PX) / 2;
  const iconScale = ICON_PX / 24;

  let modifierG = "";
  if (iconModifier) {
    const modInner = lucideElements(iconModifier);
    const modSize = MODIFIER_PX;
    const modX = TILE_SIZE - modSize - 32;
    const modY = TILE_SIZE - modSize - 32;
    const modScale = modSize / 24;
    modifierG = `
  <g transform="translate(${modX - 6},${modY - 6})">
    <rect x="0" y="0" width="${modSize + 12}" height="${modSize + 12}" rx="18" fill="#ffffff" stroke="#D6EBFE" stroke-width="2"/>
    <g transform="translate(6,6) scale(${modScale})" fill="none" stroke="#124B73" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      ${modInner}
    </g>
  </g>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE_SIZE} ${TILE_SIZE}" width="${TILE_SIZE}" height="${TILE_SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#EBF5FF"/>
      <stop offset="1" stop-color="#FFFFFF"/>
    </linearGradient>
  </defs>
  <rect width="${TILE_SIZE}" height="${TILE_SIZE}" fill="url(#bg)"/>
  <g transform="translate(${iconOffset},${iconOffset}) scale(${iconScale})" fill="none" stroke="#1969A3" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    ${iconInner}
  </g>${modifierG}
</svg>`;
}

// -----------------------------------------------------------------------------
// Iterate over mapping and write files
// -----------------------------------------------------------------------------
const BRAND_SUBS = new Set(MAPPING.brand_subcategories_use_logo || []);

const sections = [
  "root_disciplines",
  "ophtalmologie_l2",
  "consultation_l3",
  "exploration_l3",
  "consommable_l3",
  "bloc_operatoire_l3",
  "verres_sub_l3",
  "orthopedics_l2",
  "mobilier_l2",
  "orl_l2",
];

const rows = [];
for (const section of sections) {
  const block = MAPPING[section];
  for (const [slug, def] of Object.entries(block)) {
    if (BRAND_SUBS.has(slug)) continue;
    try {
      const svg = buildTile(def.icon_name, def.icon_modifier);
      const outFile = path.join(OUT_DIR, `${slug}.svg`);
      fs.writeFileSync(outFile, svg);
      rows.push({ slug, iconName: def.icon_name, modifier: def.icon_modifier || "", file: outFile });
    } catch (e) {
      console.error(`[FAIL] ${slug}: ${e.message}`);
    }
  }
}

console.log(`Generated ${rows.length} SVG tiles -> ${OUT_DIR}`);
for (const r of rows) {
  console.log(
    `  ${r.slug.padEnd(55)} ${r.iconName.padEnd(25)}${r.modifier ? " + " + r.modifier : ""}`,
  );
}
