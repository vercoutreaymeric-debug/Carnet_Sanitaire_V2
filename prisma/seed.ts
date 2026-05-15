import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // Établissement
  await prisma.etablissement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nom: 'Piscine Municipale des Lilas',
      adresse: '12 avenue du Général de Gaulle, 93260 Les Lilas',
      telephone: '01 43 62 12 34',
      capaciteBaigneursCouvert: 80,
      capaciteVisiteursCouvert: 40,
      capaciteBaigneursPleinAir: 0,
      capaciteVisiteursPleinAir: 0,
    },
  })

  // Bassins
  const grand = await prisma.bassin.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1, nom: 'Grand bassin', type: 'couvert',
      longueur: 25, largeur: 12.5, profMin: 1.0, profMax: 2.0,
      surfSuperieure: 187.5, surfInferieure: 125, volumeTotal: 625,
      debitReglementaire: 120, debitInstallation: 140,
    },
  })
  const petit = await prisma.bassin.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2, nom: 'Petit bassin', type: 'couvert',
      longueur: 12, largeur: 8, profMin: 0.6, profMax: 1.4,
      surfSuperieure: 96, surfInferieure: 0, volumeTotal: 115,
      debitReglementaire: 60, debitInstallation: 70,
    },
  })

  // Relevés
  const relevesCount = await prisma.releve.count()
  if (relevesCount === 0) {
    await prisma.releve.createMany({
      data: [
        { date: '2026-05-04', bassinId: grand.id, bassinNom: 'Grand bassin', heure: '08:30', transparence: 'Bonne', tempEau: 27.5, tempAir: 24, ph: 7.3, chloreLibre: 1.2, chloreCombine: 0.4, chloreTotal: 1.6, turbidite: 0.3, th: 25, tac: 12, volumeReactif: 15, debitRecyclage: 120, status: 'conforme' },
        { date: '2026-05-04', bassinId: petit.id, bassinNom: 'Petit bassin', heure: '08:45', transparence: 'Bonne', tempEau: 28.1, tempAir: 24, ph: 7.8, chloreLibre: 0.3, chloreCombine: 1.1, chloreTotal: 1.4, turbidite: 0.4, th: 26, tac: 13, volumeReactif: 8, debitRecyclage: 60, status: 'attention' },
        { date: '2026-05-03', bassinId: grand.id, bassinNom: 'Grand bassin', heure: '08:30', transparence: 'Excellente', tempEau: 26.8, tempAir: 23, ph: 7.2, chloreLibre: 1.4, chloreCombine: 0.3, chloreTotal: 1.7, turbidite: 0.2, th: 24, tac: 11, volumeReactif: 14, debitRecyclage: 120, status: 'conforme' },
        { date: '2026-05-03', bassinId: petit.id, bassinNom: 'Petit bassin', heure: '08:45', transparence: 'Bonne', tempEau: 27.9, tempAir: 23, ph: 8.2, chloreLibre: 0.2, chloreCombine: 1.4, chloreTotal: 1.6, turbidite: 0.6, th: 27, tac: 14, volumeReactif: 7, debitRecyclage: 60, status: 'nonconforme' },
      ],
    })
  }

  // Fréquentations
  const freqCount = await prisma.frequentation.count()
  if (freqCount === 0) {
    await prisma.frequentation.createMany({
      data: [
        { date: '2026-05-04', scolaire: 120, club: 45, publicCount: 230, total: 395, reportEau: 320, releveEau: 340, totalEau: 20, litresParBaigneur: 50.6 },
        { date: '2026-05-03', scolaire: 85, club: 60, publicCount: 195, total: 340, reportEau: 300, releveEau: 320, totalEau: 20, litresParBaigneur: 58.8 },
      ],
    })
  }

  // Interventions
  const intervCount = await prisma.intervention.count()
  if (intervCount === 0) {
    await prisma.intervention.createMany({
      data: [
        { date: '2026-05-03', heure: '14:20', type: 'Incident', bassin: 'Petit bassin', description: 'pH hors norme (8.2). Ajout de correcteur pH acide (500ml). Fermeture préventive du bassin pendant 2h. Réouverture après vérification à 16h30.', agent: 'M. Dupont', status: 'résolu' },
        { date: '2026-05-01', heure: '09:00', type: 'Maintenance', bassin: 'Grand bassin', description: 'Nettoyage des filtres à sable. Contre-lavage effectué. Remplacement du manomètre du filtre N°2.', agent: 'Équipe technique', status: 'clôturé' },
        { date: '2026-04-28', heure: '11:45', type: 'Observation', bassin: 'Tous bassins', description: 'Inspection ARS effectuée. Carnet sanitaire vérifié. Aucune observation particulière.', agent: 'Inspecteur ARS', status: 'clôturé' },
      ],
    })
  }

  // Contacts
  const contactsCount = await prisma.contact.count()
  if (contactsCount === 0) {
    await prisma.contact.createMany({
      data: [
        { categorie: 'Urgences', nom: 'SAMU', bureau: '15' },
        { categorie: 'Urgences', nom: 'Sapeurs pompiers', bureau: '18' },
        { categorie: 'Urgences', nom: 'Gendarmerie ou Police', bureau: '17' },
        { categorie: 'Administration', nom: 'Mairie', responsable: 'M. le Maire' },
        { categorie: 'Administration', nom: 'ARS', adresse: 'Hôpital Fernand-Widal, 200 r. Fbg Saint-Denis 75010', bureau: '01 40 05 48 48' },
        { categorie: 'Services', nom: 'Médecin' },
        { categorie: 'Services', nom: 'Ambulance', bureau: '15' },
        { categorie: 'Services', nom: 'Pharmacie' },
        { categorie: 'Services', nom: 'Service des eaux' },
        { categorie: 'Services', nom: 'Électricité de France' },
        { categorie: 'Services', nom: 'Gaz de France' },
        { categorie: 'Services', nom: 'Plombier' },
        { categorie: 'Technique', nom: 'Service de renseignements technique', adresse: '12 bis, rue du Commandant-Pilot 92200 Neuilly-sur-Seine', bureau: '01 43 40 49 49' },
      ],
    })
  }

  console.log('✅ Seed terminé')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
