require("dotenv").config({ path: ".env.staging" });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function deleteProductCascade(tx, productId) {
  await tx.product_translations.deleteMany({ where: { product_id: productId } });
  await tx.product_media.deleteMany({ where: { product_id: productId } });
  await tx.product_files.deleteMany({ where: { product_id: productId } });
  await tx.product_attributes.deleteMany({ where: { product_id: productId } });
  await tx.rfp_items.deleteMany({ where: { product_id: productId } });
  await tx.products.delete({ where: { id: productId } });
}

async function mergeGroup(tx, { masterRef, mergeRefs, nomFr, nomEn, descFr, descEn }) {
  const master = await tx.products.findUnique({ where: { reference_fournisseur: masterRef } });
  if (!master) throw new Error(`master ${masterRef} not found`);
  const dups = [];
  for (const ref of mergeRefs) {
    const d = await tx.products.findUnique({ where: { reference_fournisseur: ref } });
    if (d) dups.push(d);
  }
  const joined = [masterRef, ...dups.map((d) => d.reference_fournisseur)].join(", ");
  await tx.products.update({
    where: { id: master.id },
    data: { reference_fournisseur: joined, updated_at: new Date() },
  });
  for (const lang of ["fr", "en"]) {
    const t = await tx.product_translations.findFirst({
      where: { product_id: master.id, language_code: lang },
    });
    if (t) {
      const data = { nom: lang === "fr" ? nomFr : nomEn };
      if (descFr && lang === "fr") data.description = descFr;
      if (descEn && lang === "en") data.description = descEn;
      await tx.product_translations.update({ where: { id: t.id }, data });
    }
  }
  console.log(`   [MERGE] master=${masterRef}`);
  console.log(`           title: ${nomFr}`);
  for (const d of dups) {
    await deleteProductCascade(tx, d.id);
    console.log(`   [DEL-DUP] ${d.reference_fournisseur}`);
  }
}

async function main() {
  console.log("\n== Phase 9C: FCI aggressive consolidation (20 -> 9) ==\n");

  await prisma.$transaction(
    async (tx) => {
      console.log("A. Merge 8 lacrimal intubation systems -> 1");
      await mergeGroup(tx, {
        masterRef: "S1.1451, S1.1491, S1.1456, S1.1496",
        mergeRefs: [
          "S1.1621, S1.1631, S1.1661, S1.1711, S1.1501, S1.1521, S1.1801, S1.1811, S1.1821",
          "S1.1390, S1.1391, S1.1392",
          "S1.1401, S1.1421",
          "S1.1608, S1.1609, S1.1610",
          "S1.4121, S1.4122, S1.4131, S1.4132",
          "S1.1361, S1.1371",
          "S1.1515, S1.1522, S1.1530, S1.1535, S1.1540, S1.1545, S1.1550",
        ],
        nomFr: "Systèmes d'Intubation Lacrymale FCI (Ritleng / Ritleng+ / Monoka / Mini-Monoka / Fayet-Bernard / Masterka / BIKA DCR / Autostable II / Nunchaku / LacriJet / Ophtacath Ballonnet)",
        nomEn: "FCI Lacrimal Intubation Systems (Ritleng / Ritleng+ / Monoka / Mini-Monoka / Fayet-Bernard / Masterka / BIKA DCR / Autostable II / Nunchaku / LacriJet / Ophtacath Balloon)",
        descFr:
          "Gamme complète FCI de systèmes d'intubation lacrymale et de dilatation des voies lacrymales. Comprend : Ritleng / Ritleng+ autostable, Monoka / Mini-Monoka / Fayet-Bernard (monocanaliculaire), Masterka autostable, BIKA DCR, Autostable II, Nunchaku, LacriJet préchargé, et Ophtacath (cathéter à ballonnet). Brochures spécifiques disponibles pour chaque système au catalogue FCI.",
        descEn:
          "Full FCI range of lacrimal intubation and dilation systems. Includes Ritleng / Ritleng+ self-retaining, Monoka / Mini-Monoka / Fayet-Bernard (monocanalicular), Masterka self-retaining, BIKA DCR, Autostable II, Nunchaku, preloaded LacriJet, and Ophtacath balloon catheter. Specific brochures available per system in the FCI catalog.",
      });

      console.log("\nB. Merge 3 orbital implants/protections -> 1");
      await mergeGroup(tx, {
        masterRef: "PLANCHER",
        mergeRefs: ["FORMESPO", "COQUEDEP"],
        nomFr: "Implants et Protections Orbitaires FCI (Plancher MATRIX / Conformateurs Oculaires / Coque de Protection)",
        nomEn: "FCI Orbital Implants & Protections (MATRIX Floor / Ocular Conformers / Protective Shell)",
        descFr:
          "Solutions FCI pour la chirurgie orbitaire et la protection oculaire : implants de plancher orbitaire MATRIX, conformateurs oculaires post-énucléation/éviscération, et coques de protection post-opératoires.",
        descEn:
          "FCI solutions for orbital surgery and ocular protection: MATRIX orbital floor implants, ocular conformers for post-enucleation/evisceration, and post-operative protective shells.",
      });

      console.log("\nC. Merge 2 glaucoma implants -> 1");
      await mergeGroup(tx, {
        masterRef: "IMPLANTG",
        mergeRefs: ["VALVEGLA"],
        nomFr: "Implants et Valves Glaucome FCI (Implant PAUL / Valve Ahmed FP7-FP8)",
        nomEn: "FCI Glaucoma Implants & Valves (PAUL Implant / Ahmed FP7-FP8 Valve)",
        descFr:
          "Dispositifs de drainage pour la chirurgie du glaucome : Implant PAUL (microtube) et Valve de drainage Ahmed FP7/FP8.",
        descEn:
          "Drainage devices for glaucoma surgery: PAUL implant (microtube) and Ahmed FP7/FP8 drainage valve.",
      });

      console.log("\nD. Absorb Double Crochet de Ferron into the instrument boxes");
      const boxes = await tx.products.findFirst({
        where: { reference_fournisseur: { contains: "A10.7000" } },
      });
      const ferron = await tx.products.findUnique({
        where: { reference_fournisseur: "A2.4220" },
      });
      if (boxes && ferron) {
        const newRef = `${boxes.reference_fournisseur}, A2.4220`;
        await tx.products.update({
          where: { id: boxes.id },
          data: { reference_fournisseur: newRef, updated_at: new Date() },
        });
        const boxNomFr = "Boîtes d'Instruments Chirurgicaux et Pinces FCI (DCR / Chalazion / Glaucome / Ptérygion / Ptosis / Double Crochet Ferron)";
        const boxNomEn = "FCI Surgical Instrument Boxes & Forceps (DCR / Chalazion / Glaucoma / Pterygium / Ptosis / Ferron Double Hook)";
        for (const lang of ["fr", "en"]) {
          const t = await tx.product_translations.findFirst({
            where: { product_id: boxes.id, language_code: lang },
          });
          if (t) {
            await tx.product_translations.update({
              where: { id: t.id },
              data: { nom: lang === "fr" ? boxNomFr : boxNomEn },
            });
          }
        }
        await deleteProductCascade(tx, ferron.id);
        console.log(`   [MERGE] Boîtes now includes A2.4220 — title updated`);
        console.log(`   [DEL-DUP] A2.4220`);
      }
    },
    { timeout: 60000, maxWait: 10000 },
  );

  console.log("\n== Phase 9C complete ==\n");
}

main()
  .catch((e) => {
    console.error("\n[FATAL]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
