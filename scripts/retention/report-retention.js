#!/usr/bin/env node
/**
 * Durée de conservation des données personnelles (loi 09-08, art. 3 :
 * données conservées pendant une durée n'excédant pas celle nécessaire
 * aux finalités).
 *
 * LECTURE SEULE. Ce script ne supprime rien : il compte les lignes qui
 * dépassent la durée de conservation PROPOSÉE, pour décision du propriétaire.
 * Il n'affiche aucune donnée personnelle (uniquement des nombres).
 *
 * Durées proposées (à valider par le propriétaire avant toute purge) :
 *   - contact_submissions : 24 mois après la dernière mise à jour.
 *   - rfp_requests non conclues (pending, reviewing, quoted, rejected) :
 *     36 mois après la dernière mise à jour.
 *   - rfp_requests conclues (accepted, completed) : conservées avec les
 *     pièces commerciales ; durée à fixer avec le comptable.
 *
 * TODO (après validation) : ajouter une purge ou une anonymisation
 * (nom, e-mail, téléphone, adresse, message) avec sauvegarde préalable.
 *
 * Usage : DATABASE_URL=... node scripts/retention/report-retention.js
 */
const { PrismaClient } = require('@prisma/client');

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const CONTACT_MONTHS = 24;
const RFP_OPEN_MONTHS = 36;
const RFP_OPEN_STATUSES = ['pending', 'reviewing', 'quoted', 'rejected'];

async function main() {
  const prisma = new PrismaClient();
  try {
    const now = Date.now();
    const contactCutoff = new Date(now - CONTACT_MONTHS * MONTH_MS);
    const rfpCutoff = new Date(now - RFP_OPEN_MONTHS * MONTH_MS);

    const [contactTotal, contactExpired, rfpTotal, rfpExpired] = await Promise.all([
      prisma.contact_submissions.count(),
      prisma.contact_submissions.count({ where: { updated_at: { lt: contactCutoff } } }),
      prisma.rfp_requests.count(),
      prisma.rfp_requests.count({
        where: { status: { in: RFP_OPEN_STATUSES }, updated_at: { lt: rfpCutoff } },
      }),
    ]);

    console.log(`contact_submissions : ${contactTotal} au total, ${contactExpired} au-delà de ${CONTACT_MONTHS} mois`);
    console.log(`rfp_requests        : ${rfpTotal} au total, ${rfpExpired} non conclues au-delà de ${RFP_OPEN_MONTHS} mois`);
    console.log('Aucune ligne supprimée (rapport en lecture seule).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Retention report failed:', error && error.name ? error.name : 'Error');
  process.exit(1);
});
